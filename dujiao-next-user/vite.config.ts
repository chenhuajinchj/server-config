import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const cfAsyncModuleScriptPlugin = () => ({
  name: 'cfasync-module-script',
  transformIndexHtml(html: string) {
    return html.replace(
      /<script\s+type="module"(?![^>]*data-cfasync)/g,
      '<script data-cfasync="false" type="module"',
    )
  },
})

// Dev-only: serve fake products/categories so empty-state server still shows
// a realistic storefront while we iterate on design. Zero production impact.
const devMockPlugin = () => {
  const loc = (zh: string, en?: string) => ({ 'zh-CN': zh, 'zh-TW': zh, 'en-US': en || zh })
  const mkCategory = (id: number, slug: string, zh: string, en: string) => ({
    id, slug, icon: '', parent_id: 0, sort_order: id,
    name: loc(zh, en),
    description: loc(''),
  })
  const categories = [
    mkCategory(1, 'chatgpt', 'ChatGPT 账号', 'ChatGPT Accounts'),
    mkCategory(2, 'claude', 'Claude 账号', 'Claude Accounts'),
    mkCategory(3, 'midjourney', 'Midjourney 订阅', 'Midjourney'),
    mkCategory(4, 'other', '其他', 'Other'),
  ]
  const mkProduct = (id: number, slug: string, categoryId: number, zh: { title: string; desc: string }, en: { title: string; desc: string }, price: string, promo: string | null, stock: number, tags: string[]) => {
    const cat = categories.find(c => c.id === categoryId)!
    return {
      id, slug,
      title: loc(zh.title, en.title),
      description: loc(zh.desc, en.desc),
      images: [],
      tags,
      category: { id: cat.id, slug: cat.slug, name: cat.name, icon: '' },
      purchase_type: 'guest',
      fulfillment_type: 'auto',
      stock_status: stock > 0 ? 'in_stock' : 'out_of_stock',
      auto_stock_available: stock,
      manual_stock_available: 0,
      price_amount: price,
      promotion_price_amount: promo,
      promotion_rules: [],
      is_sold_out: stock === 0,
      sku_options: [],
      sort_order: id,
    }
  }
  const products = [
    mkProduct(1, 'chatgpt-plus-monthly', 1,
      { title: 'ChatGPT Plus 独享账号（月卡）', desc: '全新独享账号，开卡即用，含 GPT-5 与高级语音' },
      { title: 'ChatGPT Plus Account (Monthly)', desc: 'Brand-new dedicated account, GPT-5 and advanced voice included' },
      '158.00', '128.00', 42, ['独享', '即时发卡']),
    mkProduct(2, 'chatgpt-plus-quarterly', 1,
      { title: 'ChatGPT Plus 独享账号（季卡）', desc: '三个月独享，合约期内提供补号' },
      { title: 'ChatGPT Plus Account (Quarterly)', desc: 'Three months dedicated, replacement guaranteed' },
      '474.00', '348.00', 18, ['独享', '包补号']),
    mkProduct(3, 'chatgpt-api-key', 1,
      { title: 'ChatGPT API Key · $5 额度', desc: '官方同源转发，即时发卡，支持 GPT-5 / o1' },
      { title: 'ChatGPT API Key · $5 credit', desc: 'Official upstream relay, instant delivery' },
      '36.00', null, 9999, ['API', '即时发卡']),
    mkProduct(4, 'claude-pro-monthly', 2,
      { title: 'Claude Pro 独享账号（月卡）', desc: 'Opus 4.6 + Sonnet 4.6 全量开放，200K 上下文' },
      { title: 'Claude Pro Account (Monthly)', desc: 'Full Opus 4.6 & Sonnet 4.6, 200K context' },
      '138.00', null, 26, ['独享', 'Opus 4.6']),
    mkProduct(5, 'claude-api-key', 2,
      { title: 'Claude API Key · $5 额度', desc: '支持 Opus / Sonnet / Haiku，稳定可退款' },
      { title: 'Claude API Key · $5 credit', desc: 'Opus / Sonnet / Haiku supported' },
      '38.00', null, 9999, ['API', '稳定']),
    mkProduct(6, 'midjourney-basic', 3,
      { title: 'Midjourney 基础版（月卡）', desc: '200 张 Fast 出图，公共频道，即时交付' },
      { title: 'Midjourney Basic (Monthly)', desc: '200 Fast images, public channel, instant delivery' },
      '88.00', '78.00', 31, ['即时发卡']),
    mkProduct(7, 'midjourney-standard', 3,
      { title: 'Midjourney 标准版（月卡）', desc: '15 小时 Fast 出图 + 无限 Relax' },
      { title: 'Midjourney Standard (Monthly)', desc: '15 Fast hours + unlimited Relax' },
      '228.00', '198.00', 14, ['热卖']),
    mkProduct(8, 'custom-request', 4,
      { title: '自定义需求 / 其他服务', desc: '有特殊需求？Telegram 联系人工报价' },
      { title: 'Custom Request', desc: 'Telegram us for a custom quote' },
      '0.00', null, 9999, ['人工报价']),
  ]
  const banners: any[] = [] // empty → Home hides hero section automatically
  const ok = (data: unknown, pagination?: unknown) => ({ status_code: 0, msg: 'success', data, ...(pagination ? { pagination } : {}) })

  return {
    name: 'dev-mock-shop',
    apply: 'serve' as const,
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        if (!req.url || !req.url.startsWith('/api/v1/public/')) return next()
        const url = new URL(req.url, 'http://x')
        const p = url.pathname
        const send = (body: unknown) => {
          res.setHeader('content-type', 'application/json; charset=utf-8')
          res.end(JSON.stringify(body))
        }
        if (p === '/api/v1/public/categories') return send(ok(categories))
        if (p === '/api/v1/public/banners') return send(ok(banners))
        if (p === '/api/v1/public/products') {
          const slug = url.searchParams.get('category_slug') || url.searchParams.get('category')
          const list = slug ? products.filter(x => x.category.slug === slug) : products
          return send(ok(list, { page: 1, page_size: 20, total: list.length, total_page: 1 }))
        }
        const detailMatch = p.match(/^\/api\/v1\/public\/products\/([^/]+)$/)
        if (detailMatch) {
          const slug = detailMatch[1]
          const item = products.find(x => x.slug === slug)
          if (item) return send(ok({ ...item, sold_count: 128 }))
          return send({ status_code: 404, msg: 'not_found', data: null })
        }
        if (p === '/api/v1/public/posts') return send(ok([], { page: 1, page_size: 20, total: 0, total_page: 0 }))
        return next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [vue(), devMockPlugin(), cfAsyncModuleScriptPlugin()],
  esbuild: mode === 'production' ? { drop: ['console', 'debugger'] } : {},
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-qrcode': ['qrcode'],
          'vendor-vue-i18n': ['vue-i18n'],
        },
      },
    },
  },
  server: {
    host: '0.0.0.0', // 监听所有网络接口
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'https://shop.xiaochens.com',
        changeOrigin: true,
        secure: true,
      },
      '/uploads': {
        target: 'https://shop.xiaochens.com',
        changeOrigin: true,
        secure: true,
      }
    }
  },
}))
