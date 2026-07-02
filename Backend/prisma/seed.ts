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
    examples: ['He got cold feet right before the interview.'],
  },
];

async function main(): Promise<void> {
  const existing = await prisma.chunk.count();
  if (existing > 0) {
    console.log('Seed data already exists.');
    return;
  }

  for (const chunkData of seedChunks) {
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
        translation: chunkData.translation,
        pinyin: chunkData.pinyin,
        category: chunkData.category,
        difficulty: chunkData.difficulty,
        blank: chunkData.blank,
        answer: chunkData.answer,
        options: chunkData.options,
      },
    });

    await prisma.chunkExample.createMany({
      data: chunkData.examples.map((sentence) => ({ chunkId: chunk.id, sentence })),
    });
  }

  console.log('Seed data created.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
