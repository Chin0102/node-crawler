module.exports = class BaseTask {

  get name() {
    return this.option.task
  }

  toString() {
    return JSON.stringify(this.option)
  }

  done(any = '') {
    this.promise.resolve(any)
  }

  failed(error) {
    this.promise.reject(error)
  }

  log(...arg) {
    this._crawler.log(this, ...arg)
  }

  retry(currentError, failedError) {
    let {time, delay} = this.option.retry
    if (time > 0) {
      this.option.retry.time--
      this._crawler.queue(this.option, true)
      setTimeout(() => this.failed(currentError), delay)
    } else this.failed(failedError)
  }

  queue(option, currentOrder) {
    if (!currentOrder) option.order = this.option.order + 1
    this._crawler.queue(option)
  }

  start(option) {
    this.option = option
    return new Promise((resolve, reject) => {
      this.promise = {resolve, reject}
      this.onStart(option)
    })
  }

  onStart(option) {
  }

}