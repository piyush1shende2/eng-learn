// Languages, interface strings, phrasebook and writing data. All bundled, so it works offline.
// Translations were written for this app and should be reviewed by native speakers.
const L = (id, name, native, bcp, rtl) => ({ id, name, native, bcp, rtl: !!rtl });
export const LANGS = [L('en', 'English', 'English', 'en-US'), L('hi', 'Hindi', 'हिन्दी', 'hi-IN'), L('ja', 'Japanese', '日本語', 'ja-JP'), L('zh', 'Chinese', '中文', 'zh-CN'), L('es', 'Spanish', 'Español', 'es-ES'), L('fr', 'French', 'Français', 'fr-FR'), L('de', 'German', 'Deutsch', 'de-DE'), L('ru', 'Russian', 'Русский', 'ru-RU'), L('ko', 'Korean', '한국어', 'ko-KR'), L('ar', 'Arabic', 'العربية', 'ar-SA', 1), L('pt', 'Portuguese', 'Português', 'pt-BR'), L('it', 'Italian', 'Italiano', 'it-IT'), L('bn', 'Bengali', 'বাংলা', 'bn-IN'), L('ur', 'Urdu', 'اردو', 'ur-PK', 1), L('tr', 'Turkish', 'Türkçe', 'tr-TR'), L('nl', 'Dutch', 'Nederlands', 'nl-NL'), L('mr', 'Marathi', 'मराठी', 'mr-IN'), L('ta', 'Tamil', 'தமிழ்', 'ta-IN'), L('id', 'Indonesian', 'Bahasa Indonesia', 'id-ID'), L('vi', 'Vietnamese', 'Tiếng Việt', 'vi-VN')];
export const IFACE = [LANGS[0], LANGS[1], L('hing', 'Hinglish', 'Hinglish', 'hi-IN'), ...LANGS.slice(2)];
// More languages that only "Chat with teacher" supports (the AI teacher can speak them, but the lessons, puzzles and
// phrasebooks of the rest of the app are not written for them yet).
export const EXTRA_LANGS = [L('te', 'Telugu', 'తెలుగు', 'te-IN'), L('gu', 'Gujarati', 'ગુજરાતી', 'gu-IN'), L('kn', 'Kannada', 'ಕನ್ನಡ', 'kn-IN'), L('ml', 'Malayalam', 'മലയാളം', 'ml-IN'), L('pa', 'Punjabi', 'ਪੰਜਾਬੀ', 'pa-IN'), L('ne', 'Nepali', 'नेपाली', 'ne-NP'),
  L('th', 'Thai', 'ไทย', 'th-TH'), L('fil', 'Filipino', 'Filipino', 'fil-PH'), L('ms', 'Malay', 'Bahasa Melayu', 'ms-MY'), L('pl', 'Polish', 'Polski', 'pl-PL'), L('sv', 'Swedish', 'Svenska', 'sv-SE'), L('da', 'Danish', 'Dansk', 'da-DK'),
  L('cs', 'Czech', 'Čeština', 'cs-CZ'), L('hu', 'Hungarian', 'Magyar', 'hu-HU'), L('ro', 'Romanian', 'Română', 'ro-RO'), L('uk', 'Ukrainian', 'Українська', 'uk-UA'), L('el', 'Greek', 'Ελληνικά', 'el-GR'),
  L('he', 'Hebrew', 'עברית', 'he-IL', 1), L('fa', 'Persian', 'فارسی', 'fa-IR', 1), L('sw', 'Swahili', 'Kiswahili', 'sw-KE')];
export const isChatOnly = (id) => EXTRA_LANGS.some((l) => l.id === id);
export const langOf = (id) => IFACE.find((l) => l.id === id) || EXTRA_LANGS.find((l) => l.id === id) || LANGS[0];

const KEYS = 'home learn speak chat freechat puzzles cursive accents words notebook level streak next check hint great again ui known want accent sounds captions'.split(' ');
const UI = {
  en: "Home|Learn|Speak|Chat|Free chat|Puzzles|Writing|Accents|Hard words|Mistakes|Level|day streak|Next|Check|Hint|Great work!|Not yet. Let's practise this pattern again.|Interface language|I know|I want to learn|Accent|Sounds|Captions for audience",
  hi: 'होम|सीखें|बोलें|बातचीत|खुली बातचीत|पहेलियाँ|लेखन|उच्चारण|कठिन शब्द|गलतियाँ|स्तर|दिन की लय|आगे|जाँचें|संकेत|बहुत बढ़िया!|अभी नहीं। चलिए फिर से अभ्यास करें।|इंटरफ़ेस भाषा|मैं जानता हूँ|मैं सीखना चाहता हूँ|लहजा|ध्वनि|दर्शकों के लिए कैप्शन',
  hing: 'Home|Seekho|Bolo|Baatcheet|Free chat|Paheliyan|Likhna|Uccharan|Mushkil words|Galtiyan|Level|din ki streak|Aage|Check karo|Hint|Bahut badhiya!|Abhi nahi. Chalo phir se practise karte hain.|Interface language|Main jaanta hoon|Main seekhna chahta hoon|Accent|Sounds|Audience ke liye captions',
  ja: 'ホーム|学ぶ|話す|会話|フリーチャット|パズル|書く|アクセント|難しい単語|間違い|レベル|日連続|次へ|確認|ヒント|すばらしい！|まだです。もう一度練習しましょう。|表示言語|知っている言語|学びたい言語|アクセント|サウンド|観客向け字幕',
  zh: '首页|学习|口语|对话|自由聊天|谜题|书写|口音|难词|错误|等级|天连续|下一个|检查|提示|太棒了！|还不对，我们再练一次。|界面语言|我会的语言|我想学的语言|口音|声音|观众字幕',
  es: 'Inicio|Aprender|Hablar|Conversar|Chat libre|Rompecabezas|Escritura|Acentos|Palabras difíciles|Errores|Nivel|días seguidos|Siguiente|Comprobar|Pista|¡Buen trabajo!|Aún no. Practiquemos este patrón otra vez.|Idioma de la interfaz|Yo sé|Quiero aprender|Acento|Sonidos|Subtítulos para el público',
  fr: "Accueil|Apprendre|Parler|Discussion|Chat libre|Énigmes|Écriture|Accents|Mots difficiles|Erreurs|Niveau|jours d'affilée|Suivant|Vérifier|Indice|Bravo !|Pas encore. Pratiquons encore ce modèle.|Langue de l'interface|Je connais|Je veux apprendre|Accent|Sons|Sous-titres pour le public",
  de: 'Start|Lernen|Sprechen|Gespräch|Freier Chat|Rätsel|Schreiben|Akzente|Schwere Wörter|Fehler|Stufe|Tage in Folge|Weiter|Prüfen|Hinweis|Super gemacht!|Noch nicht. Üben wir dieses Muster noch einmal.|Oberflächensprache|Ich kann|Ich möchte lernen|Akzent|Töne|Untertitel fürs Publikum',
  ru: 'Главная|Учиться|Говорить|Диалог|Свободный чат|Головоломки|Письмо|Акценты|Сложные слова|Ошибки|Уровень|дней подряд|Далее|Проверить|Подсказка|Отлично!|Пока нет. Давайте потренируемся ещё раз.|Язык интерфейса|Я знаю|Хочу изучать|Акцент|Звуки|Субтитры для зрителей',
  ko: '홈|학습|말하기|대화|자유 채팅|퍼즐|쓰기|억양|어려운 단어|실수|레벨|일 연속|다음|확인|힌트|잘했어요!|아직이에요. 다시 연습해 봐요.|인터페이스 언어|내가 아는 언어|배우고 싶은 언어|억양|소리|청중용 자막',
  ar: 'الرئيسية|تعلّم|تحدّث|محادثة|دردشة حرة|ألغاز|الكتابة|اللهجات|كلمات صعبة|الأخطاء|المستوى|أيام متتالية|التالي|تحقق|تلميح|عمل رائع!|ليس بعد. لنتدرب على هذا النمط مرة أخرى.|لغة الواجهة|أنا أعرف|أريد أن أتعلم|اللكنة|الأصوات|ترجمة للجمهور',
  pt: 'Início|Aprender|Falar|Conversa|Chat livre|Quebra-cabeças|Escrita|Sotaques|Palavras difíceis|Erros|Nível|dias seguidos|Próximo|Verificar|Dica|Ótimo trabalho!|Ainda não. Vamos praticar este padrão de novo.|Idioma da interface|Eu sei|Quero aprender|Sotaque|Sons|Legendas para o público',
  it: "Home|Impara|Parla|Conversazione|Chat libera|Rompicapi|Scrittura|Accenti|Parole difficili|Errori|Livello|giorni di fila|Avanti|Controlla|Suggerimento|Ottimo lavoro!|Non ancora. Esercitiamoci ancora su questo schema.|Lingua dell'interfaccia|Conosco|Voglio imparare|Accento|Suoni|Sottotitoli per il pubblico",
  bn: 'হোম|শিখুন|বলুন|কথোপকথন|ফ্রি চ্যাট|ধাঁধা|লেখা|উচ্চারণভঙ্গি|কঠিন শব্দ|ভুল|স্তর|দিনের ধারা|পরবর্তী|যাচাই|ইঙ্গিত|চমৎকার!|এখনও না। আসুন আবার অনুশীলন করি।|ইন্টারফেসের ভাষা|আমি জানি|আমি শিখতে চাই|উচ্চারণভঙ্গি|শব্দ|দর্শকের জন্য ক্যাপশন',
  ur: 'ہوم|سیکھیں|بولیں|گفتگو|آزاد چیٹ|پہیلیاں|لکھائی|لہجے|مشکل الفاظ|غلطیاں|درجہ|دن لگاتار|اگلا|جانچیں|اشارہ|بہت خوب!|ابھی نہیں۔ آئیے دوبارہ مشق کریں۔|انٹرفیس کی زبان|میں جانتا ہوں|میں سیکھنا چاہتا ہوں|لہجہ|آوازیں|سامعین کے لیے کیپشن',
  tr: 'Ana sayfa|Öğren|Konuş|Sohbet|Serbest sohbet|Bulmacalar|Yazı|Aksanlar|Zor kelimeler|Hatalar|Seviye|gün üst üste|İleri|Kontrol et|İpucu|Harika iş!|Henüz değil. Bu kalıbı tekrar çalışalım.|Arayüz dili|Bildiğim dil|Öğrenmek istediğim dil|Aksan|Sesler|Seyirci için altyazı',
  nl: 'Start|Leren|Spreken|Gesprek|Vrije chat|Puzzels|Schrijven|Accenten|Moeilijke woorden|Fouten|Niveau|dagen op rij|Volgende|Controleren|Hint|Goed gedaan!|Nog niet. Laten we dit patroon opnieuw oefenen.|Interfacetaal|Ik ken|Ik wil leren|Accent|Geluiden|Ondertiteling voor publiek',
  mr: 'मुख्यपृष्ठ|शिका|बोला|संभाषण|मुक्त गप्पा|कोडी|लेखन|उच्चार शैली|कठीण शब्द|चुका|स्तर|दिवस सलग|पुढे|तपासा|सूचना|छान काम!|अजून नाही. चला पुन्हा सराव करू.|इंटरफेस भाषा|मला येते|मला शिकायचे आहे|उच्चार शैली|ध्वनी|प्रेक्षकांसाठी मथळे',
  ta: 'முகப்பு|கற்க|பேசு|உரையாடல்|இலவச அரட்டை|புதிர்கள்|எழுத்து|உச்சரிப்புகள்|கடினமான சொற்கள்|தவறுகள்|நிலை|நாள் தொடர்ச்சி|அடுத்து|சரிபார்|குறிப்பு|அருமை!|இன்னும் இல்லை. மீண்டும் பயிற்சி செய்வோம்.|இடைமுக மொழி|எனக்குத் தெரிந்தது|நான் கற்க விரும்புவது|உச்சரிப்பு|ஒலிகள்|பார்வையாளர்களுக்கான வசனம்',
  id: 'Beranda|Belajar|Bicara|Percakapan|Obrolan bebas|Teka-teki|Menulis|Aksen|Kata sulit|Kesalahan|Level|hari berturut-turut|Berikutnya|Periksa|Petunjuk|Kerja bagus!|Belum. Mari latihan pola ini lagi.|Bahasa antarmuka|Saya bisa|Saya ingin belajar|Aksen|Suara|Teks untuk penonton',
  vi: 'Trang chủ|Học|Nói|Trò chuyện|Chat tự do|Câu đố|Viết|Giọng|Từ khó|Lỗi|Cấp độ|ngày liên tiếp|Tiếp|Kiểm tra|Gợi ý|Làm tốt lắm!|Chưa đúng. Hãy luyện lại mẫu này nhé.|Ngôn ngữ giao diện|Tôi biết|Tôi muốn học|Giọng|Âm thanh|Phụ đề cho khán giả',
};
export const T = Object.fromEntries(Object.entries(UI).map(([k, v]) => [k, Object.fromEntries(v.split('|').map((s, i) => [KEYS[i], s]))]));
const TRL = { en: 'Translate', hi: 'अनुवाद', hing: 'Anuvaad', ja: '翻訳', zh: '翻译', es: 'Traductor', fr: 'Traduire', de: 'Übersetzen', ru: 'Переводчик', ko: '번역', ar: 'ترجمة', pt: 'Traduzir', it: 'Traduci', bn: 'অনুবাদ', ur: 'ترجمہ', tr: 'Çevir', nl: 'Vertalen', mr: 'भाषांतर', ta: 'மொழிபெயர்ப்பு', id: 'Terjemahan', vi: 'Dịch' };
Object.keys(T).forEach((k) => { T[k].translate = TRL[k] || 'Translate'; });

// 14 phrases in every language (same order). Used for the phrasebook, quizzes, meanings and writing words.
export const PH_EN = ['Hello', 'How are you?', 'Thank you', 'Please', 'Sorry', 'Yes', 'No', 'What is your name?', 'I am a student.', "I don't understand.", 'Where is the station?', 'How much is this?', 'Goodbye', 'Do you speak English?'];
const PH = {
  hi: 'नमस्ते|आप कैसे हैं?|धन्यवाद|कृपया|माफ़ कीजिए|हाँ|नहीं|आपका नाम क्या है?|मैं एक छात्र हूँ।|मुझे समझ नहीं आया।|स्टेशन कहाँ है?|यह कितने का है?|अलविदा|क्या आप अंग्रेज़ी बोलते हैं?',
  ja: 'こんにちは|お元気ですか？|ありがとう|お願いします|ごめんなさい|はい|いいえ|お名前は何ですか？|私は学生です。|わかりません。|駅はどこですか？|これはいくらですか？|さようなら|英語を話せますか？',
  zh: '你好|你好吗？|谢谢|请|对不起|是|不|你叫什么名字？|我是学生。|我不明白。|车站在哪里？|这个多少钱？|再见|你会说英语吗？',
  es: 'Hola|¿Cómo estás?|Gracias|Por favor|Lo siento|Sí|No|¿Cómo te llamas?|Soy estudiante.|No entiendo.|¿Dónde está la estación?|¿Cuánto cuesta esto?|Adiós|¿Hablas inglés?',
  fr: "Bonjour|Comment allez-vous ?|Merci|S'il vous plaît|Désolé|Oui|Non|Comment vous appelez-vous ?|Je suis étudiant.|Je ne comprends pas.|Où est la gare ?|Combien ça coûte ?|Au revoir|Parlez-vous anglais ?",
  de: 'Hallo|Wie geht es Ihnen?|Danke|Bitte|Entschuldigung|Ja|Nein|Wie heißen Sie?|Ich bin Student.|Ich verstehe nicht.|Wo ist der Bahnhof?|Wie viel kostet das?|Auf Wiedersehen|Sprechen Sie Englisch?',
  ru: 'Привет|Как дела?|Спасибо|Пожалуйста|Извините|Да|Нет|Как вас зовут?|Я студент.|Я не понимаю.|Где вокзал?|Сколько это стоит?|До свидания|Вы говорите по-английски?',
  ko: '안녕하세요|어떻게 지내세요?|감사합니다|부탁합니다|죄송합니다|네|아니요|이름이 뭐예요?|저는 학생이에요.|이해가 안 돼요.|역이 어디예요?|이거 얼마예요?|안녕히 가세요|영어 할 수 있어요?',
  ar: 'مرحبا|كيف حالك؟|شكرا|من فضلك|آسف|نعم|لا|ما اسمك؟|أنا طالب.|لا أفهم.|أين المحطة؟|كم سعر هذا؟|مع السلامة|هل تتحدث الإنجليزية؟',
  pt: 'Olá|Como vai você?|Obrigado|Por favor|Desculpe|Sim|Não|Qual é o seu nome?|Eu sou estudante.|Não entendo.|Onde fica a estação?|Quanto custa isto?|Tchau|Você fala inglês?',
  it: "Ciao|Come stai?|Grazie|Per favore|Scusa|Sì|No|Come ti chiami?|Sono uno studente.|Non capisco.|Dov'è la stazione?|Quanto costa questo?|Arrivederci|Parli inglese?",
  bn: 'নমস্কার|আপনি কেমন আছেন?|ধন্যবাদ|দয়া করে|দুঃখিত|হ্যাঁ|না|আপনার নাম কী?|আমি একজন ছাত্র।|আমি বুঝতে পারছি না।|স্টেশন কোথায়?|এটা কত?|বিদায়|আপনি কি ইংরেজি বলতে পারেন?',
  ur: 'السلام علیکم|آپ کیسے ہیں؟|شکریہ|براہ کرم|معاف کیجیے|ہاں|نہیں|آپ کا نام کیا ہے؟|میں ایک طالب علم ہوں۔|مجھے سمجھ نہیں آیا۔|اسٹیشن کہاں ہے؟|یہ کتنے کا ہے؟|خدا حافظ|کیا آپ انگریزی بولتے ہیں؟',
  tr: 'Merhaba|Nasılsınız?|Teşekkür ederim|Lütfen|Özür dilerim|Evet|Hayır|Adınız nedir?|Ben öğrenciyim.|Anlamıyorum.|İstasyon nerede?|Bu ne kadar?|Hoşça kal|İngilizce konuşuyor musunuz?',
  nl: 'Hallo|Hoe gaat het?|Dank u|Alstublieft|Sorry|Ja|Nee|Hoe heet u?|Ik ben student.|Ik begrijp het niet.|Waar is het station?|Hoeveel kost dit?|Tot ziens|Spreekt u Engels?',
  mr: 'नमस्कार|तुम्ही कसे आहात?|धन्यवाद|कृपया|माफ करा|हो|नाही|तुमचे नाव काय आहे?|मी विद्यार्थी आहे.|मला समजत नाही.|स्टेशन कुठे आहे?|हे किती आहे?|पुन्हा भेटू|तुम्हाला इंग्रजी येते का?',
  ta: 'வணக்கம்|நீங்கள் எப்படி இருக்கிறீர்கள்?|நன்றி|தயவுசெய்து|மன்னிக்கவும்|ஆம்|இல்லை|உங்கள் பெயர் என்ன?|நான் ஒரு மாணவன்.|எனக்குப் புரியவில்லை.|ரயில் நிலையம் எங்கே?|இது எவ்வளவு?|போய் வருகிறேன்|உங்களுக்கு ஆங்கிலம் தெரியுமா?',
  id: 'Halo|Apa kabar?|Terima kasih|Tolong|Maaf|Ya|Tidak|Siapa nama Anda?|Saya seorang pelajar.|Saya tidak mengerti.|Di mana stasiun?|Berapa harga ini?|Selamat tinggal|Apakah Anda berbicara bahasa Inggris?',
  vi: 'Xin chào|Bạn khỏe không?|Cảm ơn|Làm ơn|Xin lỗi|Vâng|Không|Bạn tên là gì?|Tôi là sinh viên.|Tôi không hiểu.|Nhà ga ở đâu?|Cái này bao nhiêu tiền?|Tạm biệt|Bạn có nói tiếng Anh không?',
};
export const phrases = (lang) => (lang === 'en' ? PH_EN : (PH[lang === 'hing' ? 'hi' : lang] || PH_EN) && (lang === 'hing' ? PH.hi : PH[lang] || '').split('|'));
export const phraseSet = (lang) => (lang === 'en' ? PH_EN : (PH[lang === 'hing' ? 'hi' : lang] || PH.hi).split('|'));

// Regional accents per language: [BCP-47 tag, label]. Which ones can be heard depends on the voices installed on the device.
export const ACC = {
  en: [['en-US', 'American English'], ['en-GB', 'British English'], ['en-IE', 'Irish English'], ['en-AU', 'Australian English'], ['en-IN', 'Indian English'], ['en-ZA', 'South African English'], ['en-CA', 'Canadian English'], ['en-NZ', 'New Zealand English'], ['fr-FR', 'French-accented English (experimental)'], ['de-DE', 'German-accented English (experimental)'], ['es-ES', 'Spanish-accented English (experimental)'], ['it-IT', 'Italian-accented English (experimental)'], ['nl-NL', 'Dutch-accented English (experimental)'], ['pt-PT', 'Portuguese-accented English (experimental)']],
  hi: [['hi-IN', 'India']], ja: [['ja-JP', 'Japan']], ko: [['ko-KR', 'Korea']], ru: [['ru-RU', 'Russia']], tr: [['tr-TR', 'Turkey']], id: [['id-ID', 'Indonesia']], vi: [['vi-VN', 'Vietnam']], mr: [['mr-IN', 'India']],
  es: [['es-ES', 'Spain'], ['es-MX', 'Mexico'], ['es-AR', 'Argentina'], ['es-CO', 'Colombia'], ['es-US', 'United States']],
  fr: [['fr-FR', 'France'], ['fr-CA', 'Canada (Québec)'], ['fr-BE', 'Belgium'], ['fr-CH', 'Switzerland']],
  de: [['de-DE', 'Germany'], ['de-AT', 'Austria'], ['de-CH', 'Switzerland']], pt: [['pt-BR', 'Brazil'], ['pt-PT', 'Portugal']],
  zh: [['zh-CN', 'Mainland Mandarin'], ['zh-TW', 'Taiwan Mandarin'], ['zh-HK', 'Hong Kong Cantonese']], ar: [['ar-SA', 'Saudi Arabia'], ['ar-EG', 'Egypt'], ['ar-AE', 'United Arab Emirates']],
  it: [['it-IT', 'Italy'], ['it-CH', 'Switzerland']], bn: [['bn-IN', 'India'], ['bn-BD', 'Bangladesh']], ur: [['ur-PK', 'Pakistan'], ['ur-IN', 'India']],
  nl: [['nl-NL', 'Netherlands'], ['nl-BE', 'Belgium (Flemish)']], ta: [['ta-IN', 'India'], ['ta-LK', 'Sri Lanka'], ['ta-SG', 'Singapore']],
  // languages that only Chat with teacher supports
  te: [['te-IN', 'India']], gu: [['gu-IN', 'India']], kn: [['kn-IN', 'India']], ml: [['ml-IN', 'India']], pa: [['pa-IN', 'India']], ne: [['ne-NP', 'Nepal']],
  th: [['th-TH', 'Thailand']], fil: [['fil-PH', 'Philippines']], ms: [['ms-MY', 'Malaysia']], pl: [['pl-PL', 'Poland']], sv: [['sv-SE', 'Sweden']], da: [['da-DK', 'Denmark']],
  cs: [['cs-CZ', 'Czechia']], hu: [['hu-HU', 'Hungary']], ro: [['ro-RO', 'Romania']], uk: [['uk-UA', 'Ukraine']], el: [['el-GR', 'Greece']],
  he: [['he-IL', 'Israel']], fa: [['fa-IR', 'Iran']], sw: [['sw-KE', 'Kenya'], ['sw-TZ', 'Tanzania']],
};
export const accentsFor = (t) => ACC[t] || ACC.en;
export const accentLabel = (t, id) => (accentsFor(t).find((a) => a[0] === id) || [id, id])[1];

// ---- Writing practice data ----
const SANS = '"Segoe UI",Arial,sans-serif', SERIF = '"Times New Roman",Georgia,serif';
const st = (id, label, fam, o = {}) => ({ id, label, fam, ...o });
export const STYLES = {
  latin: [st('cur', 'Cursive', '"Segoe Script","Brush Script MT","Lucida Handwriting","Snell Roundhand",cursive'), st('print', 'Print (school)', '"Comic Sans MS","Trebuchet MS",sans-serif', { b: 1 }), st('ital', 'Italic', 'Georgia,"Times New Roman",serif', { i: 1 }), st('cal', 'Calligraphy', '"Lucida Calligraphy","Apple Chancery","URW Chancery L",cursive'), st('cap', 'Block capitals', 'Arial,Helvetica,sans-serif', { b: 1, up: 1 })],
  deva: [st('s', 'Print (sans)', '"Nirmala UI","Noto Sans Devanagari",Mangal,sans-serif', { b: 1 }), st('f', 'Book (serif)', 'Kokila,"Noto Serif Devanagari",Mangal,serif')],
  beng: [st('s', 'Print (sans)', '"Nirmala UI","Noto Sans Bengali",Vrinda,sans-serif', { b: 1 }), st('f', 'Book (serif)', '"Noto Serif Bengali",Vrinda,serif')],
  taml: [st('s', 'Print (sans)', '"Nirmala UI","Noto Sans Tamil",Latha,sans-serif', { b: 1 }), st('f', 'Book (serif)', '"Noto Serif Tamil",Latha,serif')],
  jpan: [st('g', 'Gothic', '"Yu Gothic",Meiryo,"Hiragino Sans",sans-serif', { b: 1 }), st('m', 'Mincho', '"Yu Mincho","MS Mincho","Hiragino Mincho ProN",serif'), st('k', 'Textbook', '"UD Digi Kyokasho NK-R","HGKyokashotai","Yu Mincho",serif')],
  hans: [st('h', 'Hei (sans)', '"Microsoft YaHei","PingFang SC","Noto Sans CJK SC",sans-serif', { b: 1 }), st('s', 'Song (serif)', 'SimSun,"Songti SC",serif'), st('k', 'Kai (handwriting)', 'KaiTi,STKaiti,"Kaiti SC",serif')],
  hang: [st('g', 'Gothic', '"Malgun Gothic","Apple SD Gothic Neo",sans-serif', { b: 1 }), st('m', 'Myeongjo', 'Batang,AppleMyungjo,serif'), st('h', 'Handwriting', '"Nanum Pen Script",Gungsuh,cursive')],
  cyrl: [st('p', 'Print', SANS, { b: 1 }), st('c', 'Cursive', '"Segoe Script","Comic Sans MS",cursive'), st('i', 'Italic', SERIF, { i: 1 })],
  arab: [st('n', 'Naskh', '"Segoe UI","Traditional Arabic",Tahoma,sans-serif', { b: 1 }), st('q', 'Nastaliq / Ruqah', '"Noto Nastaliq Urdu","Jameel Noori Nastaleeq","Urdu Typesetting","Segoe UI",serif')],
};
export const SCRIPT = { en: 'latin', es: 'latin', fr: 'latin', de: 'latin', pt: 'latin', it: 'latin', tr: 'latin', nl: 'latin', id: 'latin', vi: 'latin', hi: 'deva', mr: 'deva', bn: 'beng', ta: 'taml', ja: 'jpan', zh: 'hans', ko: 'hang', ru: 'cyrl', ar: 'arab', ur: 'arab' };
const G = (s) => s.split(' ').map((x) => x.split('/')); // "glyph/roman"
const LAT = 'A B C E G M R S a e g'.split(' ');
const XTRA = { es: 'Ñ ñ á é í ó ú', fr: 'É è ê ç à ô', de: 'Ä ö ü ß', pt: 'ã õ ç é â', it: 'à è ì ò ù', tr: 'Ç ğ ı İ ö ş ü', vi: 'ă â đ ê ô ơ ư' };
export const setsFor = (lang) => {
  const sc = SCRIPT[lang];
  if (sc === 'latin') return [{ id: 'l', label: 'Letters', items: [...(XTRA[lang] ? XTRA[lang].split(' ') : []), ...LAT].map((c) => [c, '']) }];
  if (sc === 'deva') return [{ id: 'd', label: 'Vowels and consonants', items: G('अ/a आ/ā इ/i ई/ī उ/u ऊ/ū क/ka ख/kha ग/ga च/ca ट/ṭa त/ta न/na प/pa म/ma र/ra स/sa ह/ha' + (lang === 'mr' ? ' ळ/ḷa' : '')) }];
  if (sc === 'beng') return [{ id: 'b', label: 'Letters', items: G('অ/a আ/ā ই/i ঈ/ī উ/u ক/ka খ/kha গ/ga চ/ca ট/ṭa ত/ta ন/na প/pa ম/ma র/ra স/sa হ/ha') }];
  if (sc === 'taml') return [{ id: 't', label: 'Letters', items: G('அ/a ஆ/ā இ/i ஈ/ī உ/u எ/e க/ka ச/ca ட/ṭa த/ta ந/na ப/pa ம/ma ய/ya ர/ra ல/la வ/va ழ/ḻa ள/ḷa') }];
  if (sc === 'jpan') return [{ id: 'h', label: 'Hiragana', items: G('あ/a い/i う/u え/e お/o か/ka き/ki く/ku け/ke こ/ko さ/sa し/shi す/su せ/se そ/so') }, { id: 'k', label: 'Katakana', items: G('ア/a イ/i ウ/u エ/e オ/o カ/ka キ/ki ク/ku ケ/ke コ/ko') }, { id: 'j', label: 'Kanji', items: G('日/sun,day 月/moon 山/mountain 川/river 人/person 大/big 小/small 水/water 火/fire 木/tree') }];
  if (sc === 'hans') return [{ id: 'z', label: 'Characters', items: G('一/yī 二/èr 三/sān 人/rén 大/dà 小/xiǎo 山/shān 水/shuǐ 火/huǒ 木/mù 口/kǒu 日/rì 月/yuè') }];
  if (sc === 'hang') return [{ id: 'j', label: 'Letters (jamo)', items: G('ㄱ/g ㄴ/n ㄷ/d ㄹ/r ㅁ/m ㅂ/b ㅅ/s ㅇ/ng ㅏ/a ㅓ/eo ㅗ/o ㅜ/u ㅡ/eu ㅣ/i') }, { id: 's', label: 'Syllables', items: G('가/ga 나/na 다/da 라/ra 마/ma 바/ba 사/sa 아/a') }];
  if (sc === 'cyrl') return [{ id: 'c', label: 'Letters', items: G('А/a Б/b В/v Г/g Д/d Е/ye Ж/zh З/z И/i К/k Л/l М/m Н/n О/o П/p Р/r С/s Т/t Я/ya Ш/sh') }];
  return lang === 'ur'
    ? [{ id: 'u', label: 'Letters', items: G('ا/alif ب/be پ/pe ت/te ٹ/ṭe ج/jim چ/che د/dal ر/re ز/ze س/sin ش/shin ک/kaf گ/gaf ل/lam م/mim ن/nun و/vao ہ/he ی/ye') }]
    : [{ id: 'a', label: 'Letters', items: G('ا/alif ب/ba ت/ta ث/tha ج/jim ح/ha خ/kha د/dal ر/ra س/sin ش/shin ع/ayn ف/fa ق/qaf ك/kaf ل/lam م/mim ن/nun ه/ha و/waw ي/ya') }];
};
export const WRITE_IDX = [0, 2, 3, 5, 6, 12, 4]; // hello, thank you, please, yes, no, goodbye, sorry
export const writeWords = (lang, known) => {
  const t = phraseSet(lang), k = phraseSet(known);
  const w = WRITE_IDX.map((i) => [t[i], known === lang ? PH_EN[i] : k[i]]);
  return lang === 'en' ? [...w, ['plane', 'airplane'], ['leaf', 'leaf'], ['travel', 'travel']] : w;
};
