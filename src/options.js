const merge = require('deepmerge')
const {isFunction, isString} = require('./utils/types')

const DEF = 'default'

class Options {
  constructor() {
    this.namespace = {}
  }

  add(option, name) {
    if (!name || name === '') name = DEF
    let list = this.namespace[name]
    if (!list) list = this.namespace[name] = []
    list.push(option)
  }

  get(instance, opt) {
    let list = []
    let options = [DEF, instance.name]
    if (opt) options.push(opt)
    options.forEach(option => {
      let nameList = isString(option) ? (this.namespace[option] || []) : [option]
      list.push(...nameList.map(option => isFunction(option) ? option(instance) : option))
    })
    return merge.all(list)
  }
}

const provider = new Options()
provider.add(ins => ({
  concurrent: 2,
  save: `./.save/${ins.name}/`
}))

const task = new Options()
task.add(ins => ({
  request: {responseType: 'stream'},
  retry: {time: 5, delay: 100},
  saveDefault: {name: 'index', ext: '.html'},
  save: {mode: 'file', preDir: `./.save/${ins.context.provider.name}/`, dropQuery: false} //'mode' not used yet
}))

module.exports = {provider, task}
