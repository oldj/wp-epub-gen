import * as path from 'path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import tsconfigPaths from 'vite-tsconfig-paths'
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs'

/**
 * 生成模板文件的 TypeScript 代码
 */
function generateTemplatesFile() {
  const templatesDir = path.join(__dirname, 'templates')
  const outputFile = path.join(__dirname, 'src', 'templates.ts')

  if (!existsSync(templatesDir)) {
    throw new Error('Templates directory not found')
  }

  // 递归读取所有模板文件
  const templates: Array<{ exportName: string; content: string; originalPath: string }> = []

  function readTemplateFiles(dir: string, prefix = '') {
    const files = readdirSync(dir)

    for (const file of files) {
      const fullPath = path.join(dir, file)
      const stat = statSync(fullPath)

      if (stat.isDirectory()) {
        readTemplateFiles(fullPath, prefix + file + '/')
      } else {
        const relativePath = prefix + file
        const content = readFileSync(fullPath, 'utf-8')

        // 将文件路径转换为 export 名称：特殊字符用 _ 替换
        const exportName = relativePath.replace(/\//g, '_').replace(/\./g, '_')

        templates.push({
          exportName,
          content,
          originalPath: relativePath,
        })
      }
    }
  }

  readTemplateFiles(templatesDir)

  // 生成 TypeScript 文件内容
  const tsContent = `/**
 * 嵌入式模板内容
 * 此文件由构建脚本自动生成，请勿手动编辑
 * 源文件位于 templates/ 目录下
 */

${templates
  .map(({ exportName, content, originalPath }) => {
    // 转义字符串中的反引号和反斜杠
    const escapedContent = content
      .replace(/\\/g, '\\\\')
      .replace(/`/g, '\\`')
      .replace(/\$\{/g, '\\${')

    return `// ${originalPath}
export const ${exportName} = \`${escapedContent}\``
  })
  .join('\n\n')}`

  // 写入文件
  writeFileSync(outputFile, tsContent, 'utf-8')
  console.log(`Generated ${outputFile} with ${templates.length} templates`)
}

// https://vitejs.dev/config/
export default defineConfig({
  // root: path.join(__dirname, 'src', 'main'),
  base: './',
  build: {
    rollupOptions: {
      input: {
        index: path.join(__dirname, 'src', 'index.ts'),
      },
    },
    lib: {
      entry: path.join(__dirname, 'src', 'index.ts'),
      name: 'index',
      formats: ['cjs', 'es'],
      fileName: (format) => `index.${format === 'es' ? 'mjs' : 'js'}`,
    },
    outDir: path.join(__dirname, 'build'),
    minify: false,
    ssr: true,
    // emptyOutDir: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  plugins: [
    // 在构建前生成模板文件
    {
      name: 'generate-templates',
      buildStart() {
        generateTemplatesFile()
      },
    },
    tsconfigPaths(),
    dts({
      entryRoot: path.join(__dirname, 'src'),
      // outputDir: path.join(__dirname, 'build', 'types'),
    }),
  ],
})
