# epub-gen

Forked from https://github.com/cyrilis/epub-gen/ .

## Usage

Install the lib and add it as a dependency (recommended), run on your project dir:

```shell script
npm install wp-epub-gen --save
```
  
Then put this in your code:

```javascript
const {epubGen} = require("wp-epub-gen");
epubGen(option).then(
    () => console.log("Ebook Generated Successfully!"),
    err => console.error("Failed to generate Ebook because of ", err)
);
```

#### Options

- `title`:
    Title of the book
- `author`:
    Name of the author for the book, string or array, eg. `"Alice"` or `["Alice", "Bob"]`
- `publisher`:
    Publisher name (optional)
- `cover`:
    Book cover image (optional), File path (absolute path) or web url, eg. `"http://abc.com/book-cover.jpg"` or `"/User/Alice/images/book-cover.jpg"`
- `output`
    Out put path (absolute path), you can also path output as the second argument, eg: `epubGen(options, output)`
- `version`:
    You can specify the version of the generated EPUB, `3` the latest version (http://idpf.org/epub/30) or `2` the previous version (http://idpf.org/epub/201, for better compatibility with older readers). If not specified, will fallback to `3`.
- `css`:
    If you really hate our css, you can pass css string to replace our default style. eg: `"body {background: #000}"`
- `fonts`:
    Array of (absolute) paths to custom fonts to include on the book so they can be used on custom css. Ex: if you configure the array to `fonts: ['/path/to/Merriweather.ttf']` you can use the following on the custom CSS:
    ```
    @font-face {
        font-family: "Merriweather";
        font-style: normal;
        font-weight: normal;
        src : url("./fonts/Merriweather.ttf");
    }
    ```
- `lang`:
    Language of the book in 2 letters code (optional). If not specified, will fallback to `en`.
- `tocTitle`:
    Title of the table of contents. If not specified, will fallback to `Table Of Contents`.
- `appendChapterTitles`:
    Automatically append the chapter title at the beginning of each contents. You can disable that by specifying `false`.
- `customOpfTemplatePath`:
    Optional. For advanced customizations: absolute path to an OPF template.
- `customNcxTocTemplatePath`:
    Optional. For advanced customizations: absolute path to a NCX toc template.
- `customHtmlTocTemplatePath`:
    Optional. For advanced customizations: absolute path to a HTML toc template.
- `content`:
    Book Chapters content. It's should be an array of objects. eg. `[{title: "Chapter 1",data: "<div>..."}, {data: ""},...]`
    **Within each chapter object:**
    - `id`:
        optional, a unique ID.
    - `title`:
        optional, Chapter title.
    - `author`:
        optional, if each book author is different, you can fill it.
    - `data`:
        required, HTML String of the chapter content. image paths should be absolute path (should start with "http" or "https"), so that they could be downloaded. With the upgrade is possible to use local images (for this the path  must start with file: //)
    - `excludeFromToc`:
        optional, if is not shown on Table of content, default: false.
    - `beforeToc`:
        optional, if is shown before Table of content, such like copyright pages. default: false.
    - `filename`:
        optional, specify filename for each chapter, default: undefined.
    - `children`:
        optional, an Array contains children contents.
    - `appendChapterTitle`:
        optional, Automatically append the chapter title at the beginning of current chapter, this value will overwrite the global `appendChapterTitles`.
- `verbose`:
    specify whether or not to console.log progress messages, default: false.
- `timeoutSeconds`:
    specify timeout in seconds, `0` means no timeout, default: 0.
- `tocAutoNumber`:
    auto number for TOC, default: false.
