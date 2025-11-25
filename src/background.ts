import { Settings, DEFAULT_SETTINGS, TemporaryUnlocks, extractDomain } from './types.js';
import { isUrlBlocked } from './utils/urlBlocking.js';

function getParentDomain(domain: string): string | null {
  const parts = domain.split('.');
  if (parts.length <= 2) return null;
  return parts.slice(1).join('.');
}

function domainsShareParent(domain1: string, domain2: string): boolean {
  const parent1 = getParentDomain(domain1);
  const parent2 = getParentDomain(domain2);

  if (!parent1 || !parent2) return false;
  return parent1 === parent2;
}

export async function isTemporarilyUnlocked(url: string): Promise<boolean> {
  const domain = extractDomain(url);
  const result = await chrome.storage.local.get('temporaryUnlocks');
  const unlocks = (result.temporaryUnlocks as TemporaryUnlocks) || {};

  const now = Date.now();
  const expiredDomains: string[] = [];

  // Check if this domain or any parent/child domain is unlocked
  for (const [unlockedDomain, expiryTime] of Object.entries(unlocks)) {
    // Check if unlock has expired
    if (now >= expiryTime) {
      expiredDomains.push(unlockedDomain);
      continue;
    }

    // Check if current domain matches unlock hierarchically
    // 1. Exact match: reddit.com === reddit.com
    // 2. Subdomain match: old.reddit.com ends with .reddit.com
    // 3. Parent match: reddit.com ends with .old.reddit.com (when subdomain is unlocked)
    // 4. Sibling match: old.reddit.com and new.reddit.com share parent reddit.com
    if (
      domain === unlockedDomain ||
      domain.endsWith(`.${unlockedDomain}`) ||
      unlockedDomain.endsWith(`.${domain}`) ||
      domainsShareParent(domain, unlockedDomain)
    ) {
      return true;
    }
  }

  // Clean up expired unlocks
  if (expiredDomains.length > 0) {
    for (const expiredDomain of expiredDomains) {
      delete unlocks[expiredDomain];
    }
    await chrome.storage.local.set({ temporaryUnlocks: unlocks });
  }

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
