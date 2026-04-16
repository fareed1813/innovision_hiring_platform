/**
 * data.js — Innovision Overseas UAE Hiring Platform
 * Static data: roles, question banks, admin credentials
 * v1.0.0 | © 2024 Innovision Overseas Pvt. Ltd.
 */

'use strict';

const ADMINS = {
  'admin':      { password: 'innovision2024', role: 'Super Admin',  display: 'Admin' },
  'hr_manager': { password: 'uaehiring',      role: 'HR Manager',   display: 'HR Manager' },
  'recruiter':  { password: 'recruit123',     role: 'Recruiter',    display: 'Recruiter' }
};

const ROLES = {
  driver: {
    label: 'Taxi Driver',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="role-icon"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-1.1 0-2 .9-2 2v7c0 1.1.9 2 2 2h2m12 0c0 1.1-.9 2-2 2s-2-.9-2-2m-8 0c0 1.1-.9 2-2 2s-2-.9-2-2m14-8V9c0-1.1-.9-2-2-2h-3l-4-4H5c-1.1 0-2 .9-2 2v2"></path></svg>`,
    desc: 'Taxi/driver role for UAE deployments. Valid UAE driving licence and safe driving practices required.'
  },
  security: {
    label: 'Special Security Guard',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="role-icon"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>`,
    desc: 'Armed/unarmed security for high-security facilities, malls, and corporate premises in Dubai & Abu Dhabi.'
  },
  housekeeping: {
    label: 'Housekeeping Staff',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="role-icon"><path d="M12 3V2M12 21v-2M21 12h-2M3 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4l1.4-1.4M17 7l1.4-1.4"/></svg>`,
    desc: 'Hotel, hospital & facility cleaning staff for 3★–5★ hospitality clients in UAE.'
  },
  supervisor: {
    label: 'Field Supervisor',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="role-icon"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><circle cx="19" cy="11" r="3"/></svg>`,
    desc: 'On-ground team lead for facility management or construction site supervision across UAE projects.'
  },
  helper: {
    label: 'General Helper',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="role-icon"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`,
    desc: 'Multi-skilled helper for construction, warehouse, or facility maintenance roles across UAE.'
  }
};

const ROLE_THEME_HEX = {
  driver: '#f59e0b',       // Amber Yellow
  security: '#2563eb',     // Royal Blue
  housekeeping: '#10b981', // Emerald Green
  supervisor: '#7c3aed',   // Vivid Violet
  helper: '#f97316'        // Bold Orange
};

function getRoleThemeHex(jobKey) {
  return ROLE_THEME_HEX[jobKey] || '#991b1b';
}

const FLUENCY_PASSAGES_DATA = [
  {
    passage: 'I live in a busy city where life moves very fast. Every morning, people go to their offices, schools, and shops. There is a lot of traffic on the roads, which sometimes makes travel difficult. However, the city also has many facilities like hospitals, parks, and shopping malls. I enjoy living here because everything is easily available.',
    companions: [
      { q: 'Why does the person enjoy living in the busy city?', a: 'They enjoy it because everything (facilities like hospitals and shops) is easily available.' },
      { q: 'What kinds of facilities does the city have?', a: 'The city has hospitals, parks, and shopping malls.' },
      { q: 'Why is travel sometimes difficult in the city?', a: 'Travel is difficult because there is a lot of traffic on the roads.' }
    ]
  },
  {
    passage: 'In my free time, I like to watch movies and listen to music. It helps me relax after a long day. Sometimes, I also spend time with my friends and family. We talk, eat together, and share our experiences. These moments make me feel happy and refreshed.',
    companions: [
      { q: 'How does the person like to spend time with friends and family?', a: 'They talk, eat together, and share experiences.' },
      { q: 'What does the person do in their free time to relax?', a: 'They watch movies and listen to music to relax.' },
      { q: 'How do the moments with friends and family make the person feel?', a: 'They make the person feel happy and refreshed.' }
    ]
  },
  {
    passage: 'Education is very important in everyone\u2019s life. It helps people gain knowledge and improve their skills. A good education can provide better job opportunities in the future. Students should study regularly and stay focused on their goals to achieve success.',
    companions: [
      { q: 'How can a good education help people in the future?', a: 'A good education can provide better job opportunities.' },
      { q: 'What should students do to achieve success according to the passage?', a: 'Students should study regularly and stay focused on their goals.' },
      { q: 'What are two benefits of education mentioned in the passage?', a: 'Education helps people gain knowledge and improve their skills.' }
    ]
  },
  {
    passage: 'Technology has changed our lives in many ways. Today, people use smartphones and the internet for communication, work, and entertainment. It has made life easier and faster. However, too much use of technology can also affect our health, so we should use it wisely.',
    companions: [
      { q: 'What are some ways people use smartphones and the internet today?', a: 'Communication, work, and entertainment.' },
      { q: 'How has technology affected our daily life?', a: 'Technology has made life easier and faster.' },
      { q: 'What warning does the passage give about technology?', a: 'Too much use of technology can affect our health, so we should use it wisely.' }
    ]
  },
  {
    passage: 'Traveling is a great way to learn about new places and cultures. When people visit different cities or countries, they can see new traditions, food, and lifestyles. It also helps to relax the mind and take a break from daily routine. I believe traveling makes people more open-minded and gives them valuable experiences.',
    companions: [
      { q: 'According to the passage, how does traveling affect people\'s mindset?', a: 'It makes them more open-minded and gives them valuable experiences.' },
      { q: 'What can people discover when they visit different cities or countries?', a: 'They can discover new traditions, food, and lifestyles.' },
      { q: 'How does traveling help a person\'s mind?', a: 'It helps relax the mind and provides a break from daily routine.' }
    ]
  }
];

function getRandomFluencyQs() {
  const data = FLUENCY_PASSAGES_DATA[Math.floor(Math.random() * FLUENCY_PASSAGES_DATA.length)];
  // Returns: 1 Fluency read-aloud + 3 Reading comprehension questions from the same passage
  return [
    {
      id: 'fluency_readaloud',
      type: 'fluency',
      passage: data.passage,
      question: 'Please read the above passage aloud clearly.',
      expectedAnswer: data.passage
    },
    ...data.companions.map((c, i) => ({
      id: 'fluency_companion_' + (i + 1),
      type: 'reading',
      passage: data.passage,
      question: c.q,
      expectedAnswer: c.a
    }))
  ];
}

const ESSAY_PROMPTS_DATA = [
  { topic: 'The benefits of Travelling', seeds: ['visit', 'country', 'learn', 'culture', 'relax', 'experience'], followUps: [
    { q: "What was the most interesting place you've ever traveled to, and what did you learn there?", a: "Personal experience about travel and learning." },
    { q: "How does traveling to foreign countries help people become more open-minded?", a: "It exposes people to different cultures, ideas, and traditions." }
  ]},
  { topic: 'How I spend my free time', seeds: ['watching', 'music', 'family', 'friends', 'relax', 'happy'], followUps: [
    { q: "Can you describe a specific activity from your free time that helps you reduce stress?", a: "Personal activity used for unwinding and lowering stress." },
    { q: "In what ways does your free time activity make you a more productive person at work?", a: "Resting helps recharge the mind and brings better focus to work." }
  ]},
  { topic: 'How Mobile Phone have changed the world', seeds: ['technology', 'communication', 'internet', 'smartphones', 'faster', 'lifestyle'], followUps: [
    { q: "What is one negative effect of relying too much on mobile phones, and how can we prevent it?", a: "Addiction or eye strain. Prevented by setting screen time limits." },
    { q: "How can mobile phones be used effectively for learning and skill development?", a: "Watching educational videos, reading online, and using learning apps." }
  ]},
  { topic: 'My future plans', seeds: ['career', 'education', 'goals', 'success', 'work', 'study'], followUps: [
    { q: "What are the biggest challenges you might face in achieving your future plans, and how will you overcome them?", a: "Financial or educational challenges, overcome by hard work." },
    { q: "Where do you see yourself professionally in the next five years?", a: "Personal goals for career advancement and stability." }
  ]},
  { topic: 'The day I will never forget', seeds: ['memorable', 'special', 'event', 'family', 'friends', 'moment'], followUps: [
    { q: "Looking back on that unforgettable day, what is the most important lesson you learned from it?", a: "Personal lesson learned from the memorable event." },
    { q: "How has that specific day changed the way you view your life now?", a: "Changed perspective or appreciation for life." }
  ]},
  { topic: 'My hobbies', seeds: ['interest', 'enjoy', 'activities', 'painting', 'sports', 'reading'], followUps: [
    { q: "How did you first get interested in your favorite hobby?", a: "Personal story of discovering their hobby." },
    { q: "Do you think your hobby could be turned into a professional career? Why or why not?", a: "Discussion on whether hobbies can become a source of income." }
  ]},
  { topic: 'The importance of saving money', seeds: ['financial', 'future', 'bank', 'planning', 'spend', 'emergency'], followUps: [
    { q: "What are some effective strategies you use personally to save money every month?", a: "Budgeting, avoiding unnecessary spending, using a bank." },
    { q: "How can a sudden emergency affect your life if you do not have any savings?", a: "It can lead to debt, stress, and inability to manage the crisis." }
  ]},
  { topic: 'The importance of being honest', seeds: ['truth', 'integrity', 'trust', 'value', 'morals', 'character'], followUps: [
    { q: "Can you give an example of a time when being honest was difficult but necessary?", a: "Personal example of difficult honesty." },
    { q: "How does honesty help in building a strong working relationship with your supervisor?", a: "It builds trust, transparency, and reliable communication." }
  ]},
  { topic: 'My dream vacation destination', seeds: ['travel', 'visit', 'country', 'beach', 'mountains', 'adventure'], followUps: [
    { q: "What specific attractions or activities make this destination your absolute dream vacation?", a: "Personal preference for activities or sights at the destination." },
    { q: "If you could take one person with you on this dream vacation, who would it be and why?", a: "Personal choice of travel companion." }
  ]},
  { topic: 'My number one goal in life and why I chose it', seeds: ['ambition', 'purpose', 'dreams', 'priority', 'achievement', 'motive'], followUps: [
    { q: "What specific steps are you currently taking to move closer to your number one goal?", a: "Personal planning, education, or hard work towards the goal." },
    { q: "Who has been your biggest inspiration in setting and pursuing this goal?", a: "Personal inspiration, such as family, a teacher, or a role model." }
  ]}
];

function getRandomEssay() {
  const data = ESSAY_PROMPTS_DATA[Math.floor(Math.random() * ESSAY_PROMPTS_DATA.length)];
  return {
    id: 'essay_' + Math.floor(Math.random() * 1000),
    type: 'essay',
    passage: `TOPIC: ${data.topic}`,
    question: `Write a short essay (minimum 100 words) discussing the topic above.`,
    expectedKeywords: data.seeds
  };
}

function getRandomEssayBlock() {
  const data = ESSAY_PROMPTS_DATA[Math.floor(Math.random() * ESSAY_PROMPTS_DATA.length)];
  const essayId = 'essay_' + Math.floor(Math.random() * 1000);
  const essay = {
    id: essayId,
    type: 'essay',
    passage: `TOPIC: ${data.topic}`,
    question: `Write a short essay (minimum 100 words) discussing the topic above.`,
    expectedKeywords: data.seeds
  };

  const followUps = (data.followUps || []).map((fu, i) => ({
    id: essayId + '_fu_' + (i + 1),
    type: 'situational',
    passage: `TOPIC: ${data.topic} (Follow-up)`,
    question: fu.q,
    expectedAnswer: fu.a
  }));

  return [essay, ...followUps];
}

let QB = {
  driver: [
    // Paragraph 1 – Japan
    {
      id: 'dr_p1_q1', type: 'reading',
      passage: `Japan is a very famous country for its industry. It is not very big, but it is very busy. \nThe capital is Tokyo. The language is Japanese, and most people know English. \nJapan has several large cities and these cities are important centers for industry and business. \nThere are large factories for making cars, buses, trains, ships and boats. \nThese products are exported to many countries all over the world. \nA lot of people prefer to buy the Japanese products because they are not expensive and they serve for a long time.`,
      question: 'What is Japan famous for?',
      expectedAnswer: 'Japan is famous for its industry and manufacturing.'
    },
    {
      id: 'dr_p1_q2', type: 'reading',
      passage: `Japan is a very famous country for its industry. It is not very big, but it is very busy. \nThe capital is Tokyo. The language is Japanese, and most people know English. \nJapan has several large cities and these cities are important centers for industry and business. \nThere are large factories for making cars, buses, trains, ships and boats. \nThese products are exported to many countries all over the world. \nA lot of people prefer to buy the Japanese products because they are not expensive and they serve for a long time.`,
      question: "What does the word 'exported' mean in the paragraph?",
      expectedAnswer: 'Exported means goods are sent to other countries for sale.'
    },
    {
      id: 'dr_p1_q3', type: 'reading',
      passage: `Japan is a very famous country for its industry. It is not very big, but it is very busy. \nThe capital is Tokyo. The language is Japanese, and most people know English. \nJapan has several large cities and these cities are important centers for industry and business. \nThere are large factories for making cars, buses, trains, ships and boats. \nThese products are exported to many countries all over the world. \nA lot of people prefer to buy the Japanese products because they are not expensive and they serve for a long time.`,
      question: 'Why do people prefer Japanese products?',
      expectedAnswer: 'People prefer Japanese products because they are not expensive and last for a long time.'
    },
    {
      id: 'dr_p1_q4', type: 'reading',
      passage: `Japan is a very famous country for its industry. It is not very big, but it is very busy. \nThe capital is Tokyo. The language is Japanese, and most people know English. \nJapan has several large cities and these cities are important centers for industry and business. \nThere are large factories for making cars, buses, trains, ships and boats. \nThese products are exported to many countries all over the world. \nA lot of people prefer to buy the Japanese products because they are not expensive and they serve for a long time.`,
      question: 'Name some things that are made in Japanese factories.',
      expectedAnswer: 'Cars, buses, trains, ships and boats are made in Japanese factories.'
    },
    {
      id: 'dr_p1_q5', type: 'reading',
      passage: `Japan is a very famous country for its industry. It is not very big, but it is very busy. \nThe capital is Tokyo. The language is Japanese, and most people know English. \nJapan has several large cities and these cities are important centers for industry and business. \nThere are large factories for making cars, buses, trains, ships and boats. \nThese products are exported to many countries all over the world. \nA lot of people prefer to buy the Japanese products because they are not expensive and they serve for a long time.`,
      question: 'What does the paragraph tell you about the size and activity of Japan?',
      expectedAnswer: 'Japan is not very big in size but it is very busy and industrially active.'
    },
    // Paragraph 2 – Horses
    {
      id: 'dr_p2_q1', type: 'reading',
      passage: `Horses are beautiful creatures. They can be different colors, and can run quickly. \nPeople like to watch horses because they are strong and powerful. \nHorses are mammals. Horses can live up to 20 or 25 years. \nSometimes people can tell how old a horse is by looking at its teeth. \nThey generally sleep standing up, so that if a predator approaches, they can run away quickly. \nHorses only need about three hours of sleep per day.`,
      question: "What does the word 'predator' mean?",
      expectedAnswer: 'A predator is an animal that hunts and eats other animals.'
    },
    {
      id: 'dr_p2_q2', type: 'reading',
      passage: `Horses are beautiful creatures. They can be different colors, and can run quickly. \nPeople like to watch horses because they are strong and powerful. \nHorses are mammals. Horses can live up to 20 or 25 years. \nSometimes people can tell how old a horse is by looking at its teeth. \nThey generally sleep standing up, so that if a predator approaches, they can run away quickly. \nHorses only need about three hours of sleep per day.`,
      question: 'Why do horses sleep standing up?',
      expectedAnswer: 'They sleep standing up so they can run away quickly if a predator approaches.'
    },
    {
      id: 'dr_p2_q3', type: 'reading',
      passage: `Horses are beautiful creatures. They can be different colors, and can run quickly. \nPeople like to watch horses because they are strong and powerful. \nHorses are mammals. Horses can live up to 20 or 25 years. \nSometimes people can tell how old a horse is by looking at its teeth. \nThey generally sleep standing up, so that if a predator approaches, they can run away quickly. \nHorses only need about three hours of sleep per day.`,
      question: 'How long can horses live?',
      expectedAnswer: 'Horses can live up to 20 or 25 years.'
    },
    {
      id: 'dr_p2_q4', type: 'reading',
      passage: `Horses are beautiful creatures. They can be different colors, and can run quickly. \nPeople like to watch horses because they are strong and powerful. \nHorses are mammals. Horses can live up to 20 or 25 years. \nSometimes people can tell how old a horse is by looking at its teeth. \nThey generally sleep standing up, so that if a predator approaches, they can run away quickly. \nHorses only need about three hours of sleep per day.`,
      question: 'How can people tell the age of a horse?',
      expectedAnswer: 'People can tell the age of a horse by looking at its teeth.'
    },
    {
      id: 'dr_p2_q5', type: 'reading',
      passage: `Horses are beautiful creatures. They can be different colors, and can run quickly. \nPeople like to watch horses because they are strong and powerful. \nHorses are mammals. Horses can live up to 20 or 25 years. \nSometimes people can tell how old a horse is by looking at its teeth. \nThey generally sleep standing up, so that if a predator approaches, they can run away quickly. \nHorses only need about three hours of sleep per day.`,
      question: 'What does the paragraph tell about horses’ sleeping habits?',
      expectedAnswer: 'Horses sleep standing up and need only about three hours of sleep per day.'
    },
    // Paragraph 3 – Arbor Day
    {
      id: 'dr_p3_q1', type: 'reading',
      passage: `It’s Arbor Day, and Ali and Asma are planting a tree in their backyard. \nTheir parents are watching TV in the living room, and they don’t know what the children are doing. \nKids learned about Arbor Day in school. Their teachers told them trees are important to the environment \nbecause they create oxygen and provide a home for birds and other small animals. \nNow, the kids want to surprise their parents by planting a tree in the middle of the backyard. \nThey hope their parents will be happy.`,
      question: 'What is Arbor Day?',
      expectedAnswer: 'Arbor Day is a day dedicated to planting and caring for trees.'
    },
    {
      id: 'dr_p3_q2', type: 'reading',
      passage: `It’s Arbor Day, and Ali and Asma are planting a tree in their backyard. \nTheir parents are watching TV in the living room, and they don’t know what the children are doing. \nKids learned about Arbor Day in school. Their teachers told them trees are important to the environment \nbecause they create oxygen and provide a home for birds and other small animals. \nNow, the kids want to surprise their parents by planting a tree in the middle of the backyard. \nThey hope their parents will be happy.`,
      question: 'Why are Ali and Asma planting a tree?',
      expectedAnswer: 'They are planting a tree because they learned trees are important for the environment.'
    },
    {
      id: 'dr_p3_q3', type: 'reading',
      passage: `It’s Arbor Day, and Ali and Asma are planting a tree in their backyard. \nTheir parents are watching TV in the living room, and they don’t know what the children are doing. \nKids learned about Arbor Day in school. Their teachers told them trees are important to the environment \nbecause they create oxygen and provide a home for birds and other small animals. \nNow, the kids want to surprise their parents by planting a tree in the middle of the backyard. \nThey hope their parents will be happy.`,
      question: "What does the word 'environment' mean?",
      expectedAnswer: 'Environment means the natural world around us including air, land, plants and animals.'
    },
    {
      id: 'dr_p3_q4', type: 'reading',
      passage: `It’s Arbor Day, and Ali and Asma are planting a tree in their backyard. \nTheir parents are watching TV in the living room, and they don’t know what the children are doing. \nKids learned about Arbor Day in school. Their teachers told them trees are important to the environment \nbecause they create oxygen and provide a home for birds and other small animals. \nNow, the kids want to surprise their parents by planting a tree in the middle of the backyard. \nThey hope their parents will be happy.`,
      question: 'How do trees help birds and animals?',
      expectedAnswer: 'Trees provide oxygen and give birds and small animals a home.'
    },
    {
      id: 'dr_p3_q5', type: 'reading',
      passage: `It’s Arbor Day, and Ali and Asma are planting a tree in their backyard. \nTheir parents are watching TV in the living room, and they don’t know what the children are doing. \nKids learned about Arbor Day in school. Their teachers told them trees are important to the environment \nbecause they create oxygen and provide a home for birds and other small animals. \nNow, the kids want to surprise their parents by planting a tree in the middle of the backyard. \nThey hope their parents will be happy.`,
      question: 'What surprise do the children plan for their parents?',
      expectedAnswer: 'They plan to surprise their parents by planting a tree in the backyard.'
    },
    // Paragraph 4 – Nile River
    {
      id: 'dr_p4_q1', type: 'reading',
      passage: `The Nile River is the longest river in the world, flowing through northeastern Africa. \nIt stretches over 6,600 kilometers, from its sources to the Mediterranean Sea. \nThe river has two main tributaries: the White Nile and the Blue Nile. \nThe White Nile begins in East Africa, flowing from Lake Victoria in Uganda. \nThe Blue Nile starts in Ethiopia, carrying vital water and rich soil. \nThese two branches meet in Sudan, continuing their journey north together. \nFor thousands of years, the Nile has been the lifeblood of Egypt, allowing farming in the desert. \nAncient Egyptian civilization grew along its banks, building cities and monuments. \nThe river still supports millions of people today for water, food, and transport. \nFarmers use its waters to grow crops like cotton, wheat, and sugarcane.`,
      question: "What does the word 'tributaries' mean?",
      expectedAnswer: 'Tributaries are smaller rivers that flow into a larger river.'
    },
    {
      id: 'dr_p4_q2', type: 'reading',
      passage: `The Nile River is the longest river in the world, flowing through northeastern Africa. \nIt stretches over 6,600 kilometers, from its sources to the Mediterranean Sea. \nThe river has two main tributaries: the White Nile and the Blue Nile. \nThe White Nile begins in East Africa, flowing from Lake Victoria in Uganda. \nThe Blue Nile starts in Ethiopia, carrying vital water and rich soil. \nThese two branches meet in Sudan, continuing their journey north together. \nFor thousands of years, the Nile has been the lifeblood of Egypt, allowing farming in the desert. \nAncient Egyptian civilization grew along its banks, building cities and monuments. \nThe river still supports millions of people today for water, food, and transport. \nFarmers use its waters to grow crops like cotton, wheat, and sugarcane.`,
      question: 'Where do the White Nile and Blue Nile begin?',
      expectedAnswer: 'The White Nile begins near Lake Victoria in Uganda and the Blue Nile begins in Ethiopia.'
    },
    {
      id: 'dr_p4_q3', type: 'reading',
      passage: `The Nile River is the longest river in the world, flowing through northeastern Africa. \nIt stretches over 6,600 kilometers, from its sources to the Mediterranean Sea. \nThe river has two main tributaries: the White Nile and the Blue Nile. \nThe White Nile begins in East Africa, flowing from Lake Victoria in Uganda. \nThe Blue Nile starts in Ethiopia, carrying vital water and rich soil. \nThese two branches meet in Sudan, continuing their journey north together. \nFor thousands of years, the Nile has been the lifeblood of Egypt, allowing farming in the desert. \nAncient Egyptian civilization grew along its banks, building cities and monuments. \nThe river still supports millions of people today for water, food, and transport. \nFarmers use its waters to grow crops like cotton, wheat, and sugarcane.`,
      question: "Why is the Nile called the 'lifeblood of Egypt'?",
      expectedAnswer: 'It is called lifeblood because it provides water and supports farming and life in Egypt.'
    },
    {
      id: 'dr_p4_q4', type: 'reading',
      passage: `The Nile River is the longest river in the world, flowing through northeastern Africa. \nIt stretches over 6,600 kilometers, from its sources to the Mediterranean Sea. \nThe river has two main tributaries: the White Nile and the Blue Nile. \nThe White Nile begins in East Africa, flowing from Lake Victoria in Uganda. \nThe Blue Nile starts in Ethiopia, carrying vital water and rich soil. \nThese two branches meet in Sudan, continuing their journey north together. \nFor thousands of years, the Nile has been the lifeblood of Egypt, allowing farming in the desert. \nAncient Egyptian civilization grew along its banks, building cities and monuments. \nThe river still supports millions of people today for water, food, and transport. \nFarmers use its waters to grow crops like cotton, wheat, and sugarcane.`,
      question: 'How does the Nile help farmers?',
      expectedAnswer: 'The Nile provides water and fertile soil for growing crops.'
    },
    {
      id: 'dr_p4_q5', type: 'reading',
      passage: `The Nile River is the longest river in the world, flowing through northeastern Africa. \nIt stretches over 6,600 kilometers, from its sources to the Mediterranean Sea. \nThe river has two main tributaries: the White Nile and the Blue Nile. \nThe White Nile begins in East Africa, flowing from Lake Victoria in Uganda. \nThe Blue Nile starts in Ethiopia, carrying vital water and rich soil. \nThese two branches meet in Sudan, continuing their journey north together. \nFor thousands of years, the Nile has been the lifeblood of Egypt, allowing farming in the desert. \nAncient Egyptian civilization grew along its banks, building cities and monuments. \nThe river still supports millions of people today for water, food, and transport. \nFarmers use its waters to grow crops like cotton, wheat, and sugarcane.`,
      question: 'What does the paragraph tell about the importance of the Nile River?',
      expectedAnswer: 'The Nile supports agriculture, transportation, and millions of people living along it.'
    }
  ],
  security: [
    { id: 'sec_q1', type: 'comprehension', question: 'How ___ you?', options: [{key:'A', text:'are'}, {key:'B', text:'good evening'}, {key:'C', text:'doing'}], expectedOption: 'A', expectedAnswer: 'are' },
    { id: 'sec_q2', type: 'comprehension', question: 'Do ___ like cricket?', options: [{key:'A', text:'always'}, {key:'B', text:'also'}, {key:'C', text:'you'}], expectedOption: 'C', expectedAnswer: 'you' },
    { id: 'sec_q3', type: 'comprehension', question: 'Our training was completed ___ time.', options: [{key:'A', text:'on'}, {key:'B', text:'with'}, {key:'C', text:'at'}], expectedOption: 'A', expectedAnswer: 'on' },
    { id: 'sec_q4', type: 'comprehension', question: 'You should not ___ mistakes.', options: [{key:'A', text:'make'}, {key:'B', text:'made'}, {key:'C', text:'making'}], expectedOption: 'A', expectedAnswer: 'make' },
    { id: 'sec_q5', type: 'comprehension', question: 'I ___ reading the book.', options: [{key:'A', text:'too much'}, {key:'B', text:'enjoyed'}, {key:'C', text:'don\'t'}], expectedOption: 'B', expectedAnswer: 'enjoyed' },
    { id: 'sec_q6', type: 'comprehension', question: 'He is my ___.', options: [{key:'A', text:'daughter'}, {key:'B', text:'sister'}, {key:'C', text:'son'}], expectedOption: 'C', expectedAnswer: 'son' },
    { id: 'sec_q7', type: 'comprehension', question: 'We are ___ of waiting.', options: [{key:'A', text:'tried'}, {key:'B', text:'tired'}, {key:'C', text:'trying'}], expectedOption: 'B', expectedAnswer: 'tired' },
    { id: 'sec_q8', type: 'comprehension', question: 'I am ___ for my English test.', options: [{key:'A', text:'studied'}, {key:'B', text:'studying'}, {key:'C', text:'read'}], expectedOption: 'B', expectedAnswer: 'studying' },
    { id: 'sec_q9', type: 'comprehension', question: 'I want to be successful ___ life.', options: [{key:'A', text:'on'}, {key:'B', text:'over'}, {key:'C', text:'in'}], expectedOption: 'C', expectedAnswer: 'in' },
    { id: 'sec_q10', type: 'comprehension', question: 'I have something ___.', options: [{key:'A', text:'to say'}, {key:'B', text:'bring'}, {key:'C', text:'talk'}], expectedOption: 'A', expectedAnswer: 'to say' },
    { id: 'sec_q11', type: 'comprehension', question: 'I love eating ___.', options: [{key:'A', text:'dessert'}, {key:'B', text:'desert'}, {key:'C', text:'deceit'}], expectedOption: 'A', expectedAnswer: 'dessert' },
    { id: 'sec_q12', type: 'comprehension', question: '___ mobile phone is this?', options: [{key:'A', text:'Which'}, {key:'B', text:'Whose'}, {key:'C', text:'What'}], expectedOption: 'B', expectedAnswer: 'Whose' },
    { id: 'sec_q13', type: 'comprehension', question: 'You received my birthday gift. ___', options: [{key:'A', text:'Have not you?'}, {key:'B', text:'True or not?'}, {key:'C', text:'Didn\'t you?'}], expectedOption: 'C', expectedAnswer: "Didn't you?" },
    { id: 'sec_q14', type: 'comprehension', question: 'Virat Kohli is considered one of the most famous batsmen. ___', options: [{key:'A', text:'Yes, he is.'}, {key:'B', text:'Yes, is.'}, {key:'C', text:'Yes, is he!'}], expectedOption: 'A', expectedAnswer: 'Yes, he is.' },
    { id: 'sec_q15', type: 'comprehension', question: '___ the better team, we lost the match.', options: [{key:'A', text:'Although being'}, {key:'B', text:'Despite of being'}, {key:'C', text:'Despite'}], expectedOption: 'C', expectedAnswer: 'Despite' },
    { id: 'sec_q16', type: 'comprehension', question: 'The best way to learn English is ___', options: [{key:'A', text:'in speaking'}, {key:'B', text:'to speaking'}, {key:'C', text:'by speaking'}], expectedOption: 'C', expectedAnswer: 'by speaking' },
    { id: 'sec_q17', type: 'comprehension', question: 'If only I ___ richer.', options: [{key:'A', text:'were'}, {key:'B', text:'can'}, {key:'C', text:'should'}], expectedOption: 'A', expectedAnswer: 'were' },
    { id: 'sec_q18', type: 'comprehension', question: "You aren't allowed to use your phone, so ___", options: [{key:'A', text:"It's no point in leaving it on."}, {key:'B', text:"There's no point in leaving it on."}, {key:'C', text:"There's no point to leaving it on."}], expectedOption: 'B', expectedAnswer: "There's no point in leaving it on." },
    { id: 'sec_q19', type: 'comprehension', question: 'My favourite colours ___', options: [{key:'A', text:'are blue, green and purple.'}, {key:'B', text:'is blue green and purple.'}, {key:'C', text:'blue-green and purple.'}], expectedOption: 'A', expectedAnswer: 'are blue, green and purple.' },
    { id: 'sec_q20', type: 'comprehension', question: 'Perhaps Elizabeth ___ pass the exam.', options: [{key:'A', text:'may'}, {key:'B', text:'can'}, {key:'C', text:'will'}], expectedOption: 'A', expectedAnswer: 'may' },
    { id: 'sec_q21', type: 'comprehension', question: 'I ___ breakfast this morning.', options: [{key:'A', text:'hadn\'t'}, {key:'B', text:'didn\'t have'}, {key:'C', text:'haven\'t'}], expectedOption: 'B', expectedAnswer: "didn't have" },
    { id: 'sec_q22', type: 'comprehension', question: 'I ___ see a doctor ___ I felt sick.', options: [{key:'A', text:'had to, because'}, {key:'B', text:'have to, because'}, {key:'C', text:'has to, because'}], expectedOption: 'A', expectedAnswer: 'had to, because' },
    { id: 'sec_q23', type: 'comprehension', question: '___ you mind if I didn\'t come?', options: [{key:'A', text:'Could'}, {key:'B', text:'Would'}, {key:'C', text:'Will'}], expectedOption: 'B', expectedAnswer: 'Would' },
    { id: 'sec_q24', type: 'comprehension', question: 'It ___ cats and dogs.', options: [{key:'A', text:'rain'}, {key:'B', text:'ruined'}, {key:'C', text:'rained'}], expectedOption: 'C', expectedAnswer: 'rained' },
    { id: 'sec_q25', type: 'comprehension', question: 'We arrived ___ Dubai.', options: [{key:'A', text:'to'}, {key:'B', text:'in'}, {key:'C', text:'at'}], expectedOption: 'B', expectedAnswer: 'in' },
    { id: 'sec_q26', type: 'comprehension', question: 'Can I borrow ___ money? How ___ do you need?', options: [{key:'A', text:'some, many'}, {key:'B', text:'any, much'}, {key:'C', text:'some, much'}], expectedOption: 'C', expectedAnswer: 'some, much' },
    { id: 'sec_q27', type: 'comprehension', question: 'I would rather Friday ___ Saturday.', options: [{key:'A', text:'than'}, {key:'B', text:'or'}, {key:'C', text:'not'}], expectedOption: 'A', expectedAnswer: 'than' },
    { id: 'sec_q28', type: 'comprehension', question: 'He plays football ___.', options: [{key:'A', text:'skilful'}, {key:'B', text:'skilfully'}, {key:'C', text:'skilled'}], expectedOption: 'B', expectedAnswer: 'skilfully' },
    { id: 'sec_q29', type: 'comprehension', question: 'Is Usaama ___ Andrew?', options: [{key:'A', text:'taller that'}, {key:'B', text:'as tall as'}, {key:'C', text:'more tall than'}], expectedOption: 'B', expectedAnswer: 'as tall as' },
    { id: 'sec_q30', type: 'comprehension', question: "She looks ___ she's going to be sick.", options: [{key:'A', text:'as if'}, {key:'B', text:'like if'}, {key:'C', text:'if'}], expectedOption: 'A', expectedAnswer: 'as if' },
    { id: 'sec_q31', type: 'comprehension', question: 'Your phone ___ while you were away.', options: [{key:'A', text:'ring'}, {key:'B', text:'rang'}, {key:'C', text:'reign'}], expectedOption: 'B', expectedAnswer: 'rang' },
    { id: 'sec_q32', type: 'comprehension', question: 'She ___ me to go to school.', options: [{key:'A', text:'said'}, {key:'B', text:'suggested'}, {key:'C', text:'told'}], expectedOption: 'C', expectedAnswer: 'told' },
    { id: 'sec_q33', type: 'comprehension', question: 'I bought a bunch of ___.', options: [{key:'A', text:'roses'}, {key:'B', text:'bananas'}, {key:'C', text:'sweets'}], expectedOption: 'A', expectedAnswer: 'roses' },
    { id: 'sec_q34', type: 'comprehension', question: 'Where is the ___ accommodation?', options: [{key:'A', text:'most'}, {key:'B', text:'most farthest'}, {key:'C', text:'nearest'}], expectedOption: 'C', expectedAnswer: 'nearest' },
    { id: 'sec_q35', type: 'comprehension', question: "I don't like coffee. ___ do I.", options: [{key:'A', text:'So'}, {key:'B', text:'Neither'}, {key:'C', text:'Either'}], expectedOption: 'B', expectedAnswer: 'Neither' },
    { id: 'sec_q36', type: 'comprehension', question: 'He had come ___ the money.', options: [{key:'A', text:'on'}, {key:'B', text:'by'}, {key:'C', text:'at'}], expectedOption: 'B', expectedAnswer: 'by' },
    { id: 'sec_q37', type: 'comprehension', question: 'You ___ the cleaning.', options: [{key:'A', text:'needn\'t have done'}, {key:'B', text:'wouldn\'t have done'}, {key:'C', text:'couldn\'t have done'}], expectedOption: 'A', expectedAnswer: "needn't have done" },
    { id: 'sec_q38', type: 'comprehension', question: '___ requires resilience.', options: [{key:'A', text:'Friendship'}, {key:'B', text:'Sleeping'}, {key:'C', text:'Eating'}], expectedOption: 'A', expectedAnswer: 'Friendship' },
    { id: 'sec_q39', type: 'comprehension', question: 'I ___ her all my life.', options: [{key:'A', text:'known'}, {key:'B', text:'have been knowing'}, {key:'C', text:'have known'}], expectedOption: 'C', expectedAnswer: 'have known' },
    { id: 'sec_q40', type: 'comprehension', question: 'I went to the barber for ___.', options: [{key:'A', text:'haircutting'}, {key:'B', text:'a haircut'}, {key:'C', text:'hair making'}], expectedOption: 'B', expectedAnswer: 'a haircut' },
    { id: 'sec_q41', type: 'comprehension', question: 'The laptop belongs to my uncle. So, it is ___.', options: [{key:'A', text:'my uncles laptop'}, {key:'B', text:'my uncle\'s laptop'}, {key:'C', text:'my uncles\' laptop'}], expectedOption: 'B', expectedAnswer: "my uncle's laptop" },
    { id: 'sec_q42', type: 'comprehension', question: 'Nurses ___ ill people and gardeners ___ flowers and plants.', options: [{key:'A', text:'look after, cultivate'}, {key:'B', text:'look at, cultivate'}, {key:'C', text:'look in, cultivate'}], expectedOption: 'A', expectedAnswer: 'look after, cultivate' },
    { id: 'sec_q43', type: 'comprehension', question: 'Without her glasses, she is as blind as ___.', options: [{key:'A', text:'a bat'}, {key:'B', text:'darkness'}, {key:'C', text:'a beggar'}], expectedOption: 'A', expectedAnswer: 'a bat' },
    { id: 'sec_q44', type: 'comprehension', question: 'You ___ play in the middle of the road.', options: [{key:'A', text:'ought not to'}, {key:'B', text:'don’t ever'}, {key:'C', text:'can never'}], expectedOption: 'A', expectedAnswer: 'ought not to' },
    { id: 'sec_q45', type: 'comprehension', question: 'I wish to ___ the older version.', options: [{key:'A', text:'revert back'}, {key:'B', text:'respond'}, {key:'C', text:'revert to'}], expectedOption: 'C', expectedAnswer: 'revert to' },
    { id: 'sec_q46', type: 'comprehension', question: 'His sister is the one ___ to him in the photo.', options: [{key:'A', text:'standing'}, {key:'B', text:'stood'}, {key:'C', text:'adjacent'}], expectedOption: 'A', expectedAnswer: 'standing' },
    { id: 'sec_q47', type: 'comprehension', question: 'Can I take ___ to read?', options: [{key:'A', text:'it home'}, {key:'B', text:'it to home'}, {key:'C', text:'for home'}], expectedOption: 'A', expectedAnswer: 'it home' },
    { id: 'sec_q48', type: 'comprehension', question: 'The doctor gave me a ___.', options: [{key:'A', text:'receipt'}, {key:'B', text:'prescription'}, {key:'C', text:'dose'}], expectedOption: 'B', expectedAnswer: 'prescription' },
    { id: 'sec_q49', type: 'comprehension', question: '___ Arabic food?', options: [{key:'A', text:'Have you ever ate'}, {key:'B', text:'Have you ever eaten'}, {key:'C', text:'Have you eaten ever'}], expectedOption: 'B', expectedAnswer: 'Have you ever eaten' },
    { id: 'sec_q50', type: 'comprehension', question: 'I am ___ not coming for duty next week.', options: [{key:'A', text:'possibly'}, {key:'B', text:'definitely'}, {key:'C', text:'probably'}], expectedOption: 'B', expectedAnswer: 'definitely' },
    { id: 'sec_q51', type: 'comprehension', question: 'I will be among the ___ to this Friday’s movie premiere.', options: [{key:'A', text:'spectators'}, {key:'B', text:'crowd'}, {key:'C', text:'audience'}], expectedOption: 'A', expectedAnswer: 'spectators' },
    { id: 'sec_q52', type: 'comprehension', question: 'You shouldn’t count your ___ before they are hatched.', options: [{key:'A', text:'chickens'}, {key:'B', text:'ducks'}, {key:'C', text:'eggs'}], expectedOption: 'C', expectedAnswer: 'eggs' },
    { id: 'sec_q53', type: 'comprehension', question: 'If I had a million dollars, I ___.', options: [{key:'A', text:'will buy a luxury car'}, {key:'B', text:'would buy a luxury car'}, {key:'C', text:'bought a luxury car'}], expectedOption: 'B', expectedAnswer: 'would buy a luxury car' },
    { id: 'sec_q54', type: 'comprehension', question: 'Hi – Long time no see! ___', options: [{key:'A', text:'I haven’t seen you in 10 years! What have you been up to?'}, {key:'B', text:'I haven’t seen you since last 10 years! Where did you go to?'}, {key:'C', text:'I didn’t see you for 10 years! What have you been up to?'}], expectedOption: 'A', expectedAnswer: 'I haven’t seen you in 10 years! What have you been up to?' },
    { id: 'sec_q55', type: 'comprehension', question: 'No sooner had the accident happened ___ the ___ gathered.', options: [{key:'A', text:'that, audience'}, {key:'B', text:'then, people'}, {key:'C', text:'than, crowd'}], expectedOption: 'C', expectedAnswer: 'than, crowd' },
    { id: 'sec_q56', type: 'comprehension', question: 'He decided that he ___.', options: [{key:'A', text:'ought not to'}, {key:'B', text:'needn’t'}, {key:'C', text:'didn’t have to'}], expectedOption: 'C', expectedAnswer: "didn't have to" },
    { id: 'sec_q57', type: 'comprehension', question: 'The supervisor gave you a coupon ___?', options: [{key:'A', text:'hadn’t he'}, {key:'B', text:'hasn’t he'}, {key:'C', text:'didn’t he'}], expectedOption: 'C', expectedAnswer: "didn't he" },
    { id: 'sec_q58', type: 'comprehension', question: 'While I ___ to work, I ___ an old friend.', options: [{key:'A', text:'walked, bumped into'}, {key:'B', text:'walked, was bumping into'}, {key:'C', text:'was walking, bumped into'}], expectedOption: 'C', expectedAnswer: 'was walking, bumped into' },
    { id: 'sec_q59', type: 'comprehension', question: 'You have made a lot of ___.', options: [{key:'A', text:'mistakes'}, {key:'B', text:' wrongs'}, {key:'C', text:'faults'}], expectedOption: 'A', expectedAnswer: 'mistakes' },
    { id: 'sec_q60', type: 'comprehension', question: 'If I could travel anywhere, I ___ America.', options: [{key:'A', text:'will travel'}, {key:'B', text:'would travel'}, {key:'C', text:'would prefer'}], expectedOption: 'B', expectedAnswer: 'would travel' },
    { id: 'sec_q61', type: 'comprehension', question: 'managing your ___ settings', options: [{key:'A', text:'security'}, {key:'B', text:'privacy'}, {key:'C', text:'publicity'}, {key:'D', text:'social'}], expectedOption: 'B', expectedAnswer: 'privacy' },
    { id: 'sec_q62', type: 'comprehension', question: 'keep your personal information ___', options: [{key:'A', text:'secure'}, {key:'B', text:'unlocked'}, {key:'C', text:'secular'}, {key:'D', text:'authenticated'}], expectedOption: 'A', expectedAnswer: 'secure' },
    { id: 'sec_q63', type: 'comprehension', question: '___ may try to trick you', options: [{key:'A', text:'Scammers'}, {key:'B', text:'People'}, {key:'C', text:'Influencers'}, {key:'D', text:'Followers'}], expectedOption: 'A', expectedAnswer: 'Scammers' },
    { id: 'sec_q64', type: 'comprehension', question: 'fake news can spread ___', options: [{key:'A', text:'truthfulness'}, {key:'B', text:'misinformation'}, {key:'C', text:'positivity'}, {key:'D', text:'too much'}], expectedOption: 'B', expectedAnswer: 'misinformation' },
    { id: 'sec_q65', type: 'comprehension', question: 'important to ___ sources', options: [{key:'A', text:'disprove'}, {key:'B', text:'debunk'}, {key:'C', text:'verify'}, {key:'D', text:'read'}], expectedOption: 'C', expectedAnswer: 'verify' },
    { id: 'sec_q66', type: 'comprehension', question: 'use ___ tools', options: [{key:'A', text:'contradictory'}, {key:'B', text:'profile-checking'}, {key:'C', text:'file-making'}, {key:'D', text:'fact-checking'}], expectedOption: 'D', expectedAnswer: 'fact-checking' },
    { id: 'sec_q67', type: 'comprehension', question: 'have an ___ on mental health', options: [{key:'A', text:'eject'}, {key:'B', text:'elimination'}, {key:'C', text:'fun-fact'}, {key:'D', text:'impact'}], expectedOption: 'D', expectedAnswer: 'impact' },
    { id: 'sec_q68', type: 'comprehension', question: 'lead to stress and ___', options: [{key:'A', text:'happiness'}, {key:'B', text:'worry'}, {key:'C', text:'anxiety'}], expectedOption: 'C', expectedAnswer: 'anxiety' },
    { id: 'sec_q69', type: 'comprehension', question: 'feelings of ___', options: [{key:'A', text:'adequacy'}, {key:'B', text:'inadequacy'}, {key:'C', text:'competency'}, {key:'D', text:'sufficiency'}], expectedOption: 'B', expectedAnswer: 'inadequacy' },
    { id: 'sec_q70', type: 'comprehension', question: 'focus on ___ connections', options: [{key:'A', text:'authentic'}, {key:'B', text:'falsify'}, {key:'C', text:'ignoring'}, {key:'D', text:'telepathic'}], expectedOption: 'A', expectedAnswer: 'authentic' }
  ],
  housekeeping: [
    {
      id: 'hk_p1_q1', type: 'reading',
      passage: 'UAE hospitality standards require strict colour-coding for cleaning tools: Red for washrooms and high-risk areas, Blue for general public spaces, Green for food service and kitchen zones, and Yellow for specific isolation or chemical-sensitive areas.',
      question: 'What color cleaning equipment should be used specifically for washrooms and high-risk areas?',
      expectedAnswer: 'Red color-coded equipment should be used for washrooms.'
    },
    {
      id: 'hk_sit_1', type: 'situational',
      question: 'While cleaning a luxury hotel suite in Dubai, you find a diamond ring on the bedside table. What is the correct professional action?',
      expectedAnswer: 'Do not touch the item. Immediately notify and report to your floor supervisor via radio and wait for them to arrive to document and secure the item for Lost & Found.'
    },
    {
        id: 'hk_mcq_1', type: 'comprehension',
        question: 'Which chemical is typically used for sanitizing high-touch surfaces in a 5-star hotel room?',
        options: [
          {key:'A', text:'Strong bleach.'},
          {key:'B', text:'R-series or equivalent multi-purpose surface sanitizer.'},
          {key:'C', text:'Plain water.'}
        ],
        expectedOption: 'B', expectedAnswer: 'R-series or equivalent multi-purpose surface sanitizer.'
    },
    {
        id: 'hk_sit_2', type: 'situational',
        question: 'A guest complains that their room was not cleaned to their satisfaction. How do you respond?',
        expectedAnswer: 'Apologize sincerely, offer to rectify the specific issues immediately, and report or inform the supervisor to ensure the guest is satisfied with the follow-up.'
    }
  ],
  supervisor: [
    {
      id: 'sup_p1_q1', type: 'reading',
      passage: 'Field Supervisors in UAE facilities management are the primary link between staff and clients. Responsibilities include conducting daily Tool Box Talks (TBT), monitoring attendance rosters, verifying that all workers wear site-mandated PPE, and submitting daily digital shift reports to Innovision management.',
      question: 'What is the morning briefing given to staff by a supervisor called?',
      expectedAnswer: 'It is called a Tool Box Talk (TBT).'
    },
    {
        id: 'sup_sit_1', type: 'situational',
        question: 'Two team members are having a loud argument in a public area. As their supervisor, what is your immediate action?',
        expectedAnswer: 'Intervene immediately but calmly, move the discussion to a private office or back-of-house area, report the incident, listen to both parties, and resolve the conflict according to company policy.'
    },
    {
        id: 'sup_mcq_1', type: 'comprehension',
        question: 'What does "PPE" stand for in an industrial or construction environment?',
        options: [
          {key:'A', text:'Public Property Equipment.'},
          {key:'B', text:'Personal Protective Equipment.'},
          {key:'C', text:'Private Protocol Exercise.'}
        ],
        expectedOption: 'B', expectedAnswer: 'Personal Protective Equipment.'
    }
  ],
  helper: [
    {
      id: 'hlp_p1_q1', type: 'reading',
      passage: 'General helpers in UAE construction and logistics must comply with the "Midday Break" rule: outdoor work is prohibited between 12:30 PM and 3:00 PM during the summer months (June to September).',
      question: 'During what months is the UAE Midday Break rule mandatory?',
      expectedAnswer: 'It is mandatory during the summer months of June to September.'
    },
    {
        id: 'hlp_mcq_1', type: 'comprehension',
        question: 'What is the correct way to lift a heavy box from the floor?',
        options: [
          {key:'A', text:'Bend your back and pull quickly.'},
          {key:'B', text:'Bend your knees, keep your back straight, and lift with your legs.'},
          {key:'C', text:'Ask two people to pull from different sides.'}
        ],
        expectedOption: 'B', expectedAnswer: 'Bend your knees, keep your back straight, and lift with your legs.'
    },
    {
        id: 'hlp_sit_1', type: 'situational',
        question: 'You notice a safety hazard, like a water spill or an exposed wire, in the warehouse. What should you do?',
        expectedAnswer: 'Immediately mark the area if possible, stay away from the safety hazard, and report it to your direct supervisor or safety officer at once.'
    }
  ]
};

const BADGE_MAP = { reading: 'badge-reading', comprehension: 'badge-comprehension', situational: 'badge-situational', fluency: 'badge-fluency', essay: 'badge-situational' };
const BADGE_LBL = { reading: 'Reading', comprehension: 'Comprehension', situational: 'Situational', fluency: 'Fluency', essay: 'Essay' };

const DEMO_CANDIDATES = [
  { id: 'INV2001001', firstName: 'Rajesh', lastName: 'Sharma', phone: '+91 98100 11223', email: 'rajesh@example.com', city: 'Gurugram, Haryana', experience: '5', passport: 'Valid Passport (6+ months)', education: '12th Pass', languages: 'Hindi, English', gulfExp: 'Yes — UAE', job: 'driver', scores: { reading: 84, voice: 78, quality: 87, total: 83 }, status: 'pending', timestamp: new Date(Date.now() - 3600000).toISOString(), evaluations: {}, answers: {}, voice: {} },
  { id: 'INV2001002', firstName: 'Priya', lastName: 'Verma', phone: '+91 97200 22334', email: 'priya@example.com', city: 'Delhi', experience: '3', passport: 'Valid Passport (6+ months)', education: 'Graduate', languages: 'Hindi, English, Punjabi', gulfExp: 'No — First time', job: 'security', scores: { reading: 76, voice: 69, quality: 73, total: 73 }, status: 'selected', timestamp: new Date(Date.now() - 7200000).toISOString(), evaluations: {}, answers: {}, voice: {} }
];

const STORAGE_KEY = 'inv_candidates';

function loadAdminData() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const uniqueMap = new Map();
    raw.forEach(r => {
      const key = ((r.firstName || '').trim().toLowerCase() + '|' + (r.lastName || '').trim().toLowerCase());
      uniqueMap.set(key, r);
    });
    return Array.from(uniqueMap.values());
  } catch (e) { console.warn('Innovision: failed to load candidate data', e); return []; }
}

function saveAdminData(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) { console.warn('Innovision: failed to save candidate data', e); }
}
