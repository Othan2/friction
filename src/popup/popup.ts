import { Settings, DEFAULT_SETTINGS } from '../types.js';

const phraseInput = document.getElementById('phraseInput') as HTMLInputElement;
const savePhraseBtn = document.getElementById('savePhrase') as HTMLButtonElement;
const siteInput = document.getElementById('siteInput') as HTMLInputElement;
const addSiteForm = document.getElementById('addSiteForm') as HTMLFormElement;
const sitesList = document.getElementById('sitesList') as HTMLUListElement;

async function loadSettings() {
  const result = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  const settings = result as Settings;

  phraseInput.value = settings.phrase;
  renderSitesList(settings.blockedSites);
}

function renderSitesList(sites: string[]) {
  sitesList.innerHTML = '';

  if (sites.length === 0) {
    const emptyMessage = document.createElement('li');
    emptyMessage.className = 'empty-message';
    emptyMessage.textContent = 'No blocked sites yet';
    sitesList.appendChild(emptyMessage);
    return;
  }

  sites.forEach(site => {
    const li = document.createElement('li');

    const siteName = document.createElement('span');
    siteName.className = 'site-name';
    siteName.textContent = site;

    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.textContent = 'Remove';
    removeBtn.addEventListener('click', () => removeSite(site));

    li.appendChild(siteName);
    li.appendChild(removeBtn);
    sitesList.appendChild(li);
  });
}

savePhraseBtn.addEventListener('click', async () => {
  const phrase = phraseInput.value.trim();
  if (!phrase) {
    alert('Please enter a phrase');
    return;
  }

  await chrome.storage.sync.set({ phrase });
  savePhraseBtn.textContent = 'Saved!';
  setTimeout(() => {
    savePhraseBtn.textContent = 'Save Phrase';
  }, 1500);
});

addSiteForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const site = siteInput.value.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');

  if (!site) {
    alert('Please enter a site');
    return;
  }

  const result = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  const settings = result as Settings;

  if (settings.blockedSites.includes(site)) {
    alert('Site already blocked');
    siteInput.value = '';
    return;
  }

  const updatedSites = [...settings.blockedSites, site];
  await chrome.storage.sync.set({ blockedSites: updatedSites });

  siteInput.value = '';
  renderSitesList(updatedSites);
});

async function removeSite(site: string) {
  const result = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  const settings = result as Settings;

  const updatedSites = settings.blockedSites.filter(s => s !== site);
  await chrome.storage.sync.set({ blockedSites: updatedSites });

  renderSitesList(updatedSites);
}

loadSettings();
