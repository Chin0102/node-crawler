const url = require('url')
const path = require('path')
const merge = require('deepmerge')
const fs = require('./fs')
const cheerio = require('cheerio')
const axios = require('axios')

function urlToPath(requestUrl, save, saveDefault) {
  if (save.path) return save.path
  let urlInfo = url.parse(decodeURI(requestUrl))
  let pathInfo = path.parse(urlInfo.pathname)
  let info = Object.assign({}, urlInfo, pathInfo)
  if (!info.name) delete info.name
  if (!info.ext) delete info.ext
  let {rootDir, host, dir, name, ext, dropQuery, query} = Object.assign({rootDir: '/', dropQuery: false}, saveDefault, info, save)
  if (query && !dropQuery) name = `${name}(${query})`
  return path.join(rootDir, host, dir, `${name}${ext}`)
}

class Context {
  constructor(crawler, option) {
    this.crawler = crawler
    this.crawl = null
    this.option = option
  }

  log(...any) {
    this.crawler.log(this.option, ...any)
  }

  logError(error) {
    this.crawler.logError(this.option, error.toString())
  }

  queue(option) {
    let {priority, request} = this.option
    this.crawler.queue(merge(option, {
      priority: priority + 1,
      request: {headers: {referer: request.url}}
    }))
  }

  buffer() {
    if (this.crawl) return fs.readFileSync(this.crawl.path)
  }

  html() {
    if (this.crawl) return cheerio.load(fs.readFileSync(this.crawl.path))
  }

  json() {
    if (this.crawl) return JSON.parse(fs.readFileSync(this.crawl.path).toString())
  }
}

module.exports = class Task {

  toString() {
    return JSON.stringify(this.option)
  }

  callback(name) {
    let cb = this.option[name]
    if (cb) cb(this.context)
  }

  start(crawler, option) {
    return new Promise((resolve, reject) => {

      this.option = option
      this.context = new Context(crawler, option)
      this.callback('onStart')

      const url = option.request.url
      let path = urlToPath(url, option.save, option.saveDefault)
      if (fs.existsSync(path)) return this.onCrawl({exists: true, url, path}, resolve)

      if (option.check) {
        let checkPath = urlToPath(url, option.check, option.saveDefault)
        if (fs.existsSync(checkPath)) {
          fs.rename(checkPath, path)
          return this.onCrawl({exists: true, rename: true, url, path, checkPath}, resolve)
        }
      }

      axios.request(option.request).then(response => {
        fs.writeStream(path + '.temp', response.data).then(_ => {
          fs.rename(path + '.temp', path)
          this.onCrawl({url, path}, resolve)
        }).catch(e => this.onError(e, reject))
      }).catch(e => {
        let {time, delay} = option.retry
        if (time > 0) {
          option.retry.time--
          setTimeout(() => this.start(crawler, option), delay)
        } else this.onError(e, reject)
      })
    })
  }

  onCrawl(crawl, resolve) {
    this.context.crawl = crawl
    resolve(JSON.stringify(crawl))
    this.callback('onCrawl')
  }

  onError(error, reject) {
    this.context.error = error
    reject(error)
    this.callback('onError')
  }

}