# 🌍 PiTranslate

An AI-powered translator and vocabulary trainer. Translate text between 36 languages, see how to pronounce it, get example sentences, synonyms and matching idioms, and keep the words you save with spaced-repetition practice.

## Features

- **Translation** into 36 languages, with automatic source-language detection (shown as "English — detected") and a one-click swap.
- **Pronunciation guide** under every short translation: IPA for Latin-alphabet languages (`/həˈləʊ/`), standard romanization for the rest (pinyin, romaji, *sobh bekheyr*).
- **"Did you mean…?"** suggestions for misspelled input; one click fixes the text and translates again.
- **Examples & synonyms** and **idioms** with a natural equivalent in the target language.
- **Listen** with the device's own voices (the button only appears when a voice exists for that language).
- **Recent translations** (last 5) and **favorites**: click either to bring a translation back without another API call; removing a favorite can be undone.
- **Spaced-repetition practice** of saved words, fully usable from the keyboard (Space, 1, 2, S, Esc).
- Optional **accounts** (email/password with sign-up, login and password reset, or Google) via Firebase Auth; the app also works as a guest.
- Light and dark themes (following the OS by default), right-to-left text support, and a layout that works down to 320px-wide phones.

## Tech stack

| Part | Technology |
|---|---|
| Frontend | Vanilla JavaScript (ES modules, no build step), HTML, CSS |
| Backend | Node.js, Express |
| AI | OpenAI API — `gpt-6-luna` (fast tier, no reasoning) in JSON mode |
| Auth | Firebase Authentication |
| Hosting | Frontend on Netlify; backend on Coolify or Render |

## How it works

```
Browser (frontend/)                         Backend (backend/)                OpenAI
 app.html + ES modules ── POST /api/* ──▶  Express: CORS, rate limit,  ──▶  gpt-6-luna
 favorites, recent, practice,               input validation, prompts,        (JSON mode)
 theme → localStorage                       response clean-up
 login → Firebase Auth (optional)
```

The backend is a stateless proxy that keeps the OpenAI key off the client. All user data (favorites, practice progress, recent translations, preferences) currently lives in the browser's `localStorage`.

## Getting started

**Requirements:** Node.js 18+ and an OpenAI API key.

1. Install dependencies from the repo root:

   ```bash
   npm install
   ```

2. Create `backend/.env`:

   ```bash
   OPENAI_API_KEY=sk-...
   ALLOWED_ORIGINS=http://localhost:5500
   ```

3. Start the backend (port 5050 by default):

   ```bash
   npm start
   ```

4. Serve the `frontend/` folder on **http://localhost:5500**, e.g. with the VS Code Live Server extension or `npx serve frontend -l 5500`, and open `app.html`.

When the page is served from `localhost`, the frontend talks to the local backend (`http://localhost:5050/api`); anywhere else it uses the deployed one (see `API_BASE` in `frontend/api.js`).

> Use `localhost`, not `127.0.0.1`: Firebase only allows sign-in from authorized domains, and `localhost` is the one enabled by default.

### Environment variables (`backend/.env`)

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `OPENAI_API_KEY` | yes | — | OpenAI API key. The server refuses to start without it. |
| `ALLOWED_ORIGINS` | no | `http://localhost:5500,http://127.0.0.1:5500` | Comma-separated list of frontend origins allowed by CORS. |
| `PORT` | no | `5050` | Port to listen on. (5000 is avoided because macOS AirPlay uses it.) |
| `TRUST_PROXY` | no | `1` | Number of reverse proxies in front of the server, so rate limiting sees real client IPs. Set to `0` when nothing sits in front of it. |

## API

All endpoints take JSON and return JSON. Each `/api` route accepts:

| Field | Type | Notes |
|---|---|---|
| `inputText` | string, required | Up to 5000 characters. |
| `targetLang` | string, required | Language name, e.g. `"French"` or `"English (UK)"`. |
| `inputLang` | string, optional | Source language name, or `"auto"` / omitted to detect it. |

| Endpoint | Returns |
|---|---|
| `POST /api/translate` | `{ translation, pronunciation, detectedLanguage, correction }`. `pronunciation` and `correction` are only produced for inputs up to 300 characters; `detectedLanguage` only when the source language isn't given. |
| `POST /api/details` | `{ examples: [{ text, translation }], synonyms: [{ word, translation }] }` |
| `POST /api/idiom` | `{ idiom, meaning, equivalent }` |
| `GET /health` | `{ status: "ok" }`, for the hosting platform's health checks. |

Errors come back as `{ error }` with status `400` (invalid input), `403` (origin not allowed), `429` (rate limited: 30 requests per minute per IP, or the AI service is busy), `502`/`503` (AI service unavailable or unreachable) or `500`.

## Project structure

```
backend/
  server.js               Express app: CORS, rate limiting, routes, error handling
  routes/                 translate.js, details.js, idiom.js (one prompt each)
  utils/
    openai.js             OpenAI client, model settings and chat() helper
    validateInput.js      request validation middleware
    aiResponse.js         cleaning up model output
    handleOpenAIError.js  maps AI failures to HTTP responses
frontend/
  index.html              landing page
  app.html, main.js       the translator, wired together
  login-signup.html/.js   log in, sign up and password reset
  api.js                  backend calls (timeout, loading state, error toasts)
  favorites.js, recent.js, practice.js
  languages.js            the language list and the saved target language
  firebase.js             Firebase SDK version and config
  theme.js, toast.js, dom.js, storage.js, style.css
```

## Deployment

- **Backend (Coolify/Render):** run `npm start` from the repo root (or `node server.js` in `backend/`), set `OPENAI_API_KEY` and `ALLOWED_ORIGINS` (your Netlify URL), and point the health check at `/health`.
- **Frontend (Netlify):** publish the `frontend/` directory as-is; there is no build step. If the backend URL changes, update `API_BASE` in `frontend/api.js`.
- **Firebase:** add the production domain under *Authentication → Settings → Authorized domains*.

## Limitations and roadmap

- User data is stored per browser; signing in doesn't sync it yet, and the backend doesn't verify who is calling it.
- Planned: PostgreSQL for per-user favorites, practice and full history (with Firebase ID-token verification in the backend), Redis for caching translations and for rate limiting, and automated tests with CI.
