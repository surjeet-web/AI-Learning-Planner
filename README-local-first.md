# Local Data Storage & Portability

What’s included:
- IndexedDB schema (courses, progress, roadmaps, presentations, user_data).
- Export/Import:
  - JSON export with optional AES-GCM encryption (password).
  - CSV exports for courses and 30-day progress.
  - Replace or merge modes on import with basic conflict resolution.
- File System Access API:
  - Choose a local folder and save timestamped backups to /backups.
- Offline:
  - Service worker (app shell caching).
  - Offline banner and transparent local persistence.
- Live Sync:
  - Redux state automatically persists to IndexedDB (debounced).
  - Initial load restores state from IndexedDB.

Notes:
- File System Access API is supported in Chromium-based browsers. If unavailable, you can still export/download JSON/CSVs.
- Encryption uses Web Crypto (AES-GCM with PBKDF2).
- SQLite export is not implemented in this prototype to avoid heavy WASM; can be added later.
