import fs from 'fs-extra'
import os from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { downloadAllImages } from './downloadImage'
import { IEpubData, IEpubImage } from './types'

function makeEpubData(overrides: Partial<IEpubData> = {}): IEpubData {
  return {
    description: 't',
    publisher: 'p',
    author: ['a'],
    tocTitle: 'TOC',
    appendChapterTitles: false,
    date: new Date().toISOString(),
    lang: 'en',
    fonts: [],
    version: 3,
    verbose: false,
    timeoutSeconds: 0,
    tocAutoNumber: false,
    title: 't',
    output: '',
    id: 'test',
    tmpDir: '',
    dir: '',
    baseDir: '',
    docHeader: '',
    images: [],
    content: [],
    log: () => {},
    ...overrides,
  } as unknown as IEpubData
}

function makeImage(overrides: Partial<IEpubImage> = {}): IEpubImage {
  return {
    id: 'img1',
    url: '',
    dir: '',
    mediaType: 'image/png',
    extension: 'png',
    ...overrides,
  }
}

describe('downloadAllImages', () => {
  let workDir: string

  beforeEach(async () => {
    workDir = await fs.mkdtemp(path.join(os.tmpdir(), 'wp-epub-gen-dl-'))
  })

  afterEach(async () => {
    await fs.remove(workDir)
  })

  it('images 为空时直接返回，不创建任何目录', async () => {
    const epubData = makeEpubData({ dir: workDir })
    await downloadAllImages(epubData)
    // 空数组不会创建 OEBPS/images
    expect(fs.existsSync(path.join(workDir, 'OEBPS', 'images'))).toBe(false)
  })

  it('从 file:// URL 复制本地文件到 OEBPS/images', async () => {
    const src = path.join(workDir, 'source.png')
    await fs.writeFile(src, 'PNG-DATA')

    const epubData = makeEpubData({
      dir: workDir,
      images: [makeImage({ id: 'a', url: `file://${src}`, extension: 'png' })],
    })
    await downloadAllImages(epubData)

    const dst = path.join(workDir, 'OEBPS', 'images', 'a.png')
    expect(fs.existsSync(dst)).toBe(true)
    expect(await fs.readFile(dst, 'utf-8')).toBe('PNG-DATA')
  })

  it('从绝对路径 URL 复制本地文件', async () => {
    const src = path.join(workDir, 'plain.gif')
    await fs.writeFile(src, 'GIF-DATA')

    const epubData = makeEpubData({
      dir: workDir,
      images: [makeImage({ id: 'b', url: src, extension: 'gif' })],
    })
    await downloadAllImages(epubData)

    expect(await fs.readFile(path.join(workDir, 'OEBPS', 'images', 'b.gif'), 'utf-8')).toBe(
      'GIF-DATA',
    )
  })

  it('解码 URL 编码的本地路径（%20 → 空格）', async () => {
    const src = path.join(workDir, 'has space.png')
    await fs.writeFile(src, 'SPACE')

    const encoded = `file://${path.join(workDir, 'has%20space.png')}`
    const epubData = makeEpubData({
      dir: workDir,
      images: [makeImage({ id: 'c', url: encoded, extension: 'png' })],
    })
    await downloadAllImages(epubData)

    expect(await fs.readFile(path.join(workDir, 'OEBPS', 'images', 'c.png'), 'utf-8')).toBe('SPACE')
  })

  it('本地文件不存在时记录日志，不抛错', async () => {
    const log = vi.fn()
    const epubData = makeEpubData({
      dir: workDir,
      log,
      images: [
        makeImage({
          id: 'd',
          url: `file://${path.join(workDir, 'missing.png')}`,
          extension: 'png',
        }),
      ],
    })

    await expect(downloadAllImages(epubData)).resolves.toBeUndefined()
    expect(fs.existsSync(path.join(workDir, 'OEBPS', 'images', 'd.png'))).toBe(false)
    const messages = log.mock.calls.map((c) => String(c[0]))
    expect(messages.some((m) => m.includes('not exists'))).toBe(true)
  })

  it('URL 编码错误（孤立 %）时回退到原路径，不崩溃', async () => {
    const log = vi.fn()
    // 路径放在隔离的 workDir 内，避免与系统中其他文件碰撞
    const badUrl = `file://${workDir}/bad%path.png`
    const epubData = makeEpubData({
      dir: workDir,
      log,
      images: [makeImage({ id: 'e', url: badUrl, extension: 'png' })],
    })

    // 即使解码失败，也只是日志告警 + 文件不存在告警，不应抛
    await expect(downloadAllImages(epubData)).resolves.toBeUndefined()
    const messages = log.mock.calls.map((c) => String(c[0]))
    expect(messages.some((m) => m.includes('URL Decode Warning'))).toBe(true)
  })

  it('emit 进度事件，包含 phase=downloadImage 和最终 current === total', async () => {
    const src1 = path.join(workDir, 's1.png')
    const src2 = path.join(workDir, 's2.png')
    await fs.writeFile(src1, '1')
    await fs.writeFile(src2, '2')

    const events: Array<{ phase: string; current: number; total: number }> = []
    const epubData = makeEpubData({
      dir: workDir,
      _configs: {
        onProgress: (e) => events.push({ phase: e.phase, current: e.current, total: e.total }),
      },
      images: [
        makeImage({ id: 'p1', url: `file://${src1}`, extension: 'png' }),
        makeImage({ id: 'p2', url: `file://${src2}`, extension: 'png' }),
      ],
    })

    await downloadAllImages(epubData)

    const downloadEvents = events.filter((e) => e.phase === 'downloadImage')
    expect(downloadEvents.length).toBeGreaterThanOrEqual(1)
    const last = downloadEvents.at(-1)!
    expect(last.current).toBe(last.total)
    expect(last.total).toBe(2)
  })
})
