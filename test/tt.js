/**
 * @author: oldj
 * @homepage: https://oldj.net
 */

import { epubGen } from '../build/index.js'
import data from './data/1.json' with { type: 'json' }

try {
  await epubGen({ ...data, tocAutoNumber: true, output: 'test.epub' })
} catch (e) {
  console.error('Error 24: ' + e.message)
}
