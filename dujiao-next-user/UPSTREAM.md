# dujiao-next-user — 自定义前端

## 上游

- 源仓库：https://github.com/dujiao-next/user
- Fork 时间：2026-04-11
- Fork 原因：为 shop.xiaochens.com 定制视觉样式（墨蓝 + 白底 + Utility 风），
  官方后端 API 完全不改，只改前端表现层

## 改动范围

- `src/theme-override.css`（新增）：主题变量覆盖、Tailwind 圆角/阴影覆盖、价格样式
- `src/main.ts`：引入 theme-override.css
- `src/composables/useProduct.ts`：`formatPrice` 改为货币符号前缀（¥ / $）
- `src/views/Home.vue`：空文章段自动隐藏的条件判断
- `vite.config.ts`：dev-only mock 中间件（生产 build 不会带上）

## 本地开发

```bash
cd dujiao-next-user
pnpm install
pnpm dev
# 打开 http://localhost:5173
# dev 代理已指向 https://shop.xiaochens.com 的真实 API
```

## 构建部署

```bash
pnpm build         # 产出 dist/
rsync -avz -e 'ssh -p 2222' dist/ root@107.172.86.147:/opt/dujiao-next/custom-user/
# 然后改 dujiao-next/nginx.conf 让 location / 直接 serve dist/，替代 dujiaonext-user 容器
```

## 未来拉上游更新

```bash
# 用 worktree 避免污染主工作树
git worktree add /tmp/dn-upstream
cd /tmp/dn-upstream
git remote add upstream https://github.com/dujiao-next/user.git
git fetch upstream main
# 把 upstream 的 src/ 变更 cherry-pick 或手动合并到这里
```

只要不改 `theme-override.css` 和 `useProduct.ts` 里的 `formatPrice`，升级通常不冲突。
