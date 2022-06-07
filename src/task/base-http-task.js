const BaseTask = require('./base-task')
const axios = require('axios')
const OS = require('../utils/os')
const URL = require('../utils/url')

module.exports = class BaseHttpTask extends BaseTask {

  createRequest(config) {
    return axios.request(config)
  }

  getSavePath(option) {
    let path = option.save.path
    if (!path) path = option.save.path = URL.toPath(option.request.url, this.provider.option.save)
    return path
  }

  onStart(option) {
    const url = option.request.url
    let path = this.getSavePath(option)
    if (OS.existsSync(path)) {
      this.provider.log(this, '[already exists]', url)
      this.onResponse(path)
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

  onResponse(path) {
    this.promise.resolve('')
  }

  onError(e) {
    this.provider.create(this.option, true)
    setTimeout(() => this.promise.reject(e), 500)
  }

}