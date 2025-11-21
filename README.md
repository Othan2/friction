# Friction

A Chrome extension that helps you avoid distracting websites by requiring you to type an unlock phrase before accessing them.

## Features

- Block specific websites with a customizable list
- Set your own unlock phrase
- Must type the exact phrase (case-sensitive) every time you visit a blocked site
- Paste is disabled in the phrase input to ensure mindful typing
- Simple popup interface for managing blocked sites

## Installation

1. Install dependencies:

   ```bash
   npm install
   ```

2. Build the extension:

   ```bash
   npm run build
   ```

3. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `dist` folder from this project

## Usage

### Setting Up

1. Click the extension icon in your Chrome toolbar
2. Set your motivational phrase (default: "I want to waste my short time on earth.")
3. Add websites you want to block (e.g., "twitter.com", "reddit.com")

### Accessing Blocked Sites

When you navigate to a blocked site:

1. You'll be redirected to a block page
2. The phrase will be displayed at the top
3. Type the exact phrase (case-sensitive, exact punctuation)
4. Click "Continue" to proceed to the site

You must type the phrase every time you visit the blocked site - there's no session caching.

## Debugging

If blocking isn't working, follow these steps to debug:

### 1. Check Service Worker Status

1. Go to `chrome://extensions/`
2. Find "Distraction Phrase Blocker"
3. Click "Inspect views: service worker"
4. Check the console for any errors
5. Verify the service worker is running (should say "Service worker" at the top)

### 2. Verify Extension Loaded

1. In the service worker console, you should see no errors
2. If you see module import errors, the extension needs to be rebuilt
3. Click the reload icon on the extension card to reload it

### 3. Test Blocking

1. Click the extension icon and add a test site (e.g., "example.com")
2. Open a new tab and navigate to `http://example.com`
3. You should be redirected to the block page immediately
4. Check the service worker console for any log messages

### 4. Common Issues

- **Service worker fails to load**: Rebuild the extension with `npm run build`
- **Blocking doesn't work**: Check that you added the site correctly (no http://, just the domain)
- **Block page doesn't redirect**: Check browser console on the block page for errors

### 5. Testing Domain Blocking

The extension blocks domains and all subdomains:

- Adding `reddit.com` blocks:
  - `reddit.com`
  - `old.reddit.com`
  - `www.reddit.com`
  - `old.reddit.com/r/nfl`

Run the test suite to verify blocking logic:

```bash
npm test
```

## Development

### Build Commands

- `npm run build` - Bundle service worker, compile TypeScript, and copy assets to dist/
- `npm run clean` - Remove the dist/ folder
- `npm run watch` - Watch for TypeScript changes and recompile
- `npm test` - Run test suite for domain blocking logic

### Project Structure

```text
src/
├── types.ts           # Shared TypeScript interfaces
├── background.ts      # Service worker for navigation interception
├── popup/
│   ├── popup.html     # Extension popup UI
│   ├── popup.css      # Popup styles
│   └── popup.ts       # Popup logic
└── block/
    ├── block.html     # Block/interstitial page
    ├── block.css      # Block page styles
    └── block.ts       # Block page logic
```

## Technical Details

- **Manifest Version**: V3
- **Language**: TypeScript
- **Bundler**: esbuild (for service worker)
- **Storage**: chrome.storage.sync (syncs across devices)
- **Permissions**: storage, tabs, webNavigation, host_permissions for all URLs
- **Service Worker**: background.js is bundled with all dependencies to avoid ES6 module issues

## Note on Icons

The extension currently references icon files (icon16.png, icon48.png, icon128.png) in the manifest. You'll need to add these icon files to the dist/ folder, or the extension will work but show default Chrome icons.
