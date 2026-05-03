/**
 * @author: oldj
 * @homepage: https://oldj.net
 */

import fs from 'fs'
import { promisify } from 'util'
import { IGenConfigs, IProgressEvent } from '../types'

export const readFile = promisify(fs.readFile)
export const writeFile = promisify(fs.writeFile)

/** 把任意 unknown 输入归一化为有效并发数；非有限正整数返回 undefined（让调用点继续走 ?? 默认） */
export function normalizeConcurrency(value: unknown): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 1) return undefined
  return Math.floor(value)
}

export function pLimit<T>(concurrency: number) {
  // 兜底：拒绝 NaN / Infinity / 负数 / 0，避免任务永远入队卡死
  if (!Number.isFinite(concurrency) || concurrency < 1) concurrency = 1
  else concurrency = Math.floor(concurrency)
  let active = 0
  const queue: Array<() => void> = []
  const next = () => {
    active--
    if (queue.length) queue.shift()!()
  }
  return (fn: () => Promise<T>): Promise<T> =>
    new Promise<T>((resolve, reject) => {
      const run = () => {
        active++
        fn().then(
          (v) => {
            resolve(v)
            next()
          },
          (e) => {
            reject(e)
            next()
          },
        )
      }
      if (active < concurrency) run()
      else queue.push(run)
    })
}

export function emitProgress(
  configs: IGenConfigs | undefined,
  event: IProgressEvent,
): void {
  if (!configs?.onProgress) return
  try {
    configs.onProgress(event)
  } catch {
    // 宿主回调不能让 EPUB 生成失败；静默吞掉
  }
}

export const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/34.0.1847.116 Safari/537.36'

export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function fileIsStable(filename: string, max_wait: number = 30000): Promise<boolean> {
  const start_time = new Date().getTime()
  let last_size = fs.statSync(filename).size

  while (new Date().getTime() - start_time <= max_wait) {
    await wait(1000)
    const size = fs.statSync(filename).size
    if (size === last_size) return true
    last_size = size
  }

  return false
}

export function simpleMinifier(xhtml: string) {
  xhtml = xhtml
    .replace(/\s+<\/a>/gi, '</a>')
    .replace(/\n\s+</g, '\n<')
    .replace(/\n+/g, '\n')

  return xhtml
}
