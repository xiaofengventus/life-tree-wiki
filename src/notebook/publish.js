// Notebook → 站点文章的提交链路。
//
// ── 与旧版 /laup 写作页同一条发布管道
//   服务端（server/laup.js + functions/api/posts）只收 **Laup 源码**
//   （contentFormat: 'laup'），由站内置的 Laup 渲染器在服务端重渲 + 白名单自检，
//   入库 HTML 100% 由 Laup 产出；展示走 WikiPostDetail（wiki-detail 样式）。
//
// ── 图片：格附件 → 站点媒体库
//   Notebook 的粘贴/上传图片以 data URL 存在格附件里；站点的发布通道不允许 data:
//   图（server/laup.js 的 assertSafeUrls 会 400）。所以提交前把每个 data URL
//   上传到 POST /api/media（requireUser），换成 /media/<hash> 的站内 URL。
//   复用站点的 prepareImageBlob（压缩到 ≤1.8MB / 最长边 1920）与 uploadPreparedImage。

import { createPost, updatePost } from '@/services/posts'
import { prepareImageBlob, uploadPreparedImage } from '@/utils/mediaImages'

// 比 mediaImages.js 的 DATA_IMAGE_PATTERN 宽：GIF/SVG 附件也收（GIF 会被压成静态 WebP）
const DATA_URL_RE = /^data:image\/(?:png|jpe?g|gif|webp|svg\+xml);base64,/i

function dataUrlToBlob(dataUrl) {
  const value = String(dataUrl || '')
  if (!DATA_URL_RE.test(value)) throw new Error('只支持把 PNG / JPG / WebP / GIF / SVG 图片提交为文章配图')
  const comma = value.indexOf(',')
  const mimeType = value.slice(5, value.indexOf(';', 5)).toLowerCase()
  const binary = atob(value.slice(comma + 1))
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  return new Blob([bytes], { type: mimeType })
}

function collectAttachmentUrls(cells) {
  const urls = new Set()
  for (const c of cells) {
    for (const v of Object.values(c.attachments || {})) {
      if (DATA_URL_RE.test(String(v))) urls.add(v)
    }
  }
  return [...urls]
}

/**
 * 提交 Notebook 为站内文章。
 * @param cells    Notebook 格数组（store.cells）
 * @param scope    变量作用域（store.scope）
 * @param meta     { title, author, tags, type, license, visibility }
 * @param user     已登录用户（userStore.user），用于 creatorUid / 作者回退
 * @param onStep   (done, total, stage) 进度回调；stage: 'upload' | 'submit'
 * @param edit     编辑已发布文章时传 { id, version }（乐观锁版本号，PUT /api/posts/:id）；
 *                 null = 新建文章
 * @returns 保存后的文章对象（含 uid/title/visibility）
 */
export async function publishNotebook(cells, scope, meta, user, onStep = () => {}, edit = null) {
  // ① 附件上传（唯一化：同一张图只传一次）
  const urls = collectAttachmentUrls(cells)
  const urlMap = new Map()
  for (let i = 0; i < urls.length; i++) {
    onStep(i, urls.length, 'upload')
    const prepared = await prepareImageBlob(dataUrlToBlob(urls[i]), { allowSvg: true })
    const image = await uploadPreparedImage(prepared)
    urlMap.set(urls[i], image.url)
  }
  onStep(urls.length, urls.length, 'upload')

  // ② 导出 Laup 源码（附件 data URL → /media/<hash>）
  onStep(0, 1, 'submit')
  const { exportLaupDoc } = await import('./renderer.js')
  const content = exportLaupDoc(cells, scope, urlMap)
  if (!content.replace(/import\s+"laup"|\s/g, '')) {
    const err = new Error('正文为空：至少写一个 laup 格再提交')
    err.code = 'EMPTY_CONTENT'
    throw err
  }

  // ③ payload 与旧版 laup 写作页逐字段对齐
  const now = new Date().toISOString()
  const payload = {
    id: edit?.id || null,
    version: edit?.version || 1,
    title: meta.title.trim(),
    author: meta.author.trim() || user?.display_name || user?.nickname || '',
    creatorUid: user?.uid || null,
    content,
    contentFormat: 'laup',
    tags: meta.tags,
    type: meta.type,
    license: meta.license,
    visibility: meta.visibility,
    changeNote: meta.changeNote || (edit ? '更新文章' : '创建文章'),
    submittedAt: now,
    updatedAt: now,
    revisionCount: 1,
    isMinorChange: false,
    minorChangeNote: '',
  }
  const saved = edit
    ? await updatePost(edit.id, payload)
    : await createPost(payload)
  onStep(1, 1, 'submit')
  return saved
}
