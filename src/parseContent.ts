/**
 * @author: oldj
 * @homepage: https://oldj.net
 */

import safeFineName from '@/libs/safeFineName'
// 固定走 cheerio/slim：该入口的既定语义就是「always uses htmlparser2」，连 parse5 都不加载。
// 不用「主入口 + `_useHtmlParser2`」——那是 cheerio 的 InternalOptions（私有），本包依赖范围为
// ^1.2.0，下游可能装到更新的 1.x；该私有开关一旦被调整或移除就会静默退回 parse5，
// 既有实体会被解码成裸字符（&amp; → &），直接产出无效 XHTML。
import * as cheerio from 'cheerio/slim'
import { remove as removeDiacritics } from 'diacritics'
import path from 'path'
import uslug from 'uslug'
import { v4 as uuidv4 } from 'uuid'
import { logger } from './logger'
import { IChapter, IChapterData, IEpubData, IEpubImage } from './types'

// 改进类型安全：为 mime 模块创建类型声明
interface MimeModule {
  getType(path: string): string | null
  getExtension(type: string): string | null
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const mimeModule = require('mime/lite') as MimeModule | { default: MimeModule }
const mime: MimeModule = (mimeModule as any).default || mimeModule

// 性能优化：提取为常量，避免重复创建数组
const ALLOWED_ATTRIBUTES: readonly string[] = [
  'about',
  'accesskey',
  'alt',
  'aria-activedescendant',
  'aria-atomic',
  'aria-autocomplete',
  'aria-busy',
  'aria-checked',
  'aria-controls',
  'aria-describedat',
  'aria-describedby',
  'aria-disabled',
  'aria-dropeffect',
  'aria-expanded',
  'aria-flowto',
  'aria-grabbed',
  'aria-haspopup',
  'aria-hidden',
  'aria-invalid',
  'aria-label',
  'aria-labelledby',
  'aria-level',
  'aria-live',
  'aria-multiline',
  'aria-multiselectable',
  'aria-orientation',
  'aria-owns',
  'aria-posinset',
  'aria-pressed',
  'aria-readonly',
  'aria-relevant',
  'aria-required',
  'aria-selected',
  'aria-setsize',
  'aria-sort',
  'aria-valuemax',
  'aria-valuemin',
  'aria-valuenow',
  'aria-valuetext',
  'class',
  'colspan',
  'content', // 去除重复
  'contenteditable',
  'contextmenu',
  'datatype',
  'dir',
  'draggable',
  'dropzone',
  'epub:prefix',
  'epub:type',
  'hidden',
  'href',
  'hreflang',
  'id', // 去除重复
  'inlist',
  'itemid',
  'itemref',
  'itemscope',
  'itemtype',
  'lang',
  'media',
  'ns1:type',
  'ns2:alphabet',
  'ns2:ph',
  'onabort',
  'onblur',
  'oncanplay',
  'oncanplaythrough',
  'onchange',
  'onclick',
  'oncontextmenu',
  'ondblclick',
  'ondrag',
  'ondragend',
  'ondragenter',
  'ondragleave',
  'ondragover',
  'ondragstart',
  'ondrop',
  'ondurationchange',
  'onemptied',
  'onended',
  'onerror',
  'onfocus',
  'oninput',
  'oninvalid',
  'onkeydown',
  'onkeypress',
  'onkeyup',
  'onload',
  'onloadeddata',
  'onloadedmetadata',
  'onloadstart',
  'onmousedown',
  'onmousemove',
  'onmouseout',
  'onmouseover',
  'onmouseup',
  'onmousewheel',
  'onpause',
  'onplay',
  'onplaying',
  'onprogress',
  'onratechange',
  'onreadystatechange',
  'onreset',
  'onscroll',
  'onseeked',
  'onseeking',
  'onselect',
  'onshow',
  'onstalled',
  'onsubmit',
  'onsuspend',
  'ontimeupdate',
  'onvolumechange',
  'onwaiting',
  'prefix',
  'property',
  'rel',
  'resource',
  'rev',
  'role',
  'rowspan',
  'spellcheck',
  'src',
  'style',
  'tabindex',
  'target',
  'title', // 去除重复
  'type',
  'typeof',
  'vocab',
  'xml:base',
  'xml:lang',
  'xml:space',
] as const

/**
 * XHTML 1.1允许的标签列表
 */
const ALLOWED_XHTML11_TAGS: readonly string[] = [
  'a',
  'abbr',
  'acronym',
  'address',
  'applet',
  'b',
  'bar',
  'basefont',
  'bdo',
  'big',
  'blockquote',
  'br',
  'caption',
  'center',
  'cite',
  'code',
  'col',
  'colgroup',
  'dd',
  'del',
  'dfn',
  'div',
  'dl',
  'dt',
  'em',
  'embed',
  'font',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'i',
  'iframe',
  'img',
  'ins',
  'kbd',
  'li',
  'map',
  'noscript',
  'ns:svg',
  'object', // 去除重复
  'ol',
  'p',
  'param',
  'pre',
  'q',
  's',
  'samp',
  'script',
  'small',
  'span',
  'strike',
  'strong',
  'sub',
  'sup',
  'table',
  'tbody',
  'td',
  'tfoot',
  'th',
  'thead',
  'tr',
  'tt',
  'u',
  'ul',
  'var',
] as const

// 性能优化：使用 Set 进行快速查找
const ALLOWED_ATTRIBUTES_SET = new Set(ALLOWED_ATTRIBUTES)
const ALLOWED_XHTML11_TAGS_SET = new Set(ALLOWED_XHTML11_TAGS)
const SELF_CLOSING_TAGS = new Set(['img', 'br', 'hr'])

/**
 * 初始化章节基本信息，包括文件路径、ID等
 */
function initializeChapterInfo(
  content: IChapter,
  index: number | string,
  epubConfigs: IEpubData,
): IChapterData {
  const chapter: IChapterData = { ...content } as IChapterData
  let { filename } = chapter

  if (!filename) {
    let titleSlug = uslug(removeDiacritics(chapter.title || 'no title'))
    titleSlug = titleSlug.replace(/[/\\]/g, '_')
    chapter.href = `${index}_${titleSlug}.xhtml`
    chapter.filePath = path.join(epubConfigs.dir, 'OEBPS', chapter.href)
  } else {
    filename = safeFineName(filename)
    const is_xhtml = filename.endsWith('.xhtml')
    chapter.href = is_xhtml ? filename : `${filename}.xhtml`
    if (is_xhtml) {
      chapter.filePath = path.join(epubConfigs.dir, 'OEBPS', filename)
    } else {
      chapter.filePath = path.join(epubConfigs.dir, 'OEBPS', `${filename}.xhtml`)
    }
  }

  chapter.id = `item_${index}`
  chapter.dir = path.dirname(chapter.filePath)
  chapter.excludeFromToc = chapter.excludeFromToc || false
  chapter.beforeToc = chapter.beforeToc || false

  return chapter
}

/**
 * 规范化作者信息为数组格式
 */
function normalizeAuthorInfo(chapter: IChapterData): void {
  if (chapter.author && typeof chapter.author === 'string') {
    chapter.author = [chapter.author]
  } else if (!chapter.author || !Array.isArray(chapter.author)) {
    chapter.author = []
  }
}

/**
 * 获取允许的HTML属性列表
 */
function getAllowedAttributes(): readonly string[] {
  return ALLOWED_ATTRIBUTES
}

/**
 * 获取XHTML 1.1允许的标签列表
 */
function getAllowedXhtml11Tags(): readonly string[] {
  return ALLOWED_XHTML11_TAGS
}

/**
 * 章节内容的解析选项。
 *
 * **必须用 HTML 模式解析（xmlMode: false）**：入参是 HTML，而 XML 没有 void 元素的概念，
 * `<hr>` / `<br>` / `<img src=...>` 这类合法的 HTML 裸标签在 XML 模式下会被当成「未闭合的开标签」，
 * 把后续兄弟节点全部吸成自己的子节点，直到父元素闭合时才补出 `</hr>`；序列化后就是
 * `<hr/>…</hr>` 这种自相矛盾的标记，阅读器按 XHTML 严格解析直接报
 * "Opening and ending tag mismatch"，整章白屏。XHTML 化（自闭合斜线）交由**序列化端**完成，
 * 见 extractAndCleanHtmlContent。
 *
 * 解析与序列化固定由 htmlparser2 / dom-serializer 承担——见文件头 `cheerio/slim` 的 import 说明。
 * 换回 cheerio 默认的 parse5 会改变既有产物：中文与既有实体（&nbsp; / &#10;）被重编码，
 * 或反过来被解码成裸字符，两种都不是本包想要的输出。
 *
 * 下列开关都是 htmlparser2 选项，不在 cheerio 公开的 CheerioOptions 结构里，但 slim 入口下
 * 它们必然生效。先 `satisfies` 公开的 HTMLParser2Options 做名称与类型校验——将来 cheerio 若
 * 改名或删项会直接编译报错，而不是静默失效——再断言成 load() 的入参类型。
 */
const HTML_PARSE_OPTIONS = {
  xmlMode: false,
  decodeEntities: false,
  lowerCaseTags: true,
  recognizeSelfClosing: true,
  lowerCaseAttributeNames: true,
} satisfies cheerio.HTMLParser2Options as cheerio.CheerioOptions

/**
 * 加载并处理HTML内容，提取body部分
 * @param data HTML字符串数据
 * @returns Cheerio实例
 * @throws {Error} 当数据为空或无效时抛出错误
 */
function loadAndProcessHtml(data: string): cheerio.CheerioAPI {
  // 错误处理：检查输入数据
  if (!data || typeof data !== 'string') {
    throw new Error('Invalid HTML data: data must be a non-empty string')
  }

  const trimmedData = data.trim()
  if (trimmedData.length === 0) {
    throw new Error('Invalid HTML data: data cannot be empty or whitespace only')
  }

  try {
    const $ = cheerio.load(trimmedData, HTML_PARSE_OPTIONS)

    // only body innerHTML is allowed —— 把 body 子节点提升到 root，避免二次 cheerio.load
    const body = $('body')
    if (body.length) {
      const bodyContents = body.contents()
      $.root().empty().append(bodyContents)
    }

    return $
  } catch (error) {
    throw new Error(
      `Failed to parse HTML content: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { cause: error },
    )
  }
}

/**
 * 处理HTML元素，清理属性和标签
 */
function processHtmlElements(
  $: cheerio.CheerioAPI,
  allowedAttributes: readonly string[],
  allowedXhtml11Tags: readonly string[],
  epubConfigs: IEpubData,
  index: number | string,
): void {
  // 性能优化：使用 Set 进行快速查找，避免重复的 includes 调用
  const allowedAttrsSet = ALLOWED_ATTRIBUTES_SET
  const allowedTagsSet = ALLOWED_XHTML11_TAGS_SET
  const selfClosingTags = SELF_CLOSING_TAGS

  $($('*').get().reverse()).each(function (elemIndex: number, elem: any) {
    const attrs = elem.attribs || {}
    const $elem = $(elem)
    const tagName = elem.name

    // 处理自闭合标签的特殊属性
    if (selfClosingTags.has(tagName)) {
      if (tagName === 'img' && !$elem.attr('alt')) {
        $elem.attr('alt', 'image-placeholder')
      }
    }

    // 性能优化：批量处理属性，减少 DOM 操作
    const attrsToRemove: string[] = []
    for (const [attrName] of Object.entries(attrs)) {
      if (allowedAttrsSet.has(attrName)) {
        // 特殊处理 type 属性
        if (attrName === 'type' && tagName !== 'script') {
          attrsToRemove.push(attrName)
        }
      } else {
        attrsToRemove.push(attrName)
      }
    }

    // 批量移除属性
    for (const attrName of attrsToRemove) {
      $elem.removeAttr(attrName)
    }

    // 处理 EPUB 2.0 标签限制
    if (epubConfigs.version === 2) {
      if (!allowedTagsSet.has(tagName)) {
        if (epubConfigs.verbose) {
          logger.warn(
            `Warning (content[${index}]): ${tagName} tag isn't allowed on EPUB 2/XHTML 1.1 DTD.`,
          )
        }
        const child = $elem.html()
        $elem.replaceWith($('<div>' + child + '</div>'))
      }
    }
  })
}

/**
 * 处理图片元素，更新图片路径并添加到图片列表
 * @param $ Cheerio实例
 * @param chapter 章节数据
 * @param epubConfigs EPUB配置
 */
function processImages($: cheerio.CheerioAPI, chapter: IChapterData, epubConfigs: IEpubData): void {
  // 懒构建 url -> image 索引，避免每张图都做 O(M) 线性 find
  if (!epubConfigs._imagesByUrl) {
    epubConfigs._imagesByUrl = new Map(epubConfigs.images.map((img) => [img.url, img]))
  }
  const imagesByUrl = epubConfigs._imagesByUrl

  $('img').each((index: number, elem: any) => {
    const url = $(elem).attr('src') || ''

    // 错误处理：检查图片URL是否有效
    if (!url || url.trim().length === 0) {
      logger.warn(`Image at index ${index} in chapter has empty src attribute, removing element`)
      $(elem).remove()
      return
    }

    // 错误处理：检查URL格式
    const trimmedUrl = url.trim()
    try {
      // 简单的URL验证
      if (!trimmedUrl.match(/^(https?:\/\/|file:\/\/|data:|\.\/|\/)/)) {
        logger.warn(`Image URL "${trimmedUrl}" appears to be invalid, but processing anyway`)
      }
    } catch (error) {
      logger.error(`Error validating image URL "${trimmedUrl}": ${error}`)
    }

    const image = imagesByUrl.get(trimmedUrl)
    let id: string
    let extension: string

    if (image) {
      id = image.id
      extension = image.extension
    } else {
      id = uuidv4()

      // 错误处理：安全地获取MIME类型和扩展名
      let mediaType: string
      try {
        const cleanUrl = trimmedUrl.replace(/\?.*/, '') // 移除查询参数
        mediaType = mime.getType(cleanUrl) || ''

        if (!mediaType) {
          // 尝试从URL扩展名推断
          const urlExtension = cleanUrl.split('.').pop()?.toLowerCase()
          if (urlExtension && ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(urlExtension)) {
            mediaType = `image/${urlExtension === 'jpg' ? 'jpeg' : urlExtension}`
            logger.warn(
              `Could not determine MIME type for "${trimmedUrl}", inferred as "${mediaType}"`,
            )
          } else {
            logger.warn(
              `Could not determine MIME type for "${trimmedUrl}", defaulting to image/jpeg`,
            )
            mediaType = 'image/jpeg'
          }
        }
      } catch (error) {
        logger.error(`Error determining MIME type for "${trimmedUrl}": ${error}`)
        mediaType = 'image/jpeg' // 默认值
      }

      try {
        extension = mime.getExtension(mediaType) || 'jpg'
      } catch (error) {
        logger.error(`Error getting extension for MIME type "${mediaType}": ${error}`)
        extension = 'jpg' // 默认扩展名
      }

      const dir = chapter.dir || ''
      const img: IEpubImage = { id, url: trimmedUrl, dir, mediaType, extension }
      epubConfigs.images.push(img)
      imagesByUrl.set(trimmedUrl, img)

      if (epubConfigs.verbose) {
        logger.info(`Added image: ${trimmedUrl} -> images/${id}.${extension} (${mediaType})`)
      }
    }

    // 错误处理：确保设置有效的src属性
    try {
      $(elem).attr('src', `images/${id}.${extension}`)
    } catch (error) {
      logger.error(`Error setting src attribute for image ${id}: ${error}`)
      // 移除有问题的图片元素
      $(elem).remove()
    }
  })
}

/**
 * 把处理完的 DOM 序列化为 XHTML 片段（不含 html/head/body 包裹）。
 *
 * 用 `$.xml()` 而非 `$.html()`：EPUB 章节是 XHTML，void 元素必须写成自闭合形式。
 * 由 XML 序列化器统一产出，不再用正则事后修补——正则既补不干净（旧实现只剥了孤儿 `</img>`，
 * 漏掉 `</br>` / `</hr>`），又会在属性值含 `>` 时（如 alt="a>b"）把标签截断改坏。
 */
function extractAndCleanHtmlContent($: cheerio.CheerioAPI): string {
  // loadAndProcessHtml 已把 body 子节点提升到 root；这里再兜一次，兼容降级路径构造的 DOM
  const body = $('body')
  if (body.length) {
    $.root().empty().append(body.contents())
  }

  // 必须无参调用：$.xml(dom) 传入 Cheerio 对象时，序列化沿用该对象自带的 options，
  // 强制的 xmlMode 会被丢掉、退回 HTML 序列化（实测）。无参时渲染 root 的全部子节点。
  return $.xml()
}

/**
 * 递归处理子章节
 */
function processChildrenChapters(
  chapter: IChapterData,
  index: number | string,
  epubConfigs: IEpubData,
): void {
  if (Array.isArray(chapter.children)) {
    chapter.children = chapter.children.map((content, idx) =>
      parseContent(content, `${index}_${idx}`, epubConfigs),
    )
  }
}

export default function parseContent(
  content: IChapter,
  index: number | string,
  epubConfigs: IEpubData,
): IChapterData {
  // 错误处理：验证输入参数
  if (!content) {
    throw new Error('Content cannot be null or undefined')
  }

  if (!content.data) {
    logger.warn(`Chapter at index ${index} has no data, using empty string`)
    content.data = ''
  }

  const chapter = initializeChapterInfo(content, index, epubConfigs)
  normalizeAuthorInfo(chapter)

  const allowedAttributes = getAllowedAttributes()
  const allowedXhtml11Tags = getAllowedXhtml11Tags()

  // 错误处理：如果章节数据为空，直接返回空内容
  if (!chapter.data || chapter.data.trim().length === 0) {
    logger.warn(`Chapter at index ${index} has empty data, setting empty content`)
    chapter.data = ''
  } else {
    let $: cheerio.CheerioAPI
    try {
      $ = loadAndProcessHtml(chapter.data)
    } catch (error) {
      logger.error(`Failed to process HTML for chapter ${index}: ${error}`)
      // 降级处理：创建包含原始文本的简单结构。必须沿用 HTML_PARSE_OPTIONS——
      // cheerio 的默认选项会走 parse5，序列化时把中文与既有实体全部重编码
      $ = cheerio.load(`<div>${chapter.data}</div>`, HTML_PARSE_OPTIONS)
    }

    processHtmlElements($, allowedAttributes, allowedXhtml11Tags, epubConfigs, index)
    processImages($, chapter, epubConfigs)

    chapter.data = extractAndCleanHtmlContent($)
  }

  processChildrenChapters(chapter, index, epubConfigs)

  return chapter
}
