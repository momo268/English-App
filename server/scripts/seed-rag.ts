import dotenv from 'dotenv'
import { PrismaClient } from '../libs/shared/src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { RAG_CORPUS } from '../apps/ai/src/coach/corpus'

dotenv.config()

async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    }),
  })

  let created = 0
  let updated = 0

  for (const item of RAG_CORPUS) {
    const existing = await prisma.knowledgeChunk.findUnique({
      where: { key: item.key },
      select: { id: true },
    })
    await prisma.knowledgeChunk.upsert({
      where: { key: item.key },
      create: item,
      update: item,
    })
    if (existing) updated += 1
    else created += 1
  }

  console.log(`RAG 语料写入完成：新增 ${created} 条，更新 ${updated} 条，共 ${RAG_CORPUS.length} 条`)
  await prisma.$disconnect()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
