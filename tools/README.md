# Data tools

These run **once on your computer** to turn your datasets into the small files the app ships with.
End users never run them and never download datasets.

| File | What it does |
|---|---|
| `build_data.bat` / `build_data.sh` | One command that runs everything below |
| `build_accent_data.py` | VCTK (parquet) and Speech Accent Archive -> `public/accents/` (accent recordings + manifest + credits) |
| `build_voice_library.py` | Language corpora (Urdu, Japanese/Kokoro, Chuvash, German, Italian, Czech, Kurdish, Otomi) -> `public/voices/` |
| `audio_utils.py` | Shared audio code: decode, trim silence, level, write small mono MP3. No ffmpeg needed |
| `build_accent_clips.py` | Older VCTK-only builder (kept for reference) |

```
pip install -r tools/requirements.txt
python tools/build_accent_data.py --root "F:/datasets" --profile full      # add --dry-run to preview
python tools/build_voice_library.py --root "F:/datasets" --n 60
```

Profiles: `lite` (~10 MB), `standard` (~25 MB), `full` (~60 MB), `max` (~150 MB). Finished clips are kept, so you can stop and resume.
