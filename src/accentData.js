// Accent knowledge base for the Accent Lab. Everything the lab says about "why this word sounds different" comes from here.
//
// How it works:
//   * Every accent has a value (a "group") for each sound FEATURE, for example rhotic: 'r' (pronounces the r after a vowel) or '-' (does not).
//   * Every WORD lists which features affect it, and gives the IPA and a plain respelling for each accent.
//   * compareWord(word, A, B) lists the features whose groups differ between A and B, with a plain-English reason for each.
//
// Transcriptions are simplified, typical-speaker values for teaching. Real speakers vary by region, age and style.

export const ACCENTS = {
  us: { id: 'us', name: 'American (General American)', short: 'American', voice: 'en-US',
    traits: ['Pronounces every r', 'Quick d-like t between vowels (water, better)', 'Short a in bath, ask, dance', 'Vowels in day and go glide'] },
  uk: { id: 'uk', name: 'British (Southern England, Received Pronunciation)', short: 'British', voice: 'en-GB',
    traits: ['No r after a vowel (car, store)', 'Crisp t between vowels', 'Long ah in bath, ask, dance', 'Short rounded o in hot, frog, Bob'] },
  sco: { id: 'sco', name: 'Scottish (Standard Scottish English)', short: 'Scottish', voice: 'en-GB',
    traits: ['Tapped r everywhere', 'Pure vowels in day and go', 'Glottal stop for t in casual speech', 'Cot and caught sound the same'] },
  ie: { id: 'ie', name: 'Irish (Dublin-type Irish English)', short: 'Irish', voice: 'en-IE',
    traits: ['th at the start of a word sounds like t or d', 'Pronounces every r', 'Pure vowels in day and go', 'Short a in bath, ask'] },
  au: { id: 'au', name: 'Australian (General Australian)', short: 'Australian', voice: 'en-AU',
    traits: ['No r after a vowel', 'Quick d-like t between vowels', 'Wide glides in day and go', 'Long ah in bath, ask'] },
  in: { id: 'in', name: 'Indian (General Indian English)', short: 'Indian', voice: 'en-IN',
    traits: ['th sounds like a dental t or d', 'Curled-tongue (retroflex) t and d', 'v and w can blend', 'Pure vowels in day and go; tapped r'] },
};
export const ACCENT_IDS = Object.keys(ACCENTS);

// Sound features. grp = which group each accent belongs to; how = what that group does; tip = what to practise.
export const FEATURES = {
  rhotic: {
    title: 'The r after a vowel', rank: 3,
    grp: { us: 'r', uk: '-', sco: 'r', ie: 'r', au: '-', in: 'r' },
    how: { r: 'pronounces the r after a vowel (car, store, better).', '-': 'does not pronounce an r after a vowel; the vowel is stretched instead (car sounds like “cah”).' },
    tip: 'Rhotic accents: bunch or curl the tongue back for every written r. Non-rhotic accents: leave out the r at the end of a word or before a consonant and lengthen the vowel.',
  },
  tap_r: {
    title: 'What the r itself sounds like', rank: 7,
    grp: { us: 'approx', uk: 'approx', sco: 'tap', ie: 'approx', au: 'approx', in: 'tap' },
    how: { approx: 'makes r as a smooth glide, with the tongue not touching anything (red).', tap: 'makes r as a quick tap of the tongue tip, like the r in Spanish “pero”.' },
    tip: 'For a smooth r, pull the tongue tip back without touching the roof of the mouth. For a tapped r, flick the tongue tip once against the ridge behind your top teeth.',
  },
  t_between: {
    title: 'The t between vowels', rank: 4,
    grp: { us: 'flap', uk: 'clear', sco: 'glottal', ie: 'clear', au: 'flap', in: 'retro' },
    how: { flap: 'turns a t between vowels into a quick d-like tap, so better sounds like “bedder”.', clear: 'keeps a crisp t (in casual British speech it can become a glottal stop).', glottal: 'often replaces the t with a tiny catch in the throat (a glottal stop), so water sounds like “wa-er”.', retro: 'makes the t with the tongue tip curled back (retroflex), which sounds heavier.' },
    tip: 'Say “better” and “bedder” slowly, then fast. In a flap accent they become the same. Practise a clean t by pushing a small puff of air.',
  },
  retroflex: {
    title: 'Curled-tongue t and d', rank: 2,
    grp: { us: 'alv', uk: 'alv', sco: 'alv', ie: 'alv', au: 'alv', in: 'retro' },
    how: { alv: 'makes t and d with the tongue tip just behind the top teeth (on the ridge).', retro: 'makes t and d with the tongue tip curled back (retroflex), so train sounds heavier at the start.' },
    tip: 'Touch the tongue tip to the gum ridge directly behind your top teeth, not further back, for an English t or d.',
  },
  th_start: {
    title: 'th at the start of a word', rank: 1,
    grp: { us: 'fric', uk: 'fric', sco: 'fric', ie: 'stop', au: 'fric', in: 'stop' },
    how: { fric: 'says th as a soft hiss with the tongue tip between the teeth (think, three).', stop: 'says th as a t or d (the tongue touches the teeth), so three sounds like “tree” and thick like “tick”.' },
    tip: 'Put the tongue tip lightly between your teeth and blow air. Do not stop the air. “three” should not sound like “tree”.',
  },
  th_mid_end: {
    title: 'th inside or at the end of a word', rank: 2,
    grp: { us: 'fric', uk: 'fric', sco: 'fric', ie: 'fric', au: 'fric', in: 'stop' },
    how: { fric: 'keeps th as a soft fricative (brother, bath).', stop: 'turns th into a dental d or t (brother becomes “brudder”, bath becomes “bat”).' },
    tip: 'For the voiced th in brother, keep the tongue between the teeth and add voice (buzz), with no stop.',
  },
  bath: {
    title: 'The vowel in bath, ask, dance', rank: 5,
    grp: { us: 'short', uk: 'long', sco: 'short', ie: 'short', au: 'long', in: 'long' },
    how: { short: 'uses the short a of cat, so bath rhymes with math.', long: 'uses a long “ah” (bahth, like father).' },
    tip: 'Choose one and stay consistent: bath = “bath” (short a) or “bahth” (long ah). Mixing them within one speech sounds odd.',
  },
  lot: {
    title: 'The vowel in Bob, frog, hot', rank: 6,
    grp: { us: 'ah', uk: 'o', sco: 'aw', ie: 'ah', au: 'o', in: 'o' },
    how: { ah: 'uses an open “ah” (Bob sounds like “bahb”).', o: 'uses a short rounded “o” (Bob sounds like British “bob”).', aw: 'uses a rounded “aw” (like caught), because cot and caught sound the same.' },
    tip: 'For the American vowel open your jaw wide with lips relaxed. For the British vowel round your lips slightly and keep it short.',
  },
  caught_merge: {
    title: 'cot and caught', rank: 8,
    grp: { us: 'merged', uk: 'distinct', sco: 'merged', ie: 'distinct', au: 'distinct', in: 'distinct' },
    how: { merged: 'says cot and caught the same way (the cot-caught merger, common across most of the US).', distinct: 'keeps cot and caught different: caught has a longer, rounder vowel.' },
    tip: 'Listen for pairs such as cot/caught and don/dawn. If you hear one vowel for both, the accent has the merger.',
  },
  face: {
    title: 'The vowel in day, train, station', rank: 5,
    grp: { us: 'diph', uk: 'diph', sco: 'mono', ie: 'mono', au: 'wide', in: 'mono' },
    how: { diph: 'glides in day (ay-ee).', mono: 'keeps the vowel in day pure and steady, with no glide (like Spanish e).', wide: 'uses a wider glide: day starts closer to “die”.' },
    tip: 'To glide, let the tongue move up during the vowel. To keep it pure, hold the mouth still until the vowel ends.',
  },
  goat: {
    title: 'The vowel in go, snow', rank: 5,
    grp: { us: 'oh', uk: 'uh', sco: 'mono', ie: 'mono', au: 'wide', in: 'mono' },
    how: { oh: 'glides in go from “oh” towards “oo”.', uh: 'starts go from “uh” and glides to “oo” (guh-oo).', mono: 'keeps the vowel in go pure and steady, with no glide (like Spanish o).', wide: 'starts go from “uh” with a wide glide and a very rounded end.' },
    tip: 'American: start from a clear “oh”. British: start from “uh”. Scottish, Irish and Indian speakers hold one steady “oh”.',
  },
  lex_schedule: {
    title: 'A word with two accepted pronunciations', rank: 9,
    grp: { us: 'sk', uk: 'sh', sco: 'sh', ie: 'sh', au: 'sh', in: 'sh' },
    how: { sk: 'says SKED-jool (hard k).', sh: 'says SHED-yool (sh sound).' },
    tip: 'Both forms are correct. The American form is SKED-jool; most other accents say SHED-yool.',
  },
  vw: {
    title: 'v and w', rank: 1,
    grp: { us: 'distinct', uk: 'distinct', sco: 'distinct', ie: 'distinct', au: 'distinct', in: 'blend' },
    how: { distinct: 'keeps v (top teeth on the lip, with a buzz) and w (rounded lips, no teeth) apart.', blend: 'can blend v and w into one in-between sound, so very and wary may sound alike.' },
    tip: 'v: top teeth touch the lower lip and you buzz. w: round the lips as for “oo” and do not touch the teeth. Practise “very west”.',
  },
  prothesis: {
    title: 'A vowel added before s + consonant', rank: 2,
    grp: { us: 'none', uk: 'none', sco: 'none', ie: 'none', au: 'none', in: 'extra' },
    how: { none: 'starts the word straight away with s (st-, sk-, sp-).', extra: 'may add a short vowel before s + consonant (station becomes “istation”). This is common for speakers whose first language is Hindi or Urdu, but not every Indian speaker does it.' },
    tip: 'Start with a long, hissing “ssss” and add the t straight after, with no vowel before it: ssstation.',
  },
  aspiration: {
    title: 'The puff of air on p, t, k', rank: 6,
    grp: { us: 'strong', uk: 'strong', sco: 'strong', ie: 'strong', au: 'strong', in: 'weak' },
    how: { strong: 'adds a small puff of air to p, t and k at the start of a word (hold a hand in front of your mouth to feel it).', weak: 'uses little or no puff of air on p, t and k at the start of a word, so car can sound closer to “gar” to some listeners.' },
    tip: 'Hold a tissue in front of your mouth and say “pen”. It should move. If it does not, add more air.',
  },
};

// Words: ipa and say (respelling) for each accent; why = the features that affect this word.
const W = (word, why, rows, note) => {
  const ipa = {}, say = {};
  Object.entries(rows).forEach(([k, [i, s]]) => { ipa[k] = i; say[k] = s; });
  return { word, why, ipa, say, note: note || '' };
};
export const WORDS = [
  W('water', ['rhotic', 't_between'], {
    us: ['ˈwɔɾɚ', 'WAW-der'], uk: ['ˈwɔːtə', 'WAW-tuh'], sco: ['ˈwɔʔɚ', 'WAW-er (t often a catch in the throat)'],
    ie: ['ˈwɔːtɚ', 'WAW-ter'], au: ['ˈwɔːɾə', 'WAW-duh'], in: ['ˈwɔːʈɚ', 'WAW-ter (curled t)'] }),
  W('better', ['rhotic', 't_between'], {
    us: ['ˈbɛɾɚ', 'BED-der'], uk: ['ˈbɛtə', 'BET-uh'], sco: ['ˈbɛʔɚ', 'BE-er (t often a catch in the throat)'],
    ie: ['ˈbɛtɚ', 'BET-er'], au: ['ˈbɛɾə', 'BED-uh'], in: ['ˈbɛʈɚ', 'BET-er (curled t)'] }),
  W('bath', ['bath', 'th_mid_end'], {
    us: ['ˈbæθ', 'BATH (a as in cat)'], uk: ['ˈbɑːθ', 'BAHTH'], sco: ['ˈbaθ', 'BATH (short a)'],
    ie: ['ˈbæθ', 'BATH (a as in cat)'], au: ['ˈbɐːθ', 'BAHTH'], in: ['ˈbɑːt̪', 'BAHT (th becomes t)'] }),
  W('ask', ['bath'], {
    us: ['ˈæsk', 'ASK (a as in cat)'], uk: ['ˈɑːsk', 'AHSK'], sco: ['ˈask', 'ASK (short a)'],
    ie: ['ˈæsk', 'ASK (a as in cat)'], au: ['ˈɑːsk', 'AHSK'], in: ['ˈɑːsk', 'AHSK'] }),
  W('car', ['rhotic', 'tap_r', 'aspiration'], {
    us: ['ˈkɑɹ', 'KAR (r sounded)'], uk: ['ˈkɑː', 'KAH (no r)'], sco: ['ˈkɑr', 'KAR (tapped r)'],
    ie: ['ˈkɑːɹ', 'KAAR (r sounded)'], au: ['ˈkɑː', 'KAH (no r)'], in: ['ˈkɑːɾ', 'KAR (little puff, tapped r)'] }),
  W('store', ['rhotic', 'tap_r'], {
    us: ['ˈstɔɹ', 'STOR (r sounded)'], uk: ['ˈstɔː', 'STAW (no r)'], sco: ['ˈstor', 'STOR (tapped r)'],
    ie: ['ˈstɔːɹ', 'STAWR (r sounded)'], au: ['ˈstɔː', 'STAW (no r)'], in: ['ˈstoːɾ', 'STOR (tapped r)'] }),
  W('three', ['th_start', 'tap_r'], {
    us: ['ˈθɹi', 'THREE'], uk: ['ˈθɹiː', 'THREE'], sco: ['ˈθri', 'THREE (tapped r)'],
    ie: ['ˈt̪ɹiː', 'TREE (th becomes t)'], au: ['ˈθɹiː', 'THREE'], in: ['ˈt̪ʰriː', 'TREE (th becomes t, tapped r)'] },
    'Listen for three versus tree: in some accents they sound alike.'),
  W('thick', ['th_start'], {
    us: ['ˈθɪk', 'THICK'], uk: ['ˈθɪk', 'THICK'], sco: ['ˈθɪk', 'THICK'],
    ie: ['ˈt̪ɪk', 'TICK (th becomes t)'], au: ['ˈθɪk', 'THICK'], in: ['ˈt̪ʰɪk', 'TICK (th becomes t)'] },
    'Thick and tick can sound alike in accents that turn th into t.'),
  W('brother', ['rhotic', 'th_mid_end', 'tap_r'], {
    us: ['ˈbɹʌðɚ', 'BRUTH-er'], uk: ['ˈbɹʌðə', 'BRUTH-uh'], sco: ['ˈbrʌðɚ', 'BRUTH-er (tapped r)'],
    ie: ['ˈbɹʌðɚ', 'BRUTH-er'], au: ['ˈbɹɐðə', 'BRUTH-uh'], in: ['ˈbrʌd̪ɚ', 'BRUD-er (th becomes d)'] }),
  W('Wednesday', ['face', 'vw'], {
    us: ['ˈwɛnzdeɪ', 'WENZ-day'], uk: ['ˈwɛnzdeɪ', 'WENZ-day'], sco: ['ˈwɛnzde', 'WENZ-day (pure vowel)'],
    ie: ['ˈwɛnzdeː', 'WENZ-day (pure vowel)'], au: ['ˈwɛnzdæɪ', 'WENZ-day (wide glide)'], in: ['ˈʋɛnzdeː', 'VENZ-day (v/w blend, pure vowel)'] },
    'The spelling suggests Wed-nes-day, but everyone says WENZ-day.'),
  W('station', ['face', 'prothesis'], {
    us: ['ˈsteɪʃən', 'STAY-shun'], uk: ['ˈsteɪʃən', 'STAY-shun'], sco: ['ˈsteʃən', 'STAY-shun (pure vowel)'],
    ie: ['ˈsteːʃn̩', 'STAY-shn (pure vowel)'], au: ['ˈstæɪʃən', 'STAY-shun (wide glide)'], in: ['ɪsˈteːʃən', 'iss-TAY-shun (extra vowel, pure vowel)'] }),
  W('schedule', ['lex_schedule'], {
    us: ['ˈskɛdʒuːl', 'SKED-jool'], uk: ['ˈʃɛdjuːl', 'SHED-yool'], sco: ['ˈʃɛdjul', 'SHED-yool'],
    ie: ['ˈʃɛdjuːl', 'SHED-yool'], au: ['ˈʃɛdjuːl', 'SHED-yool'], in: ['ˈʃɛdjuːl', 'SHED-yool'] },
    'Both forms are correct English.'),
  W('frog', ['lot', 'tap_r'], {
    us: ['ˈfɹɑɡ', 'FRAHG'], uk: ['ˈfɹɒɡ', 'FROG (short o)'], sco: ['ˈfrɔɡ', 'FRAWG (tapped r)'],
    ie: ['ˈfɹɑɡ', 'FRAHG'], au: ['ˈfɹɒɡ', 'FROG (short o)'], in: ['ˈfrɒɡ', 'FROG (tapped r)'] }),
  W('Bob', ['lot'], {
    us: ['ˈbɑb', 'BAHB'], uk: ['ˈbɒb', 'BOB (short o)'], sco: ['ˈbɔb', 'BAWB'],
    ie: ['ˈbɑb', 'BAHB'], au: ['ˈbɒb', 'BOB (short o)'], in: ['ˈbɒb', 'BOB (short o)'] }),
  W('snow', ['goat'], {
    us: ['ˈsnoʊ', 'SNOH'], uk: ['ˈsnəʊ', 'SNUH-oo'], sco: ['ˈsno', 'SNOH (pure vowel)'],
    ie: ['ˈsnoː', 'SNOH (pure vowel)'], au: ['ˈsnəʉ', 'SNUH-oo (wide glide)'], in: ['ˈsnoː', 'SNOH (pure vowel)'] }),
  W('train', ['face', 'retroflex', 'tap_r'], {
    us: ['ˈtɹeɪn', 'TRAYN'], uk: ['ˈtɹeɪn', 'TRAYN'], sco: ['ˈtren', 'TREN (pure vowel, tapped r)'],
    ie: ['ˈtɹeːn', 'TRAYN (pure vowel)'], au: ['ˈtɹæɪn', 'TRAYN (wide glide)'], in: ['ˈʈreːn', 'TRAYN (curled t, tapped r)'] }),
  W('very', ['vw', 'tap_r'], {
    us: ['ˈvɛɹi', 'VEH-ree'], uk: ['ˈvɛɹi', 'VEH-ree'], sco: ['ˈvɛri', 'VEH-ree (tapped r)'],
    ie: ['ˈvɛɹi', 'VEH-ree'], au: ['ˈvɛɹi', 'VEH-ree'], in: ['ˈʋɛri', 'VEH-ree (v/w blend, tapped r)'] },
    'Compare with “wary”: in a v/w-blend accent the two can sound alike.'),
  W('caught', ['caught_merge'], {
    us: ['ˈkɔt', 'KAWT (same as cot for most speakers)'], uk: ['ˈkɔːt', 'KAWT'], sco: ['ˈkɔt', 'KAWT (same as cot)'],
    ie: ['ˈkɔːt', 'KAWT'], au: ['ˈkoːt', 'KAWT (long, closed)'], in: ['ˈkɔːt', 'KAWT'] },
    'In the cot-caught merger, cot and caught sound identical.'),
];
export const WORD_LIST = WORDS.map((w) => w.word);
export const wordBy = (word) => WORDS.find((w) => w.word.toLowerCase() === String(word).toLowerCase());

// Compare one word between two accents. Returns the IPA and respelling for both, and one reason per differing feature.
export function compareWord(word, a, b) {
  const w = typeof word === 'string' ? wordBy(word) : word;
  if (!w || !ACCENTS[a] || !ACCENTS[b]) return null;
  const diffs = w.why
    .filter((f) => FEATURES[f].grp[a] !== FEATURES[f].grp[b])
    .sort((x, y) => FEATURES[x].rank - FEATURES[y].rank)
    .map((f) => {
      const F = FEATURES[f];
      return { id: f, title: F.title, a: F.how[F.grp[a]], b: F.how[F.grp[b]], tip: F.tip };
    });
  const sameIpa = w.ipa[a] === w.ipa[b];
  return { word: w.word, note: w.note, a: { id: a, ipa: w.ipa[a], say: w.say[a] }, b: { id: b, ipa: w.ipa[b], say: w.say[b] }, diffs, same: sameIpa || diffs.length === 0, sameIpa };
}

// Everything that differs between two accents, most important first, with example words you can practise.
export function overview(a, b) {
  if (!ACCENTS[a] || !ACCENTS[b] || a === b) return [];
  return Object.entries(FEATURES)
    .filter(([, F]) => F.grp[a] !== F.grp[b])
    .sort(([, x], [, y]) => x.rank - y.rank)
    .map(([id, F]) => ({ id, title: F.title, a: F.how[F.grp[a]], b: F.how[F.grp[b]], tip: F.tip, words: WORDS.filter((w) => w.why.includes(id)).map((w) => w.word) }));
}

// Notes for learners whose first language is not English (Speech Accent Archive speakers). These are common tendencies, not rules for every speaker.
const INDIC = ['Retroflex t and d (the tongue tip curls back).', 'th is often a dental t or d (three sounds like “tree”).', 'v and w can blend (very ≈ wery).', 'Syllables tend to have similar length (syllable-timed rhythm), so stressed words stand out less.', 'Little puff of air on p, t, k at the start of a word.'];
export const L1 = {
  hindi: { name: 'Hindi', notes: [...INDIC, 'A vowel may be added before s + consonant (station → “istation”).', 'z can sound like j (zoo → joo) for some speakers.'], watch: ['station', 'three', 'very', 'train'] },
  urdu: { name: 'Urdu', notes: [...INDIC, 'A vowel may be added before s + consonant (school → “iskool”).', 'Shares most sounds with Hindi, so the same habits appear.'], watch: ['station', 'three', 'very', 'train'] },
  bengali: { name: 'Bengali', notes: ['There is no short “a” as in cat: it can sound like “o” (cat → “cot”).', 'v may sound like bh or w; z can become j.', 's can sound like sh for some speakers.', 'th is often a dental t or d.', 'Retroflex t and d.'], watch: ['bath', 'very', 'three', 'bags'] },
  marathi: { name: 'Marathi', notes: [...INDIC, 'ch and j before front vowels can sound like ts and dz (chair → “tsair”).'], watch: ['three', 'very', 'train', 'cheese'] },
  gujarati: { name: 'Gujarati', notes: [...INDIC, 'Vowels at the end of words tend to be shorter or dropped.'], watch: ['three', 'very', 'train'] },
  punjabi: { name: 'Punjabi', notes: [...INDIC, 'Punjabi uses pitch to tell some words apart, so pitch movement on English words may sound unusual.'], watch: ['three', 'very', 'train', 'brother'] },
  tamil: { name: 'Tamil', notes: ['p/b, t/d and k/g are not separate sounds in Tamil, so pat and bat may sound alike.', 'Words starting with e or o may get a glide (ever → “yever”).', 'There is no f: it may become p or ph.', 'Retroflex t and d; syllable-timed rhythm.'], watch: ['bath', 'frog', 'train', 'very'] },
  telugu: { name: 'Telugu', notes: ['A short vowel may be added after a final consonant (bus → “busu”).', 'Words starting with e or o may get a glide (ever → “yever”).', 'Retroflex t and d; th is often a dental t or d.'], watch: ['bags', 'frog', 'three', 'train'] },
  kannada: { name: 'Kannada', notes: ['A short vowel may be added after a final consonant (bus → “busu”).', 'Retroflex t and d; th is often a dental t or d.', 'v and w can blend.'], watch: ['bags', 'three', 'very'] },
  malayalam: { name: 'Malayalam', notes: ['Retroflex t and d; th is often a dental t or d.', 'A short vowel may be added after a final consonant.', 'Consonants can sound longer than in English.'], watch: ['three', 'train', 'better'] },
  nepali: { name: 'Nepali', notes: ['Retroflex t and d; th is often a dental t or d.', 'v and w may sound like b or w.', 'Syllable-timed rhythm.'], watch: ['three', 'very', 'train'] },
  spanish: { name: 'Spanish', notes: ['No word can start with s + consonant in Spanish, so an e is added (station → “estation”).', 'b and v are the same sound.', 'ship and sheep can sound alike (no short/long i).', 'ch and sh can be confused.', 'th may become t, d or s.'], watch: ['station', 'very', 'thick', 'cheese'] },
  french: { name: 'French', notes: ['Stress falls on the last syllable of a phrase, not the first.', 'th often becomes s/z or t/d.', 'The r is made at the back of the throat.', 'h is often dropped (hotel → “otel”).', 'The vowel in ship can be too tense (ship ≈ sheep).'], watch: ['three', 'brother', 'car'] },
  german: { name: 'German', notes: ['Final voiced sounds become voiceless (bag → “bak”, bad → “bat”).', 'w is said as v (Wednesday → “Vednesday”) and v can become f.', 'th often becomes s/z or t/d.', 'The r is made at the back of the throat.'], watch: ['Wednesday', 'very', 'bags', 'three'] },
  arabic: { name: 'Arabic', notes: ['p and b are the same sound (plastic → “blastic”).', 'A vowel may be added inside consonant clusters (plastic → “pilastic”).', 'Arabic has only three vowels, so English vowels can merge (bed/bad).', 'th is usually easy because Arabic has similar sounds.'], watch: ['plastic', 'spoons', 'bed', 'snack'] },
  mandarin: { name: 'Mandarin', notes: ['Final consonants may be dropped or followed by a vowel (bag → “baga”).', 'l, n and r can be confused.', 'th often becomes s, z or f.', 'v may become w.', 'Pitch patterns from tones can colour English intonation.'], watch: ['three', 'very', 'bags', 'train'] },
  japanese: { name: 'Japanese', notes: ['A vowel is added after consonants (strike → “sutoraiku”).', 'l and r sound the same (light/right).', 'th often becomes s or z; v may become b.', 'Syllables get equal time (mora timing).'], watch: ['three', 'very', 'train', 'spoons'] },
  korean: { name: 'Korean', notes: ['l and r are one sound.', 'f may become p; v may become b.', 'A vowel may be added to break up clusters (strike → “seuturaikeu”).', 'th often becomes s or t.'], watch: ['three', 'very', 'frog', 'plastic'] },
  russian: { name: 'Russian', notes: ['th often becomes t/d or s/z.', 'Final voiced consonants become voiceless (bag → “bak”).', 'w may be said as v.', 'Articles (a, the) are often left out.'], watch: ['three', 'Wednesday', 'bags', 'brother'] },
  portuguese: { name: 'Portuguese', notes: ['A vowel may be added after a final consonant (bag → “bagi”).', 'th often becomes t, d or f.', 'An r at the start of a word can sound like h.', 'Nasal vowels may appear in English words.'], watch: ['bags', 'three', 'red', 'brother'] },
  italian: { name: 'Italian', notes: ['Words rarely end in a consonant, so a vowel may be added (bag → “baga”).', 'h is silent (house → “ouse”).', 'th often becomes t or d.', 'Double consonants may be stretched.'], watch: ['bags', 'three', 'house', 'thick'] },
  turkish: { name: 'Turkish', notes: ['A vowel is added in clusters (station → “istasyon”-like).', 'w may become v.', 'th often becomes t or s.'], watch: ['station', 'Wednesday', 'three'] },
  vietnamese: { name: 'Vietnamese', notes: ['Final consonants are often dropped or softened (peas ≈ pea).', 'Pitch can move up and down on English words, because of tones.', 'Consonant clusters may be shortened.', 'th often becomes t or d.'], watch: ['peas', 'slabs', 'three', 'cheese'] },
  dutch: { name: 'Dutch', notes: ['v and w can blend.', 'Final voiced consonants become voiceless (bag → “bak”).', 'th often becomes t/d or s/z.', 'English vowels can be too short or too pure.'], watch: ['very', 'Wednesday', 'bags', 'three'] },
};
export const L1_IDS = Object.keys(L1);

// Which accent profile a recording group belongs to (only for accents modelled above), so the lab can play matching real clips.
export const PROFILE_OF = { American: 'us', English: 'uk', Scottish: 'sco', Irish: 'ie', Australian: 'au', Indian: 'in' };
export const profileOfGroup = (g) => (g && (g.profile || PROFILE_OF[g.id])) || null;
