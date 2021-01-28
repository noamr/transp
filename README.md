# transp
Transparent client-side transpilation
```
<script src="https://cdn.jsdelivr.net/npm/transp@0.0.2/dist/transp.min.js"></script>
<trans-script>
    // This is Typescript!
    console.log('Hello World' as string)
</trans-script>
```
## Overview
Transp enables standalone client-side transparent 0transpilation (Typescript, JSX, etc.), without requiring node.js
It uses [Babel Standalone](https://github.com/babel/babel-standalone) to transpile, and handles the 
details needed for importing scripts.

It aims to be the closest thing possible to "Typescript working natively in the browser".
## Purpose
This library is not meant for production, as it generates a huge package. This is also the case for babel-standalone.
It's meant to enable an easier development/setup/debugging, or to be part of a bigger developer-facing solution.

## How to Use
`transp` is meant for use in a browser enviornment.
It provides a JavaScript API and an HTML custom element.
### Install
`npm install transp`

### Use as a JavaScript API
The JavaScript API provides the following functions:
#### `import(href: string): Promise<any>`
A drop-in replacement for [dynamic import](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import#dynamic_import), which transpiles the required resources, resolves inner imports, and returns a promise with the resolved and evaluated model.
Example:
```
<script>
    import('some-typescript-module.ts').then(module => doSomethingWithModule)
</script>
```
#### `eval(code: string): Promise<any>`
Almost a drop-in replacement for [eval](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval), with two differences:
* The code can be Typescript (or anything supported by the Babel configuration)
* The code is evaluated asynchronously, and the return value is a promise that will resolve to the result of the code.
#### configure
The default `import` and `eval` functions provided by the library use the default configuration. To override the defaults, for example by enabling 

### Use as an HTML Custom Element
To enable the custom element, the library exposes a function:
 `initCustomElement(enviornment = transp, name = 'trans-script')`

The custom element is replacement for an HTML `script` element, and can be used with `src` or with an inline script.

Unlike regular script elements, The `trans-script` element is never executed synchrnously.

The following:
```
    <trans-script>
        import {hello} from './hello'
        // Typescript!
        console.log(hello() as string)
    </trans-script>
```
... is equivalent to a `<script async>` element with a transpiled version of the internal code.

### Custom Configurations
The default `eval` and `import` functionality uses a default set of Babel presets.
To override those, use the configure function:
```
import {configure, initCustomElement} from 'transp'
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

const myTransp = configure({
    presets: ['jsx', 'typescript', ...], // Babel presets. Default: ['typescript']
    plugins: [], // Babel plugins. Default: empty
    extensions: ['ts', 'js', 'jsx'], // supported file extensions. Default: ['js', 'ts']
    sourcemaps: 'inline' | 'external | 'none', // default: inline
    libraries: {
        lodash: {'4.17.20', url: 'https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.20/lodash.min.js', global: '_'}
    }, // Importable named libraries
    baseURL: 'http://example.com', // base URL for links. Default is document URL
    enableLibraryLinks: true // Enable searching dependencies in <link rel="library">
})

myTransp.import('some-file.ts').then(...)
initCustomElement(myTransp, 'my-script')
```

### Loading External Dependencies
A transpiled script may references an external dependency, for example:
`import {map} from 'lodash'`

To resolve external dependencies, the modules have to be defined either in the configuration passed to the `configure` function, or in `link` tags with the following scheme:
```
<link rel="library" name="{module name}" href="{the library URL}" global={the name of the global variable exposed by the library} />
```

