const log4js = require('log4js')
const options = require('./options')
const Context = require('./context')

module.exports = class Provider {
  constructor(name, Tasks, option) {
    this.logger = log4js.getLogger(name)
    this.name = name
    this.running = new Set()
    this.queue = {}
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
    if (!option.order) option.order = 0
    let q = this.queue[option.order]
    if (!q) q = this.queue[option.order] = []
    if (unshift) q.unshift(option)
    else q.push(option)
    this.start()
  }

  log(task, ...any) {
    this.logger.info(`${task.option.id} [${task.option.order}] [${task.name}]`, ...any)
  }

  onError(task, error) {
    this.logger.error(`${task.option.id} [${task.option.order}] [${task.name}]`, error.toString())
  }

  start() {
    if (this.isFullLoad) return
    let order = Object.keys(this.queue).map(order => parseInt(order)).sort().shift()
    if (order === undefined) return
    let q = this.queue[order]
    let option = q.shift()
    if (q.length === 0) delete this.queue[order]
    let name = option.task
    let task = new (this.Tasks[name])()
    task.name = name
    task.context = new Context(this, task)
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