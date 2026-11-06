# Contributing

```bash
npm install
npm run check     # lint + tests + build, the same as CI
```

- Accent knowledge lives in `src/accentData.js`. Add words or accents there; `npm test` verifies the data is complete and consistent.
- Keep new code readable: one idea per line, short comments that say *why*.
- Do not commit dataset audio you do not have the right to share. Build it with `tools/build_data.*` and keep `CREDITS.txt`.
- Keep files under 100 MB (GitHub limit).
