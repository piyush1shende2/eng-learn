// A small offline chatbot: keyword rules and follow-up questions. It is not a large language model.
const reflect = (x) => x.replace(/\bmyself\b/gi, 'yourself').replace(/\bmy\b/gi, 'your').replace(/\bme\b/gi, 'you').replace(/\bI am\b/gi, 'you are').replace(/\bI\b/g, 'you').replace(/\bi\b/g, 'you').replace(/\bmine\b/gi, 'yours');
const cap = (x) => x.charAt(0).toUpperCase() + x.slice(1);
const GENERIC = ['Interesting! Can you tell me more?', 'Why do you think so?', 'How does that make you feel?', 'Can you give me an example?', 'What happened next?', 'That sounds nice. What else can you tell me?'];

export const starters = [
  { id: 'intro', label: 'Introduce myself', q: "Let's start with you! What's your name, and where are you from?", sug: ['My name is Ravi and I am from India.', "I'm Ravi. I live in a small town."] },
  { id: 'day', label: 'My day', q: 'Tell me about your day. What did you do this morning?', sug: ['I woke up at six and went to college.', 'I studied English and had breakfast.'] },
  { id: 'hobby', label: 'Hobbies', q: 'What do you like to do in your free time?', sug: ['I like painting and listening to music.', 'I enjoy playing cricket with my friends.'] },
  { id: 'food', label: 'Food', q: "What's your favourite food, and why do you like it?", sug: ['I love pasta because it is tasty.', 'My favourite food is rice with dal.'] },
  { id: 'travel', label: 'Travel', q: 'If you could travel anywhere, where would you go?', sug: ['I would go to the mountains.', 'I would like to visit Japan because it is beautiful.'] },
  { id: 'dream', label: 'Future plans', q: 'What do you want to do in the future?', sug: ['I want to become a teacher.', 'I am going to learn English well.'] },
  { id: 'family', label: 'Family', q: 'Tell me about your family. Who do you live with?', sug: ['I live with my parents and my sister.', 'I have a small family.'] },
];
export const firstMessage = () => ({ id: 'ai0', from: 'ai', text: "Hi! I'm Parrot, your English practice buddy. Don't worry about mistakes. Speak or type anything, and I'll keep the chat going. How are you today?", sug: ['I am fine, thank you. How are you?', "I'm a little tired, but happy."] });

export function reply(text, st) {
  const t = text.trim(), l = t.toLowerCase().replace(/\s+/g, ' '), R = (tx, sug) => ({ t: tx, sug: sug || [] });
  let m;
  if (/\b(bye|goodbye|see you)\b/.test(l)) return R('Goodbye! Press "Show results" to see how you did.', ['Thank you, bye!']);
  if (/\bthank/.test(l)) return R("You're welcome! What would you like to talk about next?", ['Let us talk about my hobbies.', 'Can we talk about food?']);
  if (/how are you/.test(l)) return R("I'm doing great, thanks for asking! What did you do today?", ['I went to college and met my friends.', 'I stayed at home and studied.']);
  if ((m = l.match(/(?:my name is|call me) ([a-z]+)/))) return R(`Nice to meet you, ${cap(m[1])}! Where are you from?`, ['I am from India.', 'I live in a small town.']);
  if (/^(hi|hello|hey|good (morning|afternoon|evening))\b/.test(l) && l.split(' ').length <= 4) return R('Hello! How are you feeling today?', ['I am fine, thank you.', 'I feel a little nervous, but happy.']);
  if (/your name/.test(l)) return R("I'm Parrot, your English practice buddy. What's your name?", ['My name is Ravi.']);
  if ((m = l.match(/^do you (?:like|love|enjoy) (.+?)\??$/))) return R(`I think ${m[1]} sounds fun! What do you like about it?`, ['I like it because it is relaxing.', 'It makes me happy.']);
  if (/^(do you|are you|can you|what|why|how|where|when|who)\b/.test(l)) return R("Good question! I'm only a practice bot, so I'd love to hear your ideas. What do you think?", ['I think it is interesting.', 'I am not sure, but I like it.']);
  if ((m = l.match(/\bi (?:am from|come from|live in|'m from|am living in) ([a-z ]{2,30})/))) return R(`${cap(m[1].trim())} sounds interesting! What do you like most about living there?`, ['I like the people and the food.', 'It is quiet and peaceful.']);
  if ((m = l.match(/\bi (?:really |also )?(?:hate|dislike|don't like|do not like) (.+?)[.!?]*$/))) return R(`What don't you like about ${reflect(m[1])}?`, ['It is difficult for me.', 'It takes too much time.']);
  if ((m = l.match(/\bi (?:really |also )?(?:like|love|enjoy|prefer) (.+?)[.!?]*$/))) return R(`What do you enjoy most about ${reflect(m[1])}?`, ['It makes me feel relaxed.', 'I enjoy it because it is fun.']);
  if (/\b(sad|tired|stressed|worried|bored|angry|upset)\b/.test(l)) return R("I'm sorry to hear that. What would help you feel better?", ['A walk would help me.', 'Talking to a friend helps me.']);
  if (/\b(happy|excited|great|wonderful|glad)\b/.test(l)) return R("That's wonderful! What made you feel that way?", ['I got good news today.', 'I spent time with my friends.']);
  if (/\b(yesterday|last (night|week|weekend|month|year))\b/.test(l)) return R('That sounds interesting! What happened next?', ['Then we went home.', 'After that, I felt very happy.']);
  if (/\b(tomorrow|next (week|month|year)|i will|i am going to|i'm going to|plan to)\b/.test(l)) return R('That sounds like a good plan! Why is it important to you?', ['It is important for my career.', 'I want to improve myself.']);
  if (/\bi (study|work|am a (student|teacher|doctor|engineer))\b/.test(l)) return R('That sounds interesting! What do you enjoy most about it?', ['I enjoy learning new things.', 'I like working with people.']);
  if (l.split(' ').length <= 2) return R('Can you tell me more in a full sentence?', ['I like it because it is fun.', 'Let me explain in more detail.']);
  let r; do r = GENERIC[Math.floor(Math.random() * GENERIC.length)]; while (r === st.last);
  st.last = r; return R(r, ['I think it is a good idea.', 'Let me give you an example.']);
}
