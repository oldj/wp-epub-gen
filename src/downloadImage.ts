/**
 * @author: oldj
 * @homepage: https://oldj.net
 */

import fs from 'fs-extra'
import path from 'path'
import request from 'superagent'
import { IEpubData, IEpubImage } from './types'
import { USER_AGENT } from './libs/utils'

const downloadImage = async (epubData: IEpubData, options: IEpubImage): Promise<void> => {
  let { url } = options
  let { log } = epubData
  let epub_dir = epubData.dir

  if (!url) {
    return
  }

  let image_dir = path.join(epub_dir, 'OEBPS', 'images')
  fs.ensureDirSync(image_dir)

  let filename = path.join(image_dir, options.id + '.' + options.extension)
  if (url.startsWith('file://') || url.startsWith('/')) {
    let aux_path = url.replace(/^file:\/\//i, '')

    // 对 URL 编码的路径进行解码（如 %20 转换为空格）
    try {
      aux_path = decodeURIComponent(aux_path)
    } catch (e) {
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

  let requestAction: any
  if (url.startsWith('http')) {
    requestAction = request.get(url).set({ 'User-Agent': USER_AGENT })
    requestAction.pipe(fs.createWriteStream(filename))
  } else {
    log(`[Copy 2] '${url}' to '${filename}'`)
    requestAction = fs.createReadStream(path.join(options.dir || '', url))
    requestAction.pipe(fs.createWriteStream(filename))
  }

  return new Promise((resolve, reject) => {
    requestAction.on('error', (err: any) => {
      log('[Download Error] Error while downloading: ' + url)
      log(err)
      fs.unlinkSync(filename)
      // reject(err)
      resolve()
    })

    requestAction.on('end', () => {
      log('[Download Success] ' + url)
      resolve()
    })
  })
}

export const downloadAllImages = async (epubData: IEpubData) => {
  let { images } = epubData
  if (images.length === 0) return

  fs.ensureDirSync(path.join(epubData.dir, 'OEBPS', 'images'))
  for (let image of images) {
    await downloadImage(epubData, image)
  }
}
