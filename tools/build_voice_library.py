#!/usr/bin/env python3
"""
Build the SpeakWise AI "real voices" library from public TTS datasets (all optional; give the ones you have).
Needs Python 3 and `pip install -r tools/requirements.txt`. Runs only on your computer (no ffmpeg needed).

Easiest: point it at the folder that holds all your datasets. It finds the .tar.gz archives and the Urdu, Japanese
(Kokoro) and Chuvash folders by itself, and unpacks archives into a temporary folder that it deletes afterwards:

  python tools/build_voice_library.py --root "F:/datasets" --n 60

Or give individual folders:  --thorsten --italian --czech --kurdish --otomi --urdu --japanese --chuvash  <folder>

Each library becomes short mono MP3 clips plus an entry in manifest.json (text, file, speaker, licence, credit).
Licences (from the dataset READMEs; VERIFY the ones marked CHECK before publishing):
  Thorsten emotional (German) CC0 | LibriVox Italian CC0 | LibriVox Czech CC0 | Central Kurdish CC-BY-4.0 | Otomi CC-BY-SA-4.0 (share-alike!)
"""
import argparse, csv, glob, json, math, os, re, shutil, sys, tarfile, zipfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import audio_utils as au

EMO = ['neutral', 'amused', 'angry', 'disgusted', 'drunk', 'sleepy', 'surprised', 'whisper']


def ff(src, dst, start=None, dur=None):
    """Write src as a small mono MP3 (no ffmpeg needed)."""
    return au.convert(src, dst, start=start, seconds=dur, kbps=40, trim=False)


def duration(path):
    return au.duration(path)


def spaced(items, n):
    if len(items) <= n:
        return items
    step = len(items) / n
    return [items[int(i * step)] for i in range(n)]


def clean(t):
    return re.sub(r'\s+', ' ', t.replace('\u2014', ' ').strip(' \u2014-\u00ab\u00bb"\u201c\u201d')).strip()


def lib_german(src, out, n):
    d = os.path.join(out, 'de'); os.makedirs(d, exist_ok=True)
    meta = [l.rstrip('\n').split('|', 1) for l in open(os.path.join(src, 'thorsten-emotional-metadata.csv'), encoding='utf-8') if '|' in l]
    cand = sorted([(g, t) for g, t in meta if 25 <= len(t) <= 95 and all(os.path.exists(os.path.join(src, e, g + '.wav')) for e in EMO)], key=lambda x: (len(x[1]), x[1]))
    clips = []
    for g, t in spaced(cand, n):
        files = {}
        for e in EMO:
            name = f'de/{g[:8]}_{e}.mp3'; ff(os.path.join(src, e, g + '.wav'), os.path.join(out, name)); files[e] = name
        clips.append({'id': g[:8], 'text': t, 'emotions': files, 'file': files['neutral']})
    return dict(id='de', lang='de', rec='de-DE', name='German (Thorsten, 8 emotions)', kind='emotion', emotions=EMO, speaker='Thorsten Müller, adult male',
                license='CC0 1.0', credit='Thorsten-Voice "emotional" 2021.06 by Thorsten Müller, optimized by Dominik Kreutz.', clips=clips)


def lib_aligned(code, name, rec, speaker, licence, credit, chapters, out, n, extra_clean=True):
    d = os.path.join(out, code); os.makedirs(d, exist_ok=True)
    per = []
    for ch, audio, tsv in chapters:
        rows = []
        for r in csv.reader(open(tsv, encoding='utf-8'), delimiter='\t'):
            if len(r) < 4 or r[0] == 'start':
                continue
            try:
                s, e, du = float(r[0]), float(r[1]), float(r[2])
            except ValueError:
                continue
            t = clean(r[3])
            if 2.0 <= du <= 7.5 and 22 <= len(t) <= 110 and re.search(r'[^\W\d_]{3}', t) and '..' not in t:
                rows.append((ch, audio, s, du, t))
        per.append(rows)
    take = max(1, math.ceil(n / max(1, len(per)))); clips = []
    for rows in per:
        for ch, audio, s, du, t in spaced(rows, take):
            if len(clips) >= n:
                break
            f = f'{code}/{ch}_{int(s * 100):05d}.mp3'; ff(audio, os.path.join(out, f), start=max(0, s - 0.05), dur=du + 0.25)
            clips.append({'id': f'{ch}-{int(s)}', 'text': t, 'file': f})
    return dict(id=code, lang=code, rec=rec, name=name, kind='plain', speaker=speaker, license=licence, credit=credit, clips=clips)


def lib_italian(src, out, n):
    ch = [(m.group(1), os.path.join(src, f), os.path.join(src, f.replace('.mp3', '.tsv'))) for f in sorted(os.listdir(src))
          for m in [re.match(r'avventurepinocchio_(\d+)_collodi_64kb\.mp3$', f)] if m and os.path.exists(os.path.join(src, f.replace('.mp3', '.tsv')))]
    return lib_aligned('it', 'Italian (LibriVox, Pinocchio)', 'it-IT', 'adult female reader', 'CC0 / public domain',
                       'LibriVox recording of "Le avventure di Pinocchio" by Carlo Collodi; sentence-aligned dataset from the Mozilla Data Collective (LibriVox Italian TTS Female Voice).', ch, out, n)


def lib_czech(src, out, n):
    ch = [(m.group(1), os.path.join(src, 'audio', 'processed', f), os.path.join(src, 'alignments', m.group(1) + '.tsv')) for f in sorted(os.listdir(os.path.join(src, 'audio', 'processed')))
          for m in [re.match(r'krysar_(\d+)_dyk_64kb\.mp3$', f)] if m and os.path.exists(os.path.join(src, 'alignments', m.group(1) + '.tsv'))]
    return lib_aligned('cs', 'Czech (LibriVox, Krysař)', 'cs-CZ', 'adult female reader', 'CC0 / public domain',
                       'LibriVox recording of "Krysař" by Viktor Dyk; sentence-aligned dataset from the Mozilla Data Collective (LibriVox Czech TTS Female Voice).', ch, out, n)


def lib_kurdish(src, out, n):
    d = os.path.join(out, 'ckb'); os.makedirs(d, exist_ok=True)
    meta = [l.rstrip('\n').split('|', 1) for l in open(os.path.join(src, 'metadata.csv'), encoding='utf-8') if '|' in l]
    cand = [(f, t.strip()) for f, t in meta if 25 <= len(t.strip()) <= 100 and os.path.exists(os.path.join(src, 'wavs', f if f.endswith('.wav') else f + '.wav'))]
    clips = []
    for f, t in spaced(cand, n):
        wav = f if f.endswith('.wav') else f + '.wav'; name = f'ckb/{wav[:-4]}.mp3'
        if duration(os.path.join(src, 'wavs', wav)) > 9:
            continue
        ff(os.path.join(src, 'wavs', wav), os.path.join(out, name)); clips.append({'id': wav[:-4], 'text': t, 'file': name})
    return dict(id='ckb', lang='ckb', rec='ckb-IQ', name='Central Kurdish (Sorani, Mariwan accent)', kind='plain', speaker='Aso Mahmudi, adult male, Mariwan', license='CC-BY-4.0',
                credit='Central Kurdish TTS dataset 1.0 (Mozilla Data Collective, University of Melbourne). Speaker: Aso Mahmudi.', clips=clips)


def lib_otomi(src, out, n):
    d = os.path.join(out, 'oto'); os.makedirs(d, exist_ok=True)
    rows = list(csv.DictReader(open(os.path.join(src, 'metadata.tsv'), encoding='utf-8'), delimiter='\t'))
    cand = [r for r in rows if 14 <= len(r['texto'].strip()) <= 90 and os.path.exists(os.path.join(src, r['ruta_del_audio']))]
    clips = []
    for r in spaced(cand, n * 2):
        if len(clips) >= n:
            break
        p = os.path.join(src, r['ruta_del_audio'])
        if not 1.2 <= duration(p) <= 9:
            continue
        name = f"oto/{r['id'][:10]}.mp3"; ff(p, os.path.join(out, name)); clips.append({'id': r['id'][:10], 'text': r['texto'].strip(), 'file': name, 'note': r.get('libro', '')})
    return dict(id='oto', lang='oto', rec='', name='Otomí (Hñähñu)', kind='plain', speaker='adult male reader', license='CC-BY-SA-4.0 (share-alike)',
                credit='Otomí (Hñähñu) TTS, male voice (Mozilla Data Collective). Attribution and share-alike apply to these recordings.', clips=clips)


# ---------------------------------------------------------------------------------------------- new corpora
def first_existing(base, names):
    for n in names:
        p = os.path.join(base, n)
        if os.path.isfile(p):
            return p
    return None


def lib_japanese(src, out, n):
    """Kokoro speech (LibriVox Japanese): metadata.csv rows are  id|segmented text|phonemes  and audio is wavs/<id>.flac."""
    d = os.path.join(out, 'ja'); os.makedirs(d, exist_ok=True)
    cand = []
    with open(os.path.join(src, 'metadata.csv'), encoding='utf-8') as f:
        for line in f:
            parts = line.rstrip('\n').split('|')
            if len(parts) < 2:
                continue
            ident = parts[0].strip(); text = parts[1].replace(' ', '').strip()
            base = os.path.basename(ident)
            path = first_existing(src, [ident, ident + '.flac', os.path.join('wavs', base), os.path.join('wavs', base + '.flac'), os.path.join('wavs', os.path.splitext(base)[0] + '.flac')])
            if path and 10 <= len(text) <= 48:
                cand.append((path, text))
    clips = []
    for path, text in spaced(cand, n * 3):
        if len(clips) >= n:
            break
        if not 1.5 <= duration(path) <= 8:
            continue
        name = 'ja/' + re.sub(r'[^A-Za-z0-9_-]+', '_', os.path.splitext(os.path.basename(path))[0])[:40] + '.mp3'
        ff(path, os.path.join(out, name)); clips.append({'id': os.path.basename(name)[:-4], 'text': text, 'file': name})
    return dict(id='ja', lang='ja', rec='ja-JP', name='Japanese (LibriVox, Kokoro speech)', kind='plain', speaker='audiobook reader',
                license='Public domain audio (LibriVox) and text (Aozora Bunko); CHECK the dataset README', credit='Kokoro Speech Dataset, built from LibriVox Japanese readings of public-domain Aozora Bunko books.', clips=clips)


def lib_chuvash(src, out, n):
    """Chuvash TTS (one parquet file with audio bytes, text, file_name, dataset_name). CC BY-SA 4.0: share-alike applies."""
    import pyarrow.parquet as pq
    d = os.path.join(out, 'cv'); os.makedirs(d, exist_ok=True)
    files = sorted(glob.glob(os.path.join(src, '*.parquet')) + glob.glob(os.path.join(src, '**', '*.parquet'), recursive=True))
    if not files:
        raise SystemExit('no .parquet file found in ' + src)
    pf = pq.ParquetFile(files[0]); names = pf.schema_arrow.names
    t = pf.read(columns=[c for c in ('text', 'file_name', 'dataset_name') if c in names]).to_pydict()
    texts = t['text']; cand = [i for i, x in enumerate(texts) if x and 18 <= len(x.strip()) <= 90]
    chosen = dict((i, True) for i in spaced(cand, n * 2))
    clips, offset = [], 0
    for batch in pf.iter_batches(batch_size=64, columns=['audio']):
        for j in range(batch.num_rows):
            i = offset + j
            if i in chosen and len(clips) < n:
                au_in = batch.column('audio')[j].as_py(); data = au_in.get('bytes') if isinstance(au_in, dict) else au_in
                name = f'cv/cv_{i:06d}.mp3'
                try:
                    secs = ff(data, os.path.join(out, name))
                except Exception as err:  # noqa: BLE001
                    print('  skipped chuvash clip', i, err); continue
                if 1.2 <= secs <= 9:
                    clips.append({'id': f'cv{i}', 'text': texts[i].strip(), 'file': name})
                else:
                    os.remove(os.path.join(out, name))
        offset += batch.num_rows
        if len(clips) >= n:
            break
    return dict(id='cv', lang='cv', rec='', name='Chuvash', kind='plain', speaker='Chuvash TTS voice', license='CC-BY-SA-4.0 (share-alike)',
                credit='Chuvash TTS dataset v1.0 (ftyers). Attribution and share-alike apply to these recordings.', clips=clips)


def lib_urdu(src, out, n, licence='CHECK the dataset listing'):
    """Urdu TTS corpus: a folder of .zip files. Each zip is searched for audio and matching text; the layout is detected, not assumed."""
    d = os.path.join(out, 'ur'); os.makedirs(d, exist_ok=True)
    zips = sorted(glob.glob(os.path.join(src, '*.zip')))
    AUD = ('.wav', '.mp3', '.flac', '.ogg', '.m4a')
    clips = []
    for zpath in spaced(zips, max(1, min(len(zips), n))):
        if len(clips) >= n:
            break
        try:
            z = zipfile.ZipFile(zpath)
        except zipfile.BadZipFile:
            print('  bad zip skipped:', os.path.basename(zpath)); continue
        names = z.namelist(); audio = [x for x in names if x.lower().endswith(AUD)]
        texts = {os.path.splitext(os.path.basename(x))[0]: x for x in names if x.lower().endswith('.txt')}
        table = {}
        for x in names:
            if x.lower().endswith(('.csv', '.tsv')) or (x.lower().endswith('.txt') and len(texts) <= 2):
                for line in z.read(x).decode('utf-8', 'replace').splitlines():
                    parts = re.split(r'[|\t,]', line, maxsplit=1)
                    if len(parts) == 2:
                        table[os.path.splitext(os.path.basename(parts[0].strip()))[0]] = parts[1].strip()
        if not audio:
            print('  no audio in', os.path.basename(zpath), '; contents start:', names[:6]); continue
        for a in spaced(audio, 2):
            stem = os.path.splitext(os.path.basename(a))[0]
            text = z.read(texts[stem]).decode('utf-8', 'replace').strip() if stem in texts else table.get(stem, '')
            if not text or not 8 <= len(text) <= 120:
                continue
            name = f'ur/ur_{len(clips):04d}.mp3'
            try:
                secs = ff(z.read(a), os.path.join(out, name))
            except Exception as err:  # noqa: BLE001
                print('  skipped', a, err); continue
            if 1.2 <= secs <= 10:
                clips.append({'id': f'ur{len(clips)}', 'text': re.sub(r'\s+', ' ', text), 'file': name})
            else:
                os.remove(os.path.join(out, name))
            if len(clips) >= n:
                break
    return dict(id='ur', lang='ur', rec='ur-PK', name='Urdu', kind='plain', speaker='Urdu TTS corpus voice', license=licence,
                credit='10 hours Urdu Text-to-Speech corpus. Check the dataset page for the exact licence and credit.', clips=clips)


# ---------------------------------------------------------------------------------------------- archives and discovery
ARCHIVE_RULES = {  # key: (filename pattern, marker that identifies the dataset folder after unpacking)
    'thorsten': ('*thorsten*', lambda files, dirs: 'thorsten-emotional-metadata.csv' in files),
    'italian': ('*italian*', lambda files, dirs: any(f.startswith('avventurepinocchio_') for f in files)),
    'czech': ('*czech*', lambda files, dirs: 'alignments' in dirs),
    'kurdish': ('*ckb*', lambda files, dirs: 'metadata.csv' in files and 'wavs' in dirs),
    'otomi': ('*otomi*', lambda files, dirs: 'metadata.tsv' in files),
}


def unpack_and_find(tgz, work, marker):
    dest = os.path.join(work, re.sub(r'[^A-Za-z0-9]+', '_', os.path.basename(tgz))[:40])
    os.makedirs(dest, exist_ok=True)
    print('  unpacking', os.path.basename(tgz), '...')
    with tarfile.open(tgz) as t:
        try:
            t.extractall(dest, filter='data')
        except TypeError:  # older Python
            t.extractall(dest)
    for here, dirs, files in os.walk(dest):
        if marker(set(files), set(dirs)):
            return here
    return None


def walk_dirs(root, depth=3):
    """Yield (path, name) for folders up to `depth` levels below root."""
    root = os.path.abspath(root); base = root.count(os.sep)
    for here, dirs, _ in os.walk(root):
        if here.count(os.sep) - base >= depth:
            dirs[:] = []
        for d in dirs:
            yield os.path.join(here, d), d


def discover(root):
    """Find the Urdu, Kokoro (Japanese), Chuvash folders and the folder of .tar.gz archives, whatever their case or depth."""
    found = {}
    for path, name in walk_dirs(root):
        low = name.lower()
        for word, key in (('kokoro', 'japanese'), ('chuvash', 'chuvash'), ('urdu', 'urdu')):
            if word in low and key not in found:
                found[key] = path
        if 'archives' not in found and any(f.lower().endswith(('.tar.gz', '.tgz')) for f in os.listdir(path)):
            found['archives'] = path
    return found


def find_archive(folder, word):
    for f in sorted(os.listdir(folder)):
        if word in f.lower() and f.lower().endswith(('.tar.gz', '.tgz')):
            return os.path.join(folder, f)
    return None


if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument('--out', default='public/voices'); p.add_argument('--n', type=int, default=60)
    p.add_argument('--root', help='folder holding all your datasets (finds everything by itself)')
    p.add_argument('--archives', help='folder with the .tar.gz files')
    p.add_argument('--work', default='.voice_work', help='temporary folder for unpacked archives (deleted afterwards)')
    p.add_argument('--keep-work', action='store_true')
    p.add_argument('--urdu-license', default='CHECK the dataset listing')
    for k in ('thorsten', 'italian', 'czech', 'kurdish', 'otomi', 'urdu', 'japanese', 'chuvash'):
        p.add_argument('--' + k)
    a = p.parse_args(); os.makedirs(a.out, exist_ok=True)
    if not au.have_pure():
        sys.exit('Install the tools first:  pip install -r tools/requirements.txt')
    if a.root:
        for k, v in discover(a.root).items():
            if k == 'archives':
                a.archives = a.archives or v
            elif not getattr(a, k):
                setattr(a, k, v)
    cleanup = False
    if a.archives:
        for key, (pat, marker) in ARCHIVE_RULES.items():
            if getattr(a, key):
                continue
            hit = find_archive(a.archives, pat.strip('*'))
            hits = [hit] if hit else []
            if hits:
                cleanup = True
                folder = unpack_and_find(hits[0], a.work, marker)
                if folder:
                    setattr(a, key, folder)
                else:
                    print(f'  could not find the {key} dataset inside {os.path.basename(hits[0])}')
    jobs = (('thorsten', lib_german, max(10, a.n // 2)), ('italian', lib_italian, a.n), ('czech', lib_czech, a.n), ('kurdish', lib_kurdish, a.n),
            ('otomi', lib_otomi, a.n), ('japanese', lib_japanese, a.n), ('chuvash', lib_chuvash, a.n),
            ('urdu', lambda s, o, n: lib_urdu(s, o, n, a.urdu_license), a.n))
    old = {}
    mp = os.path.join(a.out, 'manifest.json')
    if os.path.exists(mp):
        try:
            old = {l['id']: l for l in json.load(open(mp, encoding='utf-8')).get('libraries', [])}
        except (ValueError, KeyError):
            old = {}
    for key, fn, n in jobs:
        src = getattr(a, key)
        if src:
            print(f'{key}: building from {src}')
            try:
                lib = fn(src, a.out, n)
            except Exception as err:  # noqa: BLE001
                print(f'  {key} failed: {err}'); continue
            if lib['clips']:
                old[lib['id']] = lib; print(f'  {lib["id"]}: {len(lib["clips"])} clips')
            else:
                print(f'  {key}: no usable clips found')
    libs = sorted(old.values(), key=lambda l: l['id'])
    with open(mp, 'w', encoding='utf-8') as f:
        json.dump({'version': 1, 'libraries': libs}, f, ensure_ascii=False, indent=1)
    print('manifest written ->', mp, f'({len(libs)} libraries)')
    if cleanup and not a.keep_work:
        shutil.rmtree(a.work, ignore_errors=True)
