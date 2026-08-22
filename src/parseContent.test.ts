import os from 'os'
import path from 'path'
import { describe, expect, it } from 'vitest'
import parseContent from './parseContent'
import { IChapter, IEpubData } from './types'

describe('parseContent', () => {
  const mockEpubConfigs: IEpubData = {
    id: 'test-epub-id',
    title: 'Test EPUB',
    cover: '',
    output: '',
    docHeader: '<?xml version="1.0" encoding="UTF-8"?>',
    dir: path.join(os.tmpdir(), 'test-epub'),
    tmpDir: path.join(os.tmpdir(), 'test-epub-tmp'),
    baseDir: path.join(os.tmpdir(), 'test-epub-base'),
    version: 3,
    images: [],
    verbose: false,
    content: [],
    timeoutSeconds: 900,
    log: () => {},
  }

  it('should handle HTML entities correctly without double encoding', () => {
    const inputChapter: IChapter = {
      title: '实体测试',
      data: `
        <div class="wonderpen-page">
          <div id="wonderpen-content" class="wonderpen-content">
            <div class="markdown-body">
              <p>&nbsp;&nbsp;测试内容&nbsp;&nbsp;</p>
              <p>&lt;标签&gt; &quot;引号&quot; &amp; 符号</p>
            </div>
          </div>
        </div>
      `,
    }

    const result = parseContent(inputChapter, 0, mockEpubConfigs)

    // 检查是否正确处理HTML实体，不应该出现双重编码
    expect(result.data).toContain('&nbsp;')
    expect(result.data).not.toContain('&amp;nbsp;')
    expect(result.data).toContain('&lt;')
    expect(result.data).not.toContain('&amp;lt;')
    expect(result.data).toContain('&quot;')
    expect(result.data).not.toContain('&amp;quot;')
    expect(result.data).toContain('&amp;')
    expect(result.data).not.toContain('&amp;amp;')
  })

  it('should not create nested HTML structure', () => {
    const inputChapter: IChapter = {
      title: '嵌套测试',
      data: `
        <html>
          <head></head>
          <body>
            <div class="content">
              <p>测试内容</p>
            </div>
          </body>
        </html>
      `,
    }

    const result = parseContent(inputChapter, 0, mockEpubConfigs)

    // 检查输出不应该包含嵌套的html/head/body标签
    expect(result.data).not.toMatch(/<html[^>]*>/)
    expect(result.data).not.toContain('<head>')
    expect(result.data).not.toMatch(/<body[^>]*>/)
    expect(result.data).toContain('<div class="content">')
    expect(result.data).toContain('<p>测试内容</p>')
  })

  it('should preserve content structure when no body tag exists', () => {
    const inputChapter: IChapter = {
      title: '无body标签测试',
      data: `
        <div class="markdown-body">
          <h1>标题</h1>
          <p>段落内容&nbsp;测试</p>
        </div>
      `,
    }

    const result = parseContent(inputChapter, 0, mockEpubConfigs)

    // 检查内容结构是否保持完整
    expect(result.data).toContain('<div class="markdown-body">')
    expect(result.data).toContain('<h1>标题</h1>')
    expect(result.data).toContain('<p>段落内容&nbsp;测试</p>')
    expect(result.data).not.toContain('&amp;nbsp;')
  })

  it('should generate correct file paths and metadata', () => {
    const inputChapter: IChapter = {
      title: '路径测试',
      data: '<p>测试内容</p>',
    }

    const result = parseContent(inputChapter, 1, mockEpubConfigs)

    // 检查生成的文件路径和元数据
    expect(result.href).toMatch(/^1_.*\.xhtml$/)
    expect(result.filePath).toContain('OEBPS')
    expect(result.id).toBe('item_1')
    expect(result.title).toBe('路径测试')
  })

  it('should preserve HTML entities as-is without encoding or decoding', () => {
    const inputChapter: IChapter = {
      title: '实体保持测试',
      data: `
        <div class="wonderpen-page">
          <div class="wonderpen-content">
            <h1>标题&nbsp;测试</h1>
            <p>段落1&nbsp;&nbsp;内容</p>
            <blockquote>
              <p>&quot;引用内容&quot;&nbsp;测试</p>
            </blockquote>
            <p>段落2&lt;标签&gt;&amp;符号</p>
          </div>
        </div>
      `,
    }

    const result = parseContent(inputChapter, 0, mockEpubConfigs)

    // 检查混合内容处理
    expect(result.data).toContain('<h1>')
    expect(result.data).toContain('<blockquote>')

    // 检查HTML实体原样保持
    expect(result.data).toContain('&nbsp;')
    expect(result.data).toContain('&quot;')
    expect(result.data).toContain('&lt;')
    expect(result.data).toContain('&amp;')

    // 确保没有双重编码（实体应该保持原样）
    expect(result.data).not.toContain('&amp;nbsp;')
    expect(result.data).not.toContain('&amp;quot;')
    expect(result.data).not.toContain('&amp;lt;')
    expect(result.data).not.toContain('&amp;amp;')

    // 确保没有嵌套HTML结构
    expect(result.data).not.toMatch(/<html[^>]*>/)
    expect(result.data).not.toMatch(/<body[^>]*>/)
  })

  it('should handle empty or minimal content', () => {
    const inputChapter: IChapter = {
      title: '空内容测试',
      data: '',
    }

    const result = parseContent(inputChapter, 0, mockEpubConfigs)

    // 检查空内容处理
    expect(result.data).toBe('')
    expect(result.title).toBe('空内容测试')
    expect(result.href).toMatch(/^0_.*\.xhtml$/)
  })

  it('should extract only body content from complete HTML document', () => {
    const inputChapter: IChapter = {
      title: '完整HTML文档测试',
      data: `
        <!DOCTYPE html>
        <html lang="zh-CN">
          <head>
            <meta charset="UTF-8">
            <title>页面标题</title>
            <style>body { margin: 0; }</style>
          </head>
          <body>
            <div class="main-content">
              <h1>主要内容标题</h1>
              <p>这是正文内容&nbsp;&nbsp;包含实体</p>
              <div class="section">
                <p>嵌套内容</p>
              </div>
            </div>
          </body>
        </html>
      `,
    }

    const result = parseContent(inputChapter, 0, mockEpubConfigs)

    // 检查输出只包含body内容，不包含html、head、body标签
    expect(result.data).not.toMatch(/<![^>]*>/)
    expect(result.data).not.toMatch(/<html[^>]*>/)
    expect(result.data).not.toContain('</html>')
    expect(result.data).not.toMatch(/<head[^>]*>/)
    expect(result.data).not.toContain('</head>')
    expect(result.data).not.toMatch(/<body[^>]*>/)
    expect(result.data).not.toContain('</body>')
    expect(result.data).not.toContain('<meta')
    expect(result.data).not.toContain('<title>')
    expect(result.data).not.toContain('<style>')

    // 检查body内容被正确提取
    expect(result.data).toContain('<div class="main-content">')
    expect(result.data).toContain('<h1>主要内容标题</h1>')
    expect(result.data).toContain('<p>这是正文内容&nbsp;&nbsp;包含实体</p>')
    expect(result.data).toContain('<div class="section">')
    expect(result.data).toContain('<p>嵌套内容</p>')

    // 确保HTML实体正确处理
    expect(result.data).toContain('&nbsp;')
    expect(result.data).not.toContain('&amp;nbsp;')
  })

  it('should convert unclosed HTML tags to valid XHTML format', () => {
    const inputChapter: IChapter = {
      title: '未闭合标签测试',
      data: `
        <div class="content">
          <p>段落1内容
          <br>
          <p>段落2内容&nbsp;测试
          <img src="test.jpg" alt="测试图片">
          <hr>
          <p>段落3内容
          <br><br>
          <ul>
            <li>列表项1
            <li>列表项2&nbsp;&nbsp;内容
            <li>列表项3
          </ul>
          <p>最后段落
          <input type="text" name="test">
          <meta name="test" content="value">
        </div>
      `,
    }

    const result = parseContent(inputChapter, 0, mockEpubConfigs)

    // 检查自闭合标签被正确转换为XHTML格式
    expect(result.data).toMatch(/<br\s*\/>/g) // <br> -> <br/>
    expect(result.data).toMatch(/<img[^>]*\/>/g) // <img> -> <img/>
    expect(result.data).toMatch(/<hr\s*\/>/g) // <hr> -> <hr/>
    expect(result.data).toMatch(/<input[^>]*\/>/g) // <input> -> <input/>
    expect(result.data).toMatch(/<meta[^>]*\/>/g) // <meta> -> <meta/>

    // 验证自闭合标签的XHTML格式正确性
    const brMatches = result.data.match(/<br[^>]*\/?>/g) || []
    const imgMatches = result.data.match(/<img[^>]*\/?>/g) || []
    const hrMatches = result.data.match(/<hr[^>]*\/?>/g) || []
    const inputMatches = result.data.match(/<input[^>]*\/?>/g) || []
    const metaMatches = result.data.match(/<meta[^>]*\/?>/g) || []

    // 所有匹配的自闭合标签都应该以 /> 结尾
    brMatches.forEach((tag) => expect(tag).toMatch(/\/>$/))
    imgMatches.forEach((tag) => expect(tag).toMatch(/\/>$/))
    hrMatches.forEach((tag) => expect(tag).toMatch(/\/>$/))
    inputMatches.forEach((tag) => expect(tag).toMatch(/\/>$/))
    metaMatches.forEach((tag) => expect(tag).toMatch(/\/>$/))

    // 检查块级标签被正确闭合
    expect(result.data).toMatch(/<p[^>]*>.*?<\/p>/gs) // 所有p标签都应该闭合
    expect(result.data).toMatch(/<li[^>]*>.*?<\/li>/gs) // 所有li标签都应该闭合

    // 检查HTML实体正确处理
    expect(result.data).toContain('&nbsp;')
    expect(result.data).not.toContain('&amp;nbsp;')

    // 检查内容完整性
    expect(result.data).toContain('段落1内容')
    expect(result.data).toContain('段落2内容&nbsp;测试')
    expect(result.data).toContain('列表项1')
    expect(result.data).toContain('列表项2&nbsp;&nbsp;内容')
    expect(result.data).toContain('最后段落')
  })

  it('should preserve mixed HTML entities exactly as they appear in input', () => {
    const inputChapter: IChapter = {
      title: '混合实体保持测试',
      data: `
        <div>
          <p>这是包含&amp;nbsp;的段落</p>
          <p>这里有&nbsp;普通空格和&amp;nbsp;编码空格</p>
          <p>多个&amp;nbsp;&amp;nbsp;&amp;nbsp;连续编码空格</p>
          <span>行内元素&amp;nbsp;测试</span>
          <p>其他实体：&lt;标签&gt;和&quot;引号&quot;</p>
        </div>
      `,
    }

    const result = parseContent(inputChapter, 0, mockEpubConfigs)

    // 检查所有实体都原样保持
    expect(result.data).toContain('&amp;nbsp;')
    expect(result.data).toContain('&nbsp;')
    expect(result.data).toContain('&lt;')
    expect(result.data).toContain('&gt;')
    expect(result.data).toContain('&quot;')

    // 检查内容完整性
    expect(result.data).toContain('这是包含&amp;nbsp;的段落')
    expect(result.data).toContain('普通空格和&amp;nbsp;编码空格')
    expect(result.data).toContain('多个&amp;nbsp;&amp;nbsp;&amp;nbsp;连续编码空格')
    expect(result.data).toContain('行内元素&amp;nbsp;测试')
    expect(result.data).toContain('其他实体：&lt;标签&gt;和&quot;引号&quot;')

    // 确保没有三重编码
    expect(result.data).not.toContain('&amp;amp;nbsp;')
    expect(result.data).not.toContain('&amp;lt;')
    expect(result.data).not.toContain('&amp;gt;')
    expect(result.data).not.toContain('&amp;quot;')
  })

  it('should preserve numeric HTML entities exactly as they appear in input', () => {
    const inputChapter: IChapter = {
      title: '数字实体保持测试',
      data: `
        <div>
          <p>十进制实体：&#160;空格和&#8220;左引号&#8221;</p>
          <p>十六进制实体：&#x00A0;空格和&#x201C;左引号&#x201D;</p>
          <p>混合使用：&#160;和&nbsp;以及&#x00A0;</p>
        </div>
      `,
    }

    const result = parseContent(inputChapter, 0, mockEpubConfigs)

    // 检查数字实体原样保持
    expect(result.data).toContain('&#160;')
    expect(result.data).toContain('&#8220;')
    expect(result.data).toContain('&#8221;')
    expect(result.data).toContain('&#x00A0;')
    expect(result.data).toContain('&#x201C;')
    expect(result.data).toContain('&#x201D;')

    // 检查命名实体也保持原样
    expect(result.data).toContain('&nbsp;')

    // 检查内容完整性
    expect(result.data).toContain('十进制实体：&#160;空格和&#8220;左引号&#8221;')
    expect(result.data).toContain('十六进制实体：&#x00A0;空格和&#x201C;左引号&#x201D;')
    expect(result.data).toContain('混合使用：&#160;和&nbsp;以及&#x00A0;')
  })

  // ── void 元素回归 ─────────────────────────────────────────────────────────────
  // 历史 bug：章节 HTML 曾以 xmlMode 解析，XML 没有 void 元素的概念，`<hr>` 会被当成未闭合的
  // 开标签把后续兄弟节点吸成子节点，父元素闭合时补出 `</hr>`；随后那道「补自闭合斜线」的正则
  // 又把开标签写成 `<hr/>`，产出 `<hr/>…</hr>`，阅读器按 XHTML 严格解析报
  // "Opening and ending tag mismatch"，整章白屏。
  //
  // 注意 “所有 <br> 都以 /> 结尾” 这类遍历式断言查不出本 bug——错配的是**多出来的闭合标签**，
  // 遍历只看得见开标签。故这里正面校验产物良构。

  /**
   * 极简 XHTML 良构校验：扫描标签做栈式配对。
   * 仅供测试使用——输入是本文件构造的受控片段，不含注释 / CDATA / 处理指令。
   * @returns 良构返回 null，否则返回错配描述
   */
  const findTagMismatch = (xhtml: string): string | null => {
    const stack: string[] = []
    const reg = /<(\/?)([a-zA-Z][\w:-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g
    let m: RegExpExecArray | null

    while ((m = reg.exec(xhtml)) !== null) {
      const [, closing, name, rest] = m
      if (closing) {
        const top = stack.pop()
        if (top !== name) {
          return `</${name}> mismatches ${top ? `<${top}>` : '(empty stack)'}`
        }
        continue
      }
      // 自闭合标签不入栈
      if (!/\/\s*$/.test(rest)) stack.push(name)
    }

    return stack.length > 0 ? `<${stack[stack.length - 1]}> is never closed` : null
  }

  it('should produce well-formed XHTML when void tags have following siblings', () => {
    const result = parseContent(
      {
        title: 'void 元素',
        // 三个实测触发点：正文分隔线、脚注区分隔线、脚注内容里的换行
        data:
          '<div><p>正文一</p><hr><p>正文二</p>' +
          '<div class="footnotes"><hr><ol><li id="fn-1">第一行<br>第二行 ' +
          '<a href="#fnref-1">back</a></li></ol></div>' +
          '<p>图<img src="a.png">尾</p></div>',
      },
      0,
      mockEpubConfigs,
    )

    expect(findTagMismatch(result.data)).toBeNull()
    // 孤儿闭合标签是本 bug 的直接指纹，单独钉死
    expect(result.data).not.toMatch(/<\/(?:br|hr|img|input|meta|col|link|area|base|wbr)\s*>/i)
    // void 元素不得吞掉后面的兄弟节点：三处内容都必须还在
    expect(result.data).toContain('<p>正文二</p>')
    expect(result.data).toContain('第一行<br/>第二行')
    expect(result.data).toContain('尾</p>')
    // 数量也要对，防止「良构但被吞掉一半」
    expect(result.data.match(/<hr\s*\/>/g)).toHaveLength(2)
    expect(result.data.match(/<br\s*\/>/g)).toHaveLength(1)
  })

  it('should not truncate void tags whose attribute value contains ">"', () => {
    // 旧实现用 `<(br|hr|img|…)([^>]*?)…>` 事后修补，属性值里的 > 会把标签提前截断改坏
    const result = parseContent(
      { title: '属性含尖括号', data: '<p><img src="a.png" alt="a>b">尾</p>' },
      0,
      mockEpubConfigs,
    )

    expect(findTagMismatch(result.data)).toBeNull()
    expect(result.data).toContain('alt="a>b"')
    expect(result.data).toContain('尾')
  })

  it('should keep CJK text and entities untouched around void tags', () => {
    // 防止解析器被换回 cheerio 默认的 parse5：它会把中文与既有实体重编码成 &#x....;
    const result = parseContent(
      { title: '实体保持', data: '<p>中文&nbsp;&amp;&#8220;引号&#8221;<br>下一行</p>' },
      0,
      mockEpubConfigs,
    )

    expect(result.data).toContain('中文&nbsp;&amp;&#8220;引号&#8221;<br/>下一行')
  })

  it('should keep void tags well-formed when EPUB2 rewrites disallowed tags', () => {
    // EPUB2/XHTML1.1 路径会把白名单外的标签替换为 <div>，过程中走一次 html() 序列化 + 重新解析。
    // 这里确认那次往返不会重新引入错配的 void 标签。
    const result = parseContent(
      {
        title: 'EPUB2 标签替换',
        data: '<section><p>甲<br>乙</p><hr><p>丙</p><img src="a.png">尾</section>',
      },
      0,
      { ...mockEpubConfigs, version: 2 },
    )

    expect(findTagMismatch(result.data)).toBeNull()
    expect(result.data).not.toMatch(/<\/(?:br|hr|img)\s*>/i)
    expect(result.data).toContain('甲<br/>乙')
    expect(result.data).toContain('<p>丙</p>')
    expect(result.data).toContain('尾')
  })
})
