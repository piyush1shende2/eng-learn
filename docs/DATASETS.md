# Datasets

What was found in `F:\datasets`, how each part is used, and what needs checking.

## Used for accents

| Dataset | What it holds | How it is used |
|---|---|---|
| **Speech Accent Archive** (`kaggle archive (1)`) | `speakers_all.csv` and about 2,100 mp3 recordings. Every speaker reads the same English paragraph ("Please call Stella..."). 579 recordings are from native English speakers (USA 373, UK 65, Canada 44, Australia 32, Ireland 11, New Zealand 8, Jamaica 5, South Africa 4, Singapore 4, India 3, ...). The rest are learners grouped by first language, including 104 Indian-subcontinent speakers (Hindi 18, Bengali 17, Urdu 16, Nepali 13, Punjabi 10, Gujarati 9, Tamil 6, Malayalam 4, Marathi 3, Telugu 2, Kannada 1) | One group per country (native) and per first language (learners). Speakers are spread across birthplaces and alternate by gender |
| **VCTK, Hugging Face parquet copy** (`vctk-sanchit`) | 27 parquet shards (about 11.7 GB), 88,156 utterances with `accent`, `region`, `gender`, `age` and audio. Accents include English, Scottish, Irish, Northern Irish, Welsh, American, Canadian, Australian, New Zealand, South African, Indian | The sentences read by (nearly) every speaker, the Stella paragraph and the Rainbow Passage, are found automatically. The same sentence is then available in each accent, which is what makes accent-to-accent comparison possible. Shards are streamed, never loaded whole |

## Used for the language voice library

| Dataset | Notes |
|---|---|
| `.tar.gz` archives (`datasets\less that 500mb`) | Five corpora: German (emotional), Italian, Czech, Central Kurdish, Otomi. Unpacked to a temporary folder, then deleted |
| Urdu TTS corpus (folder of zips) | Layout inside the zips is detected, not assumed. **Not tested on the real archive**; the script prints what it finds if it cannot match audio to text |
| Kokoro speech (Japanese, LibriVox) | `metadata.csv` (`id|text|phonemes`) and `wavs/*.flac`. File lookup tries several naming forms. **Not tested on the real files** |
| Chuvash TTS | One parquet file with audio and text |

## Not used

| Item | Why |
|---|---|
| `vctk-full` | Contains `vctk.zip` and a leftover `.incomplete` download file, so it may be a broken download. The parquet copy has the same speakers and labels |
| `datasets\vctk_edinburgh` | Only the README and licence text, no audio |

## Licences: check before publishing

| Dataset | Licence |
|---|---|
| VCTK | CC BY 4.0 (stated in its README). Credit required |
| Speech Accent Archive | The Kaggle page is understood to list **CC BY-NC-SA 4.0 (non-commercial)**; the dataset folder holds no licence file, so **verify on the dataset page**. Non-commercial terms matter if the app is ever monetised. Override the shown text with `--archive-license` |
| Kurdish, Otomi, Chuvash | Share-alike (CC BY-SA). Credit required, and adaptations must stay under the same licence |
| Urdu | Unknown (no licence file found). Set `--urdu-license` after checking |
| Kokoro | Public-domain sources (LibriVox, Aozora Bunko) according to the dataset description; check its README |
| German, Italian, Czech | Per each corpus's README. The existing library entries carry them |

`public/accents/CREDITS.txt` and the app's "Credits and licences" panel are generated from the same text. If you cannot confirm a licence, build without that dataset: `--only vctk`.
