export interface Settings {
  blockedSites: string[];
  phrase: string;
}

export const DEFAULT_SETTINGS: Settings = {
  blockedSites: [],
  phrase: "I want to waste my short time on earth."
};

export interface TemporaryUnlocks {
  [domain: string]: number;
}

export const UNLOCK_DURATION_MS = 5 * 60 * 1000;

export interface BlockPageParams {
  url: string;
}

export function extractDomain(url: string): string {
  const urlObj = new URL(url);
  return urlObj.hostname.replace(/^www\./, '');
}
