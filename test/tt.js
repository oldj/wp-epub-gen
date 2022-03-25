/**
 * t.js
 * @author: oldj
 * @homepage: https://oldj.net
 */

const {epubGen} = require('../dist/index')
const data = require('./data/1.json')

;(async () => {
  try {
    await epubGen({...data, tocAutoNumber: true}, 'test.epub')
  } catch (e) {
    console.error('Error 24: ' + e.message)
  }
})()
