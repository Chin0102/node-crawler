# just-crawl

## demo

```js
const Crawler = require('just-crawl')
const URL = require('url')

const testCrawler = new Crawler({rootDir: __dirname})

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

## option

#### crawler option

```js
new Crawler(option)
```

```js
//default
option = {
  concurrent: 2,
  rootDir: os.homedir(),
  logName: 'crawler', //appear in log content
  logFileName: './crawler.log', //path.resolve(rootDir, logFileName)
  saveRoot: './save/', // path.resolve(rootDir, saveRoot)
}
```

#### crawl task option

```js
crawler.preset(option) //preset default
crawler.preset(option, ...presetNames)
crawler.queue(currentOption)
```

##### deepmerge rule

Preset['default'] <- Preset[currentOption.preset] <- currentOption

_crawler.preset to the same name more than once will be deepmerge also_

##### default

```js
option = {
  preset: 'default', //preset name
  request: {responseType: 'stream'}, //axios config
  retry: {time: 5, delay: 100},
  saveDefault: {name: 'index', ext: '.html'},
  save: {rootDir: saveRoot, dropQuery: false}
}
```

##### more option

option.request: {headers:{}, ... } _// axios config_

option.save: {name, ext, path} _// if set path, ignore all other_

##### other not defined

```js
option = {
  request: {url: ''}, //required
  onStart: context => {
    //adjust option : context.option.xxx = 
  },
  onCrawl: context => {
    //parse response to queue sub task
    const $ = context.html()
    //  ...
    context.queue(option)
  },
  onError: context => {
  },
}
```

## context

.option

.log(...any)

.logError(error)

.queue(option) // sub task

.html() // get response data as cheerio instance

.json() // get response data as json

.buffer() // get response data as buffer

