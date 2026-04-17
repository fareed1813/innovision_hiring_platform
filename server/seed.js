/**
 * seed.js — Seed MongoDB with admin users, fluency passages, essay prompts, and question bank
 * Run: node seed.js
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/User.js';
import Question from './models/Question.js';

const FLUENCY_PASSAGES = [
  {
    topic: 'Japan',
    passage: 'Japan is a very famous country for its industry. It is not very big, but it is very busy. The capital is Tokyo. The language is Japanese, and most people know English. Japan has several large cities and these cities are important centers for industry and business. There are large factories for making cars, buses, trains, ships and boats. These products are exported to many countries all over the world. A lot of people prefer to buy the Japanese products because they are not expensive and they serve for a long time.',
    companions: [
      { q: 'What is Japan famous for?', a: 'Japan is famous for its industry and manufacturing.' },
      { q: "What does the word 'exported' mean in the paragraph?", a: 'Exported means goods are sent to other countries for sale.' },
      { q: 'Why do people prefer Japanese products?', a: 'People prefer Japanese products because they are not expensive and last for a long time.' },
      { q: 'Name some things that are made in Japanese factories.', a: 'Cars, buses, trains, ships and boats are made in Japanese factories.' },
      { q: 'What does the paragraph tell you about the size and activity of Japan?', a: 'Japan is not very big in size but it is very busy and industrially active.' }
    ]
  },
  {
    topic: 'Horses',
    passage: 'Horses are beautiful creatures. They can be different colors, and can run quickly. People like to watch horses because they are strong and powerful. Horses are mammals. Horses can live up to 20 or 25 years. Sometimes people can tell how old a horse is by looking at its teeth. They generally sleep standing up, so that if a predator approaches, they can run away quickly. Horses only need about three hours of sleep per day.',
    companions: [
      { q: "What does the word 'predator' mean?", a: 'A predator is an animal that hunts and eats other animals.' },
      { q: 'Why do horses sleep standing up?', a: 'They sleep standing up so they can run away quickly if a predator approaches.' },
      { q: 'How long can horses live?', a: 'Horses can live up to 20 or 25 years.' },
      { q: 'How can people tell the age of a horse?', a: 'People can tell the age of a horse by looking at its teeth.' },
      { q: 'What does the paragraph tell about horses’ sleeping habits?', a: 'Horses sleep standing up and need only about three hours of sleep per day.' }
    ]
  },
  {
    topic: 'Arbor Day',
    passage: 'It’s Arbor Day, and Ali and Asma are planting a tree in their backyard. Their parents are watching TV in the living room, and they don’t know what the children are doing. Kids learned about Arbor Day in school. Their teachers told them trees are important to the environment because they create oxygen and provide a home for birds and other small animals. Now, the kids want to surprise their parents by planting a tree in the middle of the backyard. They hope their parents will be happy.',
    companions: [
      { q: 'What is Arbor Day?', a: 'Arbor Day is a day dedicated to planting and caring for trees.' },
      { q: 'Why are Ali and Asma planting a tree?', a: 'They are planting a tree because they learned trees are important for the environment.' },
      { q: "What does the word 'environment' mean?", a: 'Environment means the natural world around us including air, land, plants and animals.' },
      { q: 'How do trees help birds and animals?', a: 'Trees provide oxygen and give birds and small animals a home.' },
      { q: 'What surprise do the children plan for their parents?', a: 'They plan to surprise their parents by planting a tree in the backyard.' }
    ]
  },
  {
    topic: 'Nile River',
    passage: 'The Nile River is the longest river in the world, flowing through northeastern Africa. It stretches over 6,600 kilometers, from its sources to the Mediterranean Sea. The river has two main tributaries: the White Nile and the Blue Nile. The White Nile begins in East Africa, flowing from Lake Victoria in Uganda. The Blue Nile starts in Ethiopia, carrying vital water and rich soil. These two branches meet in Sudan, continuing their journey north together. For thousands of years, the Nile has been the lifeblood of Egypt, allowing farming in the desert. Ancient Egyptian civilization grew along its banks, building cities and monuments. The river still supports millions of people today for water, food, and transport. Farmers use its waters to grow crops like cotton, wheat, and sugarcane.',
    companions: [
      { q: "What does the word 'tributaries' mean?", a: 'Tributaries are smaller rivers that flow into a larger river.' },
      { q: 'Where do the White Nile and Blue Nile begin?', a: 'The White Nile begins near Lake Victoria in Uganda and the Blue Nile begins in Ethiopia.' },
      { q: "Why is the Nile called the 'lifeblood of Egypt'?", a: 'It is called lifeblood because it provides water and supports farming and life in Egypt.' },
      { q: 'How does the Nile help farmers?', a: 'The Nile provides water and fertile soil for growing crops.' },
      { q: 'What does the paragraph tell about the importance of the Nile River?', a: 'The Nile supports agriculture, transportation, and millions of people living along it.' }
    ]
  }
];

const ESSAY_PROMPTS = [
  { topic: 'The benefits of Travelling', seeds: ['travel', 'culture', 'experience', 'learn', 'country', 'explore', 'adventure', 'knowledge'], mcq: [
      { q: 'What is a common benefit of visiting new countries?', opts: ['Learning new traditions','Avoiding work','Staying indoors'], cor: 'A' },
      { q: 'How does travel usually impact a person\u2019s mindset?', opts: ['Makes them tired','Makes them open-minded','Makes them bored'], cor: 'B' }
  ]},
  { topic: 'How I spend my free time', seeds: ['relax', 'hobby', 'family', 'friends', 'enjoy', 'sports', 'read', 'happy'], mcq: [
      { q: 'Why is spending time with family and friends beneficial?', opts: ['It creates stress','It makes one feel happy and refreshed','It saves money'], cor: 'B' },
      { q: 'How does relaxing after a long day help a person?', opts: ['It helps them relax and recover','It makes them lazy','It increases workload'], cor: 'A' }
  ]},
  { topic: 'How Mobile Phone have changed the world', seeds: ['communication', 'technology', 'internet', 'social', 'connect', 'information', 'fast', 'health'], mcq: [
      { q: 'What is a major change brought by mobile phones?', opts: ['Communication is slower','Communication is faster','No more letters'], cor: 'B' },
      { q: 'Too much use of technology can affect...', opts: ['Our bank account','Our health','Our height'], cor: 'B' }
  ]},
  { topic: 'My future plans', seeds: ['goal', 'education', 'career', 'job', 'study', 'success', 'family', 'work'], mcq: [
      { q: 'What is essential for achieving future goals?', opts: ['Sleeping a lot','Staying focused and studying regularly','Playing games'], cor: 'B' },
      { q: 'A good education can provide...', opts: ['Better job opportunities','Less knowledge','More free time'], cor: 'A' }
  ]},
  { topic: 'The day I will never forget', seeds: ['remember', 'special', 'happy', 'surprise', 'family', 'moment', 'feeling', 'experience'], mcq: [
      { q: 'Unforgettable moments usually make one feel...', opts: ['Sad','Special and happy','Bored'], cor: 'B' },
      { q: 'Special events are often shared with...', opts: ['Strangers','Family and friends','Nobody'], cor: 'B' }
  ]},
  { topic: 'My hobbies', seeds: ['enjoy', 'hobby', 'reading', 'sports', 'painting', 'music', 'relax', 'time'], mcq: [
      { q: 'Hobbies help people to...', opts: ['Be more stressed','Relax and enjoy activities','Waste time'], cor: 'B' },
      { q: 'Common hobbies include...', opts: ['Working late','Reading, sports, or painting','Sleeping in traffic'], cor: 'B' }
  ]},
  { topic: 'The importance of saving money', seeds: ['save', 'money', 'future', 'emergency', 'plan', 'budget', 'bank', 'spend'], mcq: [
      { q: 'Why is saving money important?', opts: ['To spend it all today','For financial planning and emergencies','To show off to others'], cor: 'B' },
      { q: 'Planning for the future involves...', opts: ['Ignoring expenses','Saving for emergencies','Buying expensive cars'], cor: 'B' }
  ]},
  { topic: 'The importance of being honest', seeds: ['honest', 'trust', 'truth', 'respect', 'integrity', 'character', 'loyal', 'believe'], mcq: [
      { q: 'What is a key value in character building?', opts: ['Lying','Honesty and integrity','Rudeness'], cor: 'B' },
      { q: 'Trust is built through...', opts: ['Tricking people','Being honest and truthful','Keeping secrets'], cor: 'B' }
  ]},
  { topic: 'My dream vacation destination', seeds: ['travel', 'vacation', 'destination', 'beach', 'culture', 'explore', 'food', 'adventure'], mcq: [
      { q: 'Dream vacations often include...', opts: ['Difficult work','Adventure and new cultures','Staying at the office'], cor: 'B' },
      { q: 'What is a great way to learn about new food and lifestyles?', opts: ['Watching TV only','Traveling to new places','Reading the news'], cor: 'B' }
  ]},
  { topic: 'My number one goal in life and why I chose it', seeds: ['goal', 'ambition', 'purpose', 'achieve', 'success', 'dream', 'focus', 'effort'], mcq: [
      { q: 'What drives a person to achieve their goals?', opts: ['Having no plan','Purpose and ambition','Luck alone'], cor: 'B' },
      { q: 'Setting priorities helps in...', opts: ['Losing focus','Achieving success and achievement','Becoming lazy'], cor: 'B' }
  ]}
];

const GRAMMAR_MCQS = [
  { q: "How ___ you?", o: ["are", "good evening", "doing"], cor: "A" },
  { q: "Do ___ like cricket?", o: ["always", "also", "you"], cor: "C" },
  { q: "Our training was completed ___ time.", o: ["on", "with", "at"], cor: "A" },
  { q: "You should not ___ mistakes.", o: ["make", "made", "making"], cor: "A" },
  { q: "I ___ reading the book.", o: ["too much", "enjoyed", "don't"], cor: "B" },
  { q: "He is my ___.", o: ["daughter", "sister", "son"], cor: "C" },
  { q: "We are ___ of waiting.", o: ["tried", "tired", "trying"], cor: "B" },
  { q: "I am ___ for my English test.", o: ["studied", "studying", "read"], cor: "B" },
  { q: "I want to be successful ___ life.", o: ["on", "over", "in"], cor: "C" },
  { q: "I have something ___.", o: ["to say", "bring", "talk"], cor: "A" },
  { q: "I love eating ___.", o: ["dessert", "desert", "deceit"], cor: "A" },
  { q: "___ mobile phone is this?", o: ["Which", "Whose", "What"], cor: "B" },
  { q: "You received my birthday gift. ___", o: ["Have not you?", "True or not?", "Didn't you?"], cor: "C" },
  { q: "Virat Kohli is considered one of the most famous batsmen. ___", o: ["Yes, he is.", "Yes, is.", "Yes, is he!"], cor: "A" },
  { q: "___ the better team, we lost the match.", o: ["Although being", "Despite of being", "Despite"], cor: "C" },
  { q: "The best way to learn English is ___", o: ["in speaking", "to speaking", "by speaking"], cor: "C" },
  { q: "If only I ___ richer.", o: ["were", "can", "should"], cor: "A" },
  { q: "You aren't allowed to use your phone, so ___", o: ["It's no point in leaving it on.", "There's no point in leaving it on.", "There's no point to leaving it on."], cor: "B" },
  { q: "My favourite colours ___", o: ["are blue, green and purple.", "is blue green and purple.", "blue-green and purple."], cor: "A" },
  { q: "Perhaps Elizabeth ___ pass the exam.", o: ["may", "can", "will"], cor: "A" },
  { q: "I ___ breakfast this morning.", o: ["hadt", "didnt have", "havent"], cor: "B" },
  { q: "I ___ see a doctor ___ I felt sick.", o: ["had to, because", "have to, because", "has to, because"], cor: "A" },
  { q: "___ you mind if I didn't come?", o: ["Could", "Would", "Will"], cor: "B" },
  { q: "It ___ cats and dogs.", o: ["rain", "ruined", "rained"], cor: "C" },
  { q: "We arrived ___ Dubai.", o: ["to", "in", "at"], cor: "B" },
  { q: "Can I borrow ___ money? How ___ do you need?", o: ["some, many", "any, much", "some, much"], cor: "C" },
  { q: "I would rather Friday ___ Saturday.", o: ["than", "or", "not"], cor: "A" },
  { q: "He plays football ___.", o: ["skilful", "skilfully", "skilled"], cor: "B" },
  { q: "Is Usaama ___ Andrew?", o: ["taller that", "as tall as", "more tall than"], cor: "B" },
  { q: "She looks ___ she's going to be sick.", o: ["as if", "like if", "if"], cor: "A" },
  { q: "Your phone ___ while you were away.", o: ["ring", "rang", "reign"], cor: "B" },
  { q: "She ___ me to go to school.", o: ["said", "suggested", "told"], cor: "C" },
  { q: "I bought a bunch of ___.", o: ["roses", "bananas", "sweets"], cor: "A" },
  { q: "Where is the ___ accommodation?", o: ["most", "most farthest", "nearest"], cor: "C" },
  { q: "I don't like coffee. ___ do I.", o: ["So", "Neither", "Either"], cor: "B" },
  { q: "He had come ___ the money.", o: ["on", "by", "at"], cor: "B" },
  { q: "You ___ the cleaning.", o: ["needn't have done", "wouldn't have done", "couldn't have done"], cor: "A" },
  { q: "___ requires resilience.", o: ["Friendship", "Sleeping", "Eating"], cor: "A" },
  { q: "I ___ her all my life.", o: ["known", "have been knowing", "have known"], cor: "C" },
  { q: "I went to the barber for ___.", o: ["haircutting", "a haircut", "hair making"], cor: "B" },
  { q: "The laptop belongs to my uncle. So, it is ___.", o: ["my uncles laptop", "my uncle's laptop", "my uncles' laptop"], cor: "B" },
  { q: "Nurses ___ ill people and gardeners ___ flowers and plants.", o: ["look after, cultivate", "look at, cultivate", "look in, cultivate"], cor: "A" },
  { q: "Without her glasses, she is as blind as ___.", o: ["a bat", "darkness", "a beggar"], cor: "A" },
  { q: "You ___ play in the middle of the road.", o: ["ought not to", "dont ever", "can never"], cor: "A" },
  { q: "I wish to ___ the older version.", o: ["revert back", "respond", "revert to"], cor: "C" },
  { q: "His sister is the one ___ to him in the photo.", o: ["standing", "stood", "adjacent"], cor: "A" },
  { q: "Can I take ___ to read?", o: ["it home", "it to home", "for home"], cor: "A" },
  { q: "The doctor gave me a ___.", o: ["receipt", "prescription", "dose"], cor: "B" },
  { q: "___ Arabic food?", o: ["Have you ever ate", "Have you ever eaten", "Have you eaten ever"], cor: "B" },
  { q: "I am ___ not coming for duty next week.", o: ["possibly", "definitely", "probably"], cor: "B" },
  { q: "I will be among the ___ to this Friday’s movie premiere.", o: ["spectators", "crowd", "audience"], cor: "A" },
  { q: "You shouldn’t count your ___ before they are hatched.", o: ["chickens", "ducks", "eggs"], cor: "C" },
  { q: "If I had a million dollars, I ___.", o: ["will buy a luxury car", "would buy a luxury car", "bought a luxury car"], cor: "B" },
  { q: "Hi – Long time no see! ___", o: ["I havent seen you in 10 years! What have you been up to?", "I havent seen you since last 10 years! Where did you go to?", "I didnt see you for 10 years! What have you been up to?"], cor: "A" },
  { q: "No sooner had the accident happened ___ the ___ gathered.", o: ["that, audience", "then, people", "than, crowd"], cor: "C" },
  { q: "He decided that he ___.", o: ["ought not to", "neednt", "didnt have to"], cor: "C" },
  { q: "The supervisor gave you a coupon ___?", o: ["hadnt he", "hasnt he", "didnt he"], cor: "C" },
  { q: "While I ___ to work, I ___ an old friend.", o: ["walked, bumped into", "walked, was bumping into", "was walking, bumped into"], cor: "C" },
  { q: "You have made a lot of ___.", o: ["mistakes", "wrongs", "faults"], cor: "A" },
  { q: "If I could travel anywhere, I ___ America.", o: ["will travel", "would travel", "would prefer"], cor: "B" },
  { q: "managing your ___ settings", o: ["security", "privacy", "publicity", "social"], cor: "B" },
  { q: "keep your personal information ___", o: ["secure", "unlocked", "secular", "authenticated"], cor: "A" },
  { q: "___ may try to trick you", o: ["Scammers", "People", "Influencers", "Followers"], cor: "A" },
  { q: "fake news can spread ___", o: ["truthfulness", "misinformation", "positivity", "too much"], cor: "B" },
  { q: "important to ___ sources", o: ["disprove", "debunk", "verify", "read"], cor: "C" },
  { q: "use ___ tools", o: ["contradictory", "profile-checking", "file-making", "fact-checking"], cor: "D" },
  { q: "have an ___ on mental health", o: ["eject", "elimination", "fun-fact", "impact"], cor: "D" },
  { q: "lead to stress and ___", o: ["happiness", "worry", "anxiety", "eagerness"], cor: "C" },
  { q: "feelings of ___", o: ["adequacy", "inadequacy", "competency", "sufficiency"], cor: "B" },
  { q: "focus on ___ connections", o: ["authentic", "falsify", "ignoring", "telepathic"], cor: "A" }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ Connected to MongoDB');

    // ── Seed Admin Users ──
    await User.deleteMany({});
    const admins = [
      { username: 'admin', password: 'innovision2024', displayName: 'Admin', role: 'Super Admin' },
      { username: 'hr_manager', password: 'uaehiring', displayName: 'HR Manager', role: 'HR Manager' },
      { username: 'recruiter', password: 'recruit123', displayName: 'Recruiter', role: 'Recruiter' }
    ];
    for (const a of admins) {
      await User.create(a);
    }
    console.log(`✓ Seeded ${admins.length} admin users`);

    // ── Seed Questions ──
    await Question.deleteMany({});
    const questions = [];

    // Fluency passages (shared across roles that use fluency)
    FLUENCY_PASSAGES.forEach((fp, i) => {
      questions.push({
        qid: `fluency_${i + 1}`,
        role: '_shared',
        type: 'fluency',
        passage: fp.passage,
        question: 'Please read the above passage aloud clearly.',
        companions: fp.companions
      });
    });

    // Essay prompts (shared)
    ESSAY_PROMPTS.forEach((ep, i) => {
      questions.push({
        qid: `essay_${i + 1}`,
        role: '_shared',
        type: 'essay',
        passage: ep.topic,
        question: `Write an essay about: ${ep.topic}`,
        // Follow-ups as situational MCQs
        followUps: ep.mcq.map(m => ({ q: m.q, a: m.opts[m.cor.charCodeAt(0) - 65] })), // For legacy situational model
        seeds: ep.seeds,
        // The specific MCQs for Security
        topicMCQs: ep.mcq.map((m, mi) => ({
          qid: `essay_${i + 1}_mcq_${mi + 1}`,
          question: m.q,
          options: m.opts.map((o, oi) => ({ key: String.fromCharCode(65 + oi), text: o })),
          expectedOption: m.cor
        }))
      });
    });

    // Grammar MCQs (shared)
    GRAMMAR_MCQS.forEach((m, i) => {
      questions.push({
        qid: `grammar_mcq_${i + 1}`,
        role: '_shared',
        type: 'mcq',
        question: m.q,
        options: m.o.map((text, index) => ({ key: String.fromCharCode(65 + index), text })),
        expectedOption: m.cor
      });
    });

    await Question.insertMany(questions);
    console.log(`✓ Seeded ${questions.length} questions`);

    console.log('\n✓ Seed complete!');
    process.exit(0);
  } catch (err) {
    console.error('✗ Seed failed:', err);
    process.exit(1);
  }
}

seed();
