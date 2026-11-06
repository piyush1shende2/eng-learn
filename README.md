# Live Link :- https://piyush1shende2.github.io/eng-learn/

# SpeakWise AI

A friendly, gamified English tutor that runs **entirely in the browser**. No account, no server, no API keys.
It works offline after the first visit and is built to stay light on low-end phones and old PCs.

The main idea of this version: **understand accents, not just words.** Pick two accents and a word, and the
Accent Lab shows how each accent says it, plays real speakers, and explains *which sounds differ and why*.

## Features

| Area | What you get |
|---|---|
| **Accent Lab** | Same word, two accents: IPA, a plain respelling, computer voice, a real recording, and a reason for every difference (the r after a vowel, th, v/w, bath vowel, ...). Notes on how learners from 24 first languages tend to sound |
| **Real accent recordings** | Real speakers from VCTK and the Speech Accent Archive: native accents from many countries, plus learners grouped by first language (Hindi, Bengali, Urdu, Spanish, Mandarin, ...). Compare one sentence across accents, "guess the accent" game, record yourself and compare |
| **Learn** | 60-day path with phrases and quizzes |
| **Speak / Chat / Free chat** | Say sentences and see which words you got right; 15 role-play scenes; a rule-based chat partner with grammar fixes |
| **Translate** | Text, two-way conversation and camera/photo (OCR). OCR works offline |
| **Puzzles, Writing, Words, Notebook** | About 20 puzzles; handwriting practice for 10 scripts; flashcards with spaced repetition; mistakes notebook; export/import progress |
| **Languages** | 20 interface and target languages, plus a voice library (German, Italian, Czech, Central Kurdish, Otomi, and with the data build: Urdu, Japanese, Chuvash) |

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
npm run check      # lint + tests + production build
```

Needs Node 18 or newer. `npm run build` writes the site to `dist/`. It uses relative paths, so it works from any
folder or GitHub Pages sub-path.

## Adding the real recordings (do this once)

The recordings are built from your datasets folder and then shipped inside the repo, so users download nothing extra.

```
tools\build_data.bat F:\datasets full        (Windows)
tools/build_data.sh  ~/datasets full         (macOS / Linux)
```

It installs the small Python tools in `tools/requirements.txt`, then:

1. `build_accent_data.py` reads the Speech Accent Archive (`speakers_all.csv` + mp3s) and the VCTK parquet files,
   finds the sentences **every** VCTK speaker reads, picks speakers spread across regions and genders, and writes
   small mono MP3s to `public/accents/` with a manifest and credits.
2. `build_voice_library.py` unpacks the `.tar.gz` corpora to a temporary folder, builds the Urdu, Japanese (Kokoro) and
   Chuvash libraries, and deletes the temporary files.

Add `--dry-run` to `build_accent_data.py` to preview. Profiles: `lite` ~10 MB, `standard` ~25 MB, `full` ~60 MB, `max` ~150 MB.
Finished clips are kept, so an interrupted run resumes. Details: [docs/DATASETS.md](docs/DATASETS.md).

Without the data build the app still works: it falls back to computer voices and the built-in accent explanations.

## Offline and low-end devices

- The first screen is about **78 KB** of JavaScript (gzipped). Each tab loads only when opened.
- A service worker (`public/sw.js`) makes the app work offline after the first visit. Audio and OCR data are stored
  the first time they are used, so nothing fills the device unasked. **Accents -> Save for offline** downloads all
  recordings at once.
- OCR (text from photos) is bundled in `public/ocr` (engine plus 20 languages, about 35 MB). Nothing is fetched from a CDN.
- Recordings are mono 22 kHz 32 kbps MP3 (about 4 KB per second); audio elements use `preload="metadata"`.
- Animations switch off with the system "reduce motion" setting.
- Speech recognition is the exception: Chrome and Edge send audio to their cloud service for it. Everything else stays on the device.

These measures are about size and loading work. They have not been timed on specific low-end hardware yet.

## Deploy to GitHub Pages

1. Push to a repository, then **Settings -> Pages -> Source: GitHub Actions**.
2. Pushing to `main` runs `.github/workflows/pages.yml` (tests, build, deploy). `ci.yml` runs on every push and pull request.
3. Keep every file under 100 MB (GitHub's limit). The data build makes files of a few hundred KB.

## Project layout

```
src/                  app (React). accentData.js = accent knowledge base, AccentLab.jsx = the lab
public/accents/       real accent recordings + manifest (built by tools/)
public/voices/        language voice library (built by tools/)
public/ocr/           offline OCR engine and language data
public/sw.js          offline support
tools/                data build scripts (Python)
tests/                node --test suites (grammar, accent data, storage, manifests)
docs/DATASETS.md      what each dataset provides and its licence
```

## How the Accent Lab explains differences

`src/accentData.js` gives every accent a value for each sound feature (for example *rhotic*: pronounces the r after a vowel, or not).
Each word lists the features that affect it, with IPA and a respelling per accent. For two accents the lab shows only the
features whose values differ, each with a plain explanation and a practice tip. `tests/accentData.test.js` checks that the data is complete
and that no difference is claimed that the transcription does not show. Transcriptions are simplified, typical-speaker values; real speakers vary.

To add a word or accent, edit `accentData.js` and run `npm test`.

## Licences

Code: MIT ([LICENSE](LICENSE)). Recordings and OCR data have their own licences and must be credited: see [CREDITS.md](CREDITS.md).
Check the licence of each dataset before you publish, in particular the non-commercial and share-alike ones.

## Chat with teacher (Speak → Chat with teacher)

An AI speaking coach powered by Google Gemini. It needs the small server in the `server/` folder, because the API keys must never be put in the browser.

**How it works**
- Pick the languages and accent in the menu at the top of the app (*I know*, *I want to learn*, *Accent*). The chat follows that menu. There is no second menu.
- The teacher opens the chat by asking two questions: your **level** and the **scenario** you want to practise (30 scenarios such as job interview, airport, doctor, shopping, phone call). Tap a suggestion or just type or speak your answer.
- The teacher replies in the language of *I know*, and keeps the phrases to learn in the language of *I want to learn*.
- 40 languages can be practised; the 20 extra ones (Telugu, Gujarati, Kannada, Thai, Polish, …) are available in this chat only.

**Run it**
1. `cd server`, copy `env.example` to `.env`, and paste your keys (`GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, optionally up to `_10`). Never commit `.env`.
2. Start the server: `cd server && npm install && npm start` (port 5000).
3. In another terminal, start the app from the project folder: `npm run dev` (port 5173).
   On Windows you can double-click `run-app.bat`, on macOS/Linux run `./run-app.sh` to start both.

**Automatic key switching.** Keys are tried in order. If one runs out of quota (or is rejected), the same message is sent again with the next key, so the learner doesn't notice. The resting key is tried again automatically later. Open `http://localhost:5000/api/health` to see how many keys are ready (it never shows the keys).

Settings in `server/.env`: `GEMINI_MODEL`, `PORT`, `FRONTEND_ORIGIN`.
