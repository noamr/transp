import {transform, availablePresets} from '@babel/standalone'
import * as uuid from 'uuid'

interface LibConfig {
    version: string
    url: string
    global: string    
}

export interface Config {
    presets: string[]
    plugins: string[],
    sourcemaps: 'inline' | 'external' | 'none'
    libraries: {[name: string]: LibConfig}
    baseURL: string
}

const defaultConfig: Config = {
    presets: ['typescript'],
    plugins: [],
    sourcemaps: 'inline',
    libraries: {},
    baseURL: location.href
}
/*
let globalImportsInitializer: Promise<void> | null = null

const initGlobalImports = () => new Promise(resolve => {
    globalImportsInitializer = globalImportsInitializer || (async () => {
        const importMapLinks = Array.from(document.querySelectorAll('head link[rel="importmap"][href]')) as HTMLLinkElement[]
        const importLinks = Array.from(document.querySelectorAll('head link[rel="package"]')) as HTMLLinkElement[]
        const importMaps = [...await Promise.all(importMapLinks.map(async link => await (await fetch(link.href)).json() as ImportMap)),
            ...importLinks.map(
                l => ({[l.getAttribute('name') || '']: {global: l.getAttribute('global'), version: l.getAttribute('version'), url: l.getAttribute('href')}} as ImportMap))
        ]

        const importMap = importMaps.reduce((a, o) => Object.assign(a, o), {})
        console.log(importMap)

    })()

    globalImportsInitializer.then(() => resolve({}))
})
class BundleScript extends HTMLElement {
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

    get observedAttributes() { return ['src', 'onerror'] }
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

        await initGlobalImports()
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

customElements.define('trans-script', BundleScript)
*/

export function configure(config: Config = defaultConfig) {
    const moduleRegistry: Map<string, string> = new Map()

    async function resolveExternal(name: string, lib: LibConfig): Promise<string> {
        const {global, version, url} = lib
        const script = document.createElement('script')
        script.src = url
        console.info(`Loading library ${name}`)
        const moduleURL = await new Promise<string>(res => {
            script.addEventListener('load', () => {
                const lib = window[global]
                const asModule = Object.keys(lib).map(key => `
                    export const ${key} = window["${global}"]["${key}"];
                `).join('\n') + `
                export default ${global};`
                const blob = new Blob([asModule], {type: 'text/javascript'})
                const blobURL = URL.createObjectURL(blob)
                console.info(`Loaded library ${name}`)
                res(blobURL)
            })
            document.head.appendChild(script)
        })
        moduleRegistry.set(name, moduleURL)
        return moduleURL
    }

    async function resolveModule(code: string, href: string) {
        const pendingImports = new Set<string>()
        const transformImports = () => transform(code, {
            presets: [availablePresets.typescript],
            sourceMaps: 'inline',
            filename: new URL(href).pathname,
            plugins: [{
                visitor: {
                    ImportDeclaration: (path, state) => {
                        const {node} = path
                        if (!node || !node.source)
                            return

                        if (moduleRegistry.has(node.source.value)) {
                            node.source.value = moduleRegistry.get(node.source.value)
                            return
                        }

                        const value = new URL(node.source.value, href).href

                        if (moduleRegistry.has(value))
                            node.source.value = moduleRegistry.get(value)
                        else
                            pendingImports.add(value)
                    }
                }
            }
        ]})

        const tranformed = transformImports()
        if (!pendingImports.size)
            return tranformed

        await Promise.all(Array.from(pendingImports).map(importName => resolve(importName, href)))
        return transformImports()
    }

    async function resolveCode(code: string, href: string): Promise<string> {
        const result = await resolveModule(code, href)
        if (!result || !result.code)
            throw new Error(`Unable to import ${name}`)

        const blob = new Blob([result.code], {type: 'text/javascript'})
        const blobURL = URL.createObjectURL(blob)
        moduleRegistry.set(href, blobURL)
        return blobURL
    }

    async function resolve(name: string, baseURL: string): Promise<string> {
        console.info(`Searching for module ${name}`)
        if (moduleRegistry.has(name))
            return moduleRegistry.get(name)

        if (config.libraries[name]) {
            const libCode = await resolveExternal(name, config.libraries[name])
            moduleRegistry.set(name, libCode)
            return libCode
        }

        const url = new URL(name, baseURL).href
        const response = await fetch(url)
        if (response.status !== 200)
            throw new Error(`Module not found: ${name}`)
        const text = await response.text()
        return resolveCode(text, url)
    }

    return {
        async import(url: string): Promise<any> {
            const imported = await resolve(url, config.baseURL)
            const uid = uuid.v4()
            return new Promise((resolve, reject) => {
                const script = document.createElement('script')
                window[uid] = {resolve, reject, remove: () => {script.remove()}}
                script.type = 'module'
                script.innerHTML = `
                    const {resolve, reject, remove} = window['${uid}']                    
                    delete window['${uid}']
                    import('${imported}').then(resolve).catch(reject)
                    remove()
                `
                document.head.appendChild(script)
            })
        }
    }
}

window.transp = configure()