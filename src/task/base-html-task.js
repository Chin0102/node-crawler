const BaseHttpTask = require('./base-http-task')
const OS = require('../utils/os')
const Path = require('path')
const cheerio = require('cheerio')

module.exports = class BaseHtmlTask extends BaseHttpTask {

  getSaveName(info) {
    let {ext, base, name} = info
    return !!ext ? base : (name + '.html')
  }

  onResponse(path) {
    const body = OS.readFileSync(path)
    this.onParseHTML(cheerio.load(body))
  }

  onParseHTML($) {
  }
}