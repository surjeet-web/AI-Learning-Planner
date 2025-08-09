# AI Learning Planner – Chrome Extension (Capture)

1. Open chrome://extensions and toggle Developer mode.
2. Click "Load unpacked" and select this `extension` folder.
3. Edit `service-worker.js` and set APP_BASE_URL to your deployed app URL.
4. Visit a course page, click the extension icon. It will send {url,title,description} to /api/ingest.

Notes:
- This uses page OG/meta for robust cross-site extraction.
- For protected pages, content scripts may need site-specific selectors.
