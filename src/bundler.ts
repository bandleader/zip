type Dict<T> = Record<string, T>

export class VueSfcs {
    // static convVueModuleToInitGlobalCode(componentKey: string, jsModuleCode: string) {
    //     return `
    //         window.vues = window.vues || {}
    //         window.vues['${componentKey}'] = ${SimpleBundler.moduleCodeToIife(jsModuleCode)}
    //         Vue.component("${componentKey}", window.vues['${componentKey}']);
    //     `
    // }
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
    static convVueSfcToESModule(vueSfcCode: string, opts: { classTransformer?: string, customMutationCode?: string, registerGlobally?: boolean|string } = {}) {
        const getTag = (tag: string, text: string) => {
        const start = text.indexOf('>', text.indexOf(`<${tag}`,)) + 1
        const end = text.lastIndexOf(`</${tag}>`)
        if (start===-1) return ""
        if (end===-1) return ""
        return text.substring(start, end)
        }
        const scriptModule = getTag("script", vueSfcCode) || "export default {}"
        let scriptIife = SimpleBundler.moduleCodeToIife(scriptModule)
        if (opts.classTransformer) scriptIife = `(${opts.classTransformer})(${scriptIife})`
        const template = getTag("template", vueSfcCode)
        const css = getTag("style", vueSfcCode)
        const regGlobalCode = typeof opts.registerGlobally === 'string' ? `Vue.component(${JSON.stringify(opts.registerGlobally)}, exp)`
          : opts.registerGlobally === true ? "Vue.component(exp)" // requires a 'name' property on the component options object
          : ""
        return `
            let exp = ${scriptIife};
            exp.template = ${JSON.stringify(template)}
            const addTag = (where, tagName, attrs) => {           
                const el = document.createElement(tagName)
                for (const k of Object.keys(attrs)) el[k] = attrs[k]
                where.appendChild(el)
            }
            const addCss = css => addTag(document.head, "style", { type: 'text/css', innerHTML: css })
            let alreadyAddedCss = false
            // TODO remove too
            const oldCreated = exp.created
            exp.created = function () {
                if (!alreadyAddedCss) addCss(${JSON.stringify(css)})
                alreadyAddedCss = true
                if (oldCreated) oldCreated.call(this)
            }
            ${opts.customMutationCode || ""}
            ${regGlobalCode}
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
  loader = (idOrNormalizedPath: string): { code: string }|void => {
    // Return a string if you managed to load the code. We expect you to override this method if the code you're bundling uses modules that you aren't pre-adding to the list
  }
  resolveAndAddModule(pathString: string, opts: { fromModuleAtPath?: string, main?: boolean } = {}) {
    const ids = this.resolver(pathString, require('path').dirname(opts.fromModuleAtPath || ""))
    
    // First, see if the module was already added, as any of the IDs
    const findAlreadyLoadedModule = this.modulesToBundle.find(mdl => ids.find(id => mdl.key === id))
    if (findAlreadyLoadedModule) {
      if (opts.main) findAlreadyLoadedModule.main = true
      return findAlreadyLoadedModule
    }

    // Otherwise, see if any loaders can load any of the IDs
    let foundCode: string|void = null
    let foundId = ids.find(x => { const r = this.loader(x); if (r) foundCode = r.code; return !!r } )
    if (typeof foundCode !== 'string') throw `Couldn't resolve path '${pathString}' from module '${opts.fromModuleAtPath || ""}' ids ${ids} and we have ${this.modulesToBundle.map(y => y.key)}`
    // And create a new module for it
    const newModule = { codeString: foundCode, key: foundId, main: !!opts.main }
    this.modulesToBundle.push(newModule)
    return newModule
  }

  static _createModuleLoader = function createModuleLoader(factories: {factory: Function, key: string}[]) {
    const modules: Record<string, {key: string, factory: Function, exports: any, loading: boolean, loaded: boolean}> = {}
    factories.forEach(f => { modules[f.key] = { key: f.key, factory: f.factory, exports: {}, loading: false, loaded: false }})

    const requireByKey = function requireByKey (key: string, useDefaultExportIfNoNamedExports = true) {
      /* 
        Provides a require function for modules to call at runtime. It will be passed to them as `require` by the loader.
        ES6-syntax `import` statements will set `useDefaultExportIfNoNamedExports=false` so we return the entire module
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
          m.factory(m, m.exports, loader.requireByKey)
          m.loading = false
          m.loaded = true
        } catch (ex) {
          m.loading = false
          console.error(`Error while running module '${key}': ${ex}`)
          throw ex // Rethrow original exception to preserve stack trace in most browsers
        }
      }
      if (useDefaultExportIfNoNamedExports && Object.keys(m.exports).length === 1 && ('default' in m.exports)) return m.exports.default
      return m.exports
    }
    const loader = { requireByKey: requireByKey }
    return loader
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
        const createModuleLoader = ${SimpleBundler._createModuleLoader}
        const loader = createModuleLoader(factories)
        // Immediately run any 'main' modules
        factories.filter(x => x.main).forEach(x => loader.requireByKey(x.key)) 
      })()
    `
  }
  static moduleCodeToFactoryFunc_simple(jsCode: string, importCallback?: (path: string) => { key: string }|void) {
  }


  static moduleCodeToFactoryFunc(jsCode: string, importCallback?: (path: string) => { key: string }|void) {
    // A "factory function" is a function that takes args (module, exports, __requireByKey) and mutates module.exports (or exports)
    // The argument `importCallback` lets you trap imports within the code (so you can add the module), and optionally change the key
    /* 2021: `importCallback` is now allowed to return void, which will not add a module, and will leave the import/require call as is.
          However, I realized that for this to be useful we have to give that power to `resolver`,
          meaning it should be allowed to return a { external: true } or something
          And also, `resolveAndAddModule` would have to sometimes return null, if the resolver says so
          And that somewhat complicates things
          Another approach is to add the module to the list, just mark it external, so we don't include it in the bundle
    */

    if (importCallback) {
      const performReplacements = (regExp: RegExp, getPath: (replaceCallbackArgs: string[]) => string, newSyntax: (key: string, replaceCallbackArgs: string[]) => string) => {
          jsCode = jsCode.replace(regExp, (...args) => {
            const path = getPath(args)
            const importResult = importCallback(path)      
            if (!importResult) return args[0] // If the importCallback doesn't wish to convert this import (i.e. it's for an external module etc.), leave it as is
            return newSyntax(importResult.key, args)
          })
      }
      performReplacements(/require\([\'\"](.+?)[\'\"]\)/g, ([_, path]) => path, key => `__requireByKey(${JSON.stringify(key)})`)
      // EXPERIMENTAL: also allow ES6 import syntax
      // default imports: import foo from 'module'
      performReplacements(/[ \t]*import ([A-Za-z0-9_]+) from (?:"|')([a-zA-z0-9 \.\/\\\-_]+)(?:"|')/g, ([whole,identifier,path]) => path, (key,[whole,identifier]) => `const ${identifier} = __requireByKey(${JSON.stringify(key)}, false).default`)
      // namespaced entire import: import * as foo from 'module'
      performReplacements(/[ \t]*import \* as ([A-Za-z0-9_]+) from (?:"|')([a-zA-z0-9 \.\/\\\-_]+)(?:"|')/g, ([whole,identifier,path]) => path, (key,[whole,identifier]) => `const ${identifier} = __requireByKey(${JSON.stringify(key)}, false)`)
      // named imports: import { a, b, c } from 'module'
      performReplacements(/[ \t]*import \{([A-Za-z0-9_, ]+)\} from (?:"|')([a-zA-z0-9 \.\/\\\-_]+)(?:"|')/g, ([whole,imports,path] )=> path, (key,[whole,imports]) => `const { ${imports} } = __requireByKey(${JSON.stringify(key)}, false)`)
    }

    // EXPERIMENTAL: Convert ES6 export syntax. For now we only support `export default <expr>`
    jsCode = jsCode.replace(/export default /g, "module.exports.default = ")
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
    jsCode = `function(module, exports, __requireByKey) {\n${jsCode}\n}`
    return jsCode
  }
  static moduleCodeToIife(jsCode: string, useDefaultExportIfNoNamedExports = true, blockRequire = false /* i.e. for external modules */) {
    // IIFE will return the exports object, or the default export if that's all there is and `useDefaultExportIfThatsAllThereIs` is set
    // Re: `useDefaultExportIfNoNamedExports`, see its definition in `requireByKey`
    return `(function() {
      var tempModule = { exports: {} }
      var tempFactory = ${SimpleBundler.moduleCodeToFactoryFunc(jsCode)}
      ${blockRequire ? `var require = function() { throw "Error: require() cannot be called when using 'moduleCodeToIife'" }` : ''}
      tempFactory(tempModule, tempModule.exports, undefined) 
      ${useDefaultExportIfNoNamedExports ? `if (Object.keys(tempModule.exports).length === 1 && ('default' in tempModule.exports)) return tempModule.exports.default` : ''}
      return tempModule.exports
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
