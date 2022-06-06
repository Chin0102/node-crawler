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
      let nameList = isString(option) ? (this.namespace[DEF] || []) : [option]
      list.push(...nameList.map(option => isFunction(option) ? option(instance) : option))
    })
    return merge.all(list)
  }
}

const provider = new Options()
provider.add(provider => ({
  concurrent: 1,
  save: `./.save/${provider.name}/`
}))

const task = new Options()
task.add({
  request: {responseType: 'stream'},
  save: {mode: 'file'} //'mode' not used yet
})

module.exports = {provider, task}
