/**
 * 验证 onProgress 回调在每个 phase 至少触发一次，
 * 并且回调抛错 / 非法 concurrency 都不会让 epubGen 失败。
 *
 * 直接 import src/ 源码，不依赖 build/ 产物，确保未 build 时也能跑。
 */

import { describe, expect, it } from 'vitest'
import { epubGen, IProgressEvent } from '../src/index'
import data from './data/1.json'

const baseOptions = data as unknown as Parameters<typeof epubGen>[0]

describe('onProgress', () => {
  it(
    'fires at least once per phase and reaches current === total',
    async () => {
      const events: IProgressEvent[] = []
      const out = await epubGen(
        { ...baseOptions, output: 'test-progress.epub' },
        {
          onProgress: (e) => events.push(e),
        },
      )
      expect(out.success).toBe(true)

      const phases = new Set(events.map((e) => e.phase))
      // 必现 phase：parseContent / writeChapters / buildToc / zip 总会发兜底事件；
      // downloadImage 仅在有图片时发——1.json 含图片，所以也必现。
      expect(phases.has('parseContent')).toBe(true)
      expect(phases.has('writeChapters')).toBe(true)
      expect(phases.has('buildToc')).toBe(true)
      expect(phases.has('downloadImage')).toBe(true)
      expect(phases.has('zip')).toBe(true)

      // 每个出现的 phase 最终事件都应该 current === total
      for (const phase of phases) {
        const last = [...events].reverse().find((e) => e.phase === phase)!
        expect(last.current).toBe(last.total)
      }

      // 同一 phase 内 current 单调非递减
      for (const phase of phases) {
        const seq = events.filter((e) => e.phase === phase).map((e) => e.current)
        for (let i = 1; i < seq.length; i++) {
          expect(seq[i]).toBeGreaterThanOrEqual(seq[i - 1])
        }
      }
    },
    60 * 1000,
  )

  it(
    'survives a throwing onProgress callback',
    async () => {
      const out = await epubGen(
        { ...baseOptions, output: 'test-progress-throw.epub' },
        {
          onProgress: () => {
            throw new Error('host callback exploded')
          },
        },
      )
      expect(out.success).toBe(true)
    },
    60 * 1000,
  )

  it(
    'tolerates invalid concurrency (NaN) without hanging',
    async () => {
      const out = await epubGen(
        { ...baseOptions, output: 'test-progress-nan.epub' },
        {
          concurrency: Number.NaN,
        },
      )
      expect(out.success).toBe(true)
    },
    60 * 1000,
  )
})
