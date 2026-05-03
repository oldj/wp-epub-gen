/**
 * @author: oldj
 * @homepage: https://oldj.net
 */

import ejs from 'ejs'
import * as entities from 'entities'
import fs from 'fs-extra'
import path from 'path'
import { emitProgress, pLimit, simpleMinifier, writeFile } from './libs/utils'
import {
  epub2_content_opf_ejs,
  epub2_toc_xhtml_ejs,
  epub3_content_opf_ejs,
  epub3_toc_xhtml_ejs,
  template_css,
  toc_ncx_ejs,
} from './templates'
import { IChapterData, IEpubData } from './types'

export const generateTempFile = async (epubData: IEpubData) => {
  const { log } = epubData
  const oebpsDir = path.join(epubData.dir, 'OEBPS')
  await fs.ensureDir(oebpsDir)

  // 使用嵌入的模板内容，无需文件路径依赖
  const customCss = epubData.css || ''
  if (!epubData.noDefaultCss) {
    // 添加默认样式
    epubData.css = template_css
    if (customCss) {
      epubData.css += '\n\n' + customCss
    }
  } else {
    epubData.css = customCss
  }
  await writeFile(path.join(oebpsDir, 'style.css'), epubData.css, 'utf-8')

  if (epubData.fonts?.length) {
    const fonts_dir = path.join(oebpsDir, 'fonts')
    await fs.ensureDir(fonts_dir)
    const fontFilenames: string[] = []
    for (const font of epubData.fonts) {
      const filename = path.basename(font)
      if (!fs.existsSync(font)) {
        log(`Custom font not found at '${font}'.`)
      } else {
        await fs.copy(font, path.join(fonts_dir, filename))
      }
      fontFilenames.push(filename)
    }
    epubData.fonts = fontFilenames
  }

  const isAppendTitle = (global_append?: boolean, local_append?: boolean): boolean => {
    if (typeof local_append === 'boolean') return local_append
    return !!global_append
  }

  const renderChapterHtml = (content: IChapterData): string => {
    const title = entities.encodeXML(content.title || '')
    let html = `${epubData.docHeader}
<head>
<meta charset="UTF-8" />
<title>${title}</title>
<link rel="stylesheet" type="text/css" href="style.css" />
</head>
<body>
`
    if (content.title && isAppendTitle(epubData.appendChapterTitles, content.appendChapterTitle)) {
      html += `<h1>${title}</h1>`
    }
    html +=
      content.title && content.author && content.author?.length
        ? `<p class='epub-author'>${entities.encodeXML(content.author.join(', '))}</p>`
        : ''
    html +=
      content.title && content.url
        ? `<p class="epub-link"><a href="${content.url}">${content.url}</a></p>`
        : ''
    html += `${content.data}`
    html += '\n</body>\n</html>'
    return html
  }

  const flattenChapters = (nodes: IChapterData[], out: IChapterData[] = []): IChapterData[] => {
    for (const c of nodes) {
      out.push(c)
      if (Array.isArray(c.children) && c.children.length) flattenChapters(c.children, out)
    }
    return out
  }

  const allChapters = flattenChapters(epubData.content)
  const totalChapters = allChapters.length

  // Phase 1: 单次 ensureDir 唯一目录（消除每章一次的重复调用）
  const uniqueDirs = Array.from(new Set(allChapters.map((c) => path.dirname(c.filePath))))
  for (const d of uniqueDirs) await fs.ensureDir(d)

  // Phase 2: 并发写章节文件
  const concurrency = epubData._configs?.concurrency ?? 16
  const limit = pLimit<void>(concurrency)
  let written = 0
  await Promise.all(
    allChapters.map((content) =>
      limit(async () => {
        await fs.writeFile(content.filePath, renderChapterHtml(content), 'utf-8')
        written++
        emitProgress(epubData._configs, {
          phase: 'writeChapters',
          current: written,
          total: totalChapters,
          label: content.title,
        })
      }),
    ),
  )

  // write meta-inf/container.xml
  const metainf_dir = path.join(epubData.dir, 'META-INF')
  await fs.ensureDir(metainf_dir)
  await fs.writeFile(
    path.join(metainf_dir, 'container.xml'),
    `<?xml version="1.0" encoding="UTF-8" ?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
<rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>
</container>`,
    'utf-8',
  )

  if (epubData.version === 2) {
    const fn = path.join(metainf_dir, 'com.apple.ibooks.display-options.xml')
    await fs.writeFile(
      fn,
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<display_options>
  <platform name="*">
    <option name="specified-fonts">true</option>
  </platform>
</display_options>
`,
      'utf-8',
    )
  }

  // 获取模板内容（支持自定义模板文件路径）
  let opfTemplate: string
  let ncxTocTemplate: string
  let htmlTocTemplate: string

  if (epubData.customOpfTemplatePath && fs.existsSync(epubData.customOpfTemplatePath)) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { readFile } = require('./libs/utils')
    opfTemplate = await readFile(epubData.customOpfTemplatePath, 'utf-8')
  } else {
    opfTemplate = epubData.version === 2 ? epub2_content_opf_ejs : epub3_content_opf_ejs
  }

  if (epubData.customNcxTocTemplatePath && fs.existsSync(epubData.customNcxTocTemplatePath)) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { readFile } = require('./libs/utils')
    ncxTocTemplate = await readFile(epubData.customNcxTocTemplatePath, 'utf-8')
  } else {
    ncxTocTemplate = toc_ncx_ejs
  }

  if (epubData.customHtmlTocTemplatePath && fs.existsSync(epubData.customHtmlTocTemplatePath)) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { readFile } = require('./libs/utils')
    htmlTocTemplate = await readFile(epubData.customHtmlTocTemplatePath, 'utf-8')
  } else {
    htmlTocTemplate = epubData.version === 2 ? epub2_toc_xhtml_ejs : epub3_toc_xhtml_ejs
  }

  const toc_depth = 1
  emitProgress(epubData._configs, { phase: 'buildToc', current: 0, total: 3 })
  // 说明：toc.xhtml 的内容在 macOS 自带的 Books 会被当作目录显示，如果空格太多，目录显示可能会不正常，因此这儿简单去掉了不必要的空格
  await Promise.all([
    fs.writeFile(path.join(oebpsDir, 'content.opf'), ejs.render(opfTemplate, epubData), 'utf-8'),
    fs.writeFile(
      path.join(oebpsDir, 'toc.ncx'),
      ejs.render(ncxTocTemplate, { ...epubData, toc_depth }),
      'utf-8',
    ),
    fs.writeFile(
      path.join(oebpsDir, 'toc.xhtml'),
      simpleMinifier(ejs.render(htmlTocTemplate, epubData)),
      'utf-8',
    ),
  ])
  emitProgress(epubData._configs, { phase: 'buildToc', current: 3, total: 3 })
}
