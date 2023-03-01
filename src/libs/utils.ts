/**
 * utils
 * @author: oldj
 * @homepage: https://oldj.net
 */

import * as fs from 'fs'
import { promisify } from 'util'

export const readFile = promisify(fs.readFile)
export const writeFile = promisify(fs.writeFile)

export const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/34.0.1847.116 Safari/537.36'

export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function fileIsStable(filename: string, max_wait: number = 30000): Promise<boolean> {
  let start_time = new Date().getTime()
  let last_size = fs.statSync(filename).size

  while (new Date().getTime() - start_time <= max_wait) {
    await wait(1000)
    let size = fs.statSync(filename).size
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
