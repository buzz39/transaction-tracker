# Transaction Tracker PWA

A lightweight, role-based **Progressive Web App (PWA)** for logging and tracking financial transactions between two parties. Transactions are persisted in Google Sheets via the [SheetDB](https://sheetdb.io/) API, and the app works fully in the browser with no server required.

---

## Features

- 🔐 **Simple login system** with username/password and two distinct roles
- 📋 **Role-based transaction logging** – investors log investments, partners log returns
- ✅ **Transaction confirmation** – each party can confirm pending entries from the other side
- 📊 **Recent transactions table** – shows the 10 most recent entries at a glance
- 📜 **Full transaction history** – toggle a full history view per sheet
- 🗂️ **Multi-sheet support** – switch between named sheets (e.g. Orient, Kapoor) via tabs
- 📱 **PWA** – installable on desktop and mobile, with offline caching via a service worker
- 💾 **Session persistence** – login state is saved in `localStorage`

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI | HTML5, [Tailwind CSS](https://tailwindcss.com/) (CDN), Google Fonts (Inter) |
| Backend | [SheetDB](https://sheetdb.io/) (Google Sheets as a REST API) |
| PWA | Web App Manifest + Service Worker |
| Runtime | Vanilla JavaScript (no build step required) |

---

## Project Structure

```
transaction-tracker/
├── dashboard/
│   ├── index.html      # Main application UI and logic
│   ├── config.js       # Configuration: sheet APIs, users, roles (not committed)
│   ├── manifest.json   # PWA web app manifest
│   └── sw.js           # Service worker for offline caching
├── .env.example        # Example environment variables (for optional bot integrations)
├── .gitignore
└── README.md
```

---

## Setup & Configuration

### 1. Create `dashboard/config.js`

This file is **not committed** to the repository (add it to `.gitignore`). Create it in the `dashboard/` folder with the following structure:

> **Getting your SheetDB API key:** Create a free account at [sheetdb.io](https://sheetdb.io/), connect a Google Sheet, and copy the API URL from your SheetDB dashboard.

```js
const AppConfig = {
  defaultSheet: 'orient',
  sheets: {
    orient: {
      api: 'https://sheetdb.io/api/v1/YOUR_ORIENT_API_KEY'  // replace with your SheetDB API URL
    },
    kapoor: {
      api: 'https://sheetdb.io/api/v1/YOUR_KAPOOR_API_KEY'  // replace with your SheetDB API URL
    }
  },
  users: [
    { username: 'investor1', password: 'secret', role: 'investor' },
    { username: 'partner1',  password: 'secret', role: 'other'    }
  ]
};
```

| Field | Description |
|---|---|
| `defaultSheet` | The sheet tab shown when the app loads (`orient` or `kapoor`) |
| `sheets.<name>.api` | SheetDB API URL for the corresponding Google Sheet |
| `users` | Array of user credentials; each user has a `username`, `password`, and `role` |

### 2. User Roles

| Role | What they can log | What they can confirm |
|---|---|---|
| `investor` | **Invest** transactions (status: Pending) | Pending **Return** transactions |
| `other` | **Return** transactions (status: Pending) | Pending **Invest** transactions |

### 3. Google Sheet columns

Each SheetDB-linked Google Sheet should contain these columns:

| Column | Description |
|---|---|
| `ID` | Auto-incremented row ID |
| `Date` | Transaction date (`YYYY-MM-DD`) |
| `Timestamp` | ISO 8601 timestamp set at submission |
| `Type` | `Invest` or `Return` |
| `Amount` | Numeric amount |
| `Return Amount` | Reserved for return tracking (optional) |
| `Status` | `Pending` or `Completed` |
| `Notes` | Optional free-text note |

---

## Running the App

Because the app is entirely client-side, you only need a static file server:

```bash
# Using Python (built-in)
cd dashboard
python3 -m http.server 8080
```

Then open `http://localhost:8080` in your browser.

> **Note:** The service worker requires the app to be served over HTTP/HTTPS (not opened as a `file://` URL).

---

## PWA Installation

1. Open the app in a supported browser (Chrome, Edge, or Firefox).
2. Look for an **Install** icon in the address bar, or a browser prompt offering to add the app to your home screen.
3. Follow the on-screen instructions to install the PWA on your device.

Once installed, the app will:
- Launch in a standalone window (no browser chrome)
- Cache core assets for offline access via the service worker

---

## Environment Variables (Optional Integrations)

The `.env.example` file documents variables for optional bot integrations (e.g., a Telegram bot):

```env
TELEGRAM_BOT_TOKEN=your-telegram-bot-token-here
SHEETDB_API_URL=https://sheetdb.io/api/v1/your-api-key
ALLOWED_USER_IDS=your-telegram-user-id,your-friend-telegram-user-id
```

Copy `.env.example` to `.env` and fill in your values if you are using such an integration.

---

## Security Notes

- User credentials in `config.js` are stored in plain text and loaded client-side. This is suitable for **personal/private use** only. Do not use this setup for a public-facing app with sensitive data.
  - For stronger security, consider moving authentication to a dedicated backend with hashed passwords, or using an OAuth provider (e.g. Google Sign-In) and enforcing access control server-side.
- Keep `config.js` out of version control (add it to `.gitignore`).
- Restrict your SheetDB API keys to only the IP ranges or origins you trust.

---

## License

This project is for personal use. No license is currently specified.
