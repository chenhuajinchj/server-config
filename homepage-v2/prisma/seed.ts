import { PrismaClient } from '../src/generated/prisma'

const prisma = new PrismaClient()

async function main() {
  // Seed projects
  await prisma.project.createMany({
    data: [
      {
        title: '个人主页',
        description: '基于 Next.js 构建的个人主页，展示项目和服务状态。',
        url: 'https://xiaochens.com',
        tags: JSON.stringify(['Next.js', 'React', 'TypeScript']),
        featured: true,
        sortOrder: 1,
      },
      {
        title: 'AI 客户端',
        description: '支持多模型的 AI 对话客户端。',
        url: 'https://ai.xiaochens.com',
        tags: JSON.stringify(['AI', 'ChatGPT', 'Claude']),
        featured: true,
        sortOrder: 2,
      },
      {
        title: '图床服务',
        description: '基于 Lsky Pro 的图片托管服务。',
        url: 'https://img.xiaochens.com',
        tags: JSON.stringify(['Lsky Pro', '图床']),
        featured: false,
        sortOrder: 3,
      },
    ],
  })

  // Seed services
  await prisma.service.createMany({
    data: [
      { name: '博客', url: 'https://blog.xiaochens.com', icon: 'book-open', sortOrder: 1 },
      { name: '图床', url: 'https://img.xiaochens.com', icon: 'image', sortOrder: 2 },
      { name: 'AI 客户端', url: 'https://ai.xiaochens.com', icon: 'bot', sortOrder: 3 },
      { name: 'API 管理', url: 'https://api.xiaochens.com', icon: 'key', sortOrder: 4 },
      { name: '商城', url: 'https://shop.xiaochens.com', icon: 'shopping-cart', sortOrder: 5 },
    ],
  })

  console.log('Seed data created successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
