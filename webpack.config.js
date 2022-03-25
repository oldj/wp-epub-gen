/**
 * @author oldj
 * @blog http://oldj.net
 */

'use strict'

const path = require('path')
const webpack = require('webpack')
const WebpackNotifierPlugin = require('webpack-notifier')
//const CopyWebpackPlugin = require('copy-webpack-plugin')
//const TerserPlugin = require('terser-webpack-plugin')
const basedir = __dirname

module.exports = {
  mode: process.env.ENV === 'dev' ? 'development' : 'production',
  entry: {
    index: ['./src/index.ts']
  },
  devtool: 'source-map',
  output: {
    filename: '[name].js',
    path: path.join(basedir, 'dist')
  },
  target: 'node',
  resolve: {
    modules: ['node_modules', 'src'],
    alias: {
      '@': path.join(basedir, 'src')
    },
    extensions: ['.ts', '.js', '.d.ts']
  },
  watchOptions: {
    ignored: []
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'ts-loader'
      }
    ]
  },
  optimization: {
    minimize: true,
    minimizer: [
      //new TerserPlugin({
      //  terserOptions: {
      //    output: {
      //      ecma: 6,
      //      comments: false,
      //      ascii_only: true
      //    }
      //  },
      //  parallel: true,
      //  cache: true,
      //  sourceMap: true
      //})
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production')
      }
    }),
    new webpack.IgnorePlugin(new RegExp('^(fs|path|window)$')),
    new WebpackNotifierPlugin({
      title: 'epub-gen',
      alwaysNotify: true,
      excludeWarnings: true
    })
    //new webpack.BannerPlugin(`WonderPen ${s_version}, ${moment().format('YYYY-MM-DD HH:mm:ss')}`)
  ]
}
