module.exports = class BaseTask {

  toString() {
    return JSON.stringify(this.option)
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