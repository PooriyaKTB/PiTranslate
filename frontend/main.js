function updateFavoritesUI() {
  const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
  const list = document.getElementById('favoritesList');
  list.innerHTML = "";
  favorites.forEach((item, index) => {
    const li = document.createElement('li');
    li.textContent = `📌 ${item.text} → ${item.translation}`;
    list.appendChild(li);
  });
}

document.getElementById('translateBtn').addEventListener('click', async () => {
  const inputText = document.getElementById('inputText').value;
  const targetLang = document.getElementById('targetLang').value;

  const res = await fetch('http://localhost:5000/api/translate', {
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
    const res = await fetch('http://localhost:5000/api/translate', {
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
  const res = await fetch('http://localhost:5000/api/details', {
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
  const res = await fetch('http://localhost:5000/api/idiom', {
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

updateFavoritesUI();