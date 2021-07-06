type Dict<T> = Record<string, T>

export class VueSfcs {
    static convVueModuleToInitGlobalCode(componentKey: string, jsModuleCode: string) {
        return `
            window.vues = window.vues || {}
            window.vues['${componentKey}'] = ${SimpleBundler.moduleCodeToIife(jsModuleCode)}
            Vue.component("${componentKey}", window.vues['${componentKey}']);
        `
    }
    static vueClassTransformerScript() {
        // We also include the __assign function replacement for Object.assign, since Rollup is transpiling {...foo} to that.
        // In the future we should just include a Zip client JS file which should already be transpiled
        return `
            (function() {
                var __assign = function() { 
                    __assign = Object.assign || function __assign(t) {
                        for (var s, i = 1, n = arguments.length; i < n; i++) {
                            s = arguments[i];
                            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
                        }
                        return t;
                    };
                    return __assign.apply(this, arguments);
                }
                return ${vueClassComponent}
            })()
        `
    }
    static convVueSfcToJsModule(vueSfcCode: string, classTransformer?: string, customMutationCode = "") {
        const getTag = (tag: string, text: string) => {
        const start = text.indexOf('>', text.indexOf(`<${tag}`,)) + 1
        const end = text.lastIndexOf(`</${tag}>`)
        if (start===-1) return ""
        if (end===-1) return ""
        return text.substring(start, end)
        }
        const scriptModule = getTag("script", vueSfcCode) || "export default {}"
        let scriptIife = SimpleBundler.moduleCodeToIife(scriptModule)
        if (classTransformer) scriptIife = `(${classTransformer})(${scriptIife})`
        const template = getTag("template", vueSfcCode)
        const css = getTag("style", vueSfcCode)
        return `
            let exp = ${scriptIife};
            exp.template = ${JSON.stringify(template)}
            const addTag = (where, tagName, attrs) => {           
                const el = document.createElement(tagName)
                for (const k of Object.keys(attrs)) el[k] = attrs[k]
                where.appendChild(el)
            }
            const addCss = css => addTag(document.head, "style", {type: 'text/css', innerHTML: css})                  
            let alreadyAddedCss = false
            // TODO remove too
            const oldCreated = exp.created
            exp.created = function () {
                if (!alreadyAddedCss) addCss(${JSON.stringify(css)})
                alreadyAddedCss = true
                if (oldCreated) oldCreated.call(this)
            }
            ${customMutationCode}
            export default exp
        `
    }
}

export function vueClassComponent(opts: Record<string, any>, cl: any) {
    if (arguments.length <= 1) { cl = arguments[0]; opts = undefined } // Allow first arg to be omitted
    if (typeof cl === 'object') return cl // This is a regular Vue component, just return
    if (typeof cl !== 'function') throw "VueClassComponent: Expected a class, not " + typeof cl
  
    const propsToIgnore = ['prototype', 'length', 'name', 'caller', 'callee']
  
    const copyData = (source: Record<string, any>, target: Record<string, any>) => {
      const insPropsOnly = Object.getOwnPropertyNames(source).filter(x => !propsToIgnore.includes(x))
      for (const prop of insPropsOnly) target[prop] = source[prop]
    }
  
    // Allow `opts` to be specified as a method on the class, or as a static object
    if (!opts && typeof cl.prototype.opts === 'function') { opts = cl.prototype.opts(); propsToIgnore.push("opts") }
    if (!opts && typeof cl.opts === 'object') { opts = cl.opts; propsToIgnore.push("opts") }
    
    // Validate/default for opts
    opts = opts || {}
    if (typeof opts !== 'object') throw "VueClassComponent: `opts` must be an options object, not " + typeof opts

    // Create main object
    const coercePropsArrayToObj = (x: object) => Array.isArray(x) ? x.reduce((a,c) => (a[c] = {}, a), {}) : x
    const ret = {
      ...opts,
      name: cl.name,
      computed: {...(opts.computed || {})},
      methods: {...(opts.methods || {})},
      props: coercePropsArrayToObj(opts.props || {}),
      data() { 
        const newInstance = new cl()
        var data = {}
        copyData(newInstance, data)
        return data
      },
    }

    const consumeProp = (obj: Record<string, any>, prop: string, ignoreOthers = false) => {
      if (propsToIgnore.includes(prop)) return;
  
      const getValue = () => obj[prop] // it's behind a function so that we don't call getters unnecessarily -- which will throw an error
      const descriptor = Object.getOwnPropertyDescriptor(obj, prop)
      if (['created', 'mounted', 'destroyed'].includes(prop)) {
        (ret as any)[prop] = obj[prop]
      } else if (descriptor && descriptor.get) {
        ret.computed[prop] = {
          get: descriptor.get,
          set: descriptor.set
        }
      } else if (typeof getValue() === 'function') {
        ret.methods[prop] = getValue()
      } else if (getValue() && getValue()._isProp) {
        ret.props[prop] = getValue()
      } else if (!ignoreOthers) {
        throw `VueClassComponent: Class prop \`${prop}\` must be a method or a getter`
      } else { // It's a data prop, from the "check instance properties" section below
        return; // Silently ignore it; it will be used in `data()` only
      }

      // If we were successful, ignore the prop in subsequent checks
      propsToIgnore.push(prop)
    }  
    
    // Populate methods/computeds/props from the class's prototype
    for (const prop of Object.getOwnPropertyNames(cl.prototype)) consumeProp(cl.prototype, prop)
  
    // Experimental: check static properties
    for (const prop of Object.getOwnPropertyNames(cl)) consumeProp(cl, prop)
  
    // Experimental: check instance properties
    const dummyInstance = new cl()   
    for (const prop of Object.getOwnPropertyNames(dummyInstance)) consumeProp(dummyInstance, prop, true)
  
    // Done!
    return ret
}


export type InputModule = {codeString: string, key?: string, main?: boolean}
export class SimpleBundler {
  modulesToBundle: InputModule[] = []
  resolver = (path: string, fromPath: string): string[] => {
    // By default: allow extensions, and normalize paths (so we don't import files twice)
    // You can override this to allow paths that don't start with /,./,../ to look in node_modules etc.
    fromPath = fromPath.split("?")[0] // If the calling module has a querystring, remove it
    return ["", ".js", "/index.js"].map(x => require('path').join(fromPath, path + x))
  }
  loader = (idOrNormalizedPath: string): string|void => {
    // Return a string if you managed to load the code
  }
  resolveAndAddModule(pathString: string, opts: { fromModuleAtPath?: string, main?: boolean } = {}) {
    const ids = this.resolver(pathString, require('path').dirname(opts.fromModuleAtPath || ""))
    
    // First, see if any of those IDs are already loaded
    const findAlreadyLoadedModule = this.modulesToBundle.find(mdl => ids.find(id => mdl.key === id))
    if (findAlreadyLoadedModule) {
      if (opts.main) findAlreadyLoadedModule.main = true
      return findAlreadyLoadedModule
    }

    // Otherwise, see if any loaders can load any of the IDs
    let foundCode: string|void = null
    let foundId = ids.find(x => foundCode = this.loader(x))
    if (typeof foundCode !== 'string') throw `Couldn't resolve path '${pathString}' from module '${opts.fromModuleAtPath || ""}`
    // And create a new module for it
    const newModule = { codeString: foundCode, key: foundId, main: !!opts.main }
    this.modulesToBundle.push(newModule)
    return newModule
  }

  static _moduleLoader = function moduleLoader(factories: {factory: Function, key: string}[]) {
    const modules: Record<string, {key: string, factory: Function, exports: any, loading: boolean, loaded: boolean}> = {}
    factories.forEach(f => { modules[f.key] = { key: f.key, factory: f.factory, exports: {}, loading: false, loaded: false }})

    const require = function (key: string, useDefaultExportIfThereIsOnlyThat = true) {
      /* 
        Provides a require function for modules to call.
        ES6-syntax `import` statements will set `useDefaultExportIfThereIsOnlyThat=false` so we return the entire module
            (and they will use precise parts of it depending on the type of import statement).
        Direct calls to `require()` (Node/CommonJS-style) default to true, so that they can easily import ES6 modules 
            which have only a default export.
        The downside is that if the ES6 modules adds a named export, the require() won't work anymore.
            (If we fixed this by *always* returning the default export if there is one, then it will no longer
            be possible for CommonJS require() calls to access a named export where there is a default export.
            I believe I got this compromise approach from Rollup.)        
         */
      if (!modules[key]) throw "Module not found in bundle: " + key
      const m = modules[key]
      if (m.loading) throw "Circular dependency found when loading module: " + key
      if (!m.loaded) {
        m.loading = true
        try {
          m.factory(m, m.exports, require)
          m.loading = false
          m.loaded = true
        } catch (ex) {
          m.loading = false
          console.error(`Error while running module '${key}': ${ex}`)
          throw ex
        }
      }
      if (useDefaultExportIfThereIsOnlyThat && Object.keys(m.exports).length === 1 && ('default' in m.exports)) return m.exports.default
      return m.exports
    }
    return require
  }

  bundle() {
    const compiledModules: (InputModule & {factoryFuncString: string})[] = []
    for (let i = 0; i < this.modulesToBundle.length; i++) { // Purposely a simple for loop because the array's length will keep increasing
      const thisModule = this.modulesToBundle[i]
      const factoryFuncString = SimpleBundler.moduleCodeToFactoryFunc(thisModule.codeString, path => {
        const resolvedModule = this.resolveAndAddModule(path, { fromModuleAtPath: thisModule.key })
        return { key: resolvedModule.key }        
      })
      compiledModules.push({ ...thisModule, factoryFuncString })
    }

    // Return loader code
    return `
      ;(function(){
        const factories = [
          ${compiledModules.map(m => `{
            key: ${JSON.stringify(m.key)},
            factory: ${m.factoryFuncString},
            main: ${!!m.main}
          }`).join(",")}
        ]
        const loader = ${SimpleBundler._moduleLoader}
        const loadersRequire = loader(factories)
        // Immediately run any 'main' modules
        factories.filter(x => x.main).forEach(x => loadersRequire(x.key)) 
      })()
    `
  }

  static moduleCodeToFactoryFunc(jsCode: string, importCallback?: (path: string) => { key: string }) {
    // A "factory function" is a function that takes args (module, exports, require) and mutates module.exports
    // The argument `importCallback` lets you trap imports within the code, and optionally change the key

    if (importCallback) {
      const getNewRequire = (path: string, allowDefaultExport = true) => `require(${JSON.stringify(importCallback(path).key)}` + (allowDefaultExport ? ')' : ', false)')
      jsCode = jsCode.replace(/require\([\'\"](.+?)[\'\"]\)/g, (_, path) => getNewRequire(path))

      // EXPERIMENTAL: also allow ES6 import syntax
      // default imports: import foo from 'module'
      jsCode = jsCode.replace(/[ \t]*import ([A-Za-z0-9_]+) from (?:"|')([a-zA-z0-9 \.\/\\\-_]+)(?:"|')/g, (whole,identifier,path)=>`const ${identifier} = ${getNewRequire(path, false)}.default`)
      // namespaced entire import: import * as foo from 'module'
      jsCode = jsCode.replace(/[ \t]*import \* as ([A-Za-z0-9_]+) from (?:"|')([a-zA-z0-9 \.\/\\\-_]+)(?:"|')/g, (whole,identifier,path)=>`const ${identifier} = ${getNewRequire(path, false)}`)
      // named imports: import { a, b, c } from 'module'
      jsCode = jsCode.replace(/[ \t]*import \{([A-Za-z0-9_, ]+)\} from (?:"|')([a-zA-z0-9 \.\/\\\-_]+)(?:"|')/g, (whole,imports,path)=>`const { ${imports} } = ${getNewRequire(path, false)}`)
    }

    // EXPERIMENTAL: Convert ES6 export syntax. For now we only support `export default <expr>`
    jsCode = jsCode.replace("export default", "module.exports.default = ")
    /* TODO: allow named exports too
        (function(module) { module = module || {}; module.exports = {}; CODE_HERE; return module.exports })
    */
    /* TODO allow exporting functions, classes, const/vars
        export const/var/let foo = 5                =>      const/var/let foo = module.exports.foo = 5
        export function foo() { }                   =>      const foo = module.exports.foo = function foo() { }
        export class foo { }                        =>      const foo = module.exports.foo = class foo() { }
        export default class/function foo { }       =>      const foo = module.exports._default = class/function foo() { }
        export default 5                            =>      module.exports._default = 5
                                            Or to simplify: const _default = module.exports._default = 5

        parseExport(str, pos): {name: string|"_default", declaration: "const"|"var"|"let"|"function"|"class"|null, lengthIncludingName: number} {
          // Eat export
          // Optionally eat default
          // Optionally eat declaration: const/let/var/function/async function/class
          // If there was a declaration, eat the name (identifier)
        }
        exportToDeclAndAssignment(export) {
            const ourDecl = (export.declaration==="var" || export.declaration==="let") ? export.declaration : "const"
            return `${ourDecl} ${export.name} = module.exports.${export.name} = `
        }
    */
    
    // Wrap in a factory function
    // jsCode = jsCode.split("\n").map(x => `  ${x}`).join("\n") // Optionally: Indent nicely
    jsCode = `function(module, exports, require) {\n${jsCode}\n}`
    return jsCode
  }
  static moduleCodeToIife(jsCode: string, useDefaultExportIfAny = true, allowRequire = false) {
    const require = allowRequire ? "require" : `function() { throw "Error: require() cannot be called when using 'moduleCodeToIife'" }`
    return `(function() {
      const tempModule = { exports: {} }
      const tempFactory = ${SimpleBundler.moduleCodeToFactoryFunc(jsCode)}
      tempFactory(tempModule, tempModule.exports, ${require})
      return ${useDefaultExportIfAny ? 'tempModule.exports.default || ' : ''}tempModule.exports
    })()`
  }  
}

function testSimpleBundler() {
  const ourModules = [
    {
      key: '/greet.js',
      codeString: `
        const { getGreeting } = require('./src/utils')
        const greet = name => say(getGreeting(name))
        module.exports = greet
      `
    },
    {
      key: '/src/utils.js',
      codeString: `
        module.exports.getGreeting = name => 'Hello ' + name + '!'
      `
    },
    { 
      key: '/src/main.js',
      codeString: `
        const greet = require("../greet")
        module.exports = greet("world")
      `,
      main: true
    }
  ]

  const b = new SimpleBundler()
  b.modulesToBundle.push(...ourModules)
  const out = b.bundle()
  const say = typeof alert === 'function' ? alert : console.info // since browsers don't have alert
  evalEx(out) // Should produce "Hello world!" in the console or alert

  // Now test the IIFE way
  say(evalEx(SimpleBundler.moduleCodeToIife(`
    export default { message: "Hello from a module" }
  `)).message)
}

export function evalEx(exprCode: string, customScope = {}) {
  // Evaluates in global scope, with optional special variables in scope
  return Function(...Object.keys(customScope), `return (${exprCode})`)(...Object.values(customScope))
}
