import * as lib from './lib'

export default function init(transp: lib.Transp = lib.configure(), name: string = 'tran-script') {
    customElements.define(name, class TranScript extends HTMLElement {
        private loaded: boolean

        constructor() {
            super()
            const slotElement = document.createElement('slot')
            const style = document.createElement('style')
            const shadow = this.attachShadow({mode: 'closed'})
            style.innerHTML = `:host { display: none }`
            shadow.appendChild(style)
            shadow.appendChild(slotElement)
            this.loaded = false
            slotElement.addEventListener('slotchange', this.render.bind(this))
        }

        get observedAttributes() { return ['src'] }
        attributesChangedCallback() { this.render() }
        connectedCallback() { this.render() }

        async render() {
            if (this.loaded)
                return

            const src = this.getAttribute('src')
            const inner = this.firstChild
            if (!src && !(inner instanceof Text))
                return

            this.loaded = true

            const defer = this.getAttribute('defer') === 'defer'
            
            const execute = () =>
                inner ?
                    transp.eval((inner as Text).textContent || '', location.href) :
                    transp.import(new URL(src as string, location.href).href)

            if (defer && document.readyState !== 'complete')
                window.addEventListener('DOMContentLoaded', execute)
            else
                execute()
        }

    })
}