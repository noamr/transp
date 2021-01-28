import {transform, availablePresets} from '@babel/standalone'
import * as uuid from 'uuid'

interface LibConfig {
    version: string
    url: string
    global: string | null
}

export interface Config {
    presets: string[]
    plugins: string[]
    extensions: string[]
    sourcemaps: 'inline' | 'external' | 'none'
    libraries: {[name: string]: LibConfig}
    baseURL: string
    enableLibraryLinks: boolean
}

export interface Transp {
    eval<T = any>(code: string, href?: string): Promise<T>
    import<T = any>(href: string): Promise<T>
}

export const defaultConfig: Config = {
    presets: ['typescript'],
    plugins: [],
    sourcemaps: 'inline',
    extensions: ['ts', 'js'],
    libraries: {},
    baseURL: location.href,
    enableLibraryLinks: true
}

export function configure(cfg: Partial<Config> = {}): Transp {
    const config = {...defaultConfig, ...cfg}
    const moduleRegistry: Map<string, string> = new Map()

    async function resolveExternal(name: string, lib: LibConfig): Promise<string> {
        const {global, version, url} = lib
        const script = document.createElement('script')
        script.src = url
        console.info(`Loading library ${name}`)
        const moduleURL = await new Promise<string>(res => {
            script.addEventListener('load', () => {
                const asModule = global ? (() => {
                    return `${Object.keys(window[global]).map(key => `
                        export const ${key} = window["${global}"]["${key}"];
                    `).join('\n')}
                    export default ${global};`
                })() : ''
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
            presets: [['typescript', {allExtensions: true}]],
            sourceMaps: config.sourcemaps,
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
                            pendingImports.add(node.source.value)
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

        return URL.createObjectURL(new Blob([result.code], {type: 'text/javascript'}))
    }

    async function fetchAny(url: string) {
        for (const extension of ['', ...config.extensions.map(e => `.${e}`)]) {
            const fullURL = `${url}${extension}`
            const exists = await fetch(fullURL, {method: 'HEAD'})
            if (exists.status !== 200)
                continue
            const response = await fetch(fullURL)
            return {response, fullURL}
        }

        return null
    }

    async function resolve(name: string, baseURL: string): Promise<string> {
        console.info(`Searching for module ${name}`)
        if (moduleRegistry.has(name))
            return moduleRegistry.get(name)

        if (config.enableLibraryLinks && !config.libraries.name) {
            const link = document.querySelector(`link[rel="library"][name="${name}"][href][version]`)
            if (link) {
                config.libraries[name] = {
                    version: link.getAttribute('version') as string,
                    url: new URL(link.getAttribute('href') as string, baseURL).href,
                    global: link.getAttribute('global')
                }
            }
        }

        if (config.libraries[name]) {
            const libCode = await resolveExternal(name, config.libraries[name])
            moduleRegistry.set(name, libCode)
            return libCode
        }

        const url = new URL(name, baseURL).href
        const r = await fetchAny(url)
        if (!r) 
            throw new Error(`Module not found: ${name}`)
        const text = await r.response.text()
        const blobURL = await resolveCode(text, r.fullURL)
        moduleRegistry.set(url, blobURL)
        return blobURL
    }

    function importImpl<T = any>(blobURL: string): Promise<any> {
        const uid = uuid.v4()
        return new Promise<T>((resolve, reject) => {
            const script = document.createElement('script')
            window[uid] = {resolve, reject, remove: () => {script.remove()}}
            script.type = 'module'
            script.innerHTML = `
                const {resolve, reject, remove} = window['${uid}']                    
                delete window['${uid}']
                import('${blobURL}').then(resolve).catch(reject)
                remove()
            `
            document.head.appendChild(script)
        })
    }

    return {
        import: <T = any>(url: string): Promise<T> => 
            resolve(url, config.baseURL).then(importImpl),
        eval: <T = any>(code: string, url: string = config.baseURL): Promise<T> => 
            resolveCode(code, url).then(importImpl)
    }
}
