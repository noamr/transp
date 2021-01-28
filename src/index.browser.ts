import {configure} from './lib'
import initCustomElement from './custom-element'

const transpDefault = configure()
initCustomElement(transpDefault, 'trans-script')
window['transp'] = {default: transpDefault, configure}