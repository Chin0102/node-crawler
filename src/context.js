module.exports = class Context {
  constructor(provider, task) {
    this.provider = provider
    this.task = task
  }

  setPromise(resolve, reject) {
    this.promise = {resolve, reject}
  }

  resolve(any) {
    this.promise.resolve(any)
  }

  reject(error) {
    this.promise.reject(error)
  }

  log(...arg) {
    this.provider.log(this.task, ...arg)
  }

  retry(currentError, failedError) {
    let {time, delay} = this.task.option.retry
    if (time > 0) {
      this.task.option.retry.time--
      this.provider.create(this.task.option, true)
      setTimeout(() => this.reject(currentError), delay)
    } else this.reject(failedError)
  }

  queue(option, currentOrder) {
    if (!currentOrder) option.order = this.task.option.order + 1
    this.provider.create(option)
  }
}