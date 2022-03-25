/**
 * @author: oldj
 * @homepage: https://oldj.net
 */

import { assert } from 'chai'
import { epubGen } from '../dist/index'
import * as data from './data/1.json'

describe('Child page image', () => {
  it.only('should has image', async () => {
    let out = { options: {} }
    try {
      out = await epubGen({ ...data }, 'cpi.epub')
    } catch (e) {
      console.error('Error 24: ' + e.message)
    }
    assert.equal(out.success, true)
    assert.equal(typeof out.options.tmpDir, 'string')
  }).timeout(60 * 1000)
})
