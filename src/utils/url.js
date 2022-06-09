const Url = require('url')
const Path = require('path')

function parse(url) {
  let urlInfo = Url.parse(url)
  let pathInfo = Path.parse(urlInfo.pathname)
  return Object.assign({}, urlInfo, pathInfo)
}

function toPath(url, option, defOption) {
  let info = parse(decodeURI(url))
  if (!info.name) delete info.name
  if (!info.ext) delete info.ext
  let {preDir, host, dir, name, ext, dropQuery, query} = Object.assign({preDir: '/', dropQuery: false}, defOption, info, option)
  if (query && !dropQuery) name = `${name}(${query})`
  return Path.join(option.preDir, host, dir, `${name}${ext}`)
}

module.exports = {
  parse, toPath
}