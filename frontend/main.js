function updateFavoritesUI() {
  const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
  const list = document.getElementById('favoritesList');
  list.innerHTML = "";
  favorites.forEach((item) => {
    const li = document.createElement('li');
    li.textContent = `📌 ${item.text} → ${item.translation}`;
    list.appendChild(li);
  });
}

function getNextPractice() {
  const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
  if (favorites.length === 0) {
    return null;
  }
  const index = Math.floor(Math.random() * favorites.length);
  return favorites[index];
}

document.getElementById('nextPracticeBtn').addEventListener('click', () => {
  const practice = getNextPractice();
  const box = document.getElementById('practiceArea');
  if (!practice) {
    box.textContent = "No favorites to practice.";
    return;
  }
  box.innerHTML = `
    <p><strong>Translate this:</strong> ${practice.text}</p>
    <details>
      <summary>Show Answer</summary>
      <p>${practice.translation}</p>
    </details>
  `;
});

document.getElementById('translateBtn').addEventListener('click', async () => {
  const inputText = document.getElementById('inputText').value;
  const targetLang = document.getElementById('targetLang').value;

  const res = await fetch('https://pooriya-pitranslate.hosting.codeyourfuture.io/api/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ inputText, targetLang })
  });

  const data = await res.json();
  document.getElementById('output').textContent = data.translation || 'Translation failed';
});

document.getElementById('speakBtn').addEventListener('click', () => {
  const text = document.getElementById('output').textContent;
  const utterance = new SpeechSynthesisUtterance(text);
  speechSynthesis.speak(utterance);
});

document.getElementById('inputText').addEventListener('mouseup', async () => {
  const textarea = document.getElementById('inputText');
  const selectedText = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd).trim();
  const targetLang = document.getElementById('targetLang').value;

  if (selectedText.length > 0) {
    const res = await fetch('https://pooriya-pitranslate.hosting.codeyourfuture.io/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputText: selectedText, targetLang })
    });

    const data = await res.json();
    document.getElementById('highlightTranslation').textContent = `🔎 "${selectedText}" means: ${data.translation}`;
  } else {
    document.getElementById('highlightTranslation').textContent = "";
  }
});

document.getElementById('detailsBtn').addEventListener('click', async () => {
  const inputText = document.getElementById('inputText').value;
  const res = await fetch('https://pooriya-pitranslate.hosting.codeyourfuture.io/api/details', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ inputText })
  });
  const data = await res.json();
  document.getElementById('extraDetails').innerHTML = `
    <h4>Examples:</h4><p>${data.examples}</p>
    <h4>Synonyms:</h4><p>${data.synonyms}</p>
  `;
});

document.getElementById('idiomBtn').addEventListener('click', async () => {
  const inputText = document.getElementById('inputText').value;
  const res = await fetch('https://pooriya-pitranslate.hosting.codeyourfuture.io/api/idiom', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ inputText })
  });
  const data = await res.json();
  document.getElementById('idiomOutput').innerHTML = `<h4>Related Idiom:</h4><p>${data.idiom}</p>`;
});

document.getElementById('favBtn').addEventListener('click', () => {
  const inputText = document.getElementById('inputText').value;
  const translation = document.getElementById('output').textContent;
  if (!inputText || !translation) return;

  const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
  favorites.push({ text: inputText, translation });
  localStorage.setItem('favorites', JSON.stringify(favorites));
  updateFavoritesUI();
});

document.getElementById('themeToggle').addEventListener('click', () => {
  const html = document.documentElement;
  const current = html.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
});
window.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
});

updateFavoritesUI();