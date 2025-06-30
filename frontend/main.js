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