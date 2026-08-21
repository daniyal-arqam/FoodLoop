# Shared Node modules

Not a runnable service. Used by auth, food, and organization services to keep enums and MongoDB connection helpers in one place.

- `constants.js` — roles, food statuses, claim statuses, categories, units
- `database.js` — mongoose connect/disconnect helpers (caller passes its mongoose instance)
- `memoryMongo.js` — in-memory MongoDB for tests and schema verification
- `jwtSecret.js` — shared production JWT placeholder rejection
- `securityHeaders.js` — nosniff / frame / referrer headers
- `escapeRegex.js` — literal organization name search
