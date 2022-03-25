/**
 * downloadImage
 * @author: oldj
 * @homepage: https://oldj.net
 */

import * as fs from 'fs-extra'
import * as path from 'path'
import * as request from 'superagent'
import { IEpubData, IEpubImage } from './types'
import { USER_AGENT } from './utils'

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
    let auxPath = url.replace(/^file:\/\//i, '')
    log(`[Copy 1] '${auxPath}' to '${filename}'`)
    if (fs.existsSync(auxPath)) {
      try {
        fs.copySync(auxPath, filename)
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
