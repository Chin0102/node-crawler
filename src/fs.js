const fs = require('fs')
const path = require('path')

function existsSync(path) {
  return fs.existsSync(path)
}

function mkdirSync(dirPath, pathIsFile) {
  if (pathIsFile) dirPath = path.parse(dirPath).dir
  if (existsSync(dirPath)) return true
  if (mkdirSync(path.dirname(dirPath))) fs.mkdirSync(dirPath)
  return true
}

function readFileSync(path) {
  return fs.readFileSync(path)
}

function remove(path) {
  if (existsSync(path)) fs.unlinkSync(path)
}

function rename(oldPath, newPath) {
  mkdirSync(newPath, true)
  fs.renameSync(oldPath, newPath)
}

function writeFileSync(path, data) {
  mkdirSync(path, true)
  fs.writeFileSync(path, data)
}

function writeFile(path, data) {
  mkdirSync(path, true)
  let writer = fs.createWriteStream(path)
  return new Promise(((resolve, reject) => {
    writer.on('finish', () => resolve(path))
    writer.on('error', e => reject(e))
    writer.write(data)
    writer.end()
  }))
}

function writeStream(path, stream) {
  mkdirSync(path, true)
  let writer = fs.createWriteStream(path)
  return new Promise(((resolve, reject) => {
    writer.on('finish', () => resolve(path))
    writer.on('error', e => reject(e))
    stream.pipe(writer)
  }))
}

module.exports = {
  existsSync, mkdirSync, readFileSync, remove, rename, writeFileSync, writeFile, writeStream
}
