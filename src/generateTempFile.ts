/**
 * @author: oldj
 * @homepage: https://oldj.net
 */

import ejs from 'ejs'
import entities from 'entities'
import fs from 'fs-extra'
import path from 'path'
import { IChapterData, IEpubData } from './types'
import { readFile, simpleMinifier, writeFile } from './libs/utils'

export const generateTempFile = async (epubData: IEpubData) => {
  let { log } = epubData
  let oebps_dir = path.join(epubData.dir, 'OEBPS')
  await fs.ensureDir(oebps_dir)

  const templates_dir = path.join(epubData.baseDir, 'templates')

  epubData.css = epubData.css || (await readFile(path.join(templates_dir, 'template.css'), 'utf-8'))
  await writeFile(path.join(oebps_dir, 'style.css'), epubData.css, 'utf-8')

  if (epubData.fonts?.length) {
    let fonts_dir = path.join(oebps_dir, 'fonts')
    await fs.ensureDir(fonts_dir)
    epubData.fonts = epubData.fonts.map((font) => {
      let filename = path.basename(font)

      if (!fs.existsSync(font)) {
        log(`Custom font not found at '${font}'.`)
      } else {
        fs.copySync(font, path.join(fonts_dir, filename))
      }

      return filename
    })
  }

  const isAppendTitle = (global_append?: boolean, local_append?: boolean): boolean => {
    if (typeof local_append === 'boolean') return local_append
    return !!global_append
  }

  const saveContentToFile = (content: IChapterData) => {
    let title = entities.encodeXML(content.title || '')
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

    fs.ensureDirSync(path.dirname(content.filePath))
    fs.writeFileSync(content.filePath, html, 'utf-8')

    if (Array.isArray(content.children)) {
      content.children.map(saveContentToFile)
    }
  }

  epubData.content.map(saveContentToFile)

  // write meta-inf/container.xml
  let metainf_dir = path.join(epubData.dir, 'META-INF')
  fs.ensureDirSync(metainf_dir)
  fs.writeFileSync(
    path.join(metainf_dir, 'container.xml'),
    `<?xml version="1.0" encoding="UTF-8" ?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
<rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>
</container>`,
    'utf-8',
  )

  if (epubData.version === 2) {
    let fn = path.join(metainf_dir, 'com.apple.ibooks.display-options.xml')
    fs.writeFileSync(
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

  let opfPath =
    epubData.customOpfTemplatePath ||
    path.join(templates_dir, `epub${epubData.version}`, 'content.opf.ejs')
  if (!fs.existsSync(opfPath)) {
    throw new Error('Custom file to OPF template not found.')
  }

  let ncxTocPath = epubData.customNcxTocTemplatePath || path.join(templates_dir, `toc.ncx.ejs`)
  if (!fs.existsSync(ncxTocPath)) {
    throw new Error('Custom file the NCX toc template not found.')
  }

  let htmlTocPath =
    epubData.customHtmlTocTemplatePath ||
    path.join(templates_dir, `epub${epubData.version}`, 'toc.xhtml.ejs')
  if (!fs.existsSync(htmlTocPath)) {
    throw new Error('Custom file to HTML toc template not found.')
  }

  let toc_depth = 1
  fs.writeFileSync(
    path.join(oebps_dir, 'content.opf'),
    await ejs.renderFile(opfPath, epubData),
    'utf-8',
  )
  fs.writeFileSync(
    path.join(oebps_dir, 'toc.ncx'),
    await ejs.renderFile(ncxTocPath, { ...epubData, toc_depth }),
    'utf-8',
  )
  // 说明：toc.xhtml 的内容在 macOS 自带的 Books 会被当作目录显示，如果空格太多，目录显示可能会不正常，因此这儿简单去掉了不必要的空格
  fs.writeFileSync(
    path.join(oebps_dir, 'toc.xhtml'),
    simpleMinifier(await ejs.renderFile(htmlTocPath, epubData)),
    'utf-8',
  )
}
