const Url = require('url')
const Path = require('path')

function parse(url) {
  let urlInfo = Url.parse(url)
  let pathInfo = Path.parse(urlInfo.pathname)
  return Object.assign({}, urlInfo, pathInfo)
}

function toPath(url, option) {
  option = Object.assign({preDir: ''}, option)
  let {root, host, dir, base, query, name, ext} = parse(decodeURI(url))
  if (option.name) base = option.name
  else if (query) base = `${name}(${query})${ext}`
  return Path.join(option.preDir, root, host, dir, base)
}

module.exports = {
  parse, toPath
}