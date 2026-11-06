#!/usr/bin/env python3
"""
Build a small, web-ready set of REAL human accent recordings for the SpeakWise AI "Accents" tab.

Python 3 and ffmpeg (on PATH) are needed. Nothing is uploaded anywhere; it runs on your computer.

  VCTK corpus (110 English speakers with different accents; download once from
  https://datashare.ed.ac.uk/items/30e7453c-9ea8-48b4-8e18-f96d0dc62928 , file VCTK-Corpus-0.92.zip, about 11 GB):

    python tools/build_accent_clips.py vctk --src "D:/data/VCTK-Corpus-0.92" --out public/accents --per-accent 4

  Speech Accent Archive (Kaggle: rtatman/speech-accent-archive; needs a free Kaggle login):

    python tools/build_accent_clips.py archive --csv "D:/data/speakers_all.csv" --audio "D:/data/recordings/recordings" \
        --out public/accents --per-group 3 --license "<licence shown on the dataset page>"

The result is public/accents/manifest.json plus a clips/ folder (a few MB). Commit that folder and users download nothing.
Always keep the credit and licence shown in the manifest; check each dataset's licence before publishing the app.
"""
import argparse, csv, json, os, re, subprocess, sys

LABELS = {'English': 'English (England)', 'Scottish': 'Scottish English', 'NorthernIrish': 'Northern Irish English', 'Irish': 'Irish English',
          'Welsh': 'Welsh English', 'American': 'American English', 'Canadian': 'Canadian English', 'Australian': 'Australian English',
          'SouthAfrican': 'South African English', 'NewZealand': 'New Zealand English', 'Indian': 'Indian English'}
PARAGRAPH = ("Please call Stella. Ask her to bring these things with her from the store: Six spoons of fresh snow peas, five thick slabs of blue cheese, "
             "and maybe a snack for her brother Bob. We also need a small plastic snake and a big toy frog for the kids. She can scoop these things into "
             "three red bags, and we will go meet her Wednesday at the train station.")


def pick_format():
    out = subprocess.run(['ffmpeg', '-hide_banner', '-encoders'], capture_output=True, text=True).stdout
    if 'libmp3lame' in out:
        return 'mp3', ['-c:a', 'libmp3lame', '-b:a', '40k']
    if re.search(r'\baac\b', out):
        return 'm4a', ['-c:a', 'aac', '-b:a', '48k']
    return 'wav', ['-c:a', 'pcm_s16le']


def convert(src, dst, codec_args, max_seconds=None):
    cmd = ['ffmpeg', '-y', '-loglevel', 'error', '-i', src, '-ac', '1', '-ar', '22050']
    if max_seconds:
        cmd += ['-t', str(max_seconds)]
    subprocess.run(cmd + codec_args + [dst], check=True)


def read_speakers(path):
    out = {}
    with open(path, encoding='utf-8', errors='replace') as f:
        for line in f:
            m = re.match(r'^\s*(p\d+)\s+(\d+)\s+([FMfm])\s+(\S+)\s*(.*)$', line)
            if m:
                out[m.group(1)] = dict(id=m.group(1), age=m.group(2), gender=m.group(3).upper(), accent=m.group(4), region=m.group(5).strip())
    return out


def find_audio(src, spk, utt):
    for rel in (f'wav48_silence_trimmed/{spk}/{spk}_{utt}_mic1.flac', f'wav48_silence_trimmed/{spk}/{spk}_{utt}_mic2.flac',
                f'wav48/{spk}/{spk}_{utt}.wav', f'wav48_silence_trimmed/{spk}/{spk}_{utt}.flac'):
        p = os.path.join(src, rel)
        if os.path.exists(p):
            return p
    return None


def alternate_genders(speakers, n):
    f = [s for s in speakers if s['gender'] == 'F']; m = [s for s in speakers if s['gender'] == 'M']; out = []
    while len(out) < n and (f or m):
        for pool in (f, m):
            if pool and len(out) < n:
                out.append(pool.pop(0))
    return out


def write_manifest(out_dir, groups, source, licence, credit):
    man = {'version': 1, 'source': source, 'license': licence, 'credit': credit, 'groups': groups}
    with open(os.path.join(out_dir, 'manifest.json'), 'w', encoding='utf-8') as f:
        json.dump(man, f, ensure_ascii=False, indent=1)
    n = sum(len(s['clips']) for g in groups for s in g['speakers'])
    print(f'Wrote {len(groups)} groups, {n} clips -> {os.path.join(out_dir, "manifest.json")}')


def do_vctk(a):
    ext, codec = pick_format(); clips_dir = os.path.join(a.out, 'clips'); os.makedirs(clips_dir, exist_ok=True)
    info = os.path.join(a.src, 'speaker-info.txt')
    if not os.path.exists(info):
        sys.exit(f'speaker-info.txt not found in {a.src}. Point --src at the unzipped VCTK-Corpus-0.92 folder.')
    utts = [u.strip() for u in a.utts.split(',') if u.strip()]
    by = {}
    for s in read_speakers(info).values():
        files = [find_audio(a.src, s['id'], u) for u in utts]
        if all(files):
            by.setdefault(s['accent'], []).append(s)
    groups = []
    for accent in sorted(by):
        chosen = alternate_genders(sorted(by[accent], key=lambda s: s['id']), a.per_accent); sp = []
        for s in chosen:
            clips = []
            for u in utts:
                txt_path = os.path.join(a.src, 'txt', s['id'], f"{s['id']}_{u}.txt")
                text = open(txt_path, encoding='utf-8', errors='replace').read().strip() if os.path.exists(txt_path) else ''
                name = f"vctk_{s['id']}_{u}.{ext}"
                convert(find_audio(a.src, s['id'], u), os.path.join(clips_dir, name), codec)
                clips.append({'utt': u, 'text': text, 'file': 'clips/' + name})
            sp.append({'id': s['id'], 'gender': s['gender'], 'age': s['age'], 'region': s['region'], 'clips': clips})
        groups.append({'id': accent, 'label': LABELS.get(accent, accent), 'speakers': sp})
        print(f'  {accent}: {len(sp)} speaker(s)')
    write_manifest(a.out, groups, 'CSTR VCTK Corpus 0.92 (University of Edinburgh)', a.license or 'See license_text.txt in the VCTK download',
                   'Yamagishi, Veaux & MacDonald (2019). CSTR VCTK Corpus. University of Edinburgh. https://doi.org/10.7488/ds/2645')


def do_archive(a):
    ext, codec = pick_format(); clips_dir = os.path.join(a.out, 'clips'); os.makedirs(clips_dir, exist_ok=True)
    rows = list(csv.DictReader(open(a.csv, encoding='utf-8', errors='replace')))
    by = {}
    for r in rows:
        fn = (r.get('filename') or '').strip(); src = os.path.join(a.audio, fn + '.mp3')
        if fn and os.path.exists(src):
            by.setdefault((r.get(a.group_by) or 'unknown').strip(), []).append((r, src))
    groups = []
    for key in sorted(by):
        if len(by[key]) < 1:
            continue
        sp = []
        for r, src in by[key][:a.per_group]:
            name = f"archive_{r['filename'].strip()}.{ext}"
            convert(src, os.path.join(clips_dir, name), codec, max_seconds=a.seconds)
            sp.append({'id': r['filename'].strip(), 'gender': (r.get('sex') or '').strip()[:1].upper(), 'age': (r.get('age') or '').strip(),
                       'region': (r.get('birthplace') or '').strip(), 'clips': [{'utt': 'paragraph', 'text': PARAGRAPH, 'file': 'clips/' + name}]})
        groups.append({'id': key, 'label': f'English spoken by {key} speakers' if a.group_by == 'native_language' else f'English from {key}', 'speakers': sp})
    write_manifest(a.out, groups, 'Speech Accent Archive (George Mason University)', a.license or 'CHECK THE DATASET PAGE', 'Weinberger, S. (2015). Speech Accent Archive. George Mason University. https://accent.gmu.edu')


if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest='cmd', required=True)
    v = sub.add_parser('vctk'); v.add_argument('--src', required=True); v.add_argument('--out', default='public/accents'); v.add_argument('--per-accent', type=int, default=4)
    v.add_argument('--utts', default='001,002,003,004,005'); v.add_argument('--license', default='')
    r = sub.add_parser('archive'); r.add_argument('--csv', required=True); r.add_argument('--audio', required=True); r.add_argument('--out', default='public/accents')
    r.add_argument('--per-group', type=int, default=3); r.add_argument('--group-by', default='native_language', choices=['native_language', 'country']); r.add_argument('--seconds', type=int, default=40); r.add_argument('--license', default='')
    a = p.parse_args(); {'vctk': do_vctk, 'archive': do_archive}[a.cmd](a)
