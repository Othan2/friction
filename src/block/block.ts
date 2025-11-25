import { Settings, DEFAULT_SETTINGS, TemporaryUnlocks, extractDomain, UNLOCK_DURATION_MS } from '../types.js';

const phraseElement = document.getElementById('phrase') as HTMLParagraphElement;
const phraseInput = document.getElementById('phraseInput') as HTMLInputElement;
const phraseForm = document.getElementById('phraseForm') as HTMLFormElement;
const errorElement = document.getElementById('error') as HTMLParagraphElement;
const bypassBtn = document.getElementById('bypassBtn') as HTMLButtonElement;

const BYPASS_DURATION_MS = 2 * 60 * 1000; // 2 minutes

phraseInput.addEventListener('paste', (e) => {
  e.preventDefault();
});

const urlParams = new URLSearchParams(window.location.search);
const targetUrl = urlParams.get('url');

async function unlockAndRedirect(url: string | null, durationMs: number): Promise<void> {
  if (!url) {
    errorElement.textContent = 'Error: No target URL specified';
    return;
  }

  const domain = extractDomain(url);
  const expiryTime = Date.now() + durationMs;

  const result = await chrome.storage.local.get('temporaryUnlocks');
  const unlocks = (result.temporaryUnlocks as TemporaryUnlocks) || {};
  unlocks[domain] = expiryTime;
  await chrome.storage.local.set({ temporaryUnlocks: unlocks });

  window.location.href = url;
}

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
    await unlockAndRedirect(targetUrl, UNLOCK_DURATION_MS);
  } else {
    errorElement.textContent = 'Incorrect phrase. Please try again.';
    phraseInput.value = '';
    phraseInput.focus();
  }
});

bypassBtn.disabled = true;

setTimeout(() => {
  bypassBtn.disabled = false;
}, 3000);

bypassBtn.addEventListener('click', async () => {
  await unlockAndRedirect(targetUrl, BYPASS_DURATION_MS);
});

init();
phraseInput.focus();
