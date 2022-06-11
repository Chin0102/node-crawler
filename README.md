# node-crawler

## demo

```js
const Crawler = require('node-crawler')
const URL = require('url')

const testCrawler = new Crawler({rootDir: __dirname})

testCrawler.enableLog()

testCrawler.preset({
  onCrawl(context) {
    const $ = context.html() //$ = cheerio
    let res = []
    $('link').each((i, node) => {
      let rel = $(node).attr('rel')
      if (rel.includes('icon') || rel === 'stylesheet') res.push($(node).attr('href'))
    })
    $('script').each((i, node) => {
      let src = $(node).attr('src')
      if (src) res.push(src)
    })
    res.forEach(url => context.queue({preset: 'default', request: {url: URL.resolve(context.option.request.url, url)}}))
  }
}, 'test')

//request = axios config
testCrawler.queue({preset: 'test', request: {url: 'https://exmple.com'}})
```