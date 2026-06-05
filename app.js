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

// ─── 파일 불러오기 ───
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target.result;
    const isMd = file.name.endsWith('.md');

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

function renderLibrary() {
  if (library.length === 0) {
    libraryList.innerHTML = '<p style="color:#888; text-align:center; margin-top:40px;">아직 저장된 책이 없어요</p>';
    return;
  }

  libraryList.innerHTML = library.map(book => {
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
