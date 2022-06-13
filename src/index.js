const os = require('os')
const path = require('path')
const merge = require('deepmerge')
const log4js = require('log4js')
const Task = require('./task')
const appenders = {}
const DefaultOption = 'default'

class TaskOptions {
  constructor() {
    this.namespace = {}
  }

  add(option, preset) {
    if (!preset || preset === '') preset = DefaultOption
    let current = this.namespace[preset] || {}
    this.namespace[preset] = merge(current, option)
  }

  get(preset, option) {
    return merge.all([
      this.namespace[DefaultOption] || {},
      (preset !== DefaultOption && this.namespace[preset]) || {},
      option || {}
    ])
  }
}

module.exports = class Crawler {

  constructor(option) {
    this._taskRunning = new Set()
    this._optQueue = {}
    this._index = 0

    this.option = Object.assign({
      concurrent: 2,
      rootDir: os.homedir(),
      logName: 'crawler',
      logFileName: './crawler.log',
      saveRoot: './save/',
      tempRoot: './temp/'
    }, option)

    let {rootDir, saveRoot, tempRoot, logName, logFileName} = this.option
    saveRoot = path.resolve(rootDir, saveRoot)
    tempRoot = path.resolve(rootDir, tempRoot) //'tempRoot' not used yet
    appenders[logName] = {type: 'file', filename: path.resolve(rootDir, logFileName)}
    log4js.configure({appenders, categories: {default: {appenders: Object.keys(appenders), level: 'info'}}})
    this.logger = log4js.getLogger(this.option.logName)

    this._taskOptions = new TaskOptions()
    this._taskOptions.add({
      preset: DefaultOption, priority: 0,
      request: {responseType: 'stream', headers: {}},
      retry: {time: 5, delay: 100},
      ignoreCache: false,
      saveDefault: {name: 'index', ext: '.html'},
      save: {mode: 'file', rootDir: saveRoot, dropQuery: false} //'mode' not used yet
    })
  }

  get isFullLoad() {
    return this._taskRunning.size >= this.option.concurrent
  }

  preset(option, ...tasks) {
    if (tasks.length === 0) this._taskOptions.add(option)
    else tasks.forEach(task => this._taskOptions.add(option, task))
  }

  queue(option) {
    if (!option) return
    if (!option.id) option.id = this._index++
    option = this._taskOptions.get(option.preset, option)
    let queue = this._optQueue[option.priority]
    if (!queue) queue = this._optQueue[option.priority] = []
    queue.push(option)
    this.start()
  }

  log(option, ...any) {
    this.logger.info(`[id:${option.id}] [priority:${option.priority}] [preset:${option.preset}]`, ...any)
  }

  logError(option, error) {
    this.logger.error(`[id:${option.id}] [priority:${option.priority}] [preset:${option.preset}]`, error.toString())
  }

  start() {
    if (this.isFullLoad) return
    let priority = Object.keys(this._optQueue).map(priority => parseInt(priority)).sort().shift()
    if (priority === undefined) return
    let queue = this._optQueue[priority]
    let option = queue.shift()
    if (queue.length === 0) delete this._optQueue[priority]

    let task = new Task()
    this._taskRunning.add(task)
    task.start(this, option)
      .then(msg => this.log(option, '[done]', msg))
      .catch(error => this.logError(option, error))
      .finally(() => {
        this._taskRunning.delete(task)
        this.start()
      })
  }

}
