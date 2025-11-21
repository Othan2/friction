import { Settings, DEFAULT_SETTINGS, TemporaryUnlocks, extractDomain } from './types.js';
import { isUrlBlocked } from './utils/urlBlocking.js';

async function isTemporarilyUnlocked(url: string): Promise<boolean> {
  const domain = extractDomain(url);
  const result = await chrome.storage.local.get('temporaryUnlocks');
  const unlocks = (result.temporaryUnlocks as TemporaryUnlocks) || {};

  const expiryTime = unlocks[domain];
  if (!expiryTime) return false;

  const now = Date.now();
  if (now < expiryTime) {
    return true;
  }

  delete unlocks[domain];
  await chrome.storage.local.set({ temporaryUnlocks: unlocks });
  return false;
}

chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  if (details.frameId !== 0) return;

  const blockPageUrl = chrome.runtime.getURL('block.html');
  if (details.url.startsWith(blockPageUrl)) return;

  const result = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  const settings = result as Settings;

  if (isUrlBlocked(details.url, settings.blockedSites)) {
    const unlocked = await isTemporarilyUnlocked(details.url);
    if (!unlocked) {
      const redirectUrl = `${blockPageUrl}?url=${encodeURIComponent(details.url)}`;
      chrome.tabs.update(details.tabId, { url: redirectUrl });
    }
  }
});

chrome.runtime.onInstalled.addListener(async () => {
  const result = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  if (!result.phrase) {
    await chrome.storage.sync.set(DEFAULT_SETTINGS);
  }
});
