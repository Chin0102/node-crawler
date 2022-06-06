const BaseHttpTask = require('./base-http-task')
const OS = require('../utils/os')
const Path = require('path')
const cheerio = require('cheerio')

module.exports = class BaseHtmlTask extends BaseHttpTask {

  getSavePath(option) {
    let path = super.getSavePath(option)
    let info = Path.parse(path)
    if (!info.ext) info.base = info.name + '.html'
    return Path.format(info)
  }

  onResponse(path) {
    const body = OS.readFileSync(path)
    this.onParseHTML(cheerio.load(body))
  }

  onParseHTML($) {
  }
}