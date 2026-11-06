// Languages, accents (BCP-47 locales used by the browser speech APIs) and
// greeting text. Add a language by adding one object to this array.
//
// accents[].label  -> shown in the 2nd dropdown and sent to the AI as the target accent
// accents[].locale -> used for microphone recognition and for the spoken voice
// accents[].aiLabel -> optional longer description sent to the AI (defaults to "<label> <language>")
// accents[].voiceSlot/rate/pitch -> optional: when several accents share one locale (e.g. the
//                      Hindi regional accents) each one prefers a different installed voice and
//                      a slightly different pace/pitch, so the voice audibly changes.
// accents[].approximate -> true when browsers have no true voice for that accent
// greeting         -> first tutor message, written in that language ({lang} = practice language)

export const LANGUAGES = [
  {
    code: 'en', name: 'English', native: 'English',
    accents: [
      { id: 'en-US', label: 'American', locale: 'en-US' },
      { id: 'en-GB', label: 'British', locale: 'en-GB' },
      { id: 'en-IN', label: 'Indian', locale: 'en-IN' },
      { id: 'en-AU', label: 'Australian', locale: 'en-AU' },
      { id: 'en-CA', label: 'Canadian', locale: 'en-CA' },
      { id: 'en-IE', label: 'Irish', locale: 'en-IE' },
      { id: 'en-ZA', label: 'South African', locale: 'en-ZA' }
    ],
    greeting: "Hi there! 👋 I’m Fluent, your {lang} speaking partner. Say or type something and I’ll help you improve with useful phrases, gentle corrections and practice questions."
  },
  {
    code: 'hi', name: 'Hindi', native: 'हिन्दी',
    accents: [
      { id: 'hi-IN', label: 'Standard (India)', locale: 'hi-IN', voiceSlot: 0 },
      { id: 'hi-IN-south', label: 'South Indian', locale: 'hi-IN', voiceSlot: 1, rate: 0.9, pitch: 1, approximate: true,
        aiLabel: 'Hindi spoken with a South Indian accent (as native Tamil, Telugu, Kannada or Malayalam speakers speak it)' },
      { id: 'hi-IN-punjabi', label: 'Punjabi', locale: 'hi-IN', voiceSlot: 2, rate: 1.02, pitch: 0.94, approximate: true,
        aiLabel: 'Hindi spoken with a Punjabi accent (as native Punjabi speakers speak it)' },
      { id: 'hi-IN-gujarati', label: 'Gujarati', locale: 'hi-IN', voiceSlot: 3, rate: 0.94, pitch: 1.06, approximate: true,
        aiLabel: 'Hindi spoken with a Gujarati accent (as native Gujarati speakers speak it)' }
    ],
    greeting: 'नमस्ते! 👋 मैं Fluent हूँ, आपका {lang} बोलने का साथी। कुछ बोलिए या लिखिए, मैं उपयोगी वाक्यों, सुधार और अभ्यास के सवालों से आपकी मदद करूँगा।'
  },
  {
    code: 'mr', name: 'Marathi', native: 'मराठी',
    accents: [{ id: 'mr-IN', label: 'Standard (India)', locale: 'mr-IN' }],
    greeting: 'नमस्कार! 👋 मी Fluent, तुमचा {lang} बोलण्याचा सोबती. काहीतरी बोला किंवा लिहा, मी उपयुक्त वाक्ये, सुधारणा आणि सराव प्रश्नांनी तुम्हाला मदत करेन.'
  },
  {
    code: 'es', name: 'Spanish', native: 'Español',
    accents: [
      { id: 'es-ES', label: 'Spain', locale: 'es-ES' },
      { id: 'es-MX', label: 'Mexico', locale: 'es-MX' },
      { id: 'es-AR', label: 'Argentina', locale: 'es-AR' },
      { id: 'es-CO', label: 'Colombia', locale: 'es-CO' },
      { id: 'es-US', label: 'United States (Latino)', locale: 'es-US' }
    ],
    greeting: '¡Hola! 👋 Soy Fluent, tu compañero para practicar {lang}. Escribe o di algo y te ayudaré con frases útiles, correcciones amables y preguntas de práctica.'
  },
  {
    code: 'fr', name: 'French', native: 'Français',
    accents: [
      { id: 'fr-FR', label: 'France', locale: 'fr-FR' },
      { id: 'fr-CA', label: 'Canada (Québec)', locale: 'fr-CA' },
      { id: 'fr-BE', label: 'Belgium', locale: 'fr-BE' },
      { id: 'fr-CH', label: 'Switzerland', locale: 'fr-CH' }
    ],
    greeting: "Bonjour ! 👋 Je suis Fluent, votre partenaire pour parler {lang}. Écrivez ou dites quelque chose et je vous aiderai avec des phrases utiles, des corrections bienveillantes et des questions d’entraînement."
  },
  {
    code: 'de', name: 'German', native: 'Deutsch',
    accents: [
      { id: 'de-DE', label: 'Germany', locale: 'de-DE' },
      { id: 'de-AT', label: 'Austria', locale: 'de-AT' },
      { id: 'de-CH', label: 'Switzerland', locale: 'de-CH' }
    ],
    greeting: 'Hallo! 👋 Ich bin Fluent, dein Partner zum Sprechen von {lang}. Schreib oder sprich etwas – ich helfe dir mit nützlichen Sätzen, freundlichen Korrekturen und Übungsfragen.'
  },
  {
    code: 'pt', name: 'Portuguese', native: 'Português',
    accents: [
      { id: 'pt-BR', label: 'Brazil', locale: 'pt-BR' },
      { id: 'pt-PT', label: 'Portugal', locale: 'pt-PT' }
    ],
    greeting: 'Olá! 👋 Eu sou o Fluent, seu parceiro para praticar {lang}. Escreva ou fale algo e eu ajudo com frases úteis, correções gentis e perguntas de prática.'
  },
  {
    code: 'it', name: 'Italian', native: 'Italiano',
    accents: [{ id: 'it-IT', label: 'Standard (Italy)', locale: 'it-IT' }],
    greeting: "Ciao! 👋 Sono Fluent, il tuo compagno per parlare {lang}. Scrivi o di’ qualcosa e ti aiuterò con frasi utili, correzioni gentili e domande di pratica."
  },
  {
    code: 'ja', name: 'Japanese', native: '日本語',
    accents: [{ id: 'ja-JP', label: 'Standard (Tokyo)', locale: 'ja-JP' }],
    greeting: 'こんにちは！👋 私はFluent、{lang}を話す練習のパートナーです。何か話しかけて（または入力して）ください。便利なフレーズ、やさしい訂正、練習の質問でサポートします。'
  },
  {
    code: 'ko', name: 'Korean', native: '한국어',
    accents: [{ id: 'ko-KR', label: 'Standard (Seoul)', locale: 'ko-KR' }],
    greeting: '안녕하세요! 👋 저는 Fluent, {lang} 말하기 연습 파트너예요. 말하거나 입력해 보세요. 유용한 표현, 부드러운 교정, 연습 질문으로 도와드릴게요.'
  },
  {
    code: 'zh', name: 'Chinese', native: '中文',
    accents: [
      { id: 'zh-CN', label: 'Mandarin (Mainland China)', locale: 'zh-CN' },
      { id: 'zh-TW', label: 'Mandarin (Taiwan)', locale: 'zh-TW' },
      { id: 'zh-HK', label: 'Cantonese (Hong Kong)', locale: 'zh-HK' }
    ],
    greeting: '你好！👋 我是 Fluent，你的{lang}口语伙伴。说点什么或输入一句话吧，我会用实用短语、温和的纠正和练习题来帮助你。'
  },
  {
    code: 'ar', name: 'Arabic', native: 'العربية', rtl: true,
    accents: [
      { id: 'ar-SA', label: 'Modern Standard (Saudi)', locale: 'ar-SA' },
      { id: 'ar-EG', label: 'Egyptian', locale: 'ar-EG' },
      { id: 'ar-AE', label: 'Gulf (UAE)', locale: 'ar-AE' }
    ],
    greeting: 'مرحبًا! 👋 أنا Fluent، شريكك لممارسة {lang}. تحدّث أو اكتب شيئًا وسأساعدك بعبارات مفيدة وتصحيحات لطيفة وأسئلة تدريبية.'
  },
  {
    code: 'ru', name: 'Russian', native: 'Русский',
    accents: [{ id: 'ru-RU', label: 'Standard (Russia)', locale: 'ru-RU' }],
    greeting: 'Привет! 👋 Я Fluent, твой партнёр для разговорной практики ({lang}). Скажи или напиши что-нибудь — я помогу полезными фразами, мягкими исправлениями и вопросами для практики.'
  },
  {
    code: 'bn', name: 'Bengali', native: 'বাংলা',
    accents: [
      { id: 'bn-IN', label: 'India (West Bengal)', locale: 'bn-IN' },
      { id: 'bn-BD', label: 'Bangladesh', locale: 'bn-BD' }
    ],
    greeting: 'হ্যালো! 👋 আমি Fluent, আপনার {lang} বলার সঙ্গী। কিছু বলুন বা লিখুন, আমি দরকারি বাক্য, সহজ সংশোধন আর অনুশীলনের প্রশ্ন দিয়ে সাহায্য করব।'
  },
  {
    code: 'ta', name: 'Tamil', native: 'தமிழ்',
    accents: [
      { id: 'ta-IN', label: 'India', locale: 'ta-IN' },
      { id: 'ta-LK', label: 'Sri Lanka', locale: 'ta-LK' },
      { id: 'ta-SG', label: 'Singapore', locale: 'ta-SG' }
    ],
    greeting: 'வணக்கம்! 👋 நான் Fluent, உங்கள் {lang} பேசும் துணை. ஏதாவது சொல்லுங்கள் அல்லது எழுதுங்கள்; பயனுள்ள சொற்றொடர்கள், மென்மையான திருத்தங்கள், பயிற்சி கேள்விகளுடன் உதவுவேன்.'
  },
  {
    code: 'te', name: 'Telugu', native: 'తెలుగు',
    accents: [{ id: 'te-IN', label: 'Standard (India)', locale: 'te-IN' }],
    greeting: 'హలో! 👋 నేను Fluent, మీ {lang} మాట్లాడే తోడు. ఏదైనా చెప్పండి లేదా రాయండి; ఉపయోగకరమైన వాక్యాలు, సున్నితమైన సవరణలు, సాధన ప్రశ్నలతో సహాయం చేస్తాను.'
  },
  {
    code: 'gu', name: 'Gujarati', native: 'ગુજરાતી',
    accents: [{ id: 'gu-IN', label: 'Standard (India)', locale: 'gu-IN' }],
    greeting: 'નમસ્તે! 👋 હું Fluent છું, તમારો {lang} બોલવાનો સાથી. કંઈક બોલો અથવા લખો, હું ઉપયોગી વાક્યો, નમ્ર સુધારા અને પ્રેક્ટિસ પ્રશ્નોથી મદદ કરીશ.'
  },
  {
    code: 'ur', name: 'Urdu', native: 'اردو', rtl: true,
    accents: [
      { id: 'ur-PK', label: 'Pakistan', locale: 'ur-PK' },
      { id: 'ur-IN', label: 'India', locale: 'ur-IN' }
    ],
    greeting: 'السلام علیکم! 👋 میں Fluent ہوں، آپ کا {lang} بولنے کا ساتھی۔ کچھ بولیں یا لکھیں، میں مفید جملوں، نرم اصلاح اور مشقی سوالات سے مدد کروں گا۔'
  },
  {
    code: 'tr', name: 'Turkish', native: 'Türkçe',
    accents: [{ id: 'tr-TR', label: 'Standard (Türkiye)', locale: 'tr-TR' }],
    greeting: 'Merhaba! 👋 Ben Fluent, {lang} konuşma partnerin. Bir şey söyle ya da yaz; faydalı cümleler, nazik düzeltmeler ve alıştırma soruları ile yardımcı olayım.'
  },
  {
    code: 'nl', name: 'Dutch', native: 'Nederlands',
    accents: [
      { id: 'nl-NL', label: 'Netherlands', locale: 'nl-NL' },
      { id: 'nl-BE', label: 'Belgium (Flemish)', locale: 'nl-BE' }
    ],
    greeting: 'Hoi! 👋 Ik ben Fluent, je partner om {lang} te oefenen. Zeg of typ iets en ik help je met handige zinnen, vriendelijke correcties en oefenvragen.'
  },
  {
    code: 'id', name: 'Indonesian', native: 'Bahasa Indonesia',
    accents: [{ id: 'id-ID', label: 'Standard (Indonesia)', locale: 'id-ID' }],
    greeting: 'Halo! 👋 Aku Fluent, teman latihan bicara {lang}-mu. Ucapkan atau ketik sesuatu, dan aku akan membantu dengan frasa berguna, koreksi lembut, dan pertanyaan latihan.'
  }
];

export const SAME_AS_PRACTICE = 'same';

export const getLanguage = code => LANGUAGES.find(l => l.code === code) || LANGUAGES[0];

export function getAccent(language, accentId) {
  return language.accents.find(a => a.id === accentId) || language.accents[0];
}

export const isSameLanguage = (practiceCode, replyCode) =>
  replyCode === SAME_AS_PRACTICE || replyCode === practiceCode;

/** Accent list for whichever language the AI is replying in. */
export function replyAccentsFor({ practiceCode, replyCode }) {
  return getLanguage(isSameLanguage(practiceCode, replyCode) ? practiceCode : replyCode).accents;
}

/** Sensible default reply accent: follow the practice accent when replying in the same language. */
export function defaultReplyAccentId({ practiceCode, accentId, replyCode }) {
  if (isSameLanguage(practiceCode, replyCode)) return getAccent(getLanguage(practiceCode), accentId).id;
  return getLanguage(replyCode).accents[0].id;
}

/** Resolve the dropdown values into everything the app needs. */
export function resolveSettings({ practiceCode, accentId, replyCode, replyAccentId }) {
  const practice = getLanguage(practiceCode);
  const accent = getAccent(practice, accentId);
  const sameLanguage = isSameLanguage(practice.code, replyCode);
  const reply = sameLanguage ? practice : getLanguage(replyCode);
  const replyAccent = getAccent(reply, replyAccentId);
  return { practice, accent, reply, replyAccent, sameLanguage, replyLocale: replyAccent.locale };
}

/** Text describing an accent to the AI. */
export const accentForAI = (language, accent) => accent.aiLabel || `${accent.label} ${language.name}`;

export function greetingFor(settings) {
  const { practice, reply } = settings;
  return reply.greeting.replace('{lang}', practice.native === practice.name ? practice.name : `${practice.name} (${practice.native})`);
}
