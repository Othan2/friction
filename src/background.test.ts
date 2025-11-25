import { extractDomain } from './types';

// Mock chrome storage API
const mockStorage = {
  temporaryUnlocks: {} as { [domain: string]: number }
};

// Mock chrome APIs
(globalThis as any).chrome = {
  storage: {
    local: {
      get: jest.fn(() => Promise.resolve({ temporaryUnlocks: mockStorage.temporaryUnlocks })),
      set: jest.fn((items) => {
        if (items.temporaryUnlocks) {
          mockStorage.temporaryUnlocks = items.temporaryUnlocks;
        }
        return Promise.resolve();
      })
    },
    sync: {
      get: jest.fn(() => Promise.resolve({}))
    }
  },
  webNavigation: {
    onBeforeNavigate: {
      addListener: jest.fn()
    }
  },
  runtime: {
    getURL: jest.fn((path) => `chrome-extension://mock-id/${path}`),
    onInstalled: {
      addListener: jest.fn()
    }
  },
  tabs: {
    update: jest.fn()
  }
};

// Import after mocking
import { isTemporarilyUnlocked } from './background';

describe('isTemporarilyUnlocked', () => {
  beforeEach(() => {
    mockStorage.temporaryUnlocks = {};
    jest.clearAllMocks();
  });

  describe('exact domain matching', () => {
    it('should unlock when exact domain is unlocked', async () => {
      const futureTime = Date.now() + 60000;
      mockStorage.temporaryUnlocks = { 'reddit.com': futureTime };

      expect(await isTemporarilyUnlocked('https://reddit.com')).toBe(true);
    });

    it('should unlock exact domain with path', async () => {
      const futureTime = Date.now() + 60000;
      mockStorage.temporaryUnlocks = { 'reddit.com': futureTime };

      expect(await isTemporarilyUnlocked('https://reddit.com/r/nfl')).toBe(true);
    });

    it('should unlock exact domain with query params', async () => {
      const futureTime = Date.now() + 60000;
      mockStorage.temporaryUnlocks = { 'reddit.com': futureTime };

      expect(await isTemporarilyUnlocked('https://reddit.com?foo=bar')).toBe(true);
    });

    it('should not unlock when domain is not in unlocks', async () => {
      mockStorage.temporaryUnlocks = {};

      expect(await isTemporarilyUnlocked('https://reddit.com')).toBe(false);
    });
  });

  describe('hierarchical unlocking - parent domain unlocked', () => {
    it('should unlock subdomain when parent domain is unlocked', async () => {
      const futureTime = Date.now() + 60000;
      mockStorage.temporaryUnlocks = { 'reddit.com': futureTime };

      expect(await isTemporarilyUnlocked('https://old.reddit.com')).toBe(true);
    });

    it('should unlock subdomain with path when parent is unlocked', async () => {
      const futureTime = Date.now() + 60000;
      mockStorage.temporaryUnlocks = { 'reddit.com': futureTime };

      expect(await isTemporarilyUnlocked('https://old.reddit.com/r/nfl')).toBe(true);
    });

    it('should unlock nested subdomain when parent domain is unlocked', async () => {
      const futureTime = Date.now() + 60000;
      mockStorage.temporaryUnlocks = { 'reddit.com': futureTime };

      expect(await isTemporarilyUnlocked('https://api.old.reddit.com')).toBe(true);
    });

    it('should unlock www subdomain when parent domain is unlocked', async () => {
      const futureTime = Date.now() + 60000;
      mockStorage.temporaryUnlocks = { 'reddit.com': futureTime };

      expect(await isTemporarilyUnlocked('https://www.reddit.com')).toBe(true);
    });
  });

  describe('hierarchical unlocking - subdomain unlocked', () => {
    it('should unlock parent domain when subdomain is unlocked', async () => {
      const futureTime = Date.now() + 60000;
      mockStorage.temporaryUnlocks = { 'old.reddit.com': futureTime };

      expect(await isTemporarilyUnlocked('https://reddit.com')).toBe(true);
    });

    it('should unlock parent domain with path when subdomain is unlocked', async () => {
      const futureTime = Date.now() + 60000;
      mockStorage.temporaryUnlocks = { 'old.reddit.com': futureTime };

      expect(await isTemporarilyUnlocked('https://reddit.com/r/nfl')).toBe(true);
    });

    it('should unlock sibling subdomain when another subdomain is unlocked', async () => {
      const futureTime = Date.now() + 60000;
      mockStorage.temporaryUnlocks = { 'old.reddit.com': futureTime };

      expect(await isTemporarilyUnlocked('https://new.reddit.com')).toBe(true);
    });

    it('should unlock nested subdomain when intermediate subdomain is unlocked', async () => {
      const futureTime = Date.now() + 60000;
      mockStorage.temporaryUnlocks = { 'old.reddit.com': futureTime };

      expect(await isTemporarilyUnlocked('https://api.old.reddit.com')).toBe(true);
    });
  });

  describe('expiry handling', () => {
    it('should not unlock when unlock has expired', async () => {
      const pastTime = Date.now() - 1000;
      mockStorage.temporaryUnlocks = { 'reddit.com': pastTime };

      expect(await isTemporarilyUnlocked('https://reddit.com')).toBe(false);
    });

    it('should remove expired unlocks from storage', async () => {
      const pastTime = Date.now() - 1000;
      mockStorage.temporaryUnlocks = { 'reddit.com': pastTime };

      await isTemporarilyUnlocked('https://reddit.com');

      expect(mockStorage.temporaryUnlocks).toEqual({});
      expect(chrome.storage.local.set).toHaveBeenCalledWith({ temporaryUnlocks: {} });
    });

    it('should keep valid unlocks while removing expired ones', async () => {
      const pastTime = Date.now() - 1000;
      const futureTime = Date.now() + 60000;
      mockStorage.temporaryUnlocks = {
        'reddit.com': pastTime,
        'twitter.com': futureTime
      };

      await isTemporarilyUnlocked('https://reddit.com');

      expect(mockStorage.temporaryUnlocks).toEqual({ 'twitter.com': futureTime });
    });

    it('should not unlock subdomain when parent unlock has expired', async () => {
      const pastTime = Date.now() - 1000;
      mockStorage.temporaryUnlocks = { 'reddit.com': pastTime };

      expect(await isTemporarilyUnlocked('https://old.reddit.com')).toBe(false);
    });
  });

  describe('negative cases', () => {
    it('should not unlock different unrelated domains', async () => {
      const futureTime = Date.now() + 60000;
      mockStorage.temporaryUnlocks = { 'reddit.com': futureTime };

      expect(await isTemporarilyUnlocked('https://twitter.com')).toBe(false);
    });

    it('should not unlock partial string matches', async () => {
      const futureTime = Date.now() + 60000;
      mockStorage.temporaryUnlocks = { 'reddit.com': futureTime };

      expect(await isTemporarilyUnlocked('https://notreddit.com')).toBe(false);
    });

    it('should not unlock domains containing unlocked domain as substring', async () => {
      const futureTime = Date.now() + 60000;
      mockStorage.temporaryUnlocks = { 'reddit.com': futureTime };

      expect(await isTemporarilyUnlocked('https://myreddit.com')).toBe(false);
    });
  });

  describe('multiple unlocked domains', () => {
    it('should unlock if URL matches any unlocked domain hierarchically', async () => {
      const futureTime = Date.now() + 60000;
      mockStorage.temporaryUnlocks = {
        'reddit.com': futureTime,
        'twitter.com': futureTime
      };

      expect(await isTemporarilyUnlocked('https://old.reddit.com')).toBe(true);
      expect(await isTemporarilyUnlocked('https://mobile.twitter.com')).toBe(true);
    });

    it('should not unlock if URL matches none in unlocks', async () => {
      const futureTime = Date.now() + 60000;
      mockStorage.temporaryUnlocks = {
        'reddit.com': futureTime,
        'twitter.com': futureTime
      };

      expect(await isTemporarilyUnlocked('https://youtube.com')).toBe(false);
    });
  });

  describe('integration with blocking behavior', () => {
    it('should match blocking hierarchy: blocking reddit.com blocks old.reddit.com, unlocking reddit.com unlocks old.reddit.com', async () => {
      const futureTime = Date.now() + 60000;
      mockStorage.temporaryUnlocks = { 'reddit.com': futureTime };

      expect(await isTemporarilyUnlocked('https://old.reddit.com')).toBe(true);
    });

    it('should handle the original bug scenario', async () => {
      // User bypasses on reddit.com
      const futureTime = Date.now() + 60000;
      mockStorage.temporaryUnlocks = { 'reddit.com': futureTime };

      // User navigates to old.reddit.com - should be unlocked
      expect(await isTemporarilyUnlocked('https://old.reddit.com')).toBe(true);
    });

    it('should handle the reverse scenario', async () => {
      // User bypasses on old.reddit.com
      const futureTime = Date.now() + 60000;
      mockStorage.temporaryUnlocks = { 'old.reddit.com': futureTime };

      // User navigates to reddit.com - should be unlocked
      expect(await isTemporarilyUnlocked('https://reddit.com')).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle URLs with ports', async () => {
      const futureTime = Date.now() + 60000;
      mockStorage.temporaryUnlocks = { 'reddit.com': futureTime };

      expect(await isTemporarilyUnlocked('https://reddit.com:8080')).toBe(true);
    });

    it('should handle URLs with fragments', async () => {
      const futureTime = Date.now() + 60000;
      mockStorage.temporaryUnlocks = { 'reddit.com': futureTime };

      expect(await isTemporarilyUnlocked('https://reddit.com#section')).toBe(true);
    });

    it('should handle complex paths', async () => {
      const futureTime = Date.now() + 60000;
      mockStorage.temporaryUnlocks = { 'reddit.com': futureTime };

      expect(await isTemporarilyUnlocked('https://old.reddit.com/r/nfl/comments/123/title')).toBe(true);
    });
  });
});
