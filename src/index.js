const log4js = require('log4js')

let logEnabled = false
let providers = {}

const crawler = {
  addProvider(provider) {
    if (providers.hasOwnProperty(provider.name)) throw new Error(`provider name '${provider.name}' already exists`)
    providers[provider.name] = provider
    if (logEnabled) this.log(true)
  },
  queue(providerName, taskOption, unshift) {
    let provider = providers[providerName]
    if (!provider) throw new Error(`without provider name ='${provider.name}'`)
    provider.create(taskOption, unshift)
    return this
  },
  log(enable) {
    logEnabled = enable
    let appenders = {}
    let categoriesAppenders = []
    Object.values(providers).forEach(provider => {
      let name = provider.name
      let logPath = `${provider.option.save}crawler.log`
      appenders[name] = {type: 'file', filename: logPath}
      categoriesAppenders.push(name)
    })
    log4js.configure({appenders, categories: {default: {appenders: categoriesAppenders, level: 'info'}}})
  }
}

module.exports = crawler
