/**
 * 嵌入式模板内容
 * 此文件由构建脚本自动生成，请勿手动编辑
 * 源文件位于 templates/ 目录下
 */

// epub2/content.opf.ejs
export const epub2_content_opf_ejs = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf"
         version="2.0"
         unique-identifier="BookId">

    <metadata xmlns:dc="http://purl.org/dc/elements/1.1/"
              xmlns:opf="http://www.idpf.org/2007/opf">

        <dc:identifier id="BookId" opf:scheme="URN"><%= id %></dc:identifier>
        <dc:title><%= title %></dc:title>
        <dc:description><%= description %></dc:description>
        <dc:publisher><%= publisher || "anonymous" %></dc:publisher>
        <dc:creator opf:role="aut" opf:file-as="<%= author.length ? author.join(",") : author %>"><%= author.length ? author.join(",") : author %></dc:creator>
        <dc:date opf:event="modification"><%= date %></dc:date>
        <dc:language><%= lang || "en" %></dc:language>
        <meta name="cover" content="image_cover"/>
        <meta name="generator" content="epub-gen"/>

    </metadata>

    <manifest>
        <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
        <item id="toc" href="toc.xhtml" media-type="application/xhtml+xml"/>
        <item id="css" href="style.css" media-type="text/css"/>

        <% if(locals.cover) { %>
            <item id="image_cover" href="cover.<%= _coverExtension %>" media-type="<%= _coverMediaType %>"/>
        <% } %>

        <% images.forEach(function(image, index){ %>
            <item id="image_<%= index %>" href="images/<%= image.id %>.<%= image.extension %>" media-type="<%= image.mediaType %>"/>
        <% }) %>

        <% content.forEach(function(content, index){ %>
            <item id="content_<%= index %>_<%= content.id %>" href="<%= content.href %>" media-type="application/xhtml+xml"/>
        <% }) %>

        <% fonts.forEach(function(font, index) { %>
            <item id="font_<%= index %>" href="fonts/<%= font %>" media-type="application/x-font-ttf"/>
        <% }) %>
    </manifest>

    <spine toc="ncx">
        <% content.forEach(function(content, index){ %>
            <% if(content.beforeToc && !content.excludeFromToc){ %>
                <itemref idref="content_<%= index %>_<%= content.id %>"/>
            <% } %>
        <% }) %>
        <itemref idref="toc"/>
        <% content.forEach(function(content, index){ %>
            <% if(!content.beforeToc && !content.excludeFromToc){ %>
                <itemref idref="content_<%= index %>_<%= content.id %>"/>
            <% } %>
        <% }) %>
    </spine>
    <guide/>
</package>
`

// epub2/toc.xhtml.ejs
export const epub2_toc_xhtml_ejs = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xml:lang="<%- lang %>" xmlns="http://www.w3.org/1999/xhtml">
<head>
    <title><%= title %></title>
    <meta charset="UTF-8"/>
    <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
<h1 class="h1"><%= tocTitle %></h1>
<% content.forEach(function(content, index){ %>
    <% if(!content.excludeFromToc){ %>
        <p class="table-of-content">
            <a href="<%= content.href %>"><%= (1 + index) + ". " + (content.title || "Chapter " + (1 + index)) %>
                <% if(content.author.length){ %>
                    - <small class="toc-author"><%= content.author.join(",") %></small>
                <% } %>
                <% if(content.url){ %><span class="toc-link"><%= content.url %></span>
                <% }else{ %><span class="toc-link"></span>
                <% } %>
            </a>
        </p>
    <% } %>
<% }) %>
</body>
</html>
`

// epub3/content.opf.ejs
export const epub3_content_opf_ejs = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf"
         version="3.0"
         unique-identifier="BookId"
         xmlns:dc="http://purl.org/dc/elements/1.1/"
         xmlns:dcterms="http://purl.org/dc/terms/"
         xml:lang="en"
         xmlns:media="http://www.idpf.org/epub/vocab/overlays/#"
         prefix="ibooks: http://vocabulary.itunes.apple.com/rdf/ibooks/vocabulary-extensions-1.0/">

    <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">

        <dc:identifier id="BookId"><%= id %></dc:identifier>
        <meta refines="#BookId" property="identifier-type" scheme="onix:codelist5">22</meta>
        <meta property="dcterms:identifier" id="meta-identifier">BookId</meta>
        <dc:title><%= title %></dc:title>
        <meta property="dcterms:title" id="meta-title"><%= title %></meta>
        <dc:language><%= lang || "en" %></dc:language>
        <meta property="dcterms:language" id="meta-language"><%= lang || "en" %></meta>
        <meta property="dcterms:modified"><%= (new Date()).toISOString().split(".")[0] + "Z" %></meta>
        <dc:creator id="creator"><%= author.length ? author.join(",") : author %></dc:creator>
        <meta refines="#creator" property="file-as"><%= author.length ? author.join(",") : author %></meta>
        <meta property="dcterms:publisher"><%= publisher || "anonymous" %></meta>
        <dc:publisher><%= publisher || "anonymous" %></dc:publisher>
        <% var date = new Date(); var year = date.getFullYear(); var month = date.getMonth() + 1; var day = date.getDate(); var stringDate = "" + year + "-" + month + "-" + day; %>
        <meta property="dcterms:date"><%= stringDate %></meta>
        <dc:date><%= stringDate %></dc:date>
        <meta property="dcterms:rights">All rights reserved</meta>
        <dc:rights>Copyright &#x00A9; <%= (new Date()).getFullYear() %> by <%= publisher || "anonymous" %></dc:rights>
        <% if(locals.cover) { %>
            <meta name="cover" content="image_cover" />
        <% } %>
        <meta name="generator" content="epub-gen" />
        <meta property="ibooks:specified-fonts">true</meta>
    </metadata>

    <manifest>
        <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml" />
        <item id="toc" href="toc.xhtml" media-type="application/xhtml+xml" properties="nav" />
        <item id="css" href="style.css" media-type="text/css" />

        <% if(locals.cover) { %>
            <item id="image_cover" href="cover.<%= _coverExtension %>" media-type="<%= _coverMediaType %>" />
        <% } %>

        <% images.forEach(function(image, index){ %>
            <item id="image_<%= index %>" href="images/<%= image.id %>.<%= image.extension %>" media-type="<%= image.mediaType %>" />
        <% }) %>

        <% function renderContentItem(content) { %>
            <% content.forEach(function(content){ %>
                <item id="content_<%= content.id %>" href="<%= content.href %>" media-type="application/xhtml+xml" />
                <% if (Array.isArray(content.children)) { %>
                    <% renderContentItem(content.children) %>
                <% } %>
            <% }) %>
        <% } %>
        <% renderContentItem(content) %>

        <% fonts.forEach(function(font, index){ %>
            <item id="font_<%= index %>" href="fonts/<%= font %>" media-type="application/x-font-ttf" />
        <% }) %>
    </manifest>

    <spine toc="ncx">
        <% var nodes_1 = content.filter(item => !item.excludeFromToc && item.beforeToc) %>
        <% var nodes_2 = content.filter(item => !item.excludeFromToc && !item.beforeToc) %>
        <% function renderToc(nodes) { %>
            <% nodes.forEach(function(content){ %>
                <itemref idref="content_<%= content.id %>" />
                <% if (Array.isArray(content.children)) { %>
                    <% renderToc(content.children) %>
                <% } %>
            <% }) %>
        <% } %>
        <% renderToc(nodes_1) %>
        <itemref idref="toc" />
        <% renderToc(nodes_2) %>
    </spine>
    <guide>
        <reference type="text" title="Table of Content" href="toc.xhtml" />
    </guide>
</package>
`

// epub3/toc.xhtml.ejs
export const epub3_toc_xhtml_ejs = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="<%- lang %>"
      lang="<%- lang %>">
<head>
    <title><%= title %></title>
    <meta charset="UTF-8" />
    <link rel="stylesheet" type="text/css" href="style.css" />
</head>
<body>
<h1 class="h1"><%= tocTitle %></h1>
<nav id="toc" class="TOC" epub:type="toc">
    <% var nodes_1 = content.filter(item => !item.excludeFromToc && item.beforeToc) %>
    <% var nodes_2 = content.filter(item => !item.excludeFromToc && !item.beforeToc) %>
    <% function renderToc(nodes, indent = 0) { %>
        <ol>
            <% nodes.forEach(function(content, index){ %>
                <li class="table-of-content">
                    <a href="<%= content.href %>"><%= (content.title || "Chapter " + (1 + index)) %>
                        <% if(content.author.length){ %> - <small
                                class="toc-author"><%= content.author.join(",") %></small>
                        <% } %>
                        <% if(content.url){ %><span class="toc-link"><%= content.url %></span>
                        <% } %>
                    </a>
                    <% if (Array.isArray(content.children) && content.children.length > 0) { %>
                        <% renderToc(content.children, indent + 1) %>
                    <% } %>
                </li>
            <% }) %>
        </ol>
    <% } %>
    <% renderToc(nodes_1) %>
    <% renderToc(nodes_2) %>
</nav>

</body>
</html>
`

// template.css
export const template_css = `.epub-author {
  color: #555;
}

.epub-link {
  margin-bottom: 30px;
}

.epub-link a {
  color: #666;
  font-size: 90%;
}

.toc-author {
  font-size: 90%;
  color: #555;
}

.toc-link {
  color: #999;
  font-size: 85%;
  display: block;
}

hr {
  border: 0;
  border-bottom: 1px solid #dedede;
  margin: 60px 10%;
}

.TOC > ol {
  margin: 0;
  padding: 0;
}

.TOC > ol ol {
  padding: 0;
  margin-left: 2em;
}

.TOC li {
  font-size: 16px;
  list-style: none;
  margin: 0 auto;
  padding: 0;
}
`

// toc.ncx.ejs
export const toc_ncx_ejs = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
    <head>
        <meta name="dtb:uid" content="<%= id %>"/>
        <meta name="dtb:generator" content="epub-gen"/>
        <meta name="dtb:depth" content="<%= (toc_depth || 1)%>"/>
        <meta name="dtb:totalPageCount" content="0"/>
        <meta name="dtb:maxPageNumber" content="0"/>
    </head>
    <docTitle>
        <text><%= title %></text>
    </docTitle>
    <docAuthor>
        <text><%= author %></text>
    </docAuthor>
    <navMap>
        <% var _index = 1; %>
        <% var nodes_1 = content.filter(c => !c.excludeFromToc && c.beforeToc) %>
        <% var nodes_2 = content.filter(c => !c.excludeFromToc && !c.beforeToc) %>
        <% function renderToc(nodes) { %>
            <% nodes.forEach(function(content, index){ %>
                <navPoint id="content_<%= content.id %>" playOrder="<%= _index++ %>" class="chapter">
                    <navLabel>
                        <text><%= (tocAutoNumber ? ((1 + index) + ". ") : "") + (content.title || "Chapter " + (1 + index)) %></text>
                    </navLabel>
                    <content src="<%= content.href %>"/>
                    <% if (Array.isArray(content.children)) { %>
                    <% renderToc(content.children) %>
                    <% } %>
                </navPoint>
            <% }) %>
        <% } %>

        <% renderToc(nodes_1) %>

        <navPoint id="toc" playOrder="<%= _index++ %>" class="chapter">
            <navLabel>
                <text><%= tocTitle %></text>
            </navLabel>
            <content src="toc.xhtml"/>
        </navPoint>

        <% renderToc(nodes_2) %>
    </navMap>
</ncx>
`