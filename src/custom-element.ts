import * as lib from './lib'

export default function init(transp: lib.Transp = lib.configure(), name: string = 'tran-script') {
    customElements.define(name, class TranScript extends HTMLElement {
        private loaded: boolean = false

        constructor() {
            super()
            const document = this.ownerDocument
            const slotElement = document.createElement('slot')
            const style = document.createElement('style')
            const shadow = this.attachShadow({mode: 'closed'})
            style.innerHTML = `:host { display: none }`
            shadow.appendChild(style)
            shadow.appendChild(slotElement)
            slotElement.addEventListener('slotchange', this.render.bind(this))
        }

        get observedAttributes() { return ['src'] }
        attributesChangedCallback() { this.render() }
        connectedCallback() { this.render() }

        async render() {
            if (this.loaded)
                return

            const location = this.ownerDocument.URL

            const src = this.getAttribute('src')
            const inner = this.firstChild as Text
            if (!src && !(inner instanceof Text))
                return

            this.loaded = true

            if (inner)
                transp.eval((inner as Text).textContent || '', location)
            else
                transp.import(new URL(src as string, location).href)

        }
    })
}