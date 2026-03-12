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

// ─── 파일 불러오기 ───
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  bookTitle.textContent = file.name;

  const reader = new FileReader();
  reader.onload = (e) => {
    content.textContent = e.target.result;
    showScreen(readerScreen);
  };
  reader.readAsText(file, 'UTF-8');
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