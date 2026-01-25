let utterance;
let speaking = false;

function getReadableText() {
  const main = document.querySelector('main') || document.body;
  return main.innerText.replace(/\s+/g, ' ').trim();
}

function toggleRead() {
  if (speaking) {
    speechSynthesis.cancel();
    speaking = false;
    btn.innerText = '🔊 Oku';
    return;
  }
  utterance = new SpeechSynthesisUtterance(getReadableText());
  utterance.lang = 'tr-TR';
  // Hız 0.95'ten 1.15'e çıkarıldı (Daha seri ve akıcı okuma için)
  utterance.rate = 1.15; 
  utterance.onend = () => {
    speaking = false;
    btn.innerText = '🔊 Oku';
  };
  speechSynthesis.speak(utterance);
  speaking = true;
  btn.innerText = '⏹ Durdur';
}

const btn = document.createElement('button');
btn.id = 'tts-btn';
btn.innerText = '🔊 Oku';
btn.onclick = toggleRead;

Object.assign(btn.style, {
  position: 'fixed',
  bottom: '20px',
  right: '20px',
  zIndex: 9999,
  padding: '10px 14px',
  borderRadius: '8px',
  border: 'none',
  background: '#cfa24a',
  color: '#000',
  fontWeight: '600',
  cursor: 'pointer',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)' // Hafif bir gölge ile daha belirgin hale getirildi
});

document.addEventListener('DOMContentLoaded', () => {
  document.body.appendChild(btn);
});
