import {Config, Transp} from './lib'
export {Config, Transp} from './lib'
import {configure} from './lib'
import initCustomElement from './custom-element'

const transpDefault = configure()
export default {
    eval: transpDefault.eval,
    import: transpDefault.import,
    configure,
    initCustomElement
} as Transp & {
    configure: (config?: Config) => Transp,
    initCustomElement: (transp?: Transp, name?: string) => void
}
