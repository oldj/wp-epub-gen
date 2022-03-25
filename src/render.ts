/**
 * render
 * @author: oldj
 * @homepage: https://oldj.net
 */

import * as archiver from 'archiver'
import * as fs from 'fs-extra'
import * as path from 'path'
import { downloadAllImages } from './downloadImage'
import { generateTempFile } from './generateTempFile'
import makeCover from './makeCover'
import { IEpubData } from './types'
import { fileIsStable } from './utils'

export async function render(data: IEpubData): Promise<void> {
  let { log } = data

  log('Generating Template Files...')
  await generateTempFile(data)
  log('Downloading Images...')
  await downloadAllImages(data)
  log('Making Cover...')
  await makeCover(data)
  log('Generating Epub Files...')
  await genEpub(data)
  if (fs.existsSync(data.output)) {
    log('Output: ' + data.output)
    log('Done.')
  } else {
    log('Output fail!')
  }
}

async function genEpub(epubData: IEpubData) {
  let { log, dir, output } = epubData

  let archive = archiver('zip', { zlib: { level: 9 } })
  let outputStream = fs.createWriteStream(epubData.output)
  log('Zipping temp dir to ' + output)

  return new Promise((resolve, reject) => {
    archive.on('end', async () => {
      log('Done zipping, clearing temp dir...')

      // log(fs.statSync(epubData.output).size)
      // setTimeout(() => log(fs.statSync(epubData.output).size), 1)
      // setTimeout(() => log(fs.statSync(epubData.output).size), 100)
      // setTimeout(() => log(fs.statSync(epubData.output).size), 1000)
      let stable = await fileIsStable(epubData.output)
      if (!stable) {
        log('Output epub file is not stable!')
      }

      try {
        fs.removeSync(dir)
        resolve()
      } catch (e) {
        log('[Error] ' + e.message)
        reject(e)
      }
    })

    archive.on('close', () => {
      log('Zip close..')
    })

    archive.on('finish', () => {
      log('Zip finish..')
    })

    archive.on('error', (err) => {
      log('[Archive Error] ' + err.message)
      reject(err)
    })

    archive.pipe(outputStream)
    archive.append('application/epub+zip', { store: true, name: 'mimetype' })
    archive.directory(path.join(dir, 'META-INF'), 'META-INF')
    archive.directory(path.join(dir, 'OEBPS'), 'OEBPS')

    archive.finalize()
  })
}
