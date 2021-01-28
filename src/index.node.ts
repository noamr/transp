import {configure} from './lib'
import initCustomElement from './custom-element'

const transpDefault = configure()
module.exports.eval = transpDefault.eval
module.exports.import = transpDefault.import
module.exports.configure = configure
module.exports.initCustomElement = initCustomElement
