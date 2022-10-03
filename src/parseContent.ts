/**
 * parseContent
 * @author: oldj
 * @homepage: https://oldj.net
 */

import * as cheerio from 'cheerio'
import { remove as removeDiacritics } from 'diacritics'
import * as mime from 'mime'
import * as path from 'path'
import * as uslug from 'uslug'
import { v4 as uuidv4 } from 'uuid'
import { IChapter, IChapterData, IEpubData, IEpubImage } from './types'

export default function parseContent(
  content: IChapter,
  index: number | string,
  epubConfigs: IEpubData,
): IChapterData {
  let chapter: IChapterData = { ...content } as IChapterData

  if (!chapter.filename) {
    let titleSlug = uslug(removeDiacritics(chapter.title || 'no title'))
    titleSlug = titleSlug.replace(/[\/\\]/g, '_')
    chapter.href = `${index}_${titleSlug}.xhtml`
    chapter.filePath = path.join(epubConfigs.dir, 'OEBPS', chapter.href)
  } else {
    let is_xhtml = chapter.filename.endsWith('.xhtml')
    chapter.href = is_xhtml ? chapter.filename : `${chapter.filename}.xhtml`
    if (is_xhtml) {
      chapter.filePath = path.join(epubConfigs.dir, 'OEBPS', chapter.filename)
    } else {
      chapter.filePath = path.join(epubConfigs.dir, 'OEBPS', `${chapter.filename}.xhtml`)
    }
  }

  chapter.id = `item_${index}`
  chapter.dir = path.dirname(chapter.filePath)
  chapter.excludeFromToc = chapter.excludeFromToc || false
  chapter.beforeToc = chapter.beforeToc || false

  // fix author array
  if (chapter.author && typeof chapter.author === 'string') {
    chapter.author = [chapter.author]
  } else if (!chapter.author || !Array.isArray(chapter.author)) {
    chapter.author = []
  }

  let allowedAttributes = [
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
  let allowedXhtml11Tags = [
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

  let $ = cheerio.load(chapter.data, {
    lowerCaseTags: true,
    recognizeSelfClosing: true,
  })

  // only body innerHTML is allowed
  let body = $('body')
  if (body.length) {
    let html = body.html()
    if (html) {
      $ = cheerio.load(html, {
        lowerCaseTags: true,
        recognizeSelfClosing: true,
      })
    }
  }

  $($('*').get().reverse()).each(function (elemIndex, elem) {
    // @ts-ignore
    let attrs = elem.attribs
    // @ts-ignore
    let that: CheerioElement = this
    let tags = ['img', 'br', 'hr']
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
        let child = $(that).html()
        $(that).replaceWith($('<div>' + child + '</div>'))
      }
    }
  })

  $('img').each((index, elem) => {
    let url = $(elem).attr('src') || ''
    let image = epubConfigs.images.find((el) => el.url === url)
    let id: string
    let extension: string

    if (image) {
      id = image.id
      extension = image.extension
    } else {
      id = uuidv4()
      let mediaType: string = mime.getType(url.replace(/\?.*/, '')) || ''
      extension = mime.getExtension(mediaType) || ''
      let dir = chapter.dir || ''

      let img: IEpubImage = { id, url, dir, mediaType, extension }
      epubConfigs.images.push(img)
    }

    $(elem).attr('src', `images/${id}.${extension}`)
  })

  chapter.data = $.xml()

  if (Array.isArray(chapter.children)) {
    chapter.children = chapter.children.map((content, idx) =>
      parseContent(content, `${index}_${idx}`, epubConfigs),
    )
  }

  return chapter
}
