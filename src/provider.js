const log4js = require('log4js')
const options = require('./options')

module.exports = class Provider {
  constructor(name, Tasks, option) {
    this.logger = log4js.getLogger(name)
    this.name = name
    this.running = new Set()
    this.queue = []
    this.Tasks = Tasks || {}
    this.num = 0
    this.option = options.provider.get(this, option)
  }

  get isFullLoad() {
    return this.running.size >= this.option.concurrent
  }

  create(option, unshift) {
    if (!option || !option.task || !this.Tasks.hasOwnProperty(option.task)) throw new Error(`miss task '${option && option.task}'`)
    if (!option.id) option.id = this.num++
    if (unshift) this.queue.unshift(option)
    else this.queue.push(option)
    this.start()
  }

  log(task, ...any) {
    this.logger.info(`${task.id} [${task.name}]`, ...any)
  }

  onError(task, error) {
    this.logger.error(`${task.id} [${task.name}]`, error.toString())
  }

  start() {
    if (this.isFullLoad || this.queue.length === 0) return
    let option = this.queue.shift()
    let {task: name, id} = option
    let task = new (this.Tasks[name])()
    task.id = id
    task.name = name
    task.provider = this
    this.running.add(task)
    task.start(options.task.get(task, option))
      .then(msg => this.log(task, `[done] ${msg}`))
      .catch(e => this.onError(task, e))
      .finally(() => {
        this.running.delete(task)
        this.start()
      })
  }

}