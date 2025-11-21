import { extractDomain, UNLOCK_DURATION_MS } from './types';

describe('extractDomain', () => {
  it('should extract domain from simple URL', () => {
    expect(extractDomain('https://reddit.com')).toBe('reddit.com');
  });

  it('should extract domain from URL with path', () => {
    expect(extractDomain('https://reddit.com/r/nfl')).toBe('reddit.com');
  });

  it('should remove www prefix', () => {
    expect(extractDomain('https://www.reddit.com')).toBe('reddit.com');
  });

  it('should extract domain from subdomain', () => {
    expect(extractDomain('https://old.reddit.com')).toBe('old.reddit.com');
  });

  it('should handle URLs with ports', () => {
    expect(extractDomain('https://reddit.com:8080')).toBe('reddit.com');
  });

  it('should handle URLs with query params', () => {
    expect(extractDomain('https://reddit.com?foo=bar')).toBe('reddit.com');
  });

  it('should handle URLs with fragments', () => {
    expect(extractDomain('https://reddit.com#section')).toBe('reddit.com');
  });

  it('should handle http protocol', () => {
    expect(extractDomain('http://reddit.com')).toBe('reddit.com');
  });
});

describe('UNLOCK_DURATION_MS', () => {
  it('should be 5 minutes in milliseconds', () => {
    expect(UNLOCK_DURATION_MS).toBe(5 * 60 * 1000);
    expect(UNLOCK_DURATION_MS).toBe(300000);
  });
});
