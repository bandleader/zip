type Dict<T> = Record<string, T>

export default class Bundler {
    static convJsModuleToFunction(jsCode: string, execute = true) {
        jsCode = jsCode.replace("export default", "_defaultExport = ")
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
    static convVueSfcToJsModule(vueSfcCode: string) {
        const getTag = (tag: string, text: string) => {
        const start = text.indexOf('>', text.indexOf(`<${tag}`,)) + 1
        const end = text.lastIndexOf(`</${tag}>`)
        if (start===-1) return ""
        if (end===-1) return ""
        return text.substring(start, end)
        }
        const script = getTag("script", vueSfcCode) || "export default {}"
        const script2 = Bundler.convJsModuleToFunction(script)                  
        const template = getTag("template", vueSfcCode)
        const css = getTag("style", vueSfcCode)
        const btoa = (str: string) => new Buffer(str).toString('base64')
        return `
            const exp = ${script2};
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