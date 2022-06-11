const os = require('os')
const path = require('path')
const merge = require('deepmerge')
const log4js = require('log4js')

let logger = console
const CommonOption = '_common_option_'
const Config = {
  rootDir: os.homedir(),
  Tasks: {
    saveAsFile: require('./task/http-task'),
    htmlRes: require('./task/html-resource')
  }
}

class TaskOptions {
  constructor() {
    this.namespace = {}
  }

  add(option, name) {
    if (!name || name === '') name = CommonOption
    let current = this.namespace[name] || {}
    this.namespace[name] = merge(current, option)
  }

  get(name, option) {
    return merge.all([
      this.namespace[CommonOption] || {},
      this.namespace[name] || {},
      option || {}
    ])
  }
}

module.exports = class Crawler {

  static registerTasks(TaskMap) {
    Object.assign(Config.Tasks, TaskMap)
  }

  static setRootDir(dir) {
    Config.rootDir = dir
    log4js.configure({
      appenders: {crawler: {type: 'file', filename: path.resolve(dir, './save/crawler.log')}},
      categories: {default: {appenders: ['crawler'], level: 'info'}}
    })
    logger = log4js.getLogger('crawler')
  }

  constructor(name = 'crawler', option) {
    this.name = name
    this._taskRunning = new Set()
    this._optQueue = {}
    this._index = 0

    const rootDir = Config.rootDir

    this.option = merge.all([{
      concurrent: 2,
      saveRoot: `./save/${name}/`,
      tempRoot: `./temp/${name}/`
    }, option, {name}].filter(opt => !!opt))

    let saveRoot = path.resolve(rootDir, this.option.saveRoot)
    let tempRoot = path.resolve(rootDir, this.option.tempRoot) //TODO not used yet

    this.taskOptions = new TaskOptions()
    this.taskOptions.add({
      task: 'saveAsFile',
      priority: 0,
      request: {responseType: 'stream'},
      retry: {time: 5, delay: 100},
      saveDefault: {name: 'index', ext: '.html'},
      save: {mode: 'file', rootDir: saveRoot, dropQuery: false} //'mode' not used yet
    })
  }

  get isFullLoad() {
    return this._taskRunning.size >= this.option.concurrent
  }

  queue(option, unshift) {
    if (!option || !option.task || !Config.Tasks.hasOwnProperty(option.task)) throw new Error(`miss task '${option && option.task}'`)
    if (!option.id) option.id = this._index++
    option = this.taskOptions.get(option.task, option)
    let queue = this._optQueue[option.priority]
    if (!queue) queue = this._optQueue[option.priority] = []
    if (unshift) queue.unshift(option)
    else queue.push(option)
    this.start()
  }

  log(task, ...any) {
    logger.info(`${task.option.id} [${task.option.priority}] [${task.name}]`, ...any)
  }

  logError(task, error) {
    logger.error(`${task.option.id} [${task.option.priority}] [${task.name}]`, error.toString())
  }

  start() {
    if (this.isFullLoad) return
    let priority = Object.keys(this._optQueue).map(priority => parseInt(priority)).sort().shift()
    if (priority === undefined) return
    let queue = this._optQueue[priority]
    let option = queue.shift()
    if (queue.length === 0) delete this._optQueue[priority]

    let task = new (Config.Tasks[option.task])()
    task._crawler = this
    this._taskRunning.add(task)
    task.start(option)
      .then(msg => this.log(task, '[done]', msg))
      .catch(error => this.logError(task, error))
      .finally(() => {
        this._taskRunning.delete(task)
        this.start()
      })
  }

}