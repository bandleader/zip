type Dict<T> = Record<string, T>

export default class Bundler {
    static convJsModuleToFunction(jsCode: string, execute = true) {
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
        
        jsCode = jsCode.replace("export default", "_defaultExport = ")
        jsCode = jsCode.split("\n").map(x => `  ${x}`).join("\n") // Indent nicely
        jsCode = "(function() {\n  let _defaultExport = undefined\n\n" + jsCode + "\n\n\n  return _defaultExport\n})" + (execute ? "()\n" : "\n")
        return jsCode
    }
    static getLoaderCode(modules: Dict<string>) {
        const moduleCode = Object.keys(modules).map(k => `'${k}': ${Bundler.convJsModuleToFunction(modules[k], false)}`).join(", ")
        return `
            const __makeLoader = ${String(Bundler.getLoader)}
            const require = __makeLoader({${moduleCode}})
        `
    }
    static getLoader(modules: Dict<Function>) {
        const loadedModules: Record<string, Function> = {}
        // TODO: keep a stack to detect infinite recursion
        // TODO: trap errors during module init and say so
        return (moduleName: string) => {
        if (!modules[moduleName]) throw `Module '${moduleName}' not found`
        if (!loadedModules[moduleName]) loadedModules[moduleName] = modules[moduleName]()
        return loadedModules[moduleName]
        }
    }
    static convVueModuleToInitGlobalCode(componentKey: string, jsModuleCode: string) {
        return `
            window.vues = window.vues || {}
            window.vues['${componentKey}'] = ${Bundler.convJsModuleToFunction(jsModuleCode)}
            Vue.component("${componentKey}", window.vues['${componentKey}']);
        `
    }
    static vueClassTransformerScript() {
        // We also include the __assign function replacement for Object.assign, since Rollup is transpiling {...foo} to that.
        // In the future we should just include a Zip client JS file which should already be transpiled
        return `
            function() {
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
            }
        `
    }
    static convVueSfcToJsModule(vueSfcCode: string, classTransformer?: string) {
        const getTag = (tag: string, text: string) => {
        const start = text.indexOf('>', text.indexOf(`<${tag}`,)) + 1
        const end = text.lastIndexOf(`</${tag}>`)
        if (start===-1) return ""
        if (end===-1) return ""
        return text.substring(start, end)
        }
        const scriptModule = getTag("script", vueSfcCode) || "export default {}"
        let scriptIife = Bundler.convJsModuleToFunction(scriptModule)
        if (classTransformer) scriptIife = `(${classTransformer})(${scriptIife})`
        const template = getTag("template", vueSfcCode)
        const css = getTag("style", vueSfcCode)
        const btoa = (str: string) => new Buffer(str).toString('base64')
        return `
            let exp = ${scriptIife};
            exp.template = atob("${btoa(template)}")
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
                if (!alreadyAddedCss) addCss(atob("${btoa(css)}"))
                alreadyAddedCss = true
                if (oldCreated) oldCreated.call(this)
            }
            export default exp
        `
    }
}

function vueClassComponent(opts: Record<string, any>, cl: any) {
    if (arguments.length <= 1) { cl = arguments[0]; opts = undefined } // Allow first arg to be omitted
    if (typeof cl === 'object') return cl // This is a regular Vue component, just return
    if (typeof cl !== 'function') throw "VueClassComponent: final argument must be a class"
  
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
    if (typeof opts !== 'object') throw "VueClassComponent: first argument must be an options object"

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
  
      const value = obj[prop], descriptor = Object.getOwnPropertyDescriptor(obj, prop)
      if (['created', 'mounted', 'destroyed'].includes(prop)) {
        (ret as any)[prop] = value
      } else if (descriptor && descriptor.get) {
        ret.computed[prop] = {
          get: descriptor.get,
          set: descriptor.set
        }
      } else if (typeof value === 'function') {
        ret.methods[prop] = value
      } else if (value && value._isProp) {
        ret.props[prop] = obj[prop]
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