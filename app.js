// ─── 화면 요소 ───
const uploadScreen = document.getElementById('upload-screen');
const libraryScreen = document.getElementById('library-screen');
const readerScreen = document.getElementById('reader-screen');
const highlightScreen = document.getElementById('highlight-screen');
const fileInput = document.getElementById('file-input');
const content = document.getElementById('content');
const bookTitle = document.getElementById('book-title');
const highlightList = document.getElementById('highlight-list');
const libraryList = document.getElementById('library-list');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');

// ─── 데이터 ───
let highlights = JSON.parse(localStorage.getItem('highlights') || '[]');
let library = JSON.parse(localStorage.getItem('library') || '[]');
let currentBook = null;
let isMarkdown = false;
let directoryHandle = null;

// ─── File System Access API 지원 여부 ───
const supportsFileSystemAccess = 'showDirectoryPicker' in window;

// ─── 저장 폴더 설정 ───
const setFolderBtn = document.getElementById('set-folder-btn');
const folderStatus = document.getElementById('folder-status');

if (!supportsFileSystemAccess) {
  setFolderBtn.style.display = 'none';
  folderStatus.textContent = '이 브라우저는 폴더 저장을 지원하지 않습니다 (localStorage 사용)';
}

setFolderBtn.addEventListener('click', async () => {
  try {
    directoryHandle = await window.showDirectoryPicker({
      mode: 'readwrite'
    });
    folderStatus.textContent = '저장 폴더: ' + directoryHandle.name;
    folderStatus.style.color = '#c8a96e';
  } catch (e) {
    if (e.name !== 'AbortError') {
      folderStatus.textContent = '폴더 선택 실패';
      folderStatus.style.color = '#ff6b6b';
    }
  }
});

// ─── 파일을 폴더에 저장 ───
async function saveFileToFolder(filename, content) {
  if (!directoryHandle) return false;

  try {
    const fileHandle = await directoryHandle.getFileHandle(filename, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
    return true;
  } catch (e) {
    console.error('파일 저장 실패:', e);
    return false;
  }
}

// ─── 폴더에서 파일 목록 불러오기 ───
async function loadFilesFromFolder() {
  if (!directoryHandle) return [];

  const files = [];
  try {
    for await (const entry of directoryHandle.values()) {
      if (entry.kind === 'file' && (entry.name.endsWith('.txt') || entry.name.endsWith('.md'))) {
        files.push(entry.name);
      }
    }
  } catch (e) {
    console.error('폴더 읽기 실패:', e);
  }
  return files;
}

// ─── 폴더에서 파일 읽기 ───
async function readFileFromFolder(filename) {
  if (!directoryHandle) return null;

  try {
    const fileHandle = await directoryHandle.getFileHandle(filename);
    const file = await fileHandle.getFile();
    return await file.text();
  } catch (e) {
    console.error('파일 읽기 실패:', e);
    return null;
  }
}

// ─── 파일 불러오기 ───
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    const text = e.target.result;
    const isMd = file.name.endsWith('.md');

    // File System Access API로 폴더에 저장 시도
    if (directoryHandle) {
      const saved = await saveFileToFolder(file.name, text);
      if (saved) {
        folderStatus.textContent = '저장됨: ' + file.name;
      }
    }

    const existingIndex = library.findIndex(b => b.title === file.name);
    if (existingIndex !== -1) {
      currentBook = library[existingIndex];
      currentBook.content = text;
      currentBook.isMarkdown = isMd;
    } else {
      currentBook = {
        id: Date.now(),
        title: file.name,
        content: text,
        scrollPosition: 0,
        isMarkdown: isMd,
        addedDate: new Date().toLocaleDateString('ko-KR')
      };
      library.push(currentBook);
    }
    saveLibrary();

    openBook(currentBook);
  };
  reader.readAsText(file, 'UTF-8');
});

// ─── 서재 저장/불러오기 ───
function saveLibrary() {
  localStorage.setItem('library', JSON.stringify(library));
}

function openBook(book) {
  currentBook = book;
  bookTitle.textContent = book.title;
  isMarkdown = book.isMarkdown || false;

  if (isMarkdown) {
    content.innerHTML = marked.parse(book.content);
  } else {
    content.textContent = book.content;
    applyHighlights();
  }

  showScreen(readerScreen);

  requestAnimationFrame(() => {
    window.scrollTo(0, book.scrollPosition || 0);
    updateProgress();
  });
}

// ─── 내 서재 버튼 ───
document.getElementById('library-btn').addEventListener('click', () => {
  renderLibrary();
  showScreen(libraryScreen);
});

// ─── 공용 책 불러오기 (books 폴더) ───
async function loadSharedBooks() {
  try {
    const res = await fetch('books/book-list.json');
    const data = await res.json();
    return data.books || [];
  } catch (e) {
    return [];
  }
}

async function openSharedBook(filename) {
  try {
    const res = await fetch('books/' + filename);
    const text = await res.text();
    const isMd = filename.endsWith('.md');

    currentBook = {
      id: 'shared-' + filename,
      title: filename,
      content: text,
      scrollPosition: 0,
      isMarkdown: isMd,
      isShared: true
    };
    openBook(currentBook);
  } catch (e) {
    alert('파일을 불러올 수 없습니다.');
  }
}

async function renderLibrary() {
  const sharedBooks = await loadSharedBooks();
  const folderFiles = await loadFilesFromFolder();
  let html = '';

  // 폴더에서 불러온 책
  if (folderFiles.length > 0) {
    html += '<div class="library-section-title">📁 폴더 책 (' + directoryHandle.name + ')</div>';
    html += folderFiles.map(filename => `
      <div class="library-item" onclick="openFolderBook('${filename}')">
        <div class="library-item-title">${filename}</div>
        <div class="library-item-meta">폴더에서 불러옴</div>
      </div>
    `).join('');
  }

  if (sharedBooks.length > 0) {
    html += '<div class="library-section-title">공용 책</div>';
    html += sharedBooks.map(filename => `
      <div class="library-item" onclick="openSharedBook('${filename}')">
        <div class="library-item-title">${filename}</div>
        <div class="library-item-meta">공용 서재</div>
      </div>
    `).join('');
  }

  if (library.length > 0) {
    html += '<div class="library-section-title">내 책</div>';
    html += library.map(book => {
      const progress = calculateProgress(book);
      return `
      <div class="library-item" onclick="openBookById(${book.id})">
        <div class="library-item-title">${book.title}</div>
        <div class="library-item-meta">추가: ${book.addedDate}</div>
        <div class="library-progress-bar">
          <div class="library-progress-fill" style="width: ${progress}%"></div>
        </div>
        <div class="library-progress-text">${progress}% 읽음</div>
        <button class="delete-book-btn" onclick="deleteBook(event, ${book.id})">삭제</button>
      </div>
    `;
    }).join('');
  }

  if (html === '') {
    html = '<p style="color:#888; text-align:center; margin-top:40px;">아직 저장된 책이 없어요</p>';
  }

  libraryList.innerHTML = html;
}

// ─── 폴더에서 책 열기 ───
async function openFolderBook(filename) {
  const content = await readFileFromFolder(filename);
  if (!content) {
    alert('파일을 읽을 수 없습니다.');
    return;
  }

  const isMd = filename.endsWith('.md');
  currentBook = {
    id: 'folder-' + filename,
    title: filename,
    content: content,
    scrollPosition: 0,
    isMarkdown: isMd,
    isFolder: true
  };
  openBook(currentBook);
}

function calculateProgress(book) {
  if (!book.content || !book.scrollPosition) return 0;
  const lineHeight = 35;
  const totalHeight = book.content.split('\n').length * lineHeight;
  const viewportHeight = window.innerHeight;
  const maxScroll = Math.max(totalHeight - viewportHeight, 1);
  const progress = Math.min(Math.round((book.scrollPosition / maxScroll) * 100), 100);
  return progress;
}

function openBookById(id) {
  const book = library.find(b => b.id === id);
  if (book) openBook(book);
}

function deleteBook(event, id) {
  event.stopPropagation();
  if (!confirm('이 책을 삭제할까요?')) return;
  library = library.filter(b => b.id !== id);
  saveLibrary();
  renderLibrary();
}

// ─── 진도바 업데이트 ───
function updateProgress() {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = docHeight > 0 ? Math.min(Math.round((scrollTop / docHeight) * 100), 100) : 0;

  progressFill.style.width = progress + '%';
  progressText.textContent = progress + '%';
}

// ─── 스크롤 위치 저장 ───
let scrollTimeout;
window.addEventListener('scroll', () => {
  if (!currentBook || readerScreen.classList.contains('hidden')) return;

  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(() => {
    currentBook.scrollPosition = window.scrollY;
    saveLibrary();
  }, 300);

  updateProgress();
});

// ─── 텍스트 선택 → 하이라이트 ───
content.addEventListener('mouseup', () => {
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();
  if (!selectedText) return;

  const confirmed = confirm(`하이라이트 추가할까요?\n\n"${selectedText.slice(0, 80)}..."`);
  if (!confirmed) return;

  highlights.push({
    id: Date.now(),
    text: selectedText,
    book: bookTitle.textContent,
    date: new Date().toLocaleDateString('ko-KR')
  });
  localStorage.setItem('highlights', JSON.stringify(highlights));

  applyHighlights();
  selection.removeAllRanges();
});

// ─── 하이라이트 화면에 표시 ───
function applyHighlights() {
  let text = content.textContent;
  highlights.forEach(h => {
    text = text.replace(
      h.text,
      `<mark class="highlight" data-id="${h.id}">${h.text}</mark>`
    );
  });
  content.innerHTML = text;
}

// ─── 하이라이트 목록 보기 ───
document.getElementById('highlight-list-btn').addEventListener('click', () => {
  renderHighlightList();
  showScreen(highlightScreen);
});

function renderHighlightList() {
  if (highlights.length === 0) {
    highlightList.innerHTML = '<p style="color:#888; text-align:center; margin-top:40px;">아직 하이라이트가 없어요</p>';
    return;
  }

  highlightList.innerHTML = highlights.map(h => `
    <div class="highlight-item">
      <div>${h.text}</div>
      <div style="font-size:0.8rem; color:#888; margin-top:8px;">📚 ${h.book} · ${h.date}</div>
      <button class="share-btn" onclick="shareHighlight(${h.id})">🐦 트위터 공유</button>
    </div>
  `).join('');
}

// ─── 공유하기 ───
function shareHighlight(id) {
  const h = highlights.find(h => h.id == id);
  if (!h) return;

  const twitterText = encodeURIComponent(`"${h.text}"\n\n📖 ${h.book}`);
  const twitterUrl = `https://twitter.com/intent/tweet?text=${twitterText}`;

  window.open(twitterUrl, '_blank');
}

// ─── 뒤로가기 ───
document.getElementById('back-btn').addEventListener('click', () => {
  currentBook = null;
  renderLibrary();
  showScreen(libraryScreen);
});

document.getElementById('back-from-highlight').addEventListener('click', () => {
  showScreen(readerScreen);
});

document.getElementById('back-from-library').addEventListener('click', () => {
  showScreen(uploadScreen);
});

// ─── 화면 전환 ───
function showScreen(screen) {
  uploadScreen.classList.add('hidden');
  libraryScreen.classList.add('hidden');
  readerScreen.classList.add('hidden');
  highlightScreen.classList.add('hidden');
  screen.classList.remove('hidden');
}
