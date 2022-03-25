/**
 * @author: oldj
 * @homepage: https://oldj.net
 */

const assert = require('assert')
const { epubGen } = require('../dist/index')
const { errors } = require('../dist/errors')
const data = require('./data/1.json')

describe('Basic', () => {
  it('no output path error', async () => {
    let out = await epubGen({ ...data, verbose: false })
    assert.equal(out.success, false)
    assert.equal(out.message, errors.no_output_path)
  })

  it('basic test', async () => {
    let out = { options: {} }
    try {
      out = await epubGen({ ...data }, 'test.epub')
    } catch (e) {
      console.error('Error 24: ' + e.message)
    }
    assert.equal(out.success, true)
    assert.equal(typeof out.options.tmpDir, 'string')
  }).timeout(60 * 1000)
})
