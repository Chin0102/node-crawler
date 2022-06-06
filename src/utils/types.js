const types = ['Null', 'Undefined', 'Array', 'Object', 'String', 'Number', 'Boolean', 'Function']

const is = {}
types.forEach(type => is[`is${type}`] = value => Object.prototype.toString.call(value) === `[object ${type}]`)

module.exports = is