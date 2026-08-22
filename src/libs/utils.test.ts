import { describe, expect, it, vi } from 'vitest'
import { IProgressEvent } from '../types'
import { emitProgress, normalizeConcurrency, pLimit, simpleMinifier, wait } from './utils'

describe('normalizeConcurrency', () => {
  it.each([
    [16, 16],
    [1, 1],
    [1.7, 1], // 截断为整数
    [4.99, 4],
  ])('合法正数 %p 归一化为 %p', (input, expected) => {
    expect(normalizeConcurrency(input)).toBe(expected)
  })

  it.each([
    ['NaN', NaN],
    ['Infinity', Infinity],
    ['-Infinity', -Infinity],
    ['零', 0],
    ['负数', -5],
    ['小于 1 的正数', 0.5],
    ['字符串', '16'],
    ['null', null],
    ['undefined', undefined],
    ['对象', { value: 16 }],
    ['布尔', true],
  ])('非法输入 %s 返回 undefined', (_label, input) => {
    expect(normalizeConcurrency(input)).toBeUndefined()
  })
})

describe('pLimit', () => {
  it('并发峰值严格等于上限（既不会越界，也确实并发）', async () => {
    const limit = pLimit<number>(3)
    let active = 0
    let peak = 0
    const task = async (i: number) => {
      active++
      peak = Math.max(peak, active)
      await wait(10)
      active--
      return i
    }
    const results = await Promise.all(Array.from({ length: 12 }, (_, i) => limit(() => task(i))))
    // 同步调入 12 个、上限 3：前 3 个应同时进入 body 后才有人 await，因此峰值必为 3
    expect(peak).toBe(3)
    expect(results).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
  })

  it('单个任务抛错不会卡死后续任务', async () => {
    const limit = pLimit<number>(2)
    const tasks = [
      limit(async () => {
        throw new Error('boom')
      }),
      limit(async () => 1),
      limit(async () => 2),
    ]
    const settled = await Promise.allSettled(tasks)
    expect(settled[0].status).toBe('rejected')
    expect(settled[1].status).toBe('fulfilled')
    expect(settled[2].status).toBe('fulfilled')
  })

  it.each([
    ['NaN', NaN],
    ['Infinity', Infinity],
    ['零', 0],
    ['负数', -3],
  ])('非法 concurrency %s 兜底为 1（任务依次执行）', async (_label, bad) => {
    const limit = pLimit<void>(bad as number)
    let active = 0
    let peak = 0
    const task = async () => {
      active++
      peak = Math.max(peak, active)
      await wait(5)
      active--
    }
    await Promise.all([limit(task), limit(task), limit(task)])
    expect(peak).toBe(1)
  })
})

describe('simpleMinifier', () => {
  it('压缩 </a> 前的空白', () => {
    expect(simpleMinifier('<a href="x">link   </a>')).toBe('<a href="x">link</a>')
  })

  it('压缩换行后标签前的缩进', () => {
    const input = '<div>\n    <span>hi</span>\n</div>'
    expect(simpleMinifier(input)).toBe('<div>\n<span>hi</span>\n</div>')
  })

  it('合并连续多个换行为一个', () => {
    expect(simpleMinifier('a\n\n\nb')).toBe('a\nb')
  })

  it('未触发任何规则时输入保持不变（避免正则误匹配）', () => {
    const input = '<p><a>x</a></p>'
    expect(simpleMinifier(input)).toBe(input)
  })
})

describe('emitProgress', () => {
  const event: IProgressEvent = { phase: 'parseContent', current: 1, total: 2 }

  it('configs 为 undefined 时不抛错', () => {
    expect(() => emitProgress(undefined, event)).not.toThrow()
  })

  it('configs 没有 onProgress 时不抛错', () => {
    expect(() => emitProgress({}, event)).not.toThrow()
  })

  it('正常调用 onProgress 并透传事件', () => {
    const cb = vi.fn()
    emitProgress({ onProgress: cb }, event)
    expect(cb).toHaveBeenCalledTimes(1)
    expect(cb).toHaveBeenCalledWith(event)
  })

  it('回调抛错被吞掉，不会向上传播', () => {
    const cb = vi.fn(() => {
      throw new Error('callback boom')
    })
    expect(() => emitProgress({ onProgress: cb }, event)).not.toThrow()
    expect(cb).toHaveBeenCalledTimes(1)
  })
})
