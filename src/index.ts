/**
 * @author: oldj
 * @homepage: https://oldj.net
 */

// @ts-ignore - Direct import to avoid complex namespace processing
const mimeModule = require('mime/lite')
const mime = mimeModule.default || mimeModule
import os from 'os'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { errors } from './errors'
import parseContent from './parseContent'
import { render } from './render'
import { IEpubData, IEpubGenOptions, IOut } from './types'

const baseDir = path.dirname(__dirname)

function result(success: boolean, message?: string, options?: IEpubGenOptions): IOut {
  if (options && options.verbose) {
    if (!success) {
      console.error(new Error(message))
    }
  }

  let out: IOut = {
    success,
  }

  if (typeof message === 'string') {
    out.message = message
  }

  if (options) {
    out.options = options
  }

  return out
}

function check(options: IEpubGenOptions): IOut {
  if (!options.output) {
    return result(false, errors.no_output_path, options)
  }

  if (!options.title) {
    return result(false, errors.no_title, options)
  }

  if (!options.content) {
    return result(false, errors.no_content, options)
  }

  return result(true, undefined, options)
}

function parseOptions(options: IEpubGenOptions): IEpubData {
  let tmpDir = options.tmpDir || os.tmpdir()
  let id = uuidv4()

  let data: IEpubData = {
    description: options.title,
    publisher: 'anonymous',
    author: ['anonymous'],
    tocTitle: 'Table Of Contents',
    appendChapterTitles: true,
    date: new Date().toISOString(),
    lang: 'en',
    fonts: [],
    version: 3,
    verbose: true,
    timeoutSeconds: 15 * 60, // 15 min
    tocAutoNumber: false,

    ...options,

    id,
    tmpDir,
    dir: path.resolve(tmpDir, id),
    baseDir,
    docHeader: '',
    images: [],
    content: [],
    log: (msg) => options.verbose && console.log(msg),
  }

  if (data.version === 2) {
    data.docHeader = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="#{self.options.lang}">
`
  } else {
    data.docHeader = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="#{self.options.lang}">
`
  }

  if (Array.isArray(data.author) && data.author.length === 0) {
    data.author = ['anonymous']
  }
  if (typeof data.author === 'string') {
    data.author = [data.author]
  }

  data.content = options.content.map((content, index) => parseContent(content, index, data))

  if (data.cover) {
    data._coverMediaType = mime.getType(data.cover) || ''
    data._coverExtension = mime.getExtension(data._coverMediaType) || ''
  }

  return data
}

export async function epubGen(options: IEpubGenOptions, output?: string): Promise<IOut> {
  options = { ...options }
  if (output) {
    options.output = output
  }

  let o = check(options)
  let verbose = options.verbose !== false
  if (!o.success) {
    if (verbose) console.error(o.message)
    return o
  }

  let t: any
  try {
    let data = parseOptions(options)
    let timeoutSeconds: number = data.timeoutSeconds || 0

    if (timeoutSeconds > 0) {
      if (verbose) console.log(`TIMEOUT: ${timeoutSeconds}s`)
      t = setTimeout(() => {
        throw new Error('timeout!')
      }, timeoutSeconds * 1000)
    } else {
      if (verbose) console.log(`TIMEOUT: N/A`)
    }

    await render(data)
    return result(true, undefined, data)
  } catch (e) {
    if (verbose) console.error(e)
    return result(false, e.message, options)
  } finally {
    clearTimeout(t)
  }
}

export const gen = epubGen
export { errors } from './errors'

// 导出所有类型，让用户可以直接从主入口导入
export type { IEpubImage, IEpubGenOptions, IEpubData, IChapter, IChapterData, IOut } from './types'
