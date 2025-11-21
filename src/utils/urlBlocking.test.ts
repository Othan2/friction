import { isUrlBlocked } from './urlBlocking';

describe('isUrlBlocked', () => {
  describe('exact domain matching', () => {
    it('should block exact domain match', () => {
      expect(isUrlBlocked('https://reddit.com', ['reddit.com'])).toBe(true);
    });

    it('should block exact domain match with path', () => {
      expect(isUrlBlocked('https://reddit.com/r/nfl', ['reddit.com'])).toBe(true);
    });

    it('should block exact domain match with query params', () => {
      expect(isUrlBlocked('https://reddit.com?foo=bar', ['reddit.com'])).toBe(true);
    });

    it('should block http protocol', () => {
      expect(isUrlBlocked('http://reddit.com', ['reddit.com'])).toBe(true);
    });
  });

  describe('subdomain matching', () => {
    it('should block subdomains when blocking base domain', () => {
      expect(isUrlBlocked('https://old.reddit.com', ['reddit.com'])).toBe(true);
    });

    it('should block subdomain with path', () => {
      expect(isUrlBlocked('https://old.reddit.com/r/nfl', ['reddit.com'])).toBe(true);
    });

    it('should block nested subdomains', () => {
      expect(isUrlBlocked('https://api.old.reddit.com', ['reddit.com'])).toBe(true);
    });

    it('should block www subdomain', () => {
      expect(isUrlBlocked('https://www.reddit.com', ['reddit.com'])).toBe(true);
    });
  });

  describe('www prefix handling', () => {
    it('should block domain when blocklist has www prefix', () => {
      expect(isUrlBlocked('https://reddit.com', ['www.reddit.com'])).toBe(true);
    });

    it('should block www domain when blocklist has no www', () => {
      expect(isUrlBlocked('https://www.reddit.com', ['reddit.com'])).toBe(true);
    });

    it('should block subdomain when blocklist has www prefix', () => {
      expect(isUrlBlocked('https://old.reddit.com', ['www.reddit.com'])).toBe(true);
    });
  });

  describe('case insensitivity', () => {
    it('should block regardless of URL case', () => {
      expect(isUrlBlocked('https://REDDIT.COM', ['reddit.com'])).toBe(true);
    });

    it('should block regardless of blocklist case', () => {
      expect(isUrlBlocked('https://reddit.com', ['REDDIT.COM'])).toBe(true);
    });

    it('should block subdomains regardless of case', () => {
      expect(isUrlBlocked('https://OLD.REDDIT.COM', ['reddit.com'])).toBe(true);
    });
  });

  describe('negative cases', () => {
    it('should not block different domains', () => {
      expect(isUrlBlocked('https://facebook.com', ['reddit.com'])).toBe(false);
    });

    it('should not block partial string matches', () => {
      expect(isUrlBlocked('https://notreddit.com', ['reddit.com'])).toBe(false);
    });

    it('should not block domains that contain blocked domain as substring', () => {
      expect(isUrlBlocked('https://myreddit.com', ['reddit.com'])).toBe(false);
    });

    it('should not block if blocklist is empty', () => {
      expect(isUrlBlocked('https://reddit.com', [])).toBe(false);
    });
  });

  describe('multiple blocked sites', () => {
    it('should block if URL matches any site in blocklist', () => {
      const blocklist = ['reddit.com', 'twitter.com', 'facebook.com'];
      expect(isUrlBlocked('https://twitter.com', blocklist)).toBe(true);
      expect(isUrlBlocked('https://old.reddit.com', blocklist)).toBe(true);
      expect(isUrlBlocked('https://www.facebook.com/profile', blocklist)).toBe(true);
    });

    it('should not block if URL matches none in blocklist', () => {
      const blocklist = ['reddit.com', 'twitter.com'];
      expect(isUrlBlocked('https://youtube.com', blocklist)).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle URLs with ports', () => {
      expect(isUrlBlocked('https://reddit.com:8080', ['reddit.com'])).toBe(true);
    });

    it('should handle URLs with fragments', () => {
      expect(isUrlBlocked('https://reddit.com#section', ['reddit.com'])).toBe(true);
    });

    it('should handle complex paths', () => {
      expect(isUrlBlocked('https://old.reddit.com/r/nfl/comments/123/title', ['reddit.com'])).toBe(true);
    });
  });
});
