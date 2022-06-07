const fs = require('fs')
const {parse} = require('path')

function existsSync(path) {
  return fs.existsSync(path)
}

function mkdirSync(osPath) {
  let temp = '', pathList = parse(osPath).dir.split('/')
  while (pathList.length > 0) {
    let part = pathList.shift()
    temp += part + '/'
    if (part === '.' || part === '') continue
    let exists = fs.existsSync(temp)
    if (!exists) fs.mkdirSync(temp)
  }
}

function readFileSync(path) {
  return fs.readFileSync(path)
}

function remove(path) {
  if (existsSync(path)) fs.unlinkSync(path)
}

function rename(oldPath, newPath) {
  fs.renameSync(oldPath, newPath)
}

function writeFileSync(path, data) {
  mkdirSync(path)
  fs.writeFileSync(path, data)
}

function writeFile(path, data) {
  mkdirSync(path)
  let writer = fs.createWriteStream(path)
  return new Promise(((resolve, reject) => {
    writer.on('finish', () => resolve(path))
    writer.on('error', e => reject(e))
    writer.write(data)
    writer.end()
  }))
}

function writeStream(path, stream) {
  mkdirSync(path)
  let writer = fs.createWriteStream(path)
  return new Promise(((resolve, reject) => {
    writer.on('finish', () => resolve(path))
    writer.on('error', e => reject(e))
    stream.pipe(writer)
  }))
}

// function writeStream(path, stream, read, option) {
//   mkdirSync(path)
//   if (read) option = Object.assign({encoding: 'utf8'}, option)
//   let writer = fs.createWriteStream(path)
//   let body = ''
//   return new Promise(((resolve, reject) => {
//     if (read) writer.on('pipe', reader => {
//       reader.setEncoding(option.encoding)
//       reader.on('data', (chunk) => body += chunk)
//       // reader.on('end', () => console.log('reader end'))
//     })
//     writer.on('finish', () => resolve(body))
//     writer.on('error', e => reject(e))
//     stream.pipe(writer)
//   }))
// }

module.exports = {
  existsSync, mkdirSync, readFileSync, remove, rename, writeFileSync, writeFile, writeStream
}
