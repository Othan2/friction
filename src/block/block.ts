import { Settings, DEFAULT_SETTINGS, TemporaryUnlocks, extractDomain, UNLOCK_DURATION_MS } from '../types.js';

const phraseElement = document.getElementById('phrase') as HTMLParagraphElement;
const phraseInput = document.getElementById('phraseInput') as HTMLInputElement;
const phraseForm = document.getElementById('phraseForm') as HTMLFormElement;
const errorElement = document.getElementById('error') as HTMLParagraphElement;

phraseInput.addEventListener('paste', (e) => {
  e.preventDefault();
});

const urlParams = new URLSearchParams(window.location.search);
const targetUrl = urlParams.get('url');

async function init() {
  const result = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  const settings = result as Settings;
  phraseElement.textContent = settings.phrase;
}

phraseForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const result = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  const settings = result as Settings;

  const enteredPhrase = phraseInput.value;

  if (enteredPhrase === settings.phrase) {
    if (targetUrl) {
      const domain = extractDomain(targetUrl);
      const expiryTime = Date.now() + UNLOCK_DURATION_MS;

      const result = await chrome.storage.local.get('temporaryUnlocks');
      const unlocks = (result.temporaryUnlocks as TemporaryUnlocks) || {};
      unlocks[domain] = expiryTime;
      await chrome.storage.local.set({ temporaryUnlocks: unlocks });

      window.location.href = targetUrl;
    } else {
      errorElement.textContent = 'Error: No target URL specified';
    }
  } else {
    errorElement.textContent = 'Incorrect phrase. Please try again.';
    phraseInput.value = '';
    phraseInput.focus();
  }
});

init();
phraseInput.focus();
