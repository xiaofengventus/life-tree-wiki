# 生命时序

Vue 3 + Vite 前端，部署到 Cloudflare Pages；动态 API 使用 Pages Functions，数据库使用 D1。文章和进化树草稿采用 IndexedDB 本地优先缓存。

## 安全模型

- 登录态只使用 `HttpOnly; Secure; SameSite=Lax` Session Cookie，前端不保存 token。
- 匿名访客依靠不含凭据的 `life_auth_hint` 提示 Cookie 跳过 `/api/auth/me`，提示值不参与权限判断。
- 密码使用 Web Crypto PBKDF2-SHA256、独立随机盐和 Cloudflare Workers 支持的最高值 100,000 次迭代。
- 首个管理员只能由 `BOOTSTRAP_INVITE_CODE` 创建；之后每个注册必须消费一个服务端一次性邀请码。
- 管理员也可创建有有效期和人数上限的多人注册链接；它与一次性邀请码并行，支持随时撤销，仍受 Turnstile、设备限制和 `MAX_USERS` 约束。
- 同一浏览器安装由服务端设备 Cookie 限制为一个账号，但 Cookie 可以被清除，因此最终注册总量由一次性邀请码和 `MAX_USERS` 控制。
- MAC 地址不会通过互联网传到 Cloudflare，浏览器也不提供读取接口，不能用于注册限制。
- Turnstile 必须经过 Pages Function 服务端验证；没有生产密钥时认证默认关闭。
- 文章权限、作者身份和版本冲突全部由服务端验证；正文在服务端和客户端分别按严格白名单清洗。
- 用户树发布到 D1 前会限制体积、节点数和层级，并清洗链接、图片、样式及重复节点 UID。
- 文章正文支持插入编号引用并在文末集中展示参考文献。
- 图片二进制文件只存入私有 R2，D1 只保存哈希、尺寸、所有者、额度和文章/树引用关系；公开读取由 `/media/:hash` Function 代理并设置不可变缓存。

## 本地图片、XMind 图片与专业用户额度

- 头像和文章封面使用 MIT 许可的 [Cropper.js](https://github.com/fengyuanchen/cropperjs) 在浏览器中完成拖动、缩放、旋转和定比裁剪；头像输出为 512×512，封面输出为 1200×675，均转为 WebP 后才上传。
- 文章编辑器和进化树编辑器都可以直接选择本地 JPEG、PNG、WebP 或 GIF；GIF 会转成静态 WebP。
- 浏览器会先把长边限制为 1,920 像素，并把单张图片压缩到 1.8MB 以内，再上传到 R2。这样不会把大图塞进 D1，也不会让 Pages Function 接收原始超大文件。
- XMind 新版 `content.json` 和 XMind 8 `content.xml` 中的内嵌图片会随主题导入。压缩包内的 PNG、JPEG、WebP、GIF 和经过清洗的 SVG 会转为本地草稿图片，发布时再统一上传。
- R2 对图片内容做 SHA-256 去重：同一用户重复上传或多个用户使用完全相同的文件，R2 中只保留一份对象。
- 普通用户默认图片额度为 20MB。管理员可在 `/admin/users` 查看每人已用空间，并把专业用户单独提高到 100MB、500MB、1GB 等；全站默认安全上限为 8GB。
- 用户可从自己的空间进入 `/media-library` 查看图片、用量和引用数。被文章或进化树引用的图片不能删除；未引用图片可删除并立即返还个人额度。
- 草稿图片保存在浏览器 IndexedDB 中，发布后正文和树只保存短的 `/media/<hash>` 地址。上传队列最多并发 3 张，适合包含大量图片的专业树，又不会突然占满 Worker 连接。

## 进化树发布

- 用户可在统一的 `/evolution-tree` 工作台制作进化树；登录后可投稿或更新到 Research。
- 文章与进化树编辑器会在停止操作后自动保存到当前浏览器的 IndexedDB；`/drafts` 可统一恢复、复制或删除本地草稿。
- 登录用户还可将未完成的文章或进化树显式保存为“仅自己可见”，以便跨设备继续编辑；两类私密作品共用 5 个名额，不进入公开列表、互动、版本和经验系统。
- 私密作品首次公开时才执行完整发布校验并建立第一个正式版本；已经公开的作品不能改回私密状态。
- 新建、编辑已发布内容、Fork 和 Contribution 都会保存各自的目标与基础版本；恢复时如果服务器已有新版本，会先提示冲突。
- 发布成功后自动清理对应草稿，发布失败继续保留；提交声明不会随草稿恢复，作者需要重新确认。
- 进化树节点可统一关联站内文章、站内进化树和外部 HTTPS 链接；旧版 `articleLinks` 会在读取时迁移为 `contentLinks`。关联树在侧栏只读预览一层，避免循环关联无限嵌套。
- `/art-trees` 提供独立的“艺术树相”公开画廊；`/art-tree/:id` 可将原树实时渲染为植物花开或晶体生长，并保留节点图片、引用和站内内容链接。
- Research 中的用户树拥有公开详情页；文章编辑器可插入已发布树，正文页将其渲染为交互式只读树块。
- 文章卡片统一分为生物卡片和自定义卡片；同一卡片可同时显示在正文当前位置和目录下方，正文只保存安全的卡片 ID 占位符。
- 作者可在已发布树的详情页自荐，管理员也可提名其他作者的树；审核通过只给原树增加“平台推荐”标识，不复制内容或改变维护权。
- 作者自荐由管理员审核，管理员提名由原作者确认；新版本默认延续已通过状态，管理员可单独取消推荐。
- D1 平台推荐树会优先出现在 Communication；`public/trees/*.xur` 静态目录继续作为离线和故障后备。
- 每次更新都会检查乐观版本号并写入 `tree_revisions`，避免并发覆盖。

## 公开 UID、用户空间与管理后台

- 数据库内部继续使用随机 UUID 作为关联主键；公开界面使用按创建顺序生成的 `U000001`（用户）、`P000001`（文章）和 `T000001`（进化树）。
- 新公开 UID 可直接用于文章、进化树和用户空间网址；历史 UUID 网址保持兼容。
- `/user-space` 是登录用户的主人模式，可编辑资料并管理自己的作品；`/users/U000001` 是公开访客模式，只显示公开资料、文章和进化树。
- 管理员可从自己的用户空间进入 `/admin/users`，按 UID、用户名或昵称搜索，修改角色、等级，以及停用或恢复账号。
- 用户空间的邀请码管理同时支持一次性邀请码和多人注册链接。多人链接使用 `/login#invite=...`，密钥片段不会进入普通 HTTP 请求日志，明文只在创建响应中显示一次。
- 停用会立即撤销该用户全部 Session。管理接口不返回密码哈希、设备标识或会话数据，并通过原子条件更新保证至少保留一名可用管理员。

## 本地开发

```powershell
npm install
Copy-Item .dev.vars.example .dev.vars
npm run db:migrate:local
npm run cf:dev
```

`.dev.vars.example` 使用 Cloudflare 官方测试 Turnstile 密钥。请先把其中的启动邀请码和两个 pepper 换成长随机值。本地站点通常由 Wrangler 显示在 `http://localhost:8788`。

普通的纯前端开发仍可运行 `npm run dev`，但 `/api/*` 不存在，因此登录、注册和文章发布不会工作。

## 首次部署到 Cloudflare Pages

1. 在 Cloudflare 创建 D1 数据库：

   ```powershell
   npx wrangler d1 create life-tree
   ```

   将命令返回的 `database_id` 替换 `wrangler.jsonc` 中仅供本地开发的
   `00000000-0000-0000-0000-000000000001`，然后应用迁移：

   ```jsonc
   "d1_databases": [{
     "binding": "DB",
     "database_name": "life-tree",
     "database_id": "这里填写真实 UUID",
     "migrations_dir": "migrations"
   }]
   ```

   ```powershell
   npm run db:migrate:remote
   ```

2. 创建私有 R2 图片桶（不需要开启公开域名）：

   ```powershell
   npx wrangler r2 bucket create life-tree-media
   ```

   `wrangler.jsonc` 已把它绑定为 `MEDIA`。如果改用控制台部署，在 Pages 项目 `Settings > Bindings` 中也要分别给 Production 和 Preview 添加名为 `MEDIA` 的 R2 binding。
3. 在 Pages 项目 `Settings > Bindings` 添加 D1 binding：变量名必须为 `DB`，选择刚创建的 `life-tree` 数据库。生产和 Preview 环境要分别配置。
4. 创建 Turnstile Widget，将站点域名加入允许列表。
5. 在 Pages 项目配置变量：
   - `TURNSTILE_SITE_KEY`：Turnstile 公开 site key。
   - `MAX_USERS`：账户总量硬上限，例如 `500`。
   - `MEDIA_GLOBAL_LIMIT_BYTES`：可选，全站图片安全上限；不设置时为 8GB。
6. 在 Pages Secrets 配置：
   - `TURNSTILE_SECRET`
   - `BOOTSTRAP_INVITE_CODE`：长随机值，仅用于首个管理员。
   - `INVITE_PEPPER`：长随机值。
   - `DEVICE_PEPPER`：另一个长随机值。
7. Git 构建参数：Build command 为 `npm run build`，输出目录为 `dist`，Node 版本为 `22.18.0`。
8. 首次部署后，用 `BOOTSTRAP_INVITE_CODE` 注册第一个账户。数据库为空时该账户自动成为管理员。
9. 登录管理员账户，在用户空间生成一次性邀请码。确认首个管理员创建成功后，从 Pages Secrets 删除 `BOOTSTRAP_INVITE_CODE`。

生产环境绝对不要设置 `ALLOW_INSECURE_DEV=true`。

## 本地缓存策略

- `posts`：公开文章摘要及已访问正文。
- `life-sequence-workspace/drafts`：文章和进化树的统一本地草稿，按登录账号或当前浏览器的匿名身份隔离。
- `publishedTrees`：已访问的 Research 用户树和 D1 平台推荐树缓存。
- `meta`：同步游标和刷新时间。
- Service Worker 缓存静态资源、页面壳、公开进化树和按内容哈希命名的 `/media/*` 图片；明确绕过所有 `/api/*` 请求。
- 公开文章使用增量同步；登录态和用户资料响应始终 `no-store`。

浏览器可能回收 IndexedDB，因此重要进化树仍应定期导出 `.xur` 文件。正式发布的文章以 D1 为唯一可信数据源。

## 常用命令

```powershell
npm run dev
npm run build
npm run cf:dev
npm run cf:deploy
npm run db:migrate:local
npm run db:migrate:remote
```
