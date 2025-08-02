/**
 * @author: oldj
 * @homepage: https://oldj.net
 */

import { describe, it, expect } from 'vitest'
import { epubGen } from '../build/index'
import * as data from './data/1.json'

describe('Child page image', () => {
  it.only(
    'should has image',
    async () => {
      let out = { options: {} }
      try {
        out = await epubGen({ ...data }, 'cpi.epub')
      } catch (e) {
        console.error('Error 24: ' + e.message)
      }
      expect(out.success).toBe(true)
      expect(typeof out.options.tmpDir).toBe('string')
    },
    60 * 1000,
  )
})
