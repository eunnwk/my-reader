// ─── 화면 요소 ───
const uploadScreen = document.getElementById('upload-screen');
const readerScreen = document.getElementById('reader-screen');
const highlightScreen = document.getElementById('highlight-screen');
const fileInput = document.getElementById('file-input');
const content = document.getElementById('content');
const bookTitle = document.getElementById('book-title');
const highlightList = document.getElementById('highlight-list');

// ─── 데이터 ───
let highlights = JSON.parse(localStorage.getItem('highlights') || '[]');
let currentBook = JSON.parse(localStorage.getItem('currentBook') || 'null');

// ─── 파일 불러오기 ───
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  bookTitle.textContent = file.name;

  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target.result;
    content.textContent = text;

    // 책 정보 저장
    currentBook = {
      title: file.name,
      content: text,
      scrollPosition: 0
    };
    saveCurrentBook();

    showScreen(readerScreen);
    applyHighlights();
  };
  reader.readAsText(file, 'UTF-8');
});

// ─── 책 정보 저장/불러오기 ───
function saveCurrentBook() {
  localStorage.setItem('currentBook', JSON.stringify(currentBook));
}

function loadSavedBook() {
  if (!currentBook) return false;

  bookTitle.textContent = currentBook.title;
  content.textContent = currentBook.content;
  showScreen(readerScreen);
  applyHighlights();

  // 저장된 스크롤 위치로 이동 (DOM 렌더링 후)
  requestAnimationFrame(() => {
    window.scrollTo(0, currentBook.scrollPosition);
  });

  return true;
}

// ─── 이어서 읽기 버튼 ───
const continueBtn = document.getElementById('continue-btn');
const continueBookTitle = document.getElementById('continue-book-title');

function showContinueButton() {
  if (currentBook) {
    continueBookTitle.textContent = currentBook.title;
    continueBtn.classList.remove('hidden');
  } else {
    continueBtn.classList.add('hidden');
  }
}

continueBtn.addEventListener('click', () => {
  loadSavedBook();
});

// ─── 스크롤 위치 저장 ───
let scrollTimeout;
window.addEventListener('scroll', () => {
  if (!currentBook || readerScreen.classList.contains('hidden')) return;

  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(() => {
    currentBook.scrollPosition = window.scrollY;
    saveCurrentBook();
  }, 300);
});

// ─── 텍스트 선택 → 하이라이트 ───
content.addEventListener('mouseup', () => {
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();
  if (!selectedText) return;

  const confirmed = confirm(`하이라이트 추가할까요?\n\n"${selectedText.slice(0, 80)}..."`);
  if (!confirmed) return;

  // 데이터 저장
  highlights.push({
    id: Date.now(),
    text: selectedText,
    book: bookTitle.textContent,
    date: new Date().toLocaleDateString('ko-KR')
  });
  localStorage.setItem('highlights', JSON.stringify(highlights));

  // 화면에 표시
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

  const text = `📖 ${h.book}\n\n"${h.text}"\n\n— My Reader`;
  const twitterText = encodeURIComponent(`"${h.text}"\n\n📖 ${h.book}`);
  const twitterUrl = `https://twitter.com/intent/tweet?text=${twitterText}`;

  window.open(twitterUrl, '_blank');
}

// ─── 뒤로가기 ───
document.getElementById('back-btn').addEventListener('click', () => {
  // 저장된 책 정보 삭제
  currentBook = null;
  localStorage.removeItem('currentBook');
  showScreen(uploadScreen);
});

document.getElementById('back-from-highlight').addEventListener('click', () => {
  showScreen(readerScreen);
});

// ─── 화면 전환 ───
function showScreen(screen) {
  uploadScreen.classList.add('hidden');
  readerScreen.classList.add('hidden');
  highlightScreen.classList.add('hidden');
  screen.classList.remove('hidden');
}

// ─── 초기화: 이어서 읽기 버튼 표시 ───
showContinueButton();