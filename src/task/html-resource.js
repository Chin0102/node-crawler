const HtmlTask = require('./base-html-task')
const URL = require('url')

module.exports = class HtmlResourceTask extends HtmlTask {
  onParseHTML($) {
    let res = []
    $('link').each((i, node) => {
      let rel = $(node).attr('rel')
      if (rel.includes('icon') || rel === 'stylesheet') res.push($(node).attr('href'))
    })
    $('script').each((i, node) => {
      let src = $(node).attr('src')
      if (src) res.push(src)
    })
    res.forEach(url => {
      url = URL.resolve(this.option.request.url, url)
      this.queue({task: 'saveAsFile', request: {url}})
    })
    this.done()
  }
}
