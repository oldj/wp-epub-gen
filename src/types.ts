/**
 * @author: oldj
 * @homepage: https://oldj.net
 */

export interface IEpubImage {
  id: string
  url: string
  dir: string
  mediaType: string
  extension: string
}

export interface IEpubGenOptions {
  title: string
  author?: string | string[]
  publisher?: string
  cover: string
  output: string
  version?: 2 | 3
  css?: string
  noDefaultCss?: boolean // 是否禁用默认的 CSS 样式表，默认为 false，即会添加默认的 CSS 样式表
  fonts?: string[]
  lang?: 'en'
  tocTitle?: string
  appendChapterTitles?: boolean // For advanced customizations: absolute path to an OPF template.
  customOpfTemplatePath?: string // For advanced customizations: absolute path to a NCX toc template.
  customHtmlTocTemplatePath?: string // For advanced customizations: absolute path to a HTML toc template.
  customNcxTocTemplatePath?: string
  content: IChapter[] // Book Chapters content. It's should be an array of objects. eg. [{title: "Chapter 1",data: "<div>..."}, {data: ""},...]
  verbose?: boolean // specify whether or not to console.log progress messages, default: false
  description?: string
  date?: string
  tmpDir?: string
  timeoutSeconds?: number
  tocAutoNumber?: boolean
}

export interface IEpubData extends IEpubGenOptions {
  id: string
  docHeader: string
  dir: string
  images: IEpubImage[]
  tmpDir: string
  baseDir: string
  _coverMediaType?: string
  _coverExtension?: string
  /** @internal 由 epubGen() 填充，供下游阶段读取 onProgress / concurrency */
  _configs?: IGenConfigs
  /** @internal 图片 url -> 元数据，避免线性 find */
  _imagesByUrl?: Map<string, IEpubImage>
  log: (msg: any) => void
  content: IChapterData[]
  timeoutSeconds: number
}

export interface IChapter {
  id?: string
  title?: string
  author?: string | string[]
  data: string // HTML String of the chapter content. image paths should be absolute path (should start with "http" or "https"), so that they could be downloaded. With the upgrade is possible to use local images (for this the path must start with file: //)
  excludeFromToc?: boolean // default: false
  beforeToc?: boolean // if is shown before Table of content, such like copyright pages. default: false
  filename?: string // specify filename for each chapter
  url?: string
  children?: IChapter[]
  appendChapterTitle?: boolean
}

export interface IChapterData extends IChapter {
  id: string
  href?: string
  dir?: string
  children: IChapterData[]
  filePath: string
  author: string[]
}

export interface IOut {
  success?: boolean
  message?: string
  options?: IEpubGenOptions
}

export interface ILogger {
  log: (msg: any) => void
  info: (msg: any) => void
  error: (msg: any) => void
  warn: (msg: any) => void
}

export type ProgressPhase =
  | 'parseContent'
  | 'writeChapters'
  | 'buildToc'
  | 'downloadImage'
  | 'zip'

export interface IProgressEvent {
  phase: ProgressPhase
  current: number
  total: number
  label?: string
}

export interface IGenConfigs {
  logger?: ILogger
  onProgress?: (e: IProgressEvent) => void
  /** 并发上限，默认 16；写盘和下载共用 */
  concurrency?: number
}
