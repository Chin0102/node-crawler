const BaseTask = require('./base-task')
const axios = require('axios')
const OS = require('../utils/os')
const URL = require('../utils/url')
const Path = require('path')

module.exports = class BaseHttpTask extends BaseTask {

  createRequest(config) {
    return axios.request(config)
  }

  getSavePath(option) {
    let path = option.save.path
    if (!path) path = option.save.path = URL.toPath(option.request.url, {
      preDir: this.provider.option.save,
      name: option.save.name
    })
    if (this.getSaveName) {
      let info = Path.parse(path)
      info.base = this.getSaveName(info)
      path = Path.format(info)
    }
    return path
  }

  onStart(option) {
    const url = option.request.url
    let path = this.getSavePath(option)
    if (OS.existsSync(path)) {
      this.provider.log(this, '[already exists]', path)
      this.onResponse(path)
    } else {
      let oPath = URL.toPath(url, {preDir: this.provider.option.save})
      if (OS.existsSync(oPath)) {
        OS.rename(oPath, path)
        this.promise.resolve('[rename] ' + path)
      } else {
        //request
        this.provider.log(this, '[start]', url)
        this.createRequest(option.request).then(response => {
          this.provider.log(this, '[loaded]', url)

          //save
          OS.writeStream(path, response.data).then(_ => {
            this.provider.log(this, '[saved]', path)
            this.onResponse(path)
          }).catch(e => this.promise.reject(e))

        }).catch(e => this.onError(e))
      }
    }
  }

  onResponse(path) {
    this.promise.resolve('')
  }

  onError(e) {
    let {time, delay} = this.option.retry
    if (time > 0) {
      this.option.retry.time--
      this.provider.create(this.option, true)
      setTimeout(() => this.promise.reject(e), delay)
    } else this.promise.reject(e)
  }

}