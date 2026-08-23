# wp-epub-gen

基于 [epub-gen](https://github.com/cyrilis/epub-gen/) 改进的 EPUB 生成器，支持 TypeScript 和现代 ES 模块。

## 安装

使用 npm 安装：

```bash
npm install wp-epub-gen --save
```

## 基本使用

### JavaScript (CommonJS)

```javascript
const { epubGen } = require('wp-epub-gen')

epubGen({
  title: '我的电子书',
  author: '作者名',
  output: './my-book.epub',
  content: [
    {
      title: '第一章',
      data: '<h1>第一章</h1><p>这是第一章的内容...</p>',
    },
  ],
}).then(
  () => console.log('电子书生成成功！'),
  (err) => console.error('生成失败：', err),
)
```

### TypeScript / ES 模块

```typescript
import { epubGen, type IEpubGenOptions } from 'wp-epub-gen'

const options: IEpubGenOptions = {
  title: '我的电子书',
  author: '作者名',
  output: './my-book.epub',
  content: [
    {
      title: '第一章',
      data: '<h1>第一章</h1><p>这是第一章的内容...</p>',
    },
  ],
}

try {
  const result = await epubGen(options)
  if (result.success) {
    console.log('电子书生成成功！')
  } else {
    console.error('生成失败：', result.message)
  }
} catch (error) {
  console.error('发生错误：', error)
}
```

### 完整示例

```typescript
import { epubGen } from 'wp-epub-gen'

const options = {
  title: '完整示例电子书',
  author: ['张三', '李四'],
  publisher: '我的出版社',
  cover: 'https://example.com/cover.jpg',
  output: './complete-book.epub',
  version: 3,
  lang: 'zh-cn',
  css: "body { font-family: 'Microsoft YaHei', sans-serif; }",
  tocTitle: '目录',
  appendChapterTitles: true,
  tocAutoNumber: true,
  verbose: true,
  timeoutSeconds: 60,
  content: [
    {
      title: '前言',
      data: '<h1>前言</h1><p>这是前言内容...</p>',
      beforeToc: true,
    },
    {
      title: '第一部分',
      data: '<h1>第一部分</h1>',
      children: [
        {
          title: '第一章',
          data: '<h2>第一章</h2><p>第一章内容...</p>',
        },
        {
          title: '第二章',
          data: '<h2>第二章</h2><p>第二章内容...</p>',
        },
      ],
    },
    {
      title: '第二部分',
      data: '<h1>第二部分</h1><p>第二部分内容...</p>',
    },
    {
      title: '附录',
      data: '<h1>附录</h1><p>附录内容...</p>',
      excludeFromToc: true,
    },
  ],
}

epubGen(options).then((result) => {
  if (result.success) {
    console.log('电子书生成成功！')
  }
})
```

## API 参考

### epubGen(options, configs?)

主要的 EPUB 生成函数。

**参数：**

- `options: IEpubGenOptions` - 配置选项对象（标题、作者、封面、章节内容等）
- `configs?: IGenConfigs` - 可选的运行时回调（logger、onProgress、concurrency），见下文 [IGenConfigs](#igenconfigs-运行时回调)

**返回值：**

- `Promise<IOut>` - 包含生成结果的 Promise

### IEpubGenOptions 配置选项

#### 必需参数

- **`title: string`** - 电子书标题
- **`output: string`** - 输出文件路径（绝对路径）
- **`content: IChapter[]`** - 章节内容数组

#### 可选参数

- **`author?: string | string[]`** - 作者名称，可以是字符串或字符串数组
  - 示例：`"张三"` 或 `["张三", "李四"]`

- **`publisher?: string`** - 出版社名称

- **`cover?: string`** - 封面图片
  - 支持网络 URL：`"https://example.com/cover.jpg"`
  - 支持本地文件：`"/path/to/cover.jpg"`

- **`version?: 2 | 3`** - EPUB 版本
  - `3`：最新版本（默认）
  - `2`：兼容老设备

- **`lang?: string`** - 语言代码
  - 默认：`"en"`
  - 中文：`"zh-cn"`

- **`css?: string`** - 自定义 CSS 样式
  - 示例：`"body { font-family: 'Microsoft YaHei'; }"`

- **`fonts?: string[]`** - 自定义字体文件路径数组
  - 示例：`["/path/to/font.ttf"]`

  使用方法：

  ```css
  @font-face {
    font-family: 'CustomFont';
    src: url('./fonts/font.ttf');
  }
  ```

- **`tocTitle?: string`** - 目录标题
  - 默认：`"Table Of Contents"`

- **`appendChapterTitles?: boolean`** - 是否在章节开头自动添加标题
  - 默认：`true`

- **`tocAutoNumber?: boolean`** - 目录是否自动编号
  - 默认：`false`

- **`verbose?: boolean`** - 是否输出详细日志
  - 默认：`false`

- **`timeoutSeconds?: number`** - 超时时间（秒）
  - `0` 表示无超时
  - 默认：`900`（15分钟）

- **`description?: string`** - 电子书描述

- **`date?: string`** - 出版日期（ISO 格式）

- **`tmpDir?: string`** - 临时目录路径

#### 高级自定义选项

- **`customOpfTemplatePath?: string`** - 自定义 OPF 模板文件路径
- **`customNcxTocTemplatePath?: string`** - 自定义 NCX 目录模板文件路径
- **`customHtmlTocTemplatePath?: string`** - 自定义 HTML 目录模板文件路径

### IChapter 章节对象

每个章节对象可以包含以下属性：

#### 必需属性

- **`data: string`** - 章节的 HTML 内容
  - 网络图片：`<img src="https://example.com/image.jpg" />`
  - 本地图片：`<img src="file:///path/to/image.jpg" />`
  - `<picture>`：只有 `<img>` 后备图会被打包，`<source>` 会被删除——`srcset` 里的地址不进图片管线（既不下载也不写进 manifest），留着就是指不到资源的非法元素。`<picture>` 里没有可用的 `<img>`（缺 `src`、`src` 为空、或只靠 `srcset` 给图）时，整个元素一并删除。响应式图片请直接给 `<img src>`
  - 属性过滤：只保留白名单内的属性（`class` / `id` / `style` / `href` / `src` / `alt` / ARIA 等），另有两道校验
    - **宿主标签**：`width` / `height` 只留在 `<img>` / `<object>` 等替换元素上（`version: 2` 另含 `<table>` / `<col>` / `<colgroup>`，`version: 3` 另含 `<video>` / `<canvas>`）；`type` 只留在 `<script>` / `<a>` / `<object>` / `<param>` / `<input>` / `<button>`（`version: 3` 另含 `<ol>` / `<source>` / `<embed>` / `<link>`）；`checked` 只留在 `<input type="checkbox">` / `<input type="radio">` 上，`disabled` 只留在 `<input>` / `<button>` / `<select>` / `<textarea>` / `<option>` / `<optgroup>` / `<fieldset>` 上。挂错标签的一律删除，例如 `<p width>`、`<div start>`、`<ul type>`、`<ul>` 里 `<li>` 的 `value`——`<ul>` 的项目符号请改用 CSS 的 `list-style-type`
    - **属性值**：尺寸要求非负整数（`version: 2` 按 XHTML 1.1 的 `Length`，额外接受 `100%` 这类百分比；`version: 3` 按 HTML 只收整数），`<ol type>` 只收 `1` / `a` / `A` / `i` / `I`，`<input type>` / `<button type>` 只收各自的控件种类，`start` / `value` 要求整数，`reversed` / `checked` / `disabled` 只收 XML 的布尔写法（`attr=""` 或 `attr="attr"`，`version: 2` 更严，只收后者），`true` / `yes` 这类写法一律删除。值不合法就把整个属性删掉，避免 EPUBCheck 报错。Markdown 任务列表的 `<input type="checkbox" disabled checked>` 因此能原样带进 `version: 3` 的 EPUB；`name` / `value` 等其余表单属性仍不保留
    - `version: 3` 额外保留 `<ol>` 的 `start` / `reversed` / `type`、有序列表里 `<li>` 的 `value`，以及 `data-*` 自定义数据属性；`version: 2` 按 XHTML 1.1 严格过滤，这些一律删除

#### 可选属性

- **`id?: string`** - 唯一标识符
- **`title?: string`** - 章节标题
- **`author?: string | string[]`** - 章节作者（覆盖全局作者）
- **`filename?: string`** - 自定义文件名
- **`excludeFromToc?: boolean`** - 是否从目录中排除（默认：`false`）
- **`beforeToc?: boolean`** - 是否显示在目录之前（如版权页）（默认：`false`）
- **`appendChapterTitle?: boolean`** - 覆盖全局的 `appendChapterTitles` 设置
- **`children?: IChapter[]`** - 子章节数组（用于创建层级结构）

### 返回值类型 IOut

```typescript
interface IOut {
  success?: boolean // 是否成功
  message?: string // 错误信息（如果失败）
  options?: IEpubGenOptions // 使用的配置选项
}
```

### IGenConfigs 运行时回调

`epubGen` 的第二个参数，用于注入宿主侧的回调和并发配置。所有字段都是可选的。

```typescript
interface IGenConfigs {
  logger?: ILogger
  onProgress?: (e: IProgressEvent) => void
  concurrency?: number
}
```

#### `logger?: ILogger`

注入自定义日志记录器（替代默认 `console`）。常用于 Electron 主进程把日志转发到渲染进程。

```typescript
interface ILogger {
  log: (msg: any) => void
  info: (msg: any) => void
  warn: (msg: any) => void
  error: (msg: any) => void
}
```

#### `onProgress?: (e: IProgressEvent) => void`

进度回调。生成过程会在 5 个阶段中分别推送事件，宿主可据此渲染进度条或转发 IPC 给 UI。

```typescript
type ProgressPhase =
  | 'parseContent' // 解析章节 HTML
  | 'writeChapters' // 写章节临时文件
  | 'buildToc' // 渲染 OPF / NCX / TOC
  | 'downloadImage' // 下载图片（仅当存在图片时）
  | 'zip' // 打包 .epub

interface IProgressEvent {
  phase: ProgressPhase
  current: number // 已完成数量
  total: number // 总数量
  label?: string // 当前条目标签（章节标题 / 图片 URL）
}
```

最小用法：

```typescript
await epubGen(options, {
  onProgress: (e) => {
    console.log(`[${e.phase}] ${e.current}/${e.total}`)
  },
})
```

回调中抛出的异常会被库静默吞掉，不会中断 EPUB 生成。

#### `concurrency?: number`

写章节文件和下载图片所共用的并发上限。默认 `16`，机械硬盘或带宽受限场景可调小（如 `4`）。非有限正整数（NaN、负数等）会被自动归一化为默认值。

## 导出的类型

库导出了所有 TypeScript 类型定义：

```typescript
import type {
  IEpubGenOptions,
  IChapter,
  IChapterData,
  IEpubData,
  IEpubImage,
  IGenConfigs,
  ILogger,
  IProgressEvent,
  ProgressPhase,
  IOut,
} from 'wp-epub-gen'
```

## 错误处理

```typescript
import { epubGen, errors } from 'wp-epub-gen'

const result = await epubGen(options)

if (!result.success) {
  switch (result.message) {
    case errors.no_title:
      console.error('缺少标题')
      break
    case errors.no_output_path:
      console.error('缺少输出路径')
      break
    case errors.no_content:
      console.error('缺少内容')
      break
    default:
      console.error('未知错误：', result.message)
  }
}
```
