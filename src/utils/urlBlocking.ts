export function isUrlBlocked(url: string, blockedSites: string[]): boolean {
  const urlObj = new URL(url);
  const hostname = urlObj.hostname.replace(/^www\./, '');

  return blockedSites.some(site => {
    const normalizedSite = site.replace(/^www\./, '').toLowerCase();
    return hostname.toLowerCase() === normalizedSite || hostname.toLowerCase().endsWith(`.${normalizedSite}`);
  });
}
