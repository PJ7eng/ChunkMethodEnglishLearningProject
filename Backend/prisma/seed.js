"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const existing = await prisma.chunk.count();
    if (existing > 0) {
        console.log('Seed data already exists.');
        return;
    }
    const poolItem = await prisma.contentPoolItem.create({
        data: {
            category: 'smalltalk',
            difficulty: 'easy',
            status: 'published',
            qualityScore: 0.95,
        },
    });
    const chunk = await prisma.chunk.create({
        data: {
            contentPoolItemId: poolItem.id,
            phrase: 'Break the ice',
            translation: '打破僵局',
            pinyin: 'Dǎpò jiāngjú',
            category: 'smalltalk',
            difficulty: 'easy',
            blank: 'She told a joke to ___ at the party.',
            answer: 'break the ice',
            options: ['break the ice', 'touch base', 'hit the road'],
        },
    });
    await prisma.chunkExample.createMany({
        data: [
            { chunkId: chunk.id, sentence: 'He told a funny joke to break the ice.' },
            { chunkId: chunk.id, sentence: 'A shared laugh can help break the ice quickly.' },
        ],
    });
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
//# sourceMappingURL=seed.js.map