const BaseHttpTask = require('./base-http-task')
const OS = require('../utils/os')
const cheerio = require('cheerio')

module.exports = class BaseHtmlTask extends BaseHttpTask {

  onResponse(path) {
    this.onParseHTML(cheerio.load(OS.readFileSync(path)))
  }

  onParseHTML($) {
  }
}