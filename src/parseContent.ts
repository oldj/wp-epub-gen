/**
 * @author: oldj
 * @homepage: https://oldj.net
 */

import safeFineName from '@/libs/safeFineName'
import * as cheerio from 'cheerio'
import { remove as removeDiacritics } from 'diacritics'
import path from 'path'
import uslug from 'uslug'
import { v4 as uuidv4 } from 'uuid'
import { IChapter, IChapterData, IEpubData, IEpubImage } from './types'
// @ts-ignore - Direct import to avoid complex namespace processing
const mimeModule = require('mime/lite')
const mime = mimeModule.default || mimeModule

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
    titleSlug = titleSlug.replace(/[\/\\]/g, '_')
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
function getAllowedAttributes(): string[] {
  return [
    'content',
    'alt',
    'id',
    'title',
    'src',
    'href',
    'about',
    'accesskey',
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
    'content',
    'contenteditable',
    'contextmenu',
    'datatype',
    'dir',
    'draggable',
    'dropzone',
    'hidden',
    'hreflang',
    'id',
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
    'spellcheck',
    'style',
    'tabindex',
    'target',
    'title',
    'type',
    'typeof',
    'vocab',
    'xml:base',
    'xml:lang',
    'xml:space',
    'colspan',
    'rowspan',
    'epub:type',
    'epub:prefix',
  ]
}

/**
 * 获取XHTML 1.1允许的标签列表
 */
function getAllowedXhtml11Tags(): string[] {
  return [
    'div',
    'p',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'ul',
    'ol',
    'li',
    'dl',
    'dt',
    'dd',
    'address',
    'hr',
    'pre',
    'blockquote',
    'center',
    'ins',
    'del',
    'a',
    'span',
    'bdo',
    'br',
    'em',
    'strong',
    'dfn',
    'code',
    'samp',
    'kbd',
    'bar',
    'cite',
    'abbr',
    'acronym',
    'q',
    'sub',
    'sup',
    'tt',
    'i',
    'b',
    'big',
    'small',
    'u',
    's',
    'strike',
    'basefont',
    'font',
    'object',
    'param',
    'img',
    'table',
    'caption',
    'colgroup',
    'col',
    'thead',
    'tfoot',
    'tbody',
    'tr',
    'th',
    'td',
    'embed',
    'applet',
    'iframe',
    'img',
    'map',
    'noscript',
    'ns:svg',
    'object',
    'script',
    'table',
    'tt',
    'var',
  ]
}

/**
 * 加载并处理HTML内容，提取body部分
 */
function loadAndProcessHtml(data: string): cheerio.CheerioAPI {
  let $ = cheerio.load(data, {
    xml: {
      lowerCaseTags: true,
      recognizeSelfClosing: true,
    },
  })

  // only body innerHTML is allowed
  const body = $('body')
  if (body.length) {
    const html = body.html()
    if (html) {
      $ = cheerio.load(html, {
        xml: {
          lowerCaseTags: true,
          recognizeSelfClosing: true,
        },
      })
    }
  }

  return $
}

/**
 * 处理HTML元素，清理属性和标签
 */
function processHtmlElements(
  $: cheerio.CheerioAPI,
  allowedAttributes: string[],
  allowedXhtml11Tags: string[],
  epubConfigs: IEpubData,
  index: number | string,
): void {
  $($('*').get().reverse()).each(function (elemIndex: number, elem: any) {
    // @ts-ignore
    const attrs = elem.attribs
    // @ts-ignore
    const that: any = this
    const tags = ['img', 'br', 'hr']
    
    if (tags.includes(that.name)) {
      if (that.name === 'img' && !$(that).attr('alt')) {
        $(that).attr('alt', 'image-placeholder')
      }
    }

    Object.entries(attrs).map(([k, v]) => {
      if (allowedAttributes.includes(k)) {
        if (k === 'type' && that.name !== 'script') {
          $(that).removeAttr(k)
        }
      } else {
        $(that).removeAttr(k)
      }
    })

    if (epubConfigs.version === 2) {
      if (!allowedXhtml11Tags.includes(that.name)) {
        if (epubConfigs.verbose) {
          console.log(
            'Warning (content[' + index + ']):',
            that.name,
            "tag isn't allowed on EPUB 2/XHTML 1.1 DTD.",
          )
        }
        const child = $(that).html()
        $(that).replaceWith($('<div>' + child + '</div>'))
      }
    }
  })
}

/**
 * 处理图片元素，更新图片路径并添加到图片列表
 */
function processImages(
  $: cheerio.CheerioAPI,
  chapter: IChapterData,
  epubConfigs: IEpubData,
): void {
  $('img').each((index: number, elem: any) => {
    const url = $(elem).attr('src') || ''
    const image = epubConfigs.images.find((el) => el.url === url)
    let id: string
    let extension: string

    if (image) {
      id = image.id
      extension = image.extension
    } else {
      id = uuidv4()
      const mediaType: string = mime.getType(url.replace(/\?.*/, '')) || ''
      extension = mime.getExtension(mediaType) || ''
      const dir = chapter.dir || ''

      const img: IEpubImage = { id, url, dir, mediaType, extension }
      epubConfigs.images.push(img)
    }

    $(elem).attr('src', `images/${id}.${extension}`)
  })
}

/**
 * 提取并清理HTML内容，处理实体和自闭合标签
 */
function extractAndCleanHtmlContent($: cheerio.CheerioAPI, originalData?: string): string {
  // Get the processed HTML content without wrapping html/head/body tags
  let data: string
  if ($('body').length) {
    data = $('body').html() || ''
  } else {
    // For content without body tag, get the root content
    data = $.root().html() || ''
  }
  
  // 新的实现方式：保持HTML实体原样，不进行任何转换
  // 我们需要从原始数据中提取实体映射，然后在处理后的数据中恢复它们
  if (!originalData) {
    return data
      // Convert self-closing tags to XHTML format
      .replace(/<(br|hr|img|input|meta|area|base|col|embed|link|source|track|wbr)([^>]*?)><\/\1>/gi, '<$1$2/>')
      // Convert remaining unclosed self-closing tags to XHTML format
      .replace(/<(br|hr|img|input|meta|area|base|col|embed|link|source|track|wbr)([^>]*?)(?<!\/)>/gi, '<$1$2/>')
  }
  
  // 创建实体映射，记录原始数据中的所有HTML实体
  const entityMap = new Map<string, string>()
  const entityRegex = /&[a-zA-Z][a-zA-Z0-9]*;|&#[0-9]+;|&#x[0-9a-fA-F]+;/g
  
  // 使用matchAll来避免死循环问题
  const matches = Array.from(originalData.matchAll(entityRegex))
  let processedOriginal = originalData
  
  // 生成唯一的占位符前缀，避免与文档内容冲突
  const timestamp = Date.now()
  const randomId = Math.random().toString(36).substring(2, 8)
  const placeholderPrefix = `__ENTITY_${timestamp}_${randomId}_`
  
  // 从后往前替换，避免索引偏移问题
  for (let i = matches.length - 1; i >= 0; i--) {
    const match = matches[i]
    const placeholder = `${placeholderPrefix}${i}__`
    entityMap.set(placeholder, match[0])
    
    // 替换这个特定位置的实体
    processedOriginal = processedOriginal.substring(0, match.index!) + 
                      placeholder + 
                      processedOriginal.substring(match.index! + match[0].length)
  }
  
  // 使用处理过的原始数据重新加载到Cheerio
  const $temp = cheerio.load(processedOriginal, {
    xmlMode: false,
  })
  
  // 获取处理后的HTML
  let tempData: string
  if ($temp('body').length) {
    tempData = $temp('body').html() || ''
  } else {
    tempData = $temp.root().html() || ''
  }
  
  // 恢复实体
  for (const [placeholder, entity] of entityMap) {
    tempData = tempData.replace(new RegExp(placeholder, 'g'), entity)
  }
  
  return tempData
    // Convert self-closing tags to XHTML format
    .replace(/<(br|hr|img|input|meta|area|base|col|embed|link|source|track|wbr)([^>]*?)><\/\1>/gi, '<$1$2/>')
    // Convert remaining unclosed self-closing tags to XHTML format
    .replace(/<(br|hr|img|input|meta|area|base|col|embed|link|source|track|wbr)([^>]*?)(?<!\/)>/gi, '<$1$2/>')
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
  const chapter = initializeChapterInfo(content, index, epubConfigs)
  normalizeAuthorInfo(chapter)

  const allowedAttributes = getAllowedAttributes()
  const allowedXhtml11Tags = getAllowedXhtml11Tags()

  let $ = loadAndProcessHtml(chapter.data)

  processHtmlElements($, allowedAttributes, allowedXhtml11Tags, epubConfigs, index)

  processImages($, chapter, epubConfigs)

  chapter.data = extractAndCleanHtmlContent($, content.data)

  processChildrenChapters(chapter, index, epubConfigs)

  return chapter
}
