/**
 * @author: oldj
 * @homepage: https://oldj.net
 */

import { describe, it, expect } from 'vitest'
import { epubGen } from '../build/index'
import { errors } from '../build/index'
import * as data from './data/1.json'

describe('Basic', () => {
  it('no output path error', async () => {
    let out = await epubGen({ ...data, verbose: false })
    expect(out.success).toBe(false)
    expect(out.message).toBe(errors.no_output_path)
  })

  it(
    'basic test',
    async () => {
      let out = { options: {} }
      try {
        out = await epubGen({ ...data }, 'test.epub')
      } catch (e) {
        console.error('Error 24: ' + e.message)
      }
      expect(out.success).toBe(true)
      expect(typeof out.options.tmpDir).toBe('string')
    },
    60 * 1000,
  )
})
