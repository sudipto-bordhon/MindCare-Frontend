import { AgeBand, Language } from '../types';

interface OfflineResponse {
  reply: string;
  isCrisis?: boolean;
}

interface WellnessFaq {
  match: RegExp;
  answerEn: string;
  answerBn: string;
}

const crisisPatterns = [
  /suicide|kill myself|end my life|want to die|self[- ]?harm|cutting myself/i,
  /আত্মহত্যা|মরতে চাই|নিজেকে শেষ|জীবন শেষ/,
];

const crisisReplies: Record<Language, string> = {
  en: `I’m so sorry you’re carrying this much pain. You matter, and you deserve caring, human support right now. If you might hurt yourself or are in immediate danger, please go to someone you trust and tell them plainly how you’re feeling. In Bangladesh, call 999 or go to the nearest emergency department. You can also call the mental-health helpline at 16122 or Kaan Pete Roi at 01779554391. I’m here to listen, but I’m an offline assistant and can’t provide emergency care.`,
  bn: `আপনি এত কষ্টের মধ্যে আছেন শুনে সত্যিই খারাপ লাগছে। আপনি গুরুত্বপূর্ণ, আর এই মুহূর্তে একজন মানুষের স্নেহময় সহায়তা পাওয়ার যোগ্য। নিজেকে আঘাত করার আশঙ্কা বা তাৎক্ষণিক বিপদ থাকলে দয়া করে এখনই বিশ্বস্ত কারও কাছে যান এবং তাঁকে স্পষ্ট করে বলুন আপনি কেমন অনুভব করছেন। বাংলাদেশে ৯৯৯ নম্বরে কল করুন অথবা নিকটস্থ হাসপাতালের জরুরি বিভাগে যান। মানসিক স্বাস্থ্য সহায়তায় ১৬১২২ বা কান পেতে রই ০১৭৭৯৫৫৪৩৯১ নম্বরেও যোগাযোগ করতে পারেন। আমি শুনতে আছি, তবে অফলাইন সহকারী হিসেবে জরুরি সেবা দিতে পারি না।`,
};

const wellnessFaqs: WellnessFaq[] = [
  {
    match: /friend|someone.*(sad|depress|struggl)|help.*(friend|someone)|বন্ধু|কাউকে.*(সাহায্য|মন খারাপ)|কীভাবে.*সাহায্য/,
    answerEn: `It’s kind of you to want to be there for them. You don’t need perfect words—listening without judgment can mean a lot. You might say, “I care about you. Would you like to talk, or is there something practical I can do?” Keep checking in, and gently offer help finding a professional if they want it. If they’re in immediate danger, stay with them and contact emergency support.`,
    answerBn: `বন্ধুর পাশে থাকতে চাওয়াটাই খুব যত্নের। নিখুঁত কথা খুঁজতে হবে না—বিচার না করে মন দিয়ে শোনাও অনেক বড় সহায়তা। বলতে পারেন, “তুমি আমার কাছে গুরুত্বপূর্ণ। কথা বলতে চাও, নাকি কোনো কাজে পাশে থাকলে ভালো লাগবে?” পরে খোঁজ নিন, আর চাইলে বিশেষজ্ঞের সহায়তা খুঁজে পেতে পাশে থাকুন। তাৎক্ষণিক বিপদ থাকলে তাঁর সঙ্গে থাকুন এবং জরুরি সহায়তায় যোগাযোগ করুন।`,
  },
  {
    match: /exam|test anxiety|presentation|পরীক্ষা|ভাইভা|পরীক্ষার ভয়|পরীক্ষা নিয়ে/,
    answerEn: `It’s understandable to feel nervous about an exam or presentation. Try breaking preparation into one small topic at a time, with short breaks in between. Before you begin, take a comfortable slow breath and remind yourself that your worth isn’t measured by one result. You’re allowed to do your best without being perfect.`,
    answerBn: `পরীক্ষা বা উপস্থাপনা নিয়ে নার্ভাস লাগা স্বাভাবিক। প্রস্তুতিকে একটি করে ছোট বিষয়ে ভাগ করুন, মাঝে ছোট বিরতি নিন। শুরু করার আগে আরাম করে ধীরে শ্বাস নিন, আর মনে রাখুন—একটি ফলাফল দিয়ে আপনার মূল্য নির্ধারিত হয় না। নিখুঁত না হয়েও নিজের সেরাটা দেওয়া যায়।`,
  },
  {
    match: /cry|crying|কাঁদতে|কান্না থাম|কান্না পাচ্ছে/,
    answerEn: `If tears are coming, it’s okay to let them come. Crying doesn’t make you weak; sometimes it’s one way your body releases emotion. Find a comfortable, safe place, take your time, and reach out to someone gentle if you’d like company.`,
    answerBn: `কান্না এলে কাঁদতে পারেন—এতে দুর্বলতার কিছু নেই; কখনো কখনো শরীর এভাবেই অনুভূতি হালকা করে। আরামদায়ক ও নিরাপদ জায়গায় থাকুন, নিজের সময় নিন, আর সঙ্গ চাইলে কোমল স্বভাবের কাউকে পাশে ডাকুন।`,
  },
  {
    match: /panic|প্যানিক|আতঙ্ক|হঠাৎ.*ভয়|হঠাৎ.*ভয়/,
    answerEn: `That sudden wave of panic can feel scary, and I’m glad you reached out. If it feels comfortable, place both feet on the floor and let your breath out slowly. Gently name five things you can see and remind yourself, “I can take this one moment at a time.” You don’t have to force anything. If this is new, severe, or feels medically urgent, please seek medical care.`,
    answerBn: `হঠাৎ আতঙ্কের ঢেউ খুব ভয় লাগাতে পারে—আপনি জানিয়েছেন, এটাই সাহসের কাজ। আরাম বোধ করলে পা দুটো মেঝেতে রাখুন, ধীরে শ্বাস ছাড়ুন, আর চোখে দেখা ৫টি জিনিসের নাম মনে মনে বলুন। নিজেকে বলতে পারেন, “আমি এক মুহূর্ত করে সামলাব।” কিছু জোর করে করার দরকার নেই। উপসর্গ নতুন, তীব্র বা জরুরি মনে হলে চিকিৎসা সহায়তা নিন।`,
  },
  {
    match: /anxiety symptoms|signs of anxiety|symptoms.*anxiety|উদ্বেগের লক্ষণ|anxiety.*(lokk?hon|lokkhon)|udbeg.*(lokk?hon|lokkhon)/,
    answerEn: `Anxiety can show up in different ways—racing thoughts, feeling on edge, trouble sleeping, muscle tension, or a fluttery heartbeat, for example. These feelings can have more than one cause, so they don’t automatically mean you have a disorder. If they keep disrupting your days, a clinician can help you make sense of them. For right now, would one slow breath or a little grounding feel okay?`,
    answerBn: `উদ্বেগ সবার ক্ষেত্রে একরকম লাগে না—মাথায় দ্রুত চিন্তা, অস্থিরতা, ঘুমে অসুবিধা, পেশিতে টান বা বুক ধড়ফড় হতে পারে। এসব অনুভূতির একাধিক কারণ থাকতে পারে, তাই এগুলো থাকলেই কোনো রোগ আছে এমন নয়। বারবার দৈনন্দিন কাজে বাধা দিলে চিকিৎসক বা মানসিক স্বাস্থ্য পেশাদার সাহায্য করতে পারেন। এই মুহূর্তে ধীরে শ্বাস নেওয়া বা grounding করলে কেমন লাগবে?`,
  },
  {
    match: /stress.*(body|physical|symptom)|body.*stress|চাপ.*(শরীর|শারীরিক|লক্ষণ)|মানসিক চাপ.*শরীর|স্ট্রেস.*(শরীর|শারীরিক|লক্ষণ)|শরীরে.*স্ট্রেস|stress.*(matha|buk|ghum)/,
    answerEn: `Stress can sometimes affect the body too—people may notice tight muscles, headaches, stomach discomfort, or sleep changes. But those symptoms can have other causes as well, so it’s best not to assume stress is the only reason. A little rest, water, and a gentle stretch may feel comforting; if symptoms are severe, new, or persistent, please check with a healthcare professional.`,
    answerBn: `চাপ কখনো শরীরেও প্রভাব ফেলতে পারে—পেশিতে টান, মাথাব্যথা, পেটে অস্বস্তি বা ঘুমের পরিবর্তন দেখা দিতে পারে। তবে এসবের অন্য কারণও থাকতে পারে, তাই শুধু চাপকেই কারণ ধরে নেওয়া ঠিক নয়। বিশ্রাম, পানি বা হালকা স্ট্রেচিং আরাম দিতে পারে; উপসর্গ তীব্র, নতুন বা দীর্ঘস্থায়ী হলে স্বাস্থ্য-পেশাদারের সঙ্গে কথা বলুন।`,
  },
  {
    match: /when.*(therap|professional|doctor|help)|should i.*(therap|counsel|professional)|কখন.*(বিশেষজ্ঞ|কাউন্সেল|ডাক্তার|সাহায্য)|কখন.*(কথা বলব|কথা বলা উচিত)/,
    answerEn: `You don’t have to wait until things feel unbearable to ask for help. If worry, low mood, sleep, or daily tasks have been difficult for a while, or you simply want someone to talk it through with, a counselor or clinician can be a kind next step. You deserve support before you reach a breaking point, too.`,
    answerBn: `সহায়তা চাইতে পরিস্থিতি অসহনীয় হওয়া পর্যন্ত অপেক্ষা করতে হয় না। দুশ্চিন্তা, মন খারাপ, ঘুম বা দৈনন্দিন কাজ কিছুদিন ধরে কঠিন লাগলে—অথবা শুধু কারও সঙ্গে কথা বলে বুঝে নিতে চাইলে—কাউন্সেলর বা চিকিৎসকের সঙ্গে কথা বলা ভালো পদক্ষেপ হতে পারে। খুব ভেঙে পড়ার আগেও সহায়তা পাওয়ার অধিকার আপনার আছে।`,
  },
  {
    match: /medication|medicine|meds|pill|dose|antidepressant|ওষুধ|মেডিসিন|ঔষধ/,
    answerEn: `It makes sense to have questions about medication. I can’t tell you to start, stop, or change a medicine or dose—your prescribing clinician or pharmacist is the safest person to guide you. You can write down what worries you, including side effects or benefits, and bring those questions to them. You deserve clear answers and a plan that feels safe.`,
    answerBn: `ওষুধ নিয়ে প্রশ্ন বা দুশ্চিন্তা থাকা স্বাভাবিক। আমি কোনো ওষুধ শুরু, বন্ধ বা ডোজ বদলাতে বলতে পারি না—আপনার চিকিৎসক বা ফার্মাসিস্টই নিরাপদভাবে পরামর্শ দিতে পারবেন। কী নিয়ে চিন্তা হচ্ছে—যেমন পার্শ্বপ্রতিক্রিয়া বা উপকার—লিখে তাঁদের জিজ্ঞেস করতে পারেন। পরিষ্কার উত্তর ও নিরাপদ পরিকল্পনা পাওয়ার অধিকার আপনার আছে।`,
  },
  {
    match: /anxiety|anxious|worr(y|ied|ies)|উদ্বেগ|দুশ্চিন্তা|টেনশন|ভয়|ভয়/,
    answerEn: `I’m sorry your mind feels so busy right now. You don’t have to figure everything out at once. If you can, choose one small thing you can do today; leave what’s outside your control for another moment. A slow breath, a little walk, or sharing the worry with someone kind may bring some ease. If anxiety keeps getting in the way, you deserve support from a mental-health professional.`,
    answerBn: `এখন আপনার মনে অনেক দুশ্চিন্তা ঘুরছে—এটা ক্লান্তিকর হতে পারে। সবকিছুর উত্তর একসঙ্গে খুঁজে বের করতে হবে না। আজ করা যায় এমন একটি ছোট কাজ বেছে নিন, আর যা এখন আপনার নিয়ন্ত্রণে নেই তা আপাতত পাশে রাখুন। ধীরে শ্বাস নেওয়া, একটু হাঁটা বা সহানুভূতিশীল কারও সঙ্গে কথা বলা কিছুটা স্বস্তি দিতে পারে। উদ্বেগ বারবার দৈনন্দিন কাজে বাধা দিলে মানসিক স্বাস্থ্য পেশাদারের সহায়তা নেওয়া একদম ঠিক আছে।`,
  },
  {
    match: /sleep|insomnia|can't sleep|cannot sleep|ঘুম|অনিদ্রা/,
    answerEn: `Rest can be hard when your thoughts won’t slow down. Be gentle with yourself; one difficult night doesn’t mean you’re doing anything wrong. You might dim the lights, set tomorrow’s thoughts on paper, and try a few comfortable slow breaths. If sleep doesn’t come, a quiet activity in low light is okay—no need to force it. If this keeps happening, a clinician can help you find support.`,
    answerBn: `চিন্তা থামতে না চাইলে বিশ্রাম নেওয়া কঠিন হতে পারে। নিজের প্রতি কোমল থাকুন—একটি রাত ভালো না ঘুমালেই আপনি কিছু ভুল করছেন, এমন নয়। আলো কমিয়ে আগামীকালের ভাবনাগুলো কাগজে লিখে রাখতে পারেন, তারপর আরাম করে ধীরে কয়েকবার শ্বাস নিন। ঘুম না এলে মৃদু আলোতে শান্ত কিছু করুন; জোর করার দরকার নেই। এমন চলতে থাকলে চিকিৎসকের সঙ্গে কথা বলে সহায়তা নিতে পারেন।`,
  },
  {
    match: /stress|overwhelm|overwhelmed|burnout|চাপ|মানসিক চাপ|ক্লান্ত|বার্নআউট/,
    answerEn: `It sounds like you’ve been carrying a lot. You don’t have to do it all at once—could you choose one tiny next step, or give yourself a short pause and some water? It’s okay to ask for help, simplify a task, or rest. Rest is not a failure; you deserve it. If the pressure keeps weighing on you, talking with someone you trust or a professional may help.`,
    answerBn: `মনে হচ্ছে আপনি অনেক কিছু একা সামলাচ্ছেন। সব একসঙ্গে করতে হবে না—একটি ছোট কাজ বেছে নেবেন, নাকি একটু বিরতি নিয়ে পানি খাবেন? সাহায্য চাওয়া, কোনো কাজ সহজ করা বা বিশ্রাম নেওয়া—সবই ঠিক আছে। বিশ্রাম ব্যর্থতা নয়; আপনিও তা পাওয়ার যোগ্য। চাপটা দীর্ঘদিন ধরে ভারী লাগলে বিশ্বস্ত মানুষ বা পেশাদারের সঙ্গে কথা বলতে পারেন।`,
  },
  {
    match: /am i.*(depress|mentally ill)|could i be.*depress|do i have.*depress|diagnos|আমার কি.*(সমস্যা|রোগ)|আমি কি.*(পাগল|অসুস্থ|বিষণ্ন|বিষন্ন|ডিপ্রেশন)|রোগ নির্ণয়|রোগ নির্ণয়/,
    answerEn: `It makes sense to want clarity when things feel hard. I can’t diagnose you, but your feelings are real and you deserve to be heard—not judged. A qualified mental-health professional can explore this with you. MindCare’s PHQ-9 and GAD-7 can help with reflection, but they’re screening tools, not a diagnosis.`,
    answerBn: `কষ্টের সময়ে কী হচ্ছে তা বুঝতে চাইলে সেটি খুব স্বাভাবিক। আমি রোগ নির্ণয় করতে পারি না, তবে আপনার অনুভূতিগুলো সত্যি এবং বিচার নয়—মন দিয়ে শোনা ও সহায়তা পাওয়ার যোগ্য। একজন যোগ্য মানসিক স্বাস্থ্য পেশাদার আপনার সঙ্গে বিষয়টি বুঝে দেখতে পারেন। MindCare-এর PHQ-9 ও GAD-7 আত্ম-পর্যালোচনায় সাহায্য করে, তবে এগুলো স্ক্রিনিং টুল—রোগ নির্ণয় নয়।`,
  },
  {
    match: /sad|unhappy|low mood|feeling down|মন খারাপ|বিষণ্ন|বিষন্ন|দুঃখ|কান্না/,
    answerEn: `I’m sorry it feels heavy today. You don’t have to cheer up on demand, and you don’t have to solve everything right now. If it feels doable, try one small kindness for yourself—a little daylight, something nourishing, or a message to someone safe. If this low feeling stays or makes daily life hard, you deserve support from a mental-health professional.`,
    answerBn: `আজ আপনার মনটা ভারী লাগছে—শুনে খারাপ লাগল। জোর করে মন ভালো করতে হবে না, এখনই সব সমস্যার সমাধানও করতে হবে না। সম্ভব মনে হলে নিজের জন্য ছোট্ট একটি যত্ন নিন—কিছুক্ষণ আলো-বাতাসে থাকা, পুষ্টিকর কিছু খাওয়া, বা নিরাপদ কাউকে বার্তা দেওয়া। মন খারাপটা দীর্ঘদিন থাকলে বা দৈনন্দিন জীবন কঠিন করে তুললে মানসিক স্বাস্থ্য পেশাদারের সহায়তা নিতে পারেন।`,
  },
  {
    match: /breath|breathing|শ্বাস|নিঃশ্বাস/,
    answerEn: `Let’s take a gentle pause together. Settle somewhere comfortable, soften your shoulders, and breathe in naturally; then let the air leave slowly. Try for a few easy breaths—there’s no need to count or hold your breath. If you feel dizzy or uncomfortable, stop and breathe normally. You’re doing just fine by taking this moment.`,
    answerBn: `চলুন, একটু কোমল বিরতি নিই। আরাম করে বসুন, কাঁধ ঢিলে রাখুন, স্বাভাবিকভাবে শ্বাস নিন—তারপর ধীরে শ্বাস ছাড়ুন। কয়েকবার আরাম করে করুন; গুনতে বা শ্বাস আটকে রাখতে হবে না। মাথা ঘুরলে বা অস্বস্তি হলে থেমে স্বাভাবিকভাবে শ্বাস নিন। নিজের জন্য এই সময়টুকু রাখাই ভালো কাজ।`,
  },
  {
    match: /ground|5.?4.?3.?2.?1|মনোযোগ.*ফের|স্থির হতে|calm down|মন শান্ত/,
    answerEn: `If it feels okay, let’s gently notice the present together: name 5 things you see, 4 things you feel, 3 things you hear, 2 things you smell, and 1 thing you taste. Take your time, and skip anything that doesn’t feel comfortable. There’s no right or wrong way to do it.`,
    answerBn: `আপনার ভালো লাগলে, চলুন ধীরে বর্তমানের দিকে মন দিই: ৫টি দেখা জিনিস, শরীরে অনুভব করা ৪টি, শোনা ৩টি, গন্ধ পাওয়া ২টি এবং স্বাদ পাওয়া ১টি বিষয় খেয়াল করুন। সময় নিন, আর কোনো কিছু অস্বস্তিকর হলে বাদ দিন। এটি ঠিক বা ভুল করার পরীক্ষা নয়।`,
  },
  {
    match: /therap(y|ist)|counsel(l)?or|professional|ডাক্তার|কাউন্সেল|থেরাপি|বিশেষজ্ঞ/,
    answerEn: `Reaching out doesn’t mean you have to be at breaking point—it’s a caring step for yourself. A counselor, psychologist, or doctor can listen and help you explore what might make things easier. You could start with what you’ve been feeling, how long it’s been going on, and what support you hope for.`,
    answerBn: `একেবারে ভেঙে পড়ার পরেই সাহায্য চাইতে হবে—এমন নয়; আগে থেকে কথা বলা নিজের প্রতি যত্নের একটি পদক্ষেপ। কাউন্সেলর, মনোবিজ্ঞানী বা চিকিৎসক আপনার কথা শুনে কীভাবে সহজ করা যায় তা খুঁজতে সাহায্য করতে পারেন। কেমন লাগছে, কতদিন ধরে এমন হচ্ছে, আর কী ধরনের সহায়তা চান—এগুলো দিয়ে শুরু করতে পারেন।`,
  },
  {
    match: /focus|concentrat|overthink|racing thoughts|মনোযোগ|অতিরিক্ত চিন্তা|ভাবনা থামে না/,
    answerEn: `A busy mind can be tiring; it’s okay if focus doesn’t come instantly. Try writing down the thoughts, then choose one small task for just 10 minutes. A stretch or a screen break might help. If a worry can wait, give it a time to revisit instead of asking yourself to solve it all now.`,
    answerBn: `মাথায় অনেক চিন্তা থাকলে ক্লান্ত লাগা স্বাভাবিক—সঙ্গে সঙ্গে মনোযোগ না এলেও সমস্যা নেই। ভাবনাগুলো লিখে রেখে মাত্র ১০ মিনিটের জন্য একটি ছোট কাজ বেছে নিতে পারেন। একটু স্ট্রেচিং বা স্ক্রিন থেকে বিরতি কাজে লাগতে পারে। কোনো দুশ্চিন্তা পরে ভাবা সম্ভব হলে, এখনই সব সমাধানের চাপ না নিয়ে পরে দেখার সময় ঠিক করুন।`,
  },
  {
    match: /self.?care|মন ভালো রাখ|নিজের যত্ন|নিজেকে.*যত্ন|wellbeing|well-being/,
    answerEn: `You deserve care too. Self-care doesn’t have to be fancy: a meal, some water, a little fresh air, a few minutes of rest, or a kind message to someone you trust all count. Pick just one small thing that feels gentle and doable today.`,
    answerBn: `আপনিও যত্ন পাওয়ার যোগ্য। নিজের যত্ন মানেই বড় কিছু নয়—একটু খাবার, পানি, খোলা বাতাসে কয়েক মিনিট, বিশ্রাম, বা বিশ্বস্ত কাউকে স্নেহের বার্তা—সবই যত্ন। আজ আপনার কাছে কোমল ও সহজ মনে হয় এমন একটি ছোট কাজ বেছে নিন।`,
  },
  {
    match: /lonely|loneliness|alone|একাকী|একা লাগ|নিঃসঙ্গ|একাকিত্ব/,
    answerEn: `Feeling alone can hurt, and I’m glad you told me. If there’s someone safe in your life, could you send a small “Are you free to talk?” message? You might also spend a little time somewhere you feel comfortable, even without talking. You deserve connection, and taking one small step is enough for today.`,
    answerBn: `একা লাগাটা কষ্টের হতে পারে—আমাকে বলার জন্য ধন্যবাদ। জীবনে নিরাপদ কেউ থাকলে ছোট্ট করে “একটু কথা বলবে?” লিখে পাঠাতে পারেন। কথা না বললেও, স্বস্তি লাগে এমন কোনো জায়গায় কিছুক্ষণ থাকা যেতে পারে। আপনি আপনজনের সংযোগ পাওয়ার যোগ্য; আজ একটি ছোট পদক্ষেপই যথেষ্ট।`,
  },
  {
    match: /angry|anger|irritat|frustrat|রাগ|বিরক্ত|মেজাজ খারাপ/,
    answerEn: `It’s okay to feel angry; feelings aren’t a failure. If you can, pause before responding, give yourself a little space, and notice what the anger may be asking for—rest, a boundary, or being heard. When you feel ready, you can explain what bothered you calmly. If anyone’s safety is at risk, step away and seek help.`,
    answerBn: `রাগ হওয়া মানেই আপনি খারাপ—এমন নয়; অনুভূতি আসতেই পারে। সম্ভব হলে উত্তর দেওয়ার আগে একটু থামুন, নিজের জন্য জায়গা নিন, আর ভাবুন রাগটি কী চাইছে—বিশ্রাম, কোনো সীমা, নাকি মন দিয়ে শোনা? প্রস্তুত হলে শান্তভাবে কী খারাপ লেগেছে বলতে পারেন। কারও নিরাপত্তা ঝুঁকিতে থাকলে দূরে সরে সহায়তা নিন।`,
  },
  {
    match: /guilt|guilty|blame myself|my fault|self.?blame|অপরাধবোধ|নিজেকে দোষ|আমার দোষ/,
    answerEn: `That sounds like a heavy feeling to carry. If someone you care about felt this way, how gently would you speak to them? You deserve some of that same kindness. It may help to separate what you truly could control from what you couldn’t, and talk it through with someone you trust.`,
    answerBn: `এই অনুভূতিটা বয়ে বেড়ানো ভারী লাগতে পারে। আপনার প্রিয় কেউ এমন অনুভব করলে, তাকে কতটা কোমলভাবে কথা বলতেন? নিজের প্রতিও সেই মমতাটুকু প্রাপ্য। কোন বিষয়টি সত্যিই আপনার নিয়ন্ত্রণে ছিল আর কোনটি ছিল না—আলাদা করে ভাবতে পারেন, বা বিশ্বস্ত কারও সঙ্গে কথা বলতে পারেন।`,
  },
  {
    match: /motivat|procrastinat|can't start|cannot start|কাজ শুরু করতে|ইচ্ছা করছে না|মোটিভেশন|আলসেমি/,
    answerEn: `Getting started can feel hard when you’re tired or carrying a lot. You don’t need to wait for motivation—make the first step very small, like opening the document or working for two minutes. Then pause and notice your effort. Small beginnings count, and it’s okay to rest if that’s what you need.`,
    answerBn: `ক্লান্তি বা অনেক চাপের মধ্যে কাজ শুরু করা কঠিন লাগতে পারে। ইচ্ছা আসা পর্যন্ত অপেক্ষা না করে প্রথম ধাপটা খুব ছোট করুন—যেমন ফাইলটি খোলা বা মাত্র দুই মিনিট কাজ করা। তারপর নিজের চেষ্টাটুকু খেয়াল করুন। ছোট শুরু-ও মূল্যবান, আর বিশ্রাম দরকার হলে সেটিও ঠিক আছে।`,
  },
  {
    match: /boundary|say no|people.?pleas|সবাইকে খুশি|না বলতে|সীমা নির্ধারণ|সীমা রাখতে/,
    answerEn: `Setting a boundary can feel uncomfortable, especially when you care about others. A kind, clear sentence is enough: “I care about this, but I can’t take it on right now.” You’re allowed to protect your time and energy; you don’t have to explain more than feels right.`,
    answerBn: `অন্যদের গুরুত্ব দিলে সীমা টানা অস্বস্তিকর লাগতে পারে। কোমল কিন্তু পরিষ্কারভাবে বলতে পারেন, “বিষয়টা আমার কাছে গুরুত্বপূর্ণ, তবে এই মুহূর্তে আমি এটা নিতে পারছি না।” নিজের সময় ও শক্তির যত্ন নেওয়ার অধিকার আপনার আছে; যতটুকু বলতে স্বস্তি লাগে, ততটুকুই যথেষ্ট।`,
  },
  {
    match: /grief|grieving|lost someone|bereav|শোক|কাউকে হারিয়|প্রিয়জন মারা|মৃত্যুতে কষ্ট/,
    answerEn: `I’m so sorry for your loss. Grief can come in waves, and there’s no single right way or timetable for it. For now, try to be gentle with yourself and let someone you trust know what you need—even if it’s just company. You don’t have to carry this alone.`,
    answerBn: `আপনার প্রিয়জনকে হারানোর কষ্টে আমি আন্তরিকভাবে দুঃখিত। শোক ঢেউয়ের মতো আসতে পারে—এর কোনো একটাই ঠিক নিয়ম বা সময়সীমা নেই। আপাতত নিজের সঙ্গে কোমল থাকুন এবং বিশ্বস্ত কাউকে জানান আপনার কী দরকার—শুধু পাশে থাকাও হতে পারে। এই কষ্ট একা বহন করতে হবে না।`,
  },
  {
    match: /confidence|self.?esteem|not good enough|worthless|নিজেকে.*(ভালো লাগে না|অযোগ্য)|আত্মবিশ্বাস|নিজেকে ছোট/,
    answerEn: `I’m sorry you’re being hard on yourself. A painful thought like “I’m not good enough” can feel convincing, but it isn’t the whole story of who you are. Could you name one small thing you handled recently, or one quality a kind person might see in you? You deserve patience while you find your footing.`,
    answerBn: `আপনি নিজের প্রতি খুব কঠোর হয়ে পড়েছেন মনে হচ্ছে—এটা কষ্ট দিতে পারে। “আমি যথেষ্ট ভালো নই” ভাবনাটি সত্যি মনে হলেও, এটি আপনার পুরো পরিচয় নয়। সম্প্রতি সামলেছেন এমন একটি ছোট কাজ, বা আপনার মধ্যে কোনো ভালো গুণ যা প্রিয় কেউ দেখতে পারে—একটি মনে করার চেষ্টা করবেন? নিজের জায়গা খুঁজে নিতে সময় লাগতেই পারে।`,
  },
  {
    match: /relax|unwind|calm myself|মন শান্ত|আরাম করতে|শান্ত হতে|রিল্যাক্স/,
    answerEn: `Let’s make this moment a little softer. If you can, loosen your shoulders, take a sip of water, and choose one gentle thing—stretching, a quiet song, or looking out the window for a minute. You don’t have to feel completely calm; even a tiny pause counts.`,
    answerBn: `চলুন, এই মুহূর্তটাকে একটু কোমল করি। পারলে কাঁধ ঢিলে করুন, এক চুমুক পানি পান করুন, আর একটি শান্ত কাজ বেছে নিন—হালকা স্ট্রেচিং, নরম কোনো গান, বা এক মিনিট জানালার বাইরে তাকানো। পুরোপুরি শান্ত হতেই হবে না; ছোট্ট বিরতিও অনেক।`,
  },
  {
    match: /mental health|what is.*mental|মানসিক স্বাস্থ্য কী|মানসিক সুস্থতা কী/,
    answerEn: `Mental health is part of overall health. It includes how we feel, think, connect with others, and handle everyday ups and downs. It can change over time, and caring for it is just as valid as caring for physical health. You don’t need a diagnosis to deserve support.`,
    answerBn: `মানসিক স্বাস্থ্য সামগ্রিক স্বাস্থ্যেরই একটি অংশ। আমরা কেমন অনুভব করি, চিন্তা করি, অন্যদের সঙ্গে সম্পর্ক রাখি এবং দৈনন্দিন ওঠানামা সামলাই—এসব এর মধ্যে পড়ে। সময়ের সঙ্গে এটি বদলাতে পারে, আর এর যত্ন নেওয়াও শারীরিক স্বাস্থ্যের যত্নের মতোই গুরুত্বপূর্ণ। সহায়তা পাওয়ার জন্য রোগ নির্ণয় থাকা জরুরি নয়।`,
  },
  {
    match: /healthy habit|daily routine|start a routine|ভালো অভ্যাস|দৈনন্দিন রুটিন|অভ্যাস গড়/,
    answerEn: `A caring routine can start very small: a regular glass of water, a little daylight, one stretch, or a few minutes to check in with yourself. Pick something easy enough for a low-energy day, and celebrate showing up rather than doing it perfectly.`,
    answerBn: `যত্নের রুটিন খুব ছোট করে শুরু করা যায়—নিয়মিত এক গ্লাস পানি, একটু দিনের আলো, হালকা স্ট্রেচিং, বা নিজের অনুভূতি খেয়াল করতে কয়েক মিনিট। এমন কিছু বেছে নিন যা শক্তি কম থাকলেও করা সম্ভব; নিখুঁত হওয়ার বদলে চেষ্টা করাটুকুই উদ্‌যাপন করুন।`,
  },
];

export function getOfflineWellnessResponse(message: string, language: Language, ageBand: AgeBand): OfflineResponse {
  if (crisisPatterns.some(pattern => pattern.test(message))) {
    const reply = ageBand === 'child_teen'
      ? language === 'bn'
        ? `আপনি যদি ১৮ বছরের কম হন, এখনই একজন নিরাপদ ও বিশ্বস্ত প্রাপ্তবয়স্ক—যেমন অভিভাবক, শিক্ষক বা কাউন্সেলর—কে জানান এবং একা থাকবেন না। তাৎক্ষণিক বিপদে বাংলাদেশে ৯৯৯ নম্বরে কল করুন বা নিকটস্থ হাসপাতালের জরুরি বিভাগে যান। মানসিক স্বাস্থ্য সহায়তায় ১৬১২২ বা কান পেতে রই ০১৭৭৯৫৫৪৩৯১ নম্বরে যোগাযোগ করতে পারেন। আমি অফলাইন সহকারী হিসেবে জরুরি সেবা দিতে পারি না।`
        : `If you are under 18, please tell a safe, trusted adult now—such as a parent or guardian, teacher, or counselor—and do not stay alone. If you are in immediate danger in Bangladesh, call 999 or go to the nearest emergency department. You can also contact the mental-health helpline at 16122 or Kaan Pete Roi at 01779554391. I’m an offline assistant and can’t provide emergency care.`
      : crisisReplies[language];
    return { reply, isCrisis: true };
  }

  const faq = wellnessFaqs.find(item => item.match.test(message));
  const answer = faq ? (language === 'bn' ? faq.answerBn : faq.answerEn) : null;
  const connectionNotice = language === 'bn'
    ? 'Mind Assistant-এর সঙ্গে এখন সংযোগ করা যাচ্ছে না, তবে আমি যতটা পারি পাশে আছি।'
    : 'Mind Assistant can’t connect right now, but I’ll do my best to support you.';
  const followUp = language === 'bn'
    ? 'এই সাধারণ পরামর্শ চিকিৎসা বা রোগ নির্ণয়ের বিকল্প নয়।'
    : 'This general guidance is not a substitute for professional care or diagnosis.';
  const unableToMatch = language === 'bn'
    ? 'এই প্রশ্নটির নির্দিষ্ট উত্তর এখন আমার জানা নেই, তাই অনুমান করে বলতে চাই না। মানসিক চাপ, উদ্বেগ, ঘুম, মন খারাপ, একাকিত্ব বা শ্বাসের অনুশীলন নিয়ে জিজ্ঞেস করলে আমি যত্ন নিয়ে সাহায্য করার চেষ্টা করব।'
    : 'I don’t have a reliable answer to that specific question while offline, and I don’t want to guess. You can ask about stress, anxiety, sleep, low mood, loneliness, or a breathing exercise, and I’ll do my best to help.';

  return {
    reply: `${connectionNotice}\n\n${answer || unableToMatch}\n\n${followUp}`,
  };
}
