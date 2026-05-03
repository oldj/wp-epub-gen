/**
 * @author: oldj
 * @homepage: https://oldj.net
 */

import fs from 'fs-extra'
import path from 'path'
import request from 'superagent'
import { emitProgress, pLimit, USER_AGENT } from './libs/utils'
import { IEpubData, IEpubImage } from './types'

const downloadImage = async (epubData: IEpubData, options: IEpubImage): Promise<void> => {
  const { url } = options
  const { log } = epubData
  const epub_dir = epubData.dir

  if (!url) {
    return
  }

  // image_dir 已由 downloadAllImages 在外层 ensureDir
  const image_dir = path.join(epub_dir, 'OEBPS', 'images')
  const filename = path.join(image_dir, options.id + '.' + options.extension)
  if (url.startsWith('file://') || url.startsWith('/')) {
    let aux_path = url.replace(/^file:\/\//i, '')

    // 对 URL 编码的路径进行解码（如 %20 转换为空格）
    try {
      aux_path = decodeURIComponent(aux_path)
    } catch {
      // 如果解码失败，继续使用原路径
      log(`[URL Decode Warning] Failed to decode path: ${aux_path}`)
    }

    if (process.platform === 'win32') {
      // Windows 下，把 /C:/ 转换成 C:/ 这样的形式
      if (aux_path.match(/^\/[a-zA-Z]:/)) {
        aux_path = aux_path.replace(/^\//, '')
      }
    }

    log(`[Copy 1] '${aux_path}' to '${filename}'`)
    if (fs.existsSync(aux_path)) {
      try {
        fs.copySync(aux_path, filename)
      } catch (e) {
        log('[Copy 1 Error] ' + e.message)
      }
    } else {
      log(`[Copy 1 Fail] '${url}' not exists!`)
    }
    return
  }

  const writeStream = fs.createWriteStream(filename)
  let requestAction: any
  if (url.startsWith('http')) {
    requestAction = request.get(url).set({ 'User-Agent': USER_AGENT })
  } else {
    log(`[Copy 2] '${url}' to '${filename}'`)
    requestAction = fs.createReadStream(path.join(options.dir || '', url))
  }
  requestAction.pipe(writeStream)

  return new Promise((resolve) => {
    let settled = false
    const finalize = () => {
      if (settled) return
      settled = true
      resolve()
    }
    const cleanupFile = () => {
      try {
        fs.unlinkSync(filename)
      } catch {
        // ignore: 文件可能已不存在或没权限
      }
    }

    const abortSource = () => {
      // superagent 用 abort()；fs.createReadStream 用 destroy()
      if (typeof requestAction.abort === 'function') requestAction.abort()
      else if (typeof requestAction.destroy === 'function') requestAction.destroy()
    }

    requestAction.on('error', (err: any) => {
      log('[Download Error] Error while downloading: ' + url)
      log(err)
      writeStream.destroy()
      cleanupFile()
      finalize()
    })

    writeStream.on('error', (err: any) => {
      log('[Write Error] Error while writing: ' + filename)
      log(err)
      abortSource()
      cleanupFile()
      finalize()
    })

    // 'finish' 表示目标流的所有数据已 flush 完成，比 source 'end' 更可靠
    writeStream.on('finish', () => {
      log('[Download Success] ' + url)
      finalize()
    })
  })
}

export const downloadAllImages = async (epubData: IEpubData) => {
  const { images } = epubData
  if (images.length === 0) return

  await fs.ensureDir(path.join(epubData.dir, 'OEBPS', 'images'))

  const concurrency = epubData._configs?.concurrency ?? 16
  const limit = pLimit<void>(concurrency)
  const total = images.length
  let done = 0

  emitProgress(epubData._configs, { phase: 'downloadImage', current: 0, total })
  await Promise.all(
    images.map((image) =>
      limit(async () => {
        await downloadImage(epubData, image)
        done++
        emitProgress(epubData._configs, {
          phase: 'downloadImage',
          current: done,
          total,
          label: image.url,
        })
      }),
    ),
  )
}
