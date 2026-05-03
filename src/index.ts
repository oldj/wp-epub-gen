/**
 * @author: oldj
 * @homepage: https://oldj.net
 */

// 改进类型安全：为 mime 模块创建类型声明
interface MimeModule {
  getType(path: string): string | null
  getExtension(type: string): string | null
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const mimeModule = require('mime/lite') as MimeModule | { default: MimeModule }
const mime: MimeModule = (mimeModule as any).default || mimeModule
import os from 'os'
import path from 'path'
import { fileURLToPath } from 'url'
import { v4 as uuidv4 } from 'uuid'
import { errors } from './errors'
import { logger } from './logger'
import { emitProgress, normalizeConcurrency } from './libs/utils'
import parseContent from './parseContent'
import { render } from './render'
import { IChapterData, IEpubData, IEpubGenOptions, IGenConfigs, IOut } from './types'

// 在 ES 模块中获取当前文件和目录路径
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
// 使用当前目录作为基础路径（模板内容已嵌入，无需文件依赖）
const baseDir = __dirname

function result(success: boolean, message?: string, options?: IEpubGenOptions): IOut {
  if (options && options.verbose) {
    if (!success) {
      logger.error(new Error(message))
    }
  }

  const out: IOut = {
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

async function parseOptions(
  options: IEpubGenOptions,
  configs?: IGenConfigs,
): Promise<IEpubData> {
  const tmpDir = options.tmpDir || os.tmpdir()
  const id = uuidv4()

  const data: IEpubData = {
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
    log: (msg) => options.verbose && logger.log(msg),
    _configs: configs,
  }

  if (data.version === 2) {
    data.docHeader = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="${data.lang}" lang="${data.lang}">
`
  } else {
    data.docHeader = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${data.lang}" lang="${data.lang}">
`
  }

  if (Array.isArray(data.author) && data.author.length === 0) {
    data.author = ['anonymous']
  }
  if (typeof data.author === 'string') {
    data.author = [data.author]
  }

  const total = options.content.length
  const parsed: IChapterData[] = []
  for (let i = 0; i < total; i++) {
    parsed.push(parseContent(options.content[i], i, data))
    // 每 32 章让出事件循环，让宿主 IPC / UI 事件得以处理
    if ((i & 31) === 31) {
      await new Promise<void>((r) => setImmediate(r))
      emitProgress(configs, { phase: 'parseContent', current: i + 1, total })
    }
  }
  emitProgress(configs, { phase: 'parseContent', current: total, total })
  data.content = parsed

  if (data.cover) {
    data._coverMediaType = mime.getType(data.cover) || ''
    data._coverExtension = mime.getExtension(data._coverMediaType) || ''
  }

  return data
}

export async function epubGen(options: IEpubGenOptions, configs?: IGenConfigs): Promise<IOut> {
  // 归一化 concurrency：宿主可能传入 NaN / 字符串 / 负数等脏值
  if (configs) {
    configs = { ...configs, concurrency: normalizeConcurrency(configs.concurrency) }
  }
  // 初始化全局 Logger
  if (configs?.logger) {
    logger.setLogger(configs.logger)
  }
  logger.info('EpubGen started 101...')

  options = { ...options }
  const o = check(options)
  const verbose = options.verbose !== false
  if (!o.success) {
    if (verbose) logger.error(o.message)
    return o
  }

  let t: any
  try {
    const data = await parseOptions(options, configs)
    const timeoutSeconds: number = data.timeoutSeconds || 0

    if (timeoutSeconds > 0) {
      if (verbose) logger.log(`TIMEOUT: ${timeoutSeconds}s`)
      t = setTimeout(() => {
        throw new Error('timeout!')
      }, timeoutSeconds * 1000)
    } else {
      if (verbose) logger.log(`TIMEOUT: N/A`)
    }

    await render(data)
    return result(true, undefined, data)
  } catch (e) {
    if (verbose) logger.error(e)
    return result(false, e.message, options)
  } finally {
    clearTimeout(t)
  }
}

export const gen = epubGen
export { errors } from './errors'

// 添加默认导出以改善 CommonJS 兼容性
export default {
  epubGen,
  gen,
  errors,
}

export type {
  IChapter,
  IChapterData,
  IEpubData,
  IEpubGenOptions,
  IEpubImage,
  IGenConfigs,
  ILogger,
  IOut,
  IProgressEvent,
  ProgressPhase,
} from './types'
