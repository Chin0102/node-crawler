const BaseTask = require('./base-task')
const axios = require('axios')
const OS = require('../utils/os')
const URL = require('../utils/url')

module.exports = class BaseHttpTask extends BaseTask {

  createRequest(config) {
    return axios.request(config)
  }

  getPath(url, save, saveDefault) {
    if (save.path) return save.path
    return URL.toPath(url, save, saveDefault)
  }

  onStart(option) {
    const url = option.request.url

    //if exists then pass
    let path = this.getPath(url, option.save, option.saveDefault)
    if (OS.existsSync(path)) return this.onResponse(path, 'exists')

    //check if checkPath exists then rename
    if (option.check) {
      let checkPath = this.getPath(url, option.check, option.saveDefault)
      if (OS.existsSync(checkPath)) {
        OS.rename(checkPath, path)
        return this.onResponse(path, 'rename')
      }
    }

    //request
    this.createRequest(option.request).then(response => {
      this.provider.log(this, '[start]', url)
      OS.writeStream(path + '.temp', response.data).then(_ => {
        OS.rename(path + '.temp', path)
        this.onResponse(path, 'saved')
      }).catch(e => this.promise.reject(e))
    }).catch(e => this.onError(e))
  }

  onResponse(path, type) {
    this.promise.resolve(`[${type}] ${path}`)
  }

  onError(e) {
    let {time, delay} = this.option.retry
    if (time > 0) {
      this.option.retry.time--
      this.provider.create(this.option, true)
      setTimeout(() => this.promise.reject(e), delay)
    } else this.promise.reject(new Error(`[failed] ${this.option.request.url}`))
  }

}