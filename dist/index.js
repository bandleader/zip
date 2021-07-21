'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var Crypto = require('crypto');
var fs = require('fs');
var Express = require('express');

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

function __generator(thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
}

function __spreadArrays() {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
}

var VueSfcs = /** @class */ (function () {
    function VueSfcs() {
    }
    // static convVueModuleToInitGlobalCode(componentKey: string, jsModuleCode: string) {
    //     return `
    //         window.vues = window.vues || {}
    //         window.vues['${componentKey}'] = ${SimpleBundler.moduleCodeToIife(jsModuleCode)}
    //         Vue.component("${componentKey}", window.vues['${componentKey}']);
    //     `
    // }
    VueSfcs.vueClassTransformerScript = function () {
        // We also include the __assign function replacement for Object.assign, since Rollup is transpiling {...foo} to that.
        // In the future we should just include a Zip client JS file which should already be transpiled
        return "\n            (function() {\n                var __assign = function() { \n                    __assign = Object.assign || function __assign(t) {\n                        for (var s, i = 1, n = arguments.length; i < n; i++) {\n                            s = arguments[i];\n                            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];\n                        }\n                        return t;\n                    };\n                    return __assign.apply(this, arguments);\n                }\n                return " + vueClassComponent + "\n            })()\n        ";
    };
    VueSfcs.convVueSfcToESModule = function (vueSfcCode, opts) {
        if (opts === void 0) { opts = {}; }
        var getTag = function (tag, text) {
            var start = text.indexOf('>', text.indexOf("<" + tag)) + 1;
            var end = text.lastIndexOf("</" + tag + ">");
            if (start === -1)
                return "";
            if (end === -1)
                return "";
            return text.substring(start, end);
        };
        var scriptModule = getTag("script", vueSfcCode) || "export default {}";
        var scriptIife = SimpleBundler.moduleCodeToIife(scriptModule);
        if (opts.classTransformer)
            scriptIife = "(" + opts.classTransformer + ")(" + scriptIife + ")";
        var template = getTag("template", vueSfcCode);
        var css = getTag("style", vueSfcCode);
        var regGlobalCode = typeof opts.registerGlobally === 'string' ? "Vue.component(" + JSON.stringify(opts.registerGlobally) + ", exp)"
            : opts.registerGlobally === true ? "Vue.component(exp)" // requires a 'name' property on the component options object
                : "";
        return "\n            let exp = " + scriptIife + ";\n            exp.template = " + JSON.stringify(template) + "\n            const addTag = (where, tagName, attrs) => {           \n                const el = document.createElement(tagName)\n                for (const k of Object.keys(attrs)) el[k] = attrs[k]\n                where.appendChild(el)\n            }\n            const addCss = css => addTag(document.head, \"style\", { type: 'text/css', innerHTML: css })\n            let alreadyAddedCss = false\n            // TODO remove too\n            const oldCreated = exp.created\n            exp.created = function () {\n                if (!alreadyAddedCss) addCss(" + JSON.stringify(css) + ")\n                alreadyAddedCss = true\n                if (oldCreated) oldCreated.call(this)\n            }\n            " + (opts.customMutationCode || "") + "\n            " + regGlobalCode + "\n            export default exp\n        ";
    };
    return VueSfcs;
}());
function vueClassComponent(opts, cl) {
    if (arguments.length <= 1) {
        cl = arguments[0];
        opts = undefined;
    } // Allow first arg to be omitted
    if (typeof cl === 'object')
        return cl; // This is a regular Vue component, just return
    if (typeof cl !== 'function')
        throw "VueClassComponent: Expected a class, not " + typeof cl;
    var propsToIgnore = ['prototype', 'length', 'name', 'caller', 'callee'];
    var copyData = function (source, target) {
        var insPropsOnly = Object.getOwnPropertyNames(source).filter(function (x) { return !propsToIgnore.includes(x); });
        for (var _i = 0, insPropsOnly_1 = insPropsOnly; _i < insPropsOnly_1.length; _i++) {
            var prop = insPropsOnly_1[_i];
            target[prop] = source[prop];
        }
    };
    // Allow `opts` to be specified as a method on the class, or as a static object
    if (!opts && typeof cl.prototype.opts === 'function') {
        opts = cl.prototype.opts();
        propsToIgnore.push("opts");
    }
    if (!opts && typeof cl.opts === 'object') {
        opts = cl.opts;
        propsToIgnore.push("opts");
    }
    // Validate/default for opts
    opts = opts || {};
    if (typeof opts !== 'object')
        throw "VueClassComponent: `opts` must be an options object, not " + typeof opts;
    // Create main object
    var coercePropsArrayToObj = function (x) { return Array.isArray(x) ? x.reduce(function (a, c) { return (a[c] = {}, a); }, {}) : x; };
    var ret = __assign(__assign({}, opts), { name: cl.name, computed: __assign({}, (opts.computed || {})), methods: __assign({}, (opts.methods || {})), props: coercePropsArrayToObj(opts.props || {}), data: function () {
            var newInstance = new cl();
            var data = {};
            copyData(newInstance, data);
            return data;
        } });
    var consumeProp = function (obj, prop, ignoreOthers) {
        if (ignoreOthers === void 0) { ignoreOthers = false; }
        if (propsToIgnore.includes(prop))
            return;
        var getValue = function () { return obj[prop]; }; // it's behind a function so that we don't call getters unnecessarily -- which will throw an error
        var descriptor = Object.getOwnPropertyDescriptor(obj, prop);
        if (['created', 'mounted', 'destroyed'].includes(prop)) {
            ret[prop] = obj[prop];
        }
        else if (descriptor && descriptor.get) {
            ret.computed[prop] = {
                get: descriptor.get,
                set: descriptor.set
            };
        }
        else if (typeof getValue() === 'function') {
            ret.methods[prop] = getValue();
        }
        else if (getValue() && getValue()._isProp) {
            ret.props[prop] = getValue();
        }
        else if (!ignoreOthers) {
            throw "VueClassComponent: Class prop `" + prop + "` must be a method or a getter";
        }
        else { // It's a data prop, from the "check instance properties" section below
            return; // Silently ignore it; it will be used in `data()` only
        }
        // If we were successful, ignore the prop in subsequent checks
        propsToIgnore.push(prop);
    };
    // Populate methods/computeds/props from the class's prototype
    for (var _i = 0, _a = Object.getOwnPropertyNames(cl.prototype); _i < _a.length; _i++) {
        var prop = _a[_i];
        consumeProp(cl.prototype, prop);
    }
    // Experimental: check static properties
    for (var _b = 0, _c = Object.getOwnPropertyNames(cl); _b < _c.length; _b++) {
        var prop = _c[_b];
        consumeProp(cl, prop);
    }
    // Experimental: check instance properties
    var dummyInstance = new cl();
    for (var _d = 0, _e = Object.getOwnPropertyNames(dummyInstance); _d < _e.length; _d++) {
        var prop = _e[_d];
        consumeProp(dummyInstance, prop, true);
    }
    // Done!
    return ret;
}
var SimpleBundler = /** @class */ (function () {
    function SimpleBundler() {
        this.modulesToBundle = [];
        this.resolver = function (path, fromPath) {
            // By default: allow extensions, and normalize paths (so we don't import files twice)
            // You can override this to allow paths that don't start with /,./,../ to look in node_modules etc.
            fromPath = fromPath.split("?")[0]; // If the calling module has a querystring, remove it
            return ["", ".js", "/index.js"].map(function (x) { return require('path').join(fromPath, path + x); });
        };
        this.loader = function (idOrNormalizedPath) {
            // Return a string if you managed to load the code. We expect you to override this method if the code you're bundling uses modules that you aren't pre-adding to the list
        };
    }
    SimpleBundler.prototype.resolveAndAddModule = function (pathString, opts) {
        var _this = this;
        if (opts === void 0) { opts = {}; }
        var ids = this.resolver(pathString, require('path').dirname(opts.fromModuleAtPath || ""));
        // First, see if the module was already added, as any of the IDs
        var findAlreadyLoadedModule = this.modulesToBundle.find(function (mdl) { return ids.find(function (id) { return mdl.key === id; }); });
        if (findAlreadyLoadedModule) {
            if (opts.main)
                findAlreadyLoadedModule.main = true;
            return findAlreadyLoadedModule;
        }
        // Otherwise, see if any loaders can load any of the IDs
        var foundCode = null;
        var foundId = ids.find(function (x) { return foundCode = _this.loader(x); });
        if (typeof foundCode !== 'string')
            throw "Couldn't resolve path '" + pathString + "' from module '" + (opts.fromModuleAtPath || "");
        // And create a new module for it
        var newModule = { codeString: foundCode, key: foundId, main: !!opts.main };
        this.modulesToBundle.push(newModule);
        return newModule;
    };
    SimpleBundler.prototype.bundle = function () {
        var _this = this;
        var compiledModules = [];
        var _loop_1 = function (i) {
            var thisModule = this_1.modulesToBundle[i];
            var factoryFuncString = SimpleBundler.moduleCodeToFactoryFunc(thisModule.codeString, function (path) {
                var resolvedModule = _this.resolveAndAddModule(path, { fromModuleAtPath: thisModule.key });
                return { key: resolvedModule.key };
            });
            compiledModules.push(__assign(__assign({}, thisModule), { factoryFuncString: factoryFuncString }));
        };
        var this_1 = this;
        for (var i = 0; i < this.modulesToBundle.length; i++) {
            _loop_1(i);
        }
        // Return loader code
        return "\n      ;(function(){\n        const factories = [\n          " + compiledModules.map(function (m) { return "{\n            key: " + JSON.stringify(m.key) + ",\n            factory: " + m.factoryFuncString + ",\n            main: " + !!m.main + "\n          }"; }).join(",") + "\n        ]\n        const createModuleLoader = " + SimpleBundler._createModuleLoader + "\n        const loader = createModuleLoader(factories)\n        // Immediately run any 'main' modules\n        factories.filter(x => x.main).forEach(x => loader.requireByKey(x.key)) \n      })()\n    ";
    };
    /* WAS DOING THIS MOSTLY TO ALLOW caller not to go ahead with the import
      however I realized that for this to be useful we have to give that power to `resolver`,
      meaning it should be allowed to return a { external: true } or something
      And also, `resolveAndAddModule` would have to sometimes return null, if the resolver says so
      And that somewhat complicates things
      Another approach is to add the module to the list, just mark it external, so we don't include it in the bundle
       */
    SimpleBundler.moduleCodeToFactoryFunc = function (jsCode, importCallback) {
        // A "factory function" is a function that takes args (module, exports, __requireByKey) and mutates module.exports (or exports)
        // The argument `importCallback` lets you trap imports within the code (so you can add the module), and optionally change the key
        if (importCallback) {
            var performReplacements = function (regExp, getPath, newSyntax) {
                jsCode = jsCode.replace(regExp, function () {
                    var args = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        args[_i] = arguments[_i];
                    }
                    var path = getPath(args);
                    var importResult = importCallback(path);
                    if (!importResult)
                        return args[0]; // If the importCallback doesn't wish to convert this import (i.e. it's for an external module etc.), leave it as is
                    return newSyntax(importResult.key, args);
                });
            };
            performReplacements(/require\([\'\"](.+?)[\'\"]\)/g, function (_a) {
                var _ = _a[0], path = _a[1];
                return path;
            }, function (key) { return "__requireByKey(" + JSON.stringify(key) + ")"; });
            // EXPERIMENTAL: also allow ES6 import syntax
            // default imports: import foo from 'module'
            performReplacements(/[ \t]*import ([A-Za-z0-9_]+) from (?:"|')([a-zA-z0-9 \.\/\\\-_]+)(?:"|')/g, function (_a) {
                var whole = _a[0], identifier = _a[1], path = _a[2];
                return path;
            }, function (key, _a) {
                var whole = _a[0], identifier = _a[1];
                return "const " + identifier + " = __requireByKey(" + JSON.stringify(key) + ", false).default";
            });
            // namespaced entire import: import * as foo from 'module'
            performReplacements(/[ \t]*import \* as ([A-Za-z0-9_]+) from (?:"|')([a-zA-z0-9 \.\/\\\-_]+)(?:"|')/g, function (_a) {
                var whole = _a[0], identifier = _a[1], path = _a[2];
                return path;
            }, function (key, _a) {
                var whole = _a[0], identifier = _a[1];
                return "const " + identifier + " = __requireByKey(" + JSON.stringify(key) + ", false)";
            });
            // named imports: import { a, b, c } from 'module'
            performReplacements(/[ \t]*import \{([A-Za-z0-9_, ]+)\} from (?:"|')([a-zA-z0-9 \.\/\\\-_]+)(?:"|')/g, function (_a) {
                var whole = _a[0], imports = _a[1], path = _a[2];
                return path;
            }, function (key, _a) {
                var whole = _a[0], imports = _a[1];
                return "const { " + imports + " } = __requireByKey(" + JSON.stringify(key) + ", false)";
            });
        }
        // EXPERIMENTAL: Convert ES6 export syntax. For now we only support `export default <expr>`
        jsCode = jsCode.replace(/export default /g, "module.exports.default = ");
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
        jsCode = "function(module, exports, __requireByKey) {\n" + jsCode + "\n}";
        return jsCode;
    };
    SimpleBundler.moduleCodeToIife = function (jsCode, useDefaultExportIfNoNamedExports, allowRequire /* i.e. for external modules */) {
        if (useDefaultExportIfNoNamedExports === void 0) { useDefaultExportIfNoNamedExports = true; }
        if (allowRequire === void 0) { allowRequire = false; }
        // IIFE will return the exports object, or the default export if that's all there is and `useDefaultExportIfThatsAllThereIs` is set
        // Re: `useDefaultExportIfNoNamedExports`, see its definition in `requireByKey`
        return "(function() {\n      var tempModule = { exports: {} }\n      var tempFactory = " + SimpleBundler.moduleCodeToFactoryFunc(jsCode) + "\n      " + (allowRequire ? '' : "var require = function() { throw \"Error: require() cannot be called when using 'moduleCodeToIife'\" }") + "\n      tempFactory(tempModule, tempModule.exports, undefined) \n      " + (useDefaultExportIfNoNamedExports ? "if (Object.keys(tempModule.exports).length === 1 && ('default' in tempModule.exports)) return tempModule.exports.default" : '') + "\n      return tempModule.exports\n    })()";
    };
    SimpleBundler._createModuleLoader = function createModuleLoader(factories) {
        var modules = {};
        factories.forEach(function (f) { modules[f.key] = { key: f.key, factory: f.factory, exports: {}, loading: false, loaded: false }; });
        var requireByKey = function requireByKey(key, useDefaultExportIfNoNamedExports) {
            if (useDefaultExportIfNoNamedExports === void 0) { useDefaultExportIfNoNamedExports = true; }
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
            if (!modules[key])
                throw "Module not found in bundle: " + key;
            var m = modules[key];
            if (m.loading)
                throw "Circular dependency found when loading module: " + key;
            if (!m.loaded) {
                m.loading = true;
                try {
                    m.factory(m, m.exports, loader.requireByKey);
                    m.loading = false;
                    m.loaded = true;
                }
                catch (ex) {
                    m.loading = false;
                    console.error("Error while running module '" + key + "': " + ex);
                    throw ex; // Rethrow original exception to preserve stack trace in most browsers
                }
            }
            if (useDefaultExportIfNoNamedExports && Object.keys(m.exports).length === 1 && ('default' in m.exports))
                return m.exports.default;
            return m.exports;
        };
        var loader = { requireByKey: requireByKey };
        return loader;
    };
    return SimpleBundler;
}());
function evalEx(exprCode, customScope) {
    if (customScope === void 0) { customScope = {}; }
    // Evaluates in global scope, with optional special variables in scope
    return Function.apply(void 0, __spreadArrays(Object.keys(customScope), ["return (" + exprCode + ")"])).apply(void 0, Object.values(customScope));
}

var _Bundler = /*#__PURE__*/Object.freeze({
    __proto__: null,
    VueSfcs: VueSfcs,
    vueClassComponent: vueClassComponent,
    SimpleBundler: SimpleBundler,
    evalEx: evalEx
});

// const a: NewGraphQuery = {
//   _args: [23],
//   fred: true,
//   beet: {
//     args: {
//       _args?: [23],
//       fish: true
//     },
//     feish: true
//   }
// }
var GraphQueryRunner = /** @class */ (function () {
    function GraphQueryRunner() {
    }
    GraphQueryRunner.resolve_inner = function (on, args, pathForDiag) {
        if (pathForDiag === void 0) { pathForDiag = "🌳"; }
        if ((args === null || args === void 0 ? void 0 : args.length) && typeof on !== 'function')
            throw pathForDiag + " cannot accept arguments";
        if (typeof on === 'function')
            on = on.apply(void 0, (args || []));
        if (!on.then)
            on = Promise.resolve(on);
        return on;
    };
    GraphQueryRunner.followField = function (obj, field, pathForDiag) {
        if (pathForDiag === void 0) { pathForDiag = "🌳"; }
        // Returns a resolver (i.e. optionally function for optionally promise for a value or object)
        // if (field === "[]") {
        //   if (!Array.isArray(obj)) throw `Can't execute '[]' on non-array: ${pathForDiag}`
        //   return Promise.resolve(obj.map((x,i) => NewGraphQueryRunner.followField(x, field, `${pathForDiag}[${i}]`)))
        // }
        if (typeof obj !== 'object' || obj === null)
            throw "Can't get field '" + field + "' on " + pathForDiag + " because it is not an object but " + typeof obj;
        // NAH if (Array.isArray(obj)) throw `Can't get field '${field}' on ${pathForDiag} because it is an array` // Should never happen
        var result = obj[field];
        if (result === undefined)
            throw "Field '" + field + "' on " + pathForDiag + " does not exist";
        if (typeof result === 'function')
            result = result.bind(obj); // So that the method can be called with the right `this`
        return result;
    };
    GraphQueryRunner.resolve = function (on, queryOrTrue, pathForDiag) {
        var _this = this;
        if (pathForDiag === void 0) { pathForDiag = "🌳"; }
        // Same as `resolve_inner`, but allows for optionally subquerying the result.
        var getSqKeys = function (obj) { return Object.keys(obj).filter(function (x) { return x !== "_args"; }); };
        try {
            var result = GraphQueryRunner.resolve_inner(on, queryOrTrue._args, pathForDiag);
            // PERHAPS: if it's `true` but the result is complex, disallow. Or at least clean, send known keys, force implementing a toJson() method, etc.
            if (queryOrTrue === true || !getSqKeys(queryOrTrue).length)
                return result;
            // Otherwise, treat `result` as a Promise<object|Array<object>>, run subqueries, and return an object
            var handleObject = function (queryable) { return __awaiter(_this, void 0, void 0, function () {
                var ret, _loop_1, _i, _a, sqKey;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            if (typeof queryable !== 'object' || queryable === null)
                                throw pathForDiag + " is a '" + typeof queryable + "', not an object, and so cannot accept subqueries";
                            ret = {};
                            _loop_1 = function (sqKey) {
                                var sqQueryOrTrue, _a, sqFieldKey, sqAlias, assignToOurObject, _b, _c, sqValue, _d;
                                return __generator(this, function (_e) {
                                    switch (_e.label) {
                                        case 0:
                                            sqQueryOrTrue = queryOrTrue[sqKey];
                                            _a = sqKey.includes("=>") ? sqKey.split("=>").map(function (x) { return x.trim(); }) : [sqKey, sqKey], sqFieldKey = _a[0], sqAlias = _a[1];
                                            assignToOurObject = function (x) {
                                                if (sqAlias)
                                                    return ret[sqAlias] = x;
                                                // Otherwise, the 'unnest=>' operator was requested, so mix the target object into ours
                                                if (typeof x !== 'object' || x === null)
                                                    throw "Can't use the 'unnest=>' operator on " + pathForDiag + "." + sqKey + " because it isn't an object";
                                                if (!Array.isArray(x))
                                                    return Object.assign(ret, x);
                                                // What to do if it's an array? I think replace us with it. Though that will lose any keys we already have! But that's the user's problem.
                                                ret = x;
                                                // ret = Object.assign(x, ret)
                                                // x.push({...ret}); ret = x//; ret.push(Object.assign(x, ret)
                                            };
                                            if (!(!sqFieldKey && sqAlias)) return [3 /*break*/, 2];
                                            // He wants to created a nested context -- the '=>nest' operator. i.e. run his subqueries on us
                                            _b = assignToOurObject;
                                            return [4 /*yield*/, GraphQueryRunner.resolve(/* same resolver*/ queryable, sqQueryOrTrue, pathForDiag + "." + sqKey)];
                                        case 1:
                                            // He wants to created a nested context -- the '=>nest' operator. i.e. run his subqueries on us
                                            _b.apply(void 0, [_e.sent()]);
                                            return [3 /*break*/, 6];
                                        case 2:
                                            if (!(sqFieldKey === "[]")) return [3 /*break*/, 4];
                                            // He wants to run subqueries on array contents
                                            if (!Array.isArray(queryable))
                                                throw "Can't use '[]' on non-array: " + pathForDiag;
                                            _c = assignToOurObject;
                                            return [4 /*yield*/, Promise.all(queryable.map(function (arrayItem, ind) { return GraphQueryRunner.resolve(arrayItem, sqQueryOrTrue, pathForDiag + "[" + ind + "]"); }))];
                                        case 3:
                                            _c.apply(void 0, [_e.sent()]);
                                            return [3 /*break*/, 6];
                                        case 4:
                                            sqValue = GraphQueryRunner.followField(queryable, sqFieldKey, pathForDiag);
                                            _d = assignToOurObject;
                                            return [4 /*yield*/, GraphQueryRunner.resolve(sqValue, sqQueryOrTrue, pathForDiag + "." + sqKey)];
                                        case 5:
                                            _d.apply(void 0, [_e.sent()]);
                                            _e.label = 6;
                                        case 6: return [2 /*return*/];
                                    }
                                });
                            };
                            _i = 0, _a = getSqKeys(queryOrTrue);
                            _b.label = 1;
                        case 1:
                            if (!(_i < _a.length)) return [3 /*break*/, 4];
                            sqKey = _a[_i];
                            return [5 /*yield**/, _loop_1(sqKey)];
                        case 2:
                            _b.sent();
                            _b.label = 3;
                        case 3:
                            _i++;
                            return [3 /*break*/, 1];
                        case 4: return [2 /*return*/, ret];
                    }
                });
            }); };
            return result.then(handleObject, function (ex) { return Promise.reject("Error in query node " + pathForDiag + ": " + ex); });
            // queryableOrArray => {
            //   if (Array.isArray(queryableOrArray)) return Promise.all(queryableOrArray.map((x, i) => handleObject(x, `${pathForDiag}[${i}]`)))
            //  return handleObject(queryableOrArray, pathForDiag)
            //})
        }
        catch (ex) {
            return Promise.reject("Error in query node " + pathForDiag + ": " + ex);
        }
    };
    return GraphQueryRunner;
}());

var randomId = function (length, alphabet) {
    if (length === void 0) { length = 10; }
    if (alphabet === void 0) { alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"; }
    return Array.from(Array(length)).map(function () { return alphabet[Math.trunc(Math.random() * alphabet.length)]; }).join("");
};
var inMinutes = function (mins) { return Date.now() + (mins * 60 * 1000); };
var passed = function (timestamp) { return timestamp < Date.now(); };
function Loginner(_opts) {
    var _this = this;
    if (_opts === void 0) { _opts = {}; }
    // TODO produce a middleware, maybe put account in req.acct or at least req.getAcct(), maybe take a function as a continuing middleware?
    // Remember this is really going to be used by the ZipRpc middleware etc. So it can just look at req.acct or something, or pass on req?
    var opts = {
        sendCode: _opts.sendCode || (function (email, code) { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
            console.log("Code is", code);
            return [2 /*return*/];
        }); }); }),
        newAcct: function (email) { return __awaiter(_this, void 0, void 0, function () {
            var obj, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!_opts.newAcct) return [3 /*break*/, 2];
                        return [4 /*yield*/, (_opts.newAcct(email))];
                    case 1:
                        _a = _b.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        _a = { email: email, id: undefined, firstName: email.split("@")[0] };
                        _b.label = 3;
                    case 3:
                        obj = _a;
                        return [2 /*return*/, __assign(__assign({}, obj), { id: obj.id || randomId() })];
                }
            });
        }); },
        me: function (acct) { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, ({ name: acct.name, firstName: acct.firstName, lastName: acct.lastName, displayName: acct.displayName })];
        }); }); },
        hashPassword: function (raw) { return Crypto.createHash('sha256').update(raw).digest('hex'); },
    };
    var db = {
        users: [],
        codes: [],
        sessions: [],
    };
    var pruned = function (list) { return list.filter(function (x) { return !passed(x.expiry); }); };
    var acctByEmail = function (email) { return db.users.find(function (x) { return x.email === email; }); };
    var acctById = function (id) { return db.users.find(function (x) { return x.id === id; }); };
    var verifyToken = function (token) {
        db.sessions = pruned(db.sessions);
        var find = db.sessions.find(function (x) { return x.token === token; });
        return find ? find.acctId : null;
    };
    var issueToken = function (acctId) {
        var token = randomId(32);
        db.sessions.push({ token: token, acctId: acctId, expiry: inMinutes(24 * 60) });
        return token;
    };
    var api = {
        useEmail: function (email) {
            return __awaiter(this, void 0, void 0, function () {
                var find, newAcct, code;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            find = acctByEmail(email);
                            if (!!find) return [3 /*break*/, 2];
                            return [4 /*yield*/, opts.newAcct(email)];
                        case 1:
                            newAcct = _a.sent();
                            db.users.push(newAcct);
                            find = newAcct;
                            _a.label = 2;
                        case 2:
                            code = randomId(6, "0123456789");
                            db.codes.push({ code: code, acctId: find.id, expiry: inMinutes(5) });
                            // TODO send code
                            return [4 /*yield*/, opts.sendCode(email, code)];
                        case 3:
                            // TODO send code
                            _a.sent();
                            return [2 /*return*/, { type: "code_sent" }];
                    }
                });
            });
        },
        loginWithEmailAndPassword: function (email, password) {
            return __awaiter(this, void 0, void 0, function () {
                var passwordHash, acct, token;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, opts.hashPassword(password)];
                        case 1:
                            passwordHash = _a.sent();
                            acct = acctByEmail(email);
                            if (!acct)
                                return [2 /*return*/, { error: "We don't recognize that email. Did you mean to register?" }];
                            if (!acct.passwordHash)
                                return [2 /*return*/, { error: "That account has no password. You must login via code, link, etc." }];
                            if (acct.passwordHash === passwordHash) {
                                token = issueToken(acct.id);
                                return [2 /*return*/, { token: token }];
                            }
                            else {
                                return [2 /*return*/, { error: "Incorrect password" }];
                            }
                    }
                });
            });
        },
        loginWithCode: function (code) {
            return __awaiter(this, void 0, void 0, function () {
                var find, token;
                return __generator(this, function (_a) {
                    db.codes = pruned(db.codes);
                    find = db.codes.find(function (x) { return x.code === code; });
                    if (!find)
                        return [2 /*return*/, null];
                    find.expiry = 0; // so it cannot be used again
                    token = issueToken(find.acctId);
                    return [2 /*return*/, { token: token }];
                });
            });
        },
        me: function (token) {
            return __awaiter(this, void 0, void 0, function () {
                var acctId, acct, me, _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            acctId = verifyToken(token);
                            acct = acctId && acctById(acctId);
                            _a = acct;
                            if (!_a) return [3 /*break*/, 2];
                            return [4 /*yield*/, opts.me(acct)];
                        case 1:
                            _a = (_b.sent());
                            _b.label = 2;
                        case 2:
                            me = _a;
                            return [2 /*return*/, me];
                    }
                });
            });
        },
        logout: function (token) {
            var session = db.sessions.find(function (x) { return x.token === token; });
            if (!session)
                return false;
            db.sessions = db.sessions.filter(function (x) { return x.token !== token; });
            return true;
        },
    };
    return { api: api, verifyToken: verifyToken };
}

//   ________  ___  ________   
var Bundler = _Bundler;
function getPackageRoot() {
    var projRoot = process.cwd();
    while (!(require('fs').existsSync(projRoot + "/package.json"))) {
        console.warn("Couldn't find package.json at " + projRoot);
        projRoot = projRoot.replace(/\\/g, "/").split("/").slice(0, projRoot.split("/").length - 1).join("/"); // hack off one directory
        console.warn("Trying " + projRoot);
        if (projRoot.length <= 3)
            throw "Couldn't find `package.json` anywhere";
    }
    return projRoot;
}
function flatMap(array, callbackfn) {
    var _a;
    return (_a = Array.prototype).concat.apply(_a, array.map(callbackfn));
}
function localFilesystem(root) {
    var resolve = function () {
        var _a;
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return (_a = require('path')).resolve.apply(_a, args).replace(/\\/g, "/");
    };
    var localRoot = resolve(root);
    var getFiles = function (dirPrefix) {
        if (dirPrefix === void 0) { dirPrefix = ""; }
        var localDir = resolve(root, dirPrefix);
        return flatMap(fs.readdirSync(localDir), function (file) {
            var localPath = localDir + "/" + file;
            return fs.statSync(localPath).isDirectory()
                ? getFiles("" + dirPrefix + file + "/")
                : [{ path: dirPrefix + file, localPath: localPath }];
        });
    };
    var readFileSync = function (path) {
        var localPath = resolve(root, path);
        if (!localPath.startsWith(localRoot + "/"))
            throw "Path " + path + " is below the root";
        return fs.readFileSync(localPath, { encoding: "utf8" });
    };
    // console.log("ADDED FILESYSTEM:",{localRoot,files: getFiles()})
    return { getFiles: getFiles, readFileSync: readFileSync };
}
function multirootFilesystem(fss) {
    return {
        getFiles: function () {
            var all = flatMap(fss, function (x) { return x.getFiles(); });
            var paths = [];
            return all.filter(function (x) {
                if (paths.includes(x.path))
                    return false;
                paths.push(x.path);
                return true;
            });
        },
        readFileSync: function (path) {
            var firstEx = null;
            for (var _i = 0, fss_1 = fss; _i < fss_1.length; _i++) {
                var fs_1 = fss_1[_i];
                try {
                    return fs_1.readFileSync(path);
                }
                catch (e) {
                    firstEx = firstEx || e;
                }
            }
            throw firstEx;
        }
    };
}
var ZipRunner = /** @class */ (function () {
    function ZipRunner(site) {
        if (site === void 0) { site = {}; }
        this.site = site;
        this.auth = Loginner();
        this.authRpc = quickRpc(this.auth.api, "/api/auth");
        {
            // Load from filesystem based on package.json root
            var pkgRoot = getPackageRoot();
            this.files = multirootFilesystem([
                localFilesystem(pkgRoot + "/zip-src"),
                localFilesystem(__dirname + "/../default-files")
            ]);
            var packageJson = JSON.parse(fs.readFileSync(pkgRoot + "/package.json", { encoding: "utf8" })); // require(root + '/package.json')
            var zipConfig = packageJson.zip || {};
            for (var k in zipConfig)
                site[k] = zipConfig[k]; // TODO apply deeply
            site.siteName = site.siteName || packageJson.name;
        }
        // Set some defaults
        site.siteName = site.siteName || "Zip Site";
        site.siteBrand = site.siteBrand || site.siteName;
        site.router = site.router || {};
        site.basePath = site.basePath || "/";
        this.startBackend();
    }
    ZipRunner.prototype.serve = function (opts) {
        if (opts === void 0) { opts = {}; }
        var app = opts.app || Express();
        if (opts.preBind)
            opts.preBind(app);
        app.use(Express.static("./zip-src/static"));
        app.use(Express.static(__dirname + "/../default-files/static"));
        app.all("*", this.handler);
        var port = opts.port || process.env.PORT || 3000;
        if (opts.listen !== false)
            app.listen(port, function () {
                console.info("Your Zip app is listening on http://localhost:" + port);
            });
        return app;
    };
    ZipRunner.prototype.getFile = function (path) {
        // if (!this.site.files[path]) throw `File '${path}' not found in zip`
        // return this.site.files[path].data
        return this.files.readFileSync(path);
    };
    ZipRunner.prototype.getFrontendIndex = function (newMode) {
        if (newMode === void 0) { newMode = false; }
        var contents = this.getFile("index.html");
        contents = contents.replace(/\{\%siteName\}/g, this.site.siteName);
        contents = contents.replace(/\{\%siteBrand\}/g, this.site.siteBrand || this.site.siteName);
        contents = contents.replace(/\{\%basePath\}/g, this.site.basePath);
        // Inject script
        var scriptTag = newMode ? "<script src=\"/_ZIPFRONTENDSCRIPT\" type=\"module\"></script>" : "<script>" + this.getFrontendScript() + "</script>";
        contents = contents.replace(/<\/body>/g, scriptTag + "</body>");
        return contents;
    };
    ZipRunner.prototype.startBackend = function () {
        var backend = this.site.backend;
        // Allow using a file in the Zip VFS called `backend.js`
        if (!backend) {
            var backendModuleText = this.files.getFiles().some(function (x) { return x.path === "backend.js"; }) ? this.getFile("backend.js") : "";
            // TODO use clearableScheduler
            backend = Bundler.evalEx(Bundler.SimpleBundler.moduleCodeToIife(backendModuleText, undefined, true), { require: require });
            if (typeof backend === 'function')
                backend = backend.backend();
        }
        if (Object.keys(backend).filter(function (x) { return x !== 'greeting'; }).length) {
            console.log("Loaded backend with methods:", Object.keys(backend).join(", "));
        }
        // Allow graph queries
        var graphResolver = backend.graph;
        if (graphResolver)
            backend.graph = function (queryObj) { return GraphQueryRunner.resolve(graphResolver, queryObj); };
        this.backendRpc = quickRpc(backend, this.site.basePath + "api/qrpc");
    };
    Object.defineProperty(ZipRunner.prototype, "handler", {
        get: function () {
            var _this = this;
            return function (req, resp) {
                _this.handleRequest(req.path, req, resp);
            };
        },
        enumerable: true,
        configurable: true
    });
    ZipRunner.prototype.handleRequest = function (path, req, resp) {
        if (!resp.json)
            resp.json = function (obj) { return resp.send(JSON.stringify(obj)); };
        /*const tryWith = (msgPrefix: string, fn: Function) => {
          try {
            const result = fn()
            if (result.catch) result.catch(sendErr)
            return result
          } catch (ex) {
            sendErr(`${msgPrefix}${ex}`)
          }
        }*/
        if (path === "/favicon.ico") {
            resp.send("404 Not Found");
        }
        else if (path == "/_zipver") {
            resp.send(require('../package.json').version);
        }
        else if (path === "/api/qrpc") {
            this.backendRpc.handler(req, resp);
        }
        else if (path === "/api/auth") {
            this.authRpc.handler(req, resp);
        }
        else if (path.startsWith("/api/")) {
            // REST API -- not currently implemented because we have to think about arg types being only string...
            var method = path.split("/")[2];
            throw "REST API not yet implemented";
        }
        else {
            resp.send(this.getFrontendIndex());
        }
    };
    ZipRunner.prototype.getFrontendScript = function (newMode) {
        if (newMode === void 0) { newMode = false; }
        var scripts = [];
        scripts.push(this.getFile("zip-client.js"));
        scripts.push("Zip.Backend = " + this.backendRpc.script); // RPC for backend methods
        scripts.push("Zip.ZipAuth = " + this.authRpc.script); // RPC for auth methods
        var vueFiles = this.files; // passing extra files won't hurt
        scripts.push(new ZipFrontend(vueFiles, __assign(__assign({}, this.site), { siteBrand: this.site.siteBrand /* we assigned it in the constructor */ })).script(newMode));
        return scripts.join("\n");
    };
    return ZipRunner;
}());
function quickRpc(backend, endpointUrl) {
    var _this = this;
    if (endpointUrl === void 0) { endpointUrl = "/api"; }
    var endpointUrlString = endpointUrl + (endpointUrl.includes("?") ? "&" : "?");
    var indent = function (text, spaces) {
        if (spaces === void 0) { spaces = 2; }
        return text.split("\n").map(function (x) { return " ".repeat(spaces) + x; }).join("\n");
    };
    //.replace(/\:method/g, '" + method + "')
    var script = "const _call = (method, ...args) => {\n  const result = fetch(" + JSON.stringify(endpointUrlString) + " + \"method=\" + method + \"&args=\" + encodeURIComponent(JSON.stringify(args)), { method: \"POST\" })\n  const jsonResult = result.then(x => x.json())\n  return jsonResult.then(json => {\n    if (json.err) throw \"Server returned error: \" + json.err\n    return json.result\n  })\n}\n";
    script += "return {\n" +
        Object.keys(backend).map(function (key) { return "  " + key + "(...args) { return _call('" + key + "', ...args) }"; })
            .join(", \n") + "\n}";
    // Wrap in IIFE
    script = "(function() {\n" + indent(script) + "\n})()";
    var handler = function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var method, context, args, result, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    method = req.query.method;
                    context = { req: req, res: res, method: method };
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, , 7]);
                    if (!req.query.expose) return [3 /*break*/, 2];
                    res.send("window." + req.query.expose + " = " + script);
                    return [3 /*break*/, 5];
                case 2:
                    if (!(typeof backend[method] !== 'function')) return [3 /*break*/, 3];
                    throw "Method '" + method + "' does not exist";
                case 3:
                    args = JSON.parse(req.query.args);
                    return [4 /*yield*/, backend[method].apply(context, args)];
                case 4:
                    result = _a.sent();
                    res.json({ result: result });
                    _a.label = 5;
                case 5: return [3 /*break*/, 7];
                case 6:
                    err_1 = _a.sent();
                    res.json({ err: err_1 });
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    }); };
    var setup = function (expressApp) { return expressApp.post(endpointUrl, handler); };
    return { script: script, handler: handler, setup: setup };
}
var ZipFrontend = /** @class */ (function () {
    function ZipFrontend(files, options) {
        this.files = files;
        this.options = options;
    }
    ZipFrontend.prototype._vueFiles = function () {
        var getFileName = function (path) { return path.split("/")[path.split("/").length - 1]; };
        var minusExt = function (fileName) { return fileName.substr(0, fileName.lastIndexOf(".")); };
        var usedNames = [];
        return this.files.getFiles().filter(function (f) { return f.path.endsWith(".vue"); }).map(function (f, i) {
            var autoRoute = f.path === "pages/home.vue" ? "/"
                : f.path.startsWith('pages/') ? ('/' + minusExt(f.path.substr(6)).replace(/__/g, ':'))
                    : null;
            var componentKey = minusExt(getFileName(f.path)).replace(/[^a-zA-Z0-9א-ת]+/g, "-");
            // Make name safe and unique
            if (componentKey.startsWith("-"))
                componentKey = 'z' + componentKey;
            if (componentKey.endsWith("-"))
                componentKey = componentKey + 'z';
            if (autoRoute && usedNames.includes(componentKey))
                componentKey += "-" + i;
            usedNames.push(componentKey);
            return __assign(__assign({}, f), { autoRoute: autoRoute, componentKey: componentKey });
        });
    };
    ZipFrontend.prototype._vueModules = function () {
        var _this = this;
        return this._vueFiles().map(function (vueFile) {
            return Bundler.VueSfcs.convVueSfcToESModule(_this.files.readFileSync(vueFile.path), { classTransformer: Bundler.VueSfcs.vueClassTransformerScript() });
        });
    };
    ZipFrontend.prototype.script = function (newMode, vue3) {
        var _this = this;
        if (newMode === void 0) { newMode = false; }
        if (vue3 === void 0) { vue3 = false; }
        var _a;
        var files = this._vueFiles();
        var lines = function (x) { return files.map(x).filter(function (x) { return x; }).join("\n"); };
        var ret = "\n      // Import the Vue files\n      " + lines(function (f, i) {
            var _a;
            return newMode
                ? "import vue" + i + " from '/" + (((_a = f.localPath) === null || _a === void 0 ? void 0 : _a.includes("default-files")) ? '_ZIPDEFAULTFILES/' : '') + f.path + "'"
                : "const vue" + i + " = " + Bundler.SimpleBundler.moduleCodeToIife(Bundler.VueSfcs.convVueSfcToESModule(_this.files.readFileSync(f.path), { classTransformer: Bundler.VueSfcs.vueClassTransformerScript() }));
        }) + "\n      const vues = [" + files.map(function (_, i) { return "vue" + i; }) + "]\n            \n      ";
        var storeFile = this.files.getFiles().find(function (x) { return x.path === "store.ts" || x.path === "store.js"; });
        if (storeFile)
            ret += "\n        " + (newMode ? "import store from '/store'" : "const store = " + Bundler.SimpleBundler.moduleCodeToIife(this.files.readFileSync(storeFile.path))) + "\n        window['store'] = store // To easily reference from JS components without importing\n        Vue.mixin({\n          data() {\n            return {\n              store: store\n            }\n          }\n        })\n      ";
        // Register all globally for Vue2
        if (!vue3)
            ret += lines(function (x, i) { return "Vue.component(" + JSON.stringify(x.componentKey) + ", vue" + i + ")"; });
        // Set up routes
        ret += "\n      " + lines(function (x, i) { return x.autoRoute ? "vue" + i + ".route = vue" + i + ".route || " + JSON.stringify(x.autoRoute) : ""; }) + "\n      const routes = vues.map((x,i) => ({ path: x.route, component: x })).filter(x => x.path)\n      const router = new VueRouter({\n        routes,\n        base: '" + (this.options.basePath || "/") + "',\n        mode: '" + (((_a = this.options.router) === null || _a === void 0 ? void 0 : _a.mode) || 'history') + "'\n      })\n\n      // Call Vue\n      const vueApp = " + (vue3 ? 'Vue.createApp' : 'new Vue') + "({ \n        el: '#app', \n        router, \n        data: { \n          App: {\n            identity: {\n              showLogin() { alert(\"TODO\") },\n              logout() { alert(\"TODO\") },\n            }\n          }, \n          siteBrand: " + JSON.stringify(this.options.siteBrand) + ",\n          navMenuItems: vues.filter(v => v.menuText).map(v => ({ url: v.route, text: v.menuText })),\n          deviceState: { user: null },\n        },\n        created() {\n        }\n      })\n    ";
        // Register all globally for Vue3
        if (vue3)
            ret += lines(function (x, i) { return "app.component(" + JSON.stringify(x.componentKey) + ", vue" + i + ")"; });
        return ret;
    };
    return ZipFrontend;
}());

exports.Bundler = Bundler;
exports.ZipFrontend = ZipFrontend;
exports.ZipRunner = ZipRunner;
exports.default = ZipRunner;
exports.getPackageRoot = getPackageRoot;
exports.quickRpc = quickRpc;
