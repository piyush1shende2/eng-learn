#!/usr/bin/env python3
"""
Build the real-speaker ACCENT data for SpeakWise AI from your datasets folder.

    python tools/build_accent_data.py --root "F:/datasets"

It looks for these datasets under --root (any that are missing are skipped):

  * Speech Accent Archive (Kaggle copy):  <root>/**/speakers_all.csv  +  recordings/recordings/*.mp3
        ~2,100 speakers read the same English paragraph. 579 are native English speakers from many countries,
        the rest are learners grouped by first language (Hindi, Bengali, Urdu, Spanish, Mandarin, ...).
  * VCTK, Hugging Face parquet copy:      <root>/**/vctk*/data/*.parquet
        110 English speakers with an accent label (English, Scottish, Irish, American, Australian, Indian, ...).
        The sentences that EVERY speaker reads (the "Please call Stella" paragraph and the Rainbow Passage) are
        found automatically, so the same sentence can be heard in many accents.

Output (all small mono MP3, about 4 KB per second):
    public/accents/manifest.json     what the app reads
    public/accents/clips/...         the audio
    public/accents/CREDITS.txt       credits and licences

Profiles (size vs variety):  lite ~10 MB | standard ~25 MB | full ~60 MB | max ~150 MB
Nothing is uploaded anywhere. Runs fine on a low-end PC (the parquet files are streamed, never loaded whole).
"""
import argparse
import csv
import datetime
import glob
import json
import os
import re
import sys
from collections import Counter, defaultdict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import audio_utils as au  # noqa: E402

PROFILES = {
    #            VCTK speakers/accent, shared sentences, native speakers/country, learner speakers/L1, min speakers for an L1, extra for Indian-subcontinent L1, seconds
    "lite":     dict(vctk_spk=2, vctk_sent=5,  native_spk=2, l1_spk=1, l1_min=3, boost=0, seconds=25),
    "standard": dict(vctk_spk=3, vctk_sent=5,  native_spk=3, l1_spk=2, l1_min=3, boost=1, seconds=30),
    "full":     dict(vctk_spk=5, vctk_sent=12, native_spk=5, l1_spk=3, l1_min=2, boost=2, seconds=40),
    "max":      dict(vctk_spk=9, vctk_sent=24, native_spk=10, l1_spk=6, l1_min=2, boost=4, seconds=45),
}

VCTK_LABELS = {"English": "English (England)", "Scottish": "Scottish English", "NorthernIrish": "Northern Irish English", "Irish": "Irish English",
               "Welsh": "Welsh English", "American": "American English", "Canadian": "Canadian English", "Australian": "Australian English",
               "SouthAfrican": "South African English", "NewZealand": "New Zealand English", "Indian": "Indian English"}
# Accents the Accent Lab has detailed explanations for (see src/accentData.js).
PROFILE_OF = {"American": "us", "English": "uk", "Scottish": "sco", "Irish": "ie", "Australian": "au", "Indian": "in"}
ARCHIVE_PROFILE = {"usa": "us", "uk": "uk", "australia": "au", "ireland": "ie", "india": "in"}
COUNTRY_NAMES = {"usa": "the USA", "uk": "the UK", "uae": "the UAE"}
INDIC = {"hindi", "urdu", "bengali", "marathi", "gujarati", "punjabi", "tamil", "telugu", "kannada", "malayalam", "nepali", "sinhalese", "sinhala",
         "konkani", "oriya", "assamese", "sindhi", "kashmiri", "hindko", "newari"}
PASSAGE = ("Please call Stella. Ask her to bring these things with her from the store: Six spoons of fresh snow peas, five thick slabs of blue cheese, "
           "and maybe a snack for her brother Bob. We also need a small plastic snake and a big toy frog for the kids. She can scoop these things into "
           "three red bags, and we will go meet her Wednesday at the train station.")

SOURCES = {
    "vctk": dict(id="vctk", name="CSTR VCTK Corpus 0.92 (University of Edinburgh)", license="CC BY 4.0",
                 credit="Yamagishi, Veaux & MacDonald (2019). CSTR VCTK Corpus: English multi-speaker corpus for CSTR Voice Cloning Toolkit. University of Edinburgh. https://doi.org/10.7488/ds/2645"),
    "archive": dict(id="archive", name="Speech Accent Archive (George Mason University, Kaggle copy)",
                    license="CC BY-NC-SA 4.0 (as listed on the Kaggle dataset page; non-commercial. VERIFY on the dataset page before publishing)",
                    credit="Weinberger, S. (2015). Speech Accent Archive. George Mason University. https://accent.gmu.edu"),
}


def say(msg=""):
    print(msg, flush=True)


def slug(text):
    return re.sub(r"[^a-z0-9]+", "-", str(text).lower()).strip("-") or "x"


def norm(text):
    return re.sub(r"[^a-z0-9 ]+", "", str(text).lower()).strip()


def spread(items, n):
    """n items spread evenly across a list (so different regions are represented, not just the first ones)."""
    if len(items) <= n:
        return list(items)
    step = len(items) / n
    return [items[int(i * step)] for i in range(n)]


def alternate_genders(rows, n, gender_of):
    f = [r for r in rows if gender_of(r) == "F"]
    m = [r for r in rows if gender_of(r) != "F"]
    out = []
    while len(out) < n and (f or m):
        for pool in (f, m):
            if pool and len(out) < n:
                out.append(pool.pop(0))
    return out


def find_first(root, pattern):
    hits = glob.glob(os.path.join(root, "**", pattern), recursive=True)
    return sorted(hits, key=len)[0] if hits else None


# ------------------------------------------------------------------ Speech Accent Archive
def build_archive(a, cfg, out_clips):
    csv_path = a.archive_csv or find_first(a.root, "speakers_all.csv")
    if not csv_path:
        say("Speech Accent Archive: speakers_all.csv not found, skipped.")
        return []
    base = os.path.dirname(csv_path)
    audio_dir = a.archive_audio
    if not audio_dir:
        for cand in ("recordings/recordings", "recordings"):
            d = os.path.join(base, cand)
            if os.path.isdir(d) and glob.glob(os.path.join(d, "*.mp3")):
                audio_dir = d
                break
    if not audio_dir:
        say("Speech Accent Archive: recordings folder with .mp3 files not found, skipped.")
        return []
    passage_file = os.path.join(base, "reading-passage.txt")
    passage = re.sub(r"\s+", " ", open(passage_file, encoding="utf-8", errors="replace").read()).strip() if os.path.exists(passage_file) else PASSAGE
    say(f"Speech Accent Archive: {csv_path}")

    rows = []
    with open(csv_path, encoding="utf-8", errors="replace", newline="") as fh:
        for r in csv.DictReader(fh):
            fn = (r.get("filename") or "").strip()
            if not fn or str(r.get("file_missing?", "")).strip().upper() == "TRUE":
                continue
            p = os.path.join(audio_dir, fn + ".mp3")
            if os.path.exists(p):
                r["_path"], r["_fn"] = p, fn
                r["_lang"] = (r.get("native_language") or "").strip().lower()
                r["_country"] = (r.get("country") or "").strip().lower()
                rows.append(r)
    native = defaultdict(list)
    learners = defaultdict(list)
    for r in rows:
        (native if r["_lang"] == "english" else learners)[r["_country"] if r["_lang"] == "english" else r["_lang"]].append(r)

    def pick(group, n):
        group = sorted(group, key=lambda r: (r.get("birthplace") or "", r["_fn"]))
        return alternate_genders(spread(group, n * 2), n, lambda r: (r.get("sex") or "").strip()[:1].upper())

    plan = []  # (family, key, label, profile, l1, [rows])
    for country, grp in sorted(native.items()):
        if len(grp) < 2 or not country:
            continue
        pretty = COUNTRY_NAMES.get(country, country.title())
        plan.append(("native", "en-" + slug(country), f"English from {pretty}", ARCHIVE_PROFILE.get(country), None, pick(grp, cfg["native_spk"])))
    for lang, grp in sorted(learners.items()):
        if not lang or len(grp) < cfg["l1_min"]:
            continue
        n = cfg["l1_spk"] + (cfg["boost"] if lang in INDIC else 0)
        plan.append(("l1", "l1-" + slug(lang), f"English spoken by {lang.title()} speakers", None, lang, pick(grp, n)))

    groups = []
    total = sum(len(p[5]) for p in plan)
    say(f"  {len(plan)} groups, {total} recordings to prepare")
    if a.dry_run:
        for fam, key, label, prof, l1, picked in plan:
            say(f"    {label}: {len(picked)} speaker(s)")
        return []
    done = 0
    for fam, key, label, prof, l1, picked in plan:
        speakers = []
        for r in picked:
            rel = f"clips/archive/{slug(key)}/{r['_fn']}.mp3"
            dst = os.path.join(a.out, rel)
            try:
                if a.force or not os.path.exists(dst):
                    au.convert(r["_path"], dst, seconds=cfg["seconds"])
            except Exception as err:  # noqa: BLE001
                say(f"    skipped {r['_fn']}: {err}")
                continue
            speakers.append({"id": r["_fn"], "gender": (r.get("sex") or "").strip()[:1].upper(), "age": (r.get("age") or "").strip(),
                             "region": (r.get("birthplace") or "").strip(), "clips": [{"utt": "passage", "text": passage, "file": rel}]})
            done += 1
        if speakers:
            g = {"id": key, "label": label, "family": fam, "source": "archive", "speakers": speakers}
            if prof:
                g["profile"] = prof
            if l1:
                g["l1"] = l1
            groups.append(g)
        if done and done % 25 == 0:
            say(f"    ... {done}/{total}")
    say(f"  built {len(groups)} groups, {done} recordings")
    return groups


# ------------------------------------------------------------------ VCTK (parquet)
def build_vctk(a, cfg):
    try:
        import pyarrow.parquet as pq
    except ImportError:
        say("VCTK: pyarrow is not installed (pip install -r tools/requirements.txt), skipped.")
        return []
    shards = sorted(a.vctk_parquet or glob.glob(os.path.join(a.root, "**", "vctk*", "data", "*.parquet"), recursive=True))
    shards = [s for s in shards if not os.sep + ".cache" + os.sep in s]
    if not shards:
        say("VCTK: no parquet shards found, skipped.")
        return []
    say(f"VCTK: {len(shards)} parquet shard(s), scanning the text columns (fast, no audio yet)")

    speakers = {}                      # id -> info
    sent_count = Counter()             # normalised text -> number of speakers
    sent_text, sent_id = {}, {}
    spk_sents = defaultdict(set)
    shard_spk = defaultdict(set)
    cols = ["speaker_id", "text", "text_id", "accent", "region", "gender", "age"]
    for path in shards:
        pf = pq.ParquetFile(path)
        have = [c for c in cols if c in pf.schema_arrow.names]
        for batch in pf.iter_batches(batch_size=4096, columns=have):
            d = batch.to_pydict()
            for i, spk in enumerate(d["speaker_id"]):
                spk = str(spk)
                shard_spk[path].add(spk)
                info = speakers.setdefault(spk, {"id": spk, "accent": str((d.get("accent") or [""] * (i + 1))[i] or "").strip(),
                                                  "region": str((d.get("region") or [""] * (i + 1))[i] or "").strip(),
                                                  "gender": str((d.get("gender") or [""] * (i + 1))[i] or "").strip()[:1].upper(),
                                                  "age": str((d.get("age") or [""] * (i + 1))[i] or "").strip()})
                if not info["accent"]:
                    info["accent"] = str((d.get("accent") or [""] * (i + 1))[i] or "").strip()
                t = d["text"][i]
                if not t:
                    continue
                k = norm(t)
                if k not in spk_sents[spk]:
                    spk_sents[spk].add(k)
                    sent_count[k] += 1
                    sent_text.setdefault(k, str(t).strip())
                    tid = str((d.get("text_id") or [""] * (i + 1))[i] or "")
                    if tid.isdigit():
                        sent_id[k] = min(sent_id.get(k, 10 ** 9), int(tid))
    n_spk = len(speakers)
    say(f"  {n_spk} speakers found")
    shared = [k for k, c in sent_count.items() if c >= 0.7 * n_spk] or [k for k, c in sent_count.items() if c >= 0.3 * n_spk]
    shared.sort(key=lambda k: (sent_id.get(k, 10 ** 9), k))
    chosen = shared[: cfg["vctk_sent"]]
    if not chosen:
        say("  no sentence is read by most speakers; cannot compare accents on one sentence, skipped.")
        return []
    say(f"  {len(shared)} sentences are read by (nearly) every speaker; using {len(chosen)}:")
    for i, k in enumerate(chosen):
        say(f"    u{i + 1}: {sent_text[k]}")

    by_accent = defaultdict(list)
    for s in speakers.values():
        if s["accent"] and s["accent"].lower() != "unknown" and all(k in spk_sents[s["id"]] for k in chosen):
            by_accent[s["accent"]].append(s)
    plan = {}
    for acc, lst in sorted(by_accent.items()):
        lst = sorted(lst, key=lambda s: s["id"])
        plan[acc] = alternate_genders(spread(lst, cfg["vctk_spk"] * 2), cfg["vctk_spk"], lambda s: s["gender"])
    say(f"  accents: " + ", ".join(f"{k} ({len(v)})" for k, v in plan.items()))
    if a.dry_run:
        return []
    want = {s["id"]: (acc, s) for acc, lst in plan.items() for s in lst}
    rank = {k: i + 1 for i, k in enumerate(chosen)}
    made = {}  # (speaker, sentence key) -> relative file
    for path in shards:
        if not (shard_spk[path] & set(want)):
            continue
        pf = pq.ParquetFile(path)
        have = [c for c in ("speaker_id", "text", "audio") if c in pf.schema_arrow.names]
        for batch in pf.iter_batches(batch_size=32, columns=have):
            ids = [str(x) for x in batch.column("speaker_id").to_pylist()]
            texts = batch.column("text").to_pylist()
            for i, spk in enumerate(ids):
                if spk not in want or not texts[i]:
                    continue
                k = norm(texts[i])
                if k not in rank or (spk, k) in made:
                    continue
                acc = want[spk][0]
                rel = f"clips/vctk/{slug(acc)}/{spk}_u{rank[k]}.mp3"
                dst = os.path.join(a.out, rel)
                try:
                    if a.force or not os.path.exists(dst):
                        au_in = batch.column("audio")[i].as_py()
                        data = au_in.get("bytes") if isinstance(au_in, dict) else au_in
                        if not data and isinstance(au_in, dict) and au_in.get("path") and os.path.exists(au_in["path"]):
                            data = au_in["path"]
                        au.convert(data, dst, seconds=30)
                    made[(spk, k)] = rel
                except Exception as err:  # noqa: BLE001
                    say(f"    skipped {spk} u{rank[k]}: {err}")
        say(f"  processed {os.path.basename(path)} ({len(made)} clips so far)")

    groups = []
    for acc, lst in plan.items():
        sp = []
        for s in lst:
            clips = [{"utt": f"u{rank[k]}", "text": sent_text[k], "file": made[(s["id"], k)]} for k in chosen if (s["id"], k) in made]
            if clips:
                sp.append({"id": s["id"], "gender": s["gender"], "age": s["age"], "region": s["region"], "clips": clips})
        if sp:
            g = {"id": "vctk-" + slug(acc), "label": VCTK_LABELS.get(acc, acc), "family": "native", "source": "vctk", "speakers": sp}
            if acc in PROFILE_OF:
                g["profile"] = PROFILE_OF[acc]
            groups.append(g)
    say(f"  built {len(groups)} groups, {len(made)} clips")
    return groups


# ------------------------------------------------------------------ main
def folder_size_mb(path):
    return sum(os.path.getsize(os.path.join(d, f)) for d, _, fs in os.walk(path) for f in fs) / 1e6


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--root", default=os.environ.get("DATASETS_ROOT", "F:/datasets"), help="folder that holds your datasets")
    p.add_argument("--out", default="public/accents")
    p.add_argument("--profile", default="standard", choices=sorted(PROFILES))
    p.add_argument("--only", default="vctk,archive", help="comma list: vctk, archive")
    p.add_argument("--dry-run", action="store_true", help="show what would be built, write nothing")
    p.add_argument("--force", action="store_true", help="re-encode clips that already exist")
    p.add_argument("--archive-csv"), p.add_argument("--archive-audio")
    p.add_argument("--vctk-parquet", nargs="*")
    p.add_argument("--archive-license", help="override the licence text shown for the Speech Accent Archive")
    a = p.parse_args()
    cfg = PROFILES[a.profile]
    only = {x.strip() for x in a.only.split(",")}
    if not a.dry_run and not au.have_pure():
        say("Install the tools first:  pip install -r tools/requirements.txt")
        sys.exit(1)
    if not os.path.isdir(a.root):
        sys.exit(f"Datasets folder not found: {a.root}  (use --root)")
    os.makedirs(a.out, exist_ok=True)
    groups, sources = [], []
    if "vctk" in only:
        g = build_vctk(a, cfg)
        groups += g
        if g:
            sources.append(SOURCES["vctk"])
    if "archive" in only:
        g = build_archive(a, cfg, a.out)
        groups += g
        if g:
            src = dict(SOURCES["archive"])
            if a.archive_license:
                src["license"] = a.archive_license
            sources.append(src)
    if a.dry_run:
        say("Dry run only: nothing written.")
        return
    if not groups:
        sys.exit("Nothing was built. Check --root and the dataset folders.")
    man = {"version": 2, "generated": datetime.date.today().isoformat(), "profile": a.profile, "passage": PASSAGE, "sources": sources, "groups": groups}
    with open(os.path.join(a.out, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(man, f, ensure_ascii=False, indent=1)
    with open(os.path.join(a.out, "CREDITS.txt"), "w", encoding="utf-8") as f:
        f.write("Real accent recordings. Keep these credits when you publish.\n\n")
        for s in sources:
            f.write(f"{s['name']}\n  Licence: {s['license']}\n  {s['credit']}\n\n")
    n = sum(len(s["clips"]) for g in groups for s in g["speakers"])
    mb = folder_size_mb(a.out)
    say(f"\nDone: {len(groups)} accent groups, {n} clips, {mb:.1f} MB -> {a.out}")
    if mb > 300:
        say("Warning: over 300 MB. GitHub works best under about 1 GB in total and 100 MB per file. Use a smaller --profile if you hit limits.")


if __name__ == "__main__":
    main()
