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
      this.context.log('[start]', url)
      OS.writeStream(path + '.temp', response.data).then(_ => {
        OS.rename(path + '.temp', path)
        this.onResponse(path, 'saved')
      }).catch(e => this.context.reject(e))
    }).catch(e => this.onError(e))
  }

  onResponse(path, type) {
    this.context.resolve(`[${type}] ${path}`)
  }

  onError(error) {
    this.context.retry(error, new Error(`[failed] ${this.option.request.url}`))
  }

}