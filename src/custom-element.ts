import * as uuid from 'uuid'
import {resolve, resolveCode} from './impl'
class TranScript extends HTMLElement {
    shadow: HTMLShadowElement
    slotElement: HTMLSlotElement
    loaded: boolean

    constructor() {
        super()
        this.slotElement = document.createElement('slot')
        const style = document.createElement('style')
        this.shadow = this.attachShadow({mode: 'closed'})
        style.innerHTML = `:host { display: none }`
        this.shadow.appendChild(style)
        this.shadow.appendChild(this.slotElement)
        this.loaded = false
        this.slotElement.addEventListener('slotchange', () => {
            this.render()
        })
    }

    get observedAttributes() { return ['src'] }
    attributesChangedCallback() {
        this.render()
    }

    connectedCallback() {
        this.render()
    }

    async render() {
        if (this.loaded)
            return

        const src = this.getAttribute('src')
        const inner = this.innerText
        if (!src && !inner)
            return

        this.loaded = true

        const defer = this.getAttribute('defer') === 'defer'
        
        const dispatch = async () => {
            const blobURL = inner ?
                await resolveCode(inner, location.href) :
                await resolve(src as string, location.href)

            const uid = uuid.v4()
            const script = document.createElement('script')
            script.type = 'module'
            const textNode = document.createTextNode(`import('${blobURL}')`)
            script.appendChild(textNode)
            this.shadow.appendChild(script)
        }

        if (defer && document.readyState !== 'complete')
            window.addEventListener('DOMContentLoaded', dispatch)
        else
            dispatch()
    }
}
