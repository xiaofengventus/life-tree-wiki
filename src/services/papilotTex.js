import JSZip from 'jszip'

const MAX_TOTAL_BYTES = 4 * 1024 * 1024
const MAX_FILES = 200
const TEXT_EXTENSIONS = /\.(?:tex|sty|cls|bib|bst|txt|md|mkiv|mkvi|ltx|fd|cfg|def|log)$/i

function fail(message) {
  throw new Error(`TeX 项目无效：${message}`)
}

function toUint8Array(value) {
  if (value instanceof Uint8Array) return value
  if (value instanceof ArrayBuffer) return new Uint8Array(value)
  if (ArrayBuffer.isView(value)) return new Uint8Array(value.buffer, value.byteOffset, value.byteLength)
  return null
}

function bytesToBase64(bytes) {
  if (typeof Buffer !== 'undefined' && typeof Buffer.from === 'function') return Buffer.from(bytes).toString('base64')
  let result = ''
  const chunkSize = 0x8000
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    result += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize))
  }
  return btoa(result)
}

function base64ToBytes(base64) {
  if (typeof base64 !== 'string' || !/^[A-Za-z0-9+/]*={0,2}$/.test(base64) || base64.length % 4 === 1) fail('文件内容不是有效的 Base64')
  if (typeof Buffer !== 'undefined' && typeof Buffer.from === 'function') return new Uint8Array(Buffer.from(base64, 'base64'))
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  return bytes
}

function normalizePath(input) {
  const path = String(input || '').replaceAll('\\', '/')
  if (!path || path.endsWith('/') || path.startsWith('/') || /^[A-Za-z]:/.test(path) || path.split('/').some(part => !part || part === '.' || part === '..') || path.includes('\0')) fail(`危险路径：${input}`)
  return path
}

function projectName(name) {
  return String(name || 'tex-project').replace(/\.(?:zip|tex)$/i, '').replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').replace(/_main$/i, '').trim() || 'tex-project'
}

function folderName(path, fallback) {
  const normalized = String(path || '').replaceAll('\\', '/')
  return projectName(normalized.includes('/') ? normalized.split('/')[0] : fallback)
}

async function readInput(file) {
  if (file && typeof file.arrayBuffer === 'function') return new Uint8Array(await file.arrayBuffer())
  if (file instanceof ArrayBuffer || ArrayBuffer.isView(file) || file instanceof Uint8Array) return toUint8Array(file)
  fail('导入项不是可读取的文件')
}

function filePath(file) {
  return file.webkitRelativePath || file.relativePath || file.path || file.name
}

function chooseEntry(files) {
  const texFiles = files.filter(file => TEXT_EXTENSIONS.test(file.path))
  return (texFiles.find(file => /(^|\/)main\.tex$/i.test(file.path)) || texFiles.find(file => /\\documentclass(?:\[[^\]]*\])?\s*\{/i.test(decodeTexText(file.content))) || texFiles.find(file => /(^|\/)main\.(?:tex|ltx)$/i.test(file.path)) || texFiles[0] || files[0])?.path || ''
}

export function encodeTexText(text) {
  const bytes = new TextEncoder().encode(String(text ?? ''))
  return bytesToBase64(bytes)
}

export function decodeTexText(base64) {
  return new TextDecoder().decode(base64ToBytes(base64))
}

export async function importTexProject(files) {
  const inputs = Array.from(files || [])
  if (!inputs.length) fail('没有选择文件')
  if (inputs.length === 1 && /\.zip$/i.test(filePath(inputs[0]) || inputs[0].name || '')) {
    const zipBytes = await readInput(inputs[0])
    if (zipBytes.byteLength > MAX_TOTAL_BYTES) fail('档案超过 4 MiB')
    let zip
    try { zip = await JSZip.loadAsync(zipBytes, { checkCRC32: true, createFolders: false }) } catch (cause) { throw new Error(`TeX 项目无效：ZIP 读取失败（${cause.message}）`) }
    const entries = Object.values(zip.files).filter(entry => !entry.dir)
    if (entries.length > MAX_FILES) fail('文件数量超过 200')
    let total = 0
    const output = []
    const paths = new Set()
    for (const entry of entries) {
      const path = normalizePath(entry.name)
      if (paths.has(path)) fail(`重复路径：${path}`)
      paths.add(path)
      const declaredSize = Number(entry._data?.uncompressedSize)
      if (Number.isFinite(declaredSize) && declaredSize > MAX_TOTAL_BYTES - total) fail('解压后总大小超过 4 MiB')
      const bytes = await entry.async('uint8array')
      total += bytes.byteLength
      if (total > MAX_TOTAL_BYTES) fail('解压后总大小超过 4 MiB')
      output.push({ path, content: bytesToBase64(bytes) })
    }
    const name = projectName(filePath(inputs[0]) || inputs[0].name)
    return { name, document: { entry: chooseEntry(output), files: output } }
  }

  if (inputs.length > MAX_FILES) fail('文件数量超过 200')
  let total = 0
  const output = []
  const paths = new Set()
  for (const file of inputs) {
    const path = normalizePath(filePath(file))
    if (paths.has(path)) fail(`重复路径：${path}`)
    paths.add(path)
    const bytes = await readInput(file)
    total += bytes.byteLength
    if (total > MAX_TOTAL_BYTES) fail('文件总大小超过 4 MiB')
    output.push({ path, content: bytesToBase64(bytes) })
  }
  return { name: folderName(output[0]?.path, inputs[0].name || 'tex-project'), document: { entry: chooseEntry(output), files: output } }
}

export async function downloadTexProject(name, document) {
  const files = document?.files
  if (!Array.isArray(files) || files.length > MAX_FILES) fail('项目文件数量超过 200')
  const zip = new JSZip()
  const paths = new Set()
  let total = 0
  for (const file of files) {
    const path = normalizePath(file?.path)
    if (paths.has(path)) fail(`重复路径：${path}`)
    paths.add(path)
    const bytes = base64ToBytes(file?.content)
    total += bytes.byteLength
    if (total > MAX_TOTAL_BYTES) fail('项目总大小超过 4 MiB')
    zip.file(path, bytes)
  }
  const blob = await zip.generateAsync({ type: 'blob', compression: 'deflate', compressionOptions: { level: 6 } })
  const browserDocument = globalThis.document
  if (browserDocument?.createElement && globalThis.URL?.createObjectURL) {
    const url = globalThis.URL.createObjectURL(blob)
    const link = browserDocument.createElement('a')
    link.href = url
    link.download = `${projectName(name)}.zip`
    browserDocument.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => globalThis.URL.revokeObjectURL(url), 1000)
  }
  return blob
}
