import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const seedChunks = [
  {
    phrase: 'Break the ice',
    translation: '打破僵局',
    pinyin: 'Dǎpò jiāngjú',
    category: 'smalltalk',
    difficulty: 'easy',
    blank: 'She told a joke to ___ at the party.',
    answer: 'break the ice',
    options: ['break the ice', 'touch base', 'hit the road'],
    examples: ['He told a funny joke to break the ice.', 'A shared laugh can help break the ice quickly.'],
  },
  {
    phrase: 'Touch base',
    translation: '簡短聯絡一下',
    pinyin: 'Jiǎnduǎn liánluò yīxià',
    category: 'workplace',
    difficulty: 'medium',
    blank: "Let's ___ tomorrow morning about the launch.",
    answer: 'touch base',
    options: ['touch base', 'get cold feet', 'bite the bullet'],
    examples: ["Let's touch base before the meeting starts.", 'I want to touch base with the client later today.'],
  },
  {
    phrase: 'Get cold feet',
    translation: '臨陣退縮',
    pinyin: 'Línzhèn tuìsuō',
    category: 'smalltalk',
    difficulty: 'medium',
    blank: 'She ___ before giving the presentation.',
    answer: 'got cold feet',
    options: ['got cold feet', 'hit the road', 'broke the ice'],
    examples: ['He got cold feet right before the interview.', 'Do not get cold feet before your big presentation.'],
  },
  {
    phrase: 'Hit the road',
    translation: '出發／上路',
    pinyin: 'Chūfā',
    category: 'travel',
    difficulty: 'easy',
    blank: "It's getting late — we should ___.",
    answer: 'hit the road',
    options: ['hit the road', 'touch base', 'break the ice'],
    examples: ["We need to hit the road before traffic gets bad.", "After breakfast, they hit the road."],
  },
  {
    phrase: 'Bite the bullet',
    translation: '硬著頭皮去做',
    pinyin: 'Yìngzhe tóupí qù zuò',
    category: 'emotions',
    difficulty: 'medium',
    blank: 'I finally ___ and booked the dentist.',
    answer: 'bit the bullet',
    options: ['bit the bullet', 'hit the road', 'touched base'],
    examples: ['She bit the bullet and told him the truth.', 'Sometimes you just have to bite the bullet.'],
  },
  {
    phrase: 'Under the weather',
    translation: '身體不舒服',
    pinyin: 'Shēntǐ bù shūfú',
    category: 'emotions',
    difficulty: 'easy',
    blank: "I'm feeling a bit ___ today.",
    answer: 'under the weather',
    options: ['under the weather', 'on the same page', 'out of the blue'],
    examples: ["She's under the weather and staying home.", "I felt under the weather after the flight."],
  },
  {
    phrase: 'On the same page',
    translation: '達成共識／想法一致',
    pinyin: 'Dáchéng gòngshí',
    category: 'workplace',
    difficulty: 'medium',
    blank: "Let's make sure we're all ___ before we launch.",
    answer: 'on the same page',
    options: ['on the same page', 'under the weather', 'out of the blue'],
    examples: ['The team needs to be on the same page.', "Are we on the same page about the deadline?"],
  },
  {
    phrase: 'Out of the blue',
    translation: '突然地、出乎意料',
    pinyin: 'Tūrán de',
    category: 'smalltalk',
    difficulty: 'medium',
    blank: 'He called me ___ after five years.',
    answer: 'out of the blue',
    options: ['out of the blue', 'on the same page', 'hit the road'],
    examples: ['The offer came out of the blue.', 'She showed up out of the blue.'],
  },
  {
    phrase: 'Catch a flight',
    translation: '趕飛機',
    pinyin: 'Gǎn fēijī',
    category: 'travel',
    difficulty: 'easy',
    blank: 'We need to leave now to ___.',
    answer: 'catch a flight',
    options: ['catch a flight', 'break the ice', 'touch base'],
    examples: ["I'm rushing to catch a flight to Tokyo.", 'She almost missed catching her flight.'],
  },
  {
    phrase: 'Think outside the box',
    translation: '跳出框架思考',
    pinyin: 'Tiào chū kuàngjià sīkǎo',
    category: 'workplace',
    difficulty: 'hard',
    blank: 'We need to ___ to solve this problem.',
    answer: 'think outside the box',
    options: ['think outside the box', 'get cold feet', 'hit the road'],
    examples: ['Great designers think outside the box.', 'Try thinking outside the box this time.'],
  },
  {
    phrase: 'Keep your chin up',
    translation: '振作起來／別氣餒',
    pinyin: 'Zhènzuò qǐlái',
    category: 'emotions',
    difficulty: 'easy',
    blank: '___ — things will get better.',
    answer: 'Keep your chin up',
    options: ['Keep your chin up', 'Hit the road', 'Touch base'],
    examples: ['Keep your chin up after the rejection.', 'Friends told her to keep her chin up.'],
  },
  {
    phrase: 'A piece of cake',
    translation: '小菜一碟／很容易',
    pinyin: 'Xiǎocài yī dié',
    category: 'random',
    difficulty: 'easy',
    blank: 'The quiz was ___ for her.',
    answer: 'a piece of cake',
    options: ['a piece of cake', 'under the weather', 'out of the blue'],
    examples: ['Learning this phrase is a piece of cake.', 'The hike was a piece of cake.'],
  },
  {
    phrase: 'Call it a day',
    translation: '今天就到此為止',
    pinyin: 'Jīntiān jiù dào cǐ wéizhǐ',
    category: 'workplace',
    difficulty: 'easy',
    blank: "We've done enough — let's ___.",
    answer: 'call it a day',
    options: ['call it a day', 'break the ice', 'catch a flight'],
    examples: ["Let's call it a day and go home.", 'After ten hours, they called it a day.'],
  },
  {
    phrase: 'Travel light',
    translation: '輕裝出行',
    pinyin: 'Qīngzhuāng chūxíng',
    category: 'travel',
    difficulty: 'easy',
    blank: 'I always ___ when I go backpacking.',
    answer: 'travel light',
    options: ['travel light', 'touch base', 'bite the bullet'],
    examples: ['She prefers to travel light.', 'Travel light if you have a long layover.'],
  },
  {
    phrase: 'Spill the tea',
    translation: '爆料／八卦',
    pinyin: 'Bàoliào',
    category: 'smalltalk',
    difficulty: 'medium',
    blank: 'Come on, ___ about the reunion.',
    answer: 'spill the tea',
    options: ['spill the tea', 'call it a day', 'travel light'],
    examples: ['She spilled the tea about the surprise party.', "Don't spill the tea too soon."],
  },
];

function phraseKey(phrase: string): string {
  return phrase.trim().replace(/\s+/g, ' ').toLowerCase();
}

function metadata(chunk: (typeof seedChunks)[number]) {
  const cefr = chunk.difficulty === 'easy' ? 'A2' : chunk.difficulty === 'medium' ? 'B1' : 'B2';
  return {
    phraseKey: phraseKey(chunk.phrase),
    usage: `A common ${chunk.category} expression meaning “${chunk.translation}”.`,
    register: 'neutral',
    cefr,
  };
}

async function main(): Promise<void> {
  for (const chunkData of seedChunks) {
    const existing = await prisma.chunk.findUnique({ where: { phraseKey: phraseKey(chunkData.phrase) } });
    if (existing) {
      await prisma.$transaction([
        prisma.chunk.update({
          where: { id: existing.id },
          data: {
            phrase: chunkData.phrase,
            translation: chunkData.translation,
            pinyin: chunkData.pinyin,
            blank: chunkData.blank,
            answer: chunkData.answer,
            options: chunkData.options,
            ...metadata(chunkData),
          },
        }),
        prisma.chunkExample.deleteMany({ where: { chunkId: existing.id } }),
      ]);
      await prisma.chunkExample.createMany({
        data: chunkData.examples.map((sentence, orderIndex) => ({
          chunkId: existing.id,
          sentence,
          orderIndex,
        })),
      });
      continue;
    }

    const poolItem = await prisma.contentPoolItem.create({
      data: {
        category: chunkData.category,
        difficulty: chunkData.difficulty,
        status: 'published',
        qualityScore: 0.92,
      },
    });

    const chunk = await prisma.chunk.create({
      data: {
        contentPoolItemId: poolItem.id,
        phrase: chunkData.phrase,
        ...metadata(chunkData),
        translation: chunkData.translation,
        pinyin: chunkData.pinyin,
        category: chunkData.category,
        difficulty: chunkData.difficulty,
        blank: chunkData.blank,
        answer: chunkData.answer,
        options: chunkData.options,
        status: 'active',
      },
    });

    await prisma.chunkExample.createMany({
      data: chunkData.examples.map((sentence, orderIndex) => ({ chunkId: chunk.id, sentence, orderIndex })),
    });

    const quiz = await prisma.quizQuestion.create({
      data: {
        contentPoolItemId: poolItem.id,
        prompt: chunkData.blank,
        correctAnswerChunkId: chunk.id,
        difficulty: chunkData.difficulty,
        status: 'active',
      },
    });

    await prisma.quizOption.createMany({
      data: chunkData.options.map((opt, index) => ({
        quizQuestionId: quiz.id,
        chunkId: chunk.id,
        isCorrect: opt.toLowerCase() === chunkData.answer.toLowerCase(),
        orderIndex: index,
      })),
    });
  }

  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  if (superAdminEmail) {
    await prisma.user.update({
      where: { email: superAdminEmail },
      data: { role: 'super_admin', emailVerifiedAt: new Date() },
    });
    console.log(`Promoted ${superAdminEmail} to super_admin.`);
  }

  console.log('Seed data ensured.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
