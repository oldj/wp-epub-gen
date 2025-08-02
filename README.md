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
const { epubGen } = require("wp-epub-gen");

epubGen({
  title: "我的电子书",
  author: "作者名",
  output: "./my-book.epub",
  content: [
    {
      title: "第一章",
      data: "<h1>第一章</h1><p>这是第一章的内容...</p>"
    }
  ]
}).then(
  () => console.log("电子书生成成功！"),
  err => console.error("生成失败：", err)
);
```

### TypeScript / ES 模块

```typescript
import { epubGen, type IEpubGenOptions } from 'wp-epub-gen';

const options: IEpubGenOptions = {
  title: "我的电子书",
  author: "作者名",
  output: "./my-book.epub",
  content: [
    {
      title: "第一章",
      data: "<h1>第一章</h1><p>这是第一章的内容...</p>"
    }
  ]
};

try {
  const result = await epubGen(options);
  if (result.success) {
    console.log("电子书生成成功！");
  } else {
    console.error("生成失败：", result.message);
  }
} catch (error) {
  console.error("发生错误：", error);
}
```

### 完整示例

```typescript
import { epubGen } from 'wp-epub-gen';

const options = {
  title: "完整示例电子书",
  author: ["张三", "李四"],
  publisher: "我的出版社",
  cover: "https://example.com/cover.jpg",
  output: "./complete-book.epub",
  version: 3,
  lang: "zh-cn",
  css: "body { font-family: 'Microsoft YaHei', sans-serif; }",
  tocTitle: "目录",
  appendChapterTitles: true,
  tocAutoNumber: true,
  verbose: true,
  timeoutSeconds: 60,
  content: [
    {
      title: "前言",
      data: "<h1>前言</h1><p>这是前言内容...</p>",
      beforeToc: true
    },
    {
      title: "第一部分",
      data: "<h1>第一部分</h1>",
      children: [
        {
          title: "第一章",
          data: "<h2>第一章</h2><p>第一章内容...</p>"
        },
        {
          title: "第二章", 
          data: "<h2>第二章</h2><p>第二章内容...</p>"
        }
      ]
    },
    {
      title: "第二部分",
      data: "<h1>第二部分</h1><p>第二部分内容...</p>"
    },
    {
      title: "附录",
      data: "<h1>附录</h1><p>附录内容...</p>",
      excludeFromToc: true
    }
  ]
};

epubGen(options).then(result => {
  if (result.success) {
    console.log("电子书生成成功！");
  }
});
```

## API 参考

### epubGen(options, output?)

主要的 EPUB 生成函数。

**参数：**
- `options: IEpubGenOptions` - 配置选项对象
- `output?: string` - 可选的输出路径，会覆盖 options.output

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
    font-family: "CustomFont";
    src: url("./fonts/font.ttf");
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
  success?: boolean;     // 是否成功
  message?: string;      // 错误信息（如果失败）
  options?: IEpubGenOptions; // 使用的配置选项
}
```

## 导出的类型

库导出了所有 TypeScript 类型定义：

```typescript
import type { 
  IEpubGenOptions, 
  IChapter, 
  IChapterData,
  IEpubData,
  IEpubImage,
  IOut 
} from 'wp-epub-gen';
```

## 错误处理

```typescript
import { epubGen, errors } from 'wp-epub-gen';

const result = await epubGen(options);

if (!result.success) {
  switch (result.message) {
    case errors.no_title:
      console.error("缺少标题");
      break;
    case errors.no_output_path:
      console.error("缺少输出路径");
      break;
    case errors.no_content:
      console.error("缺少内容");
      break;
    default:
      console.error("未知错误：", result.message);
  }
}
```
