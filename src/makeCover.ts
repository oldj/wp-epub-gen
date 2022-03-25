/**
 * makeCover
 * @author: oldj
 * @homepage: https://oldj.net
 */

import * as fs from 'fs-extra'
import * as path from 'path'
import * as request from 'superagent'
import { IEpubData } from './types'
import { USER_AGENT } from './utils'

export default async function makeCover(data: IEpubData) {
  let { cover, _coverExtension, log } = data
  if (!cover) return

  let destPath = path.join(data.dir, 'OEBPS', `cover.${_coverExtension}`)
  let writeStream: any = null

  if (cover.startsWith('http')) {
    writeStream = request.get(cover).set({ 'User-Agent': USER_AGENT })
    writeStream.pipe(fs.createWriteStream(destPath))
  } else {
    if (!fs.existsSync(cover)) return
    log('local cover image: ' + cover)

    writeStream = fs.createReadStream(cover)
    writeStream.pipe(fs.createWriteStream(destPath))
  }

  return new Promise((resolve) => {
    writeStream.on('end', () => {
      log('[Success] cover image saved.')
      resolve()
    })

    writeStream.on('error', (e: any) => {
      log('[Error] cover image error: ' + e.message)
      log('destPath: ' + destPath)
      if (fs.existsSync(destPath)) {
        try {
          fs.unlinkSync(destPath)
          log('destPath removed.')
        } catch (e) {
          log('[Error] remove cover image error: ' + e.message)
        }
      }
      resolve(e)
      // throw new Error('[Fail] cover image save fail!')
    })
  })
}
