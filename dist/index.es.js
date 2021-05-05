import { createHash } from 'crypto';

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
    VueSfcs.convVueModuleToInitGlobalCode = function (componentKey, jsModuleCode) {
        return "\n            window.vues = window.vues || {}\n            window.vues['" + componentKey + "'] = " + SimpleBundler.moduleCodeToIife(jsModuleCode) + "\n            Vue.component(\"" + componentKey + "\", window.vues['" + componentKey + "']);\n        ";
    };
    VueSfcs.vueClassTransformerScript = function () {
        // We also include the __assign function replacement for Object.assign, since Rollup is transpiling {...foo} to that.
        // In the future we should just include a Zip client JS file which should already be transpiled
        return "\n            (function() {\n                var __assign = function() { \n                    __assign = Object.assign || function __assign(t) {\n                        for (var s, i = 1, n = arguments.length; i < n; i++) {\n                            s = arguments[i];\n                            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];\n                        }\n                        return t;\n                    };\n                    return __assign.apply(this, arguments);\n                }\n                return " + vueClassComponent + "\n            })()\n        ";
    };
    VueSfcs.convVueSfcToJsModule = function (vueSfcCode, classTransformer, customMutationCode) {
        if (customMutationCode === void 0) { customMutationCode = ""; }
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
        if (classTransformer)
            scriptIife = "(" + classTransformer + ")(" + scriptIife + ")";
        var template = getTag("template", vueSfcCode);
        var css = getTag("style", vueSfcCode);
        return "\n            let exp = " + scriptIife + ";\n            exp.template = " + JSON.stringify(template) + "\n            const addTag = (where, tagName, attrs) => {           \n                const el = document.createElement(tagName)\n                for (const k of Object.keys(attrs)) el[k] = attrs[k]\n                where.appendChild(el)\n            }\n            const addCss = css => addTag(document.head, \"style\", {type: 'text/css', innerHTML: css})                  \n            let alreadyAddedCss = false\n            // TODO remove too\n            const oldCreated = exp.created\n            exp.created = function () {\n                if (!alreadyAddedCss) addCss(" + JSON.stringify(css) + ")\n                alreadyAddedCss = true\n                if (oldCreated) oldCreated.call(this)\n            }\n            " + customMutationCode + "\n            export default exp\n        ";
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
        var _this = this;
        this.modulesToBundle = [];
        this.pathResolver = function (pathString, fromModule) {
            var ret = undefined;
            var attempt = function (what) { if (!ret)
                ret = what; };
            var normalizePath = function (path) { return path.split("/").reduce(function (a, c) {
                return (c === ".") ? a :
                    (c === ".." && a.length) ? a.slice(0, a.length - 1) :
                        (c === "..") ? (function () { throw "Invalid path: '" + path + "'"; })() : __spreadArrays(a, [c]);
            }, []).join("/"); };
            var attemptPath = function (path) { return attempt(_this.modulesToBundle.find(function (x) { return x.key === normalizePath(path); })); };
            var attemptPathWithExts = function (path) { [path, path + ".js", path + "/index.js"].forEach(attemptPath); };
            if (pathString.startsWith("./") || pathString.startsWith("../")) {
                var getDir = function (path) { return path.split("/").slice(0, path.split("/").length - 1).join("/"); };
                var moduleDir = getDir(fromModule.key || "");
                attemptPathWithExts(moduleDir + "/" + pathString);
            }
            else if (pathString.startsWith("/")) {
                attemptPathWithExts(pathString);
            }
            else {
                throw "Module '" + fromModule.key + "': Unsupported require path scheme '" + pathString + "'";
            }
            return ret;
        };
    }
    SimpleBundler.prototype.bundle = function () {
        var _this = this;
        var modulesToCompile = this.modulesToBundle.slice();
        var compiledModules = [];
        var _loop_1 = function (m) {
            var factoryFuncString = SimpleBundler.moduleCodeToFactoryFunc(m.codeString, function (path) {
                var resolved = _this.pathResolver(path, m);
                if (!resolved)
                    throw "'" + m.key + "': Could not resolve module path '" + path + "'";
                if (!modulesToCompile.includes(resolved))
                    modulesToCompile.push(resolved); // Add the 'require'd module to our list
                return "require('" + resolved.key + "')";
            });
            compiledModules.push(__assign(__assign({}, m), { factoryFuncString: factoryFuncString }));
        };
        // 'Compile' each module to a factory function, i.e. a function that takes args (module, exports, require) and mutates module.exports
        // The callback we pass to moduleCodeToFactoryFunc will also resolve calls to require() using our class instances's `pathResolver` function, and will add any 'require'd modules to our list of modules to add to our bundle.
        for (var _i = 0, modulesToCompile_1 = modulesToCompile; _i < modulesToCompile_1.length; _i++) {
            var m = modulesToCompile_1[_i];
            _loop_1(m);
        }
        // Return loader code
        return "\n      ;(function(){\n        const factories = [\n          " + compiledModules.map(function (m) { return "{\n            key: " + JSON.stringify(m.key) + ",\n            factory: " + m.factoryFuncString + ",\n            main: " + !!m.main + "\n          }"; }).join(",") + "\n        ]\n        const require = " + SimpleBundler._moduleLoader + "(factories)\n        factories.filter(x => x.main).forEach(x => require(x.key)) // Run any 'main' modules\n        return require\n      })()\n    ";
    };
    SimpleBundler.moduleCodeToFactoryFunc = function (jsCode, importCallback) {
        // Optionally resolve calls to `require()`
        if (importCallback)
            jsCode = jsCode.replace(/require\([\'\"](.+?)[\'\"]\)/g, function (_, path) { return importCallback(path); });
        // Convert ES6 export syntax. For now we only support `export default <expr>`
        jsCode = jsCode.replace("export default", "module.exports.default = ");
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
        jsCode = "function(module, exports, require) {\n" + jsCode + "\n}";
        return jsCode;
    };
    SimpleBundler.moduleCodeToIife = function (jsCode, useDefaultExportIfAny, allowRequire) {
        if (useDefaultExportIfAny === void 0) { useDefaultExportIfAny = true; }
        if (allowRequire === void 0) { allowRequire = false; }
        var require = allowRequire ? "require" : "function() { throw \"Error: require() cannot be called when using 'moduleCodeToIife'\" }";
        return "(function() {\n      const tempModule = { exports: {} }\n      const tempFactory = " + SimpleBundler.moduleCodeToFactoryFunc(jsCode) + "\n      tempFactory(tempModule, tempModule.exports, " + require + ")\n      return " + (useDefaultExportIfAny ? 'tempModule.exports.default || ' : '') + "tempModule.exports\n    })()";
    };
    SimpleBundler._moduleLoader = function moduleLoader(factories) {
        var modules = {};
        factories.forEach(function (f) { modules[f.key] = { key: f.key, factory: f.factory, exports: {}, loading: false, loaded: false }; });
        var require = function (key) {
            if (!modules[key])
                throw "Module not found in bundle: " + key;
            var m = modules[key];
            if (m.loading)
                throw "Circular dependency found when loading module: " + key;
            if (!m.loaded) {
                m.loading = true;
                try {
                    m.factory(m, m.exports, require);
                    m.loading = false;
                    m.loaded = true;
                }
                catch (ex) {
                    m.loading = false;
                    throw new Error("Error while running module '" + key + "': " + ex);
                }
            }
            return m.exports;
        };
        return require;
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
        hashPassword: function (raw) { return createHash('sha256').update(raw).digest('hex'); },
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
var ZipRunner = /** @class */ (function () {
    function ZipRunner(site) {
        this.site = site;
        this.auth = Loginner();
        this.authRpc = quickRpc(this.auth.api, "/api/auth");
        site.siteBrand = site.siteBrand || site.siteName;
        site.router = site.router || {};
        this.startBackend();
    }
    ZipRunner.prototype.getFile = function (path) {
        if (!this.site.files[path])
            throw "File '" + path + "' not found in zip";
        return this.site.files[path].data;
    };
    ZipRunner.prototype.getFrontendIndex = function () {
        var scriptsToInclude = this.getFrontendScript();
        var contents = this.getFile("index.html");
        contents = contents.replace(/\{\{siteName\}\}/g, this.site.siteName);
        contents = contents.replace(/\{\{siteBrand\}\}/g, this.site.siteBrand || this.site.siteName);
        // Inject script
        contents = contents.replace(/<\/body>/g, "<script>" + scriptsToInclude + "</script></body>");
        return contents;
    };
    ZipRunner.prototype.startBackend = function () {
        // TODO use clearableScheduler
        var backendModuleText = this.getFile("backend.js");
        this.backend = Bundler.evalEx(Bundler.SimpleBundler.moduleCodeToIife(backendModuleText, undefined, true), { require: require });
        if (typeof this.backend === 'function')
            this.backend = this.backend();
        if (Object.keys(this.backend).filter(function (x) { return x !== 'greeting'; }).length) {
            console.log("Loaded backend with methods:", Object.keys(this.backend).join(", "));
        }
        // Allow graph queries
        var graphResolver = this.backend.graph;
        if (graphResolver)
            this.backend.graph = function (queryObj) { return GraphQueryRunner.resolve(graphResolver, queryObj); };
        this.backendRpc = quickRpc(this.backend, "/api/qrpc");
    };
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
    ZipRunner.prototype.getFrontendScript = function () {
        var scripts = [];
        scripts.push(this.getFile("zip-client.js"));
        scripts.push("Zip.Backend = " + this.backendRpc.script); // RPC for backend methods
        scripts.push("Zip.ZipAuth = " + this.authRpc.script); // RPC for auth methods
        var vueFiles = this.site.files; // passing extra files won't hurt
        scripts.push(ZipFrontend.fromMemory(vueFiles, __assign(__assign({}, this.site), { siteBrand: this.site.siteBrand /* we assigned it in the constructor */ })).script());
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
    function ZipFrontend() {
        this.files = {};
    }
    ZipFrontend.fromMemory = function (files, options) {
        var ret = new ZipFrontend();
        ret.files = files;
        ret.options = options;
        return ret;
    };
    ZipFrontend._filesFromDir = function (localPath, fs) {
        var ret = {};
        for (var _i = 0, _a = fs.readdirSync(localPath); _i < _a.length; _i++) {
            var file = _a[_i];
            var path = localPath + "/" + file;
            if (fs.statSync(path).isDirectory()) {
                var loadDir = ZipFrontend._filesFromDir(path, fs);
                for (var key in loadDir)
                    ret[file + "/" + key] = loadDir[key];
            }
            else {
                ret[file.replace(/--/g, "/")] = { data: fs.readFileSync(path).toString() };
            }
        }
        return ret;
    };
    ZipFrontend.fromFilesystem = function (path, fs, options) {
        var files = ZipFrontend._filesFromDir(path, fs);
        return ZipFrontend.fromMemory(files, options);
    };
    ZipFrontend.prototype._allFiles = function () {
        var _this = this;
        // Return as an array instead of an object
        return Object.keys(this.files).map(function (path) { return (__assign(__assign({}, _this.files[path]), { path: path })); });
    };
    ZipFrontend.prototype._vueFiles = function () {
        var getFileName = function (path) { return path.split("/")[path.split("/").length - 1]; };
        var minusExt = function (fileName) { return fileName.substr(0, fileName.lastIndexOf(".")); };
        return this._allFiles().filter(function (f) { return f.path.endsWith(".vue"); }).map(function (f) {
            var autoRoute = f.path === "pages/Home.vue" ? "/"
                : f.path.startsWith('pages/') ? ('/' + minusExt(f.path.substr(6)).replace(/__/g, ':'))
                    : null;
            var componentKey = minusExt(getFileName(f.path)).replace(/[^a-zA-Z0-9א-ת]+/g, "-");
            return __assign(__assign({}, f), { autoRoute: autoRoute, componentKey: componentKey });
        });
    };
    ZipFrontend.prototype._vueModules = function () {
        return this._vueFiles().map(function (vueFile) {
            // Provide a default component name
            var mutationCode = "exp.name = exp.name || " + JSON.stringify(vueFile.componentKey) + "\n";
            // Provide a default 'route' options key (feel free to override)
            if (vueFile.autoRoute)
                mutationCode += "exp.route = exp.route || " + JSON.stringify(vueFile.autoRoute) + "\n";
            return Bundler.VueSfcs.convVueSfcToJsModule(vueFile.data, Bundler.VueSfcs.vueClassTransformerScript(), mutationCode);
        });
    };
    ZipFrontend.prototype.script = function () {
        var _a;
        var out = [];
        var vueModules = this._vueModules();
        out.push("const vues = [" + vueModules.map(function (vm) { return Bundler.SimpleBundler.moduleCodeToIife(vm); }).join(", ") + "]");
        // Register the components globally
        out.push("const registerGlobally = x => Vue.component(x.name, x)");
        out.push("vues.forEach(registerGlobally)");
        // Set up routes and call VueRouter
        out.push("\nconst routes = vues.map((v, i) => ({ path: v.route, component: vues[i] })).filter(x => x.path)\nconst router = new VueRouter({\n  routes,\n  base: '" + (this.options.basePath || "/") + "',\n  mode: '" + (((_a = this.options.router) === null || _a === void 0 ? void 0 : _a.mode) || 'history') + "'\n})");
        // Call Vue
        out.push("\nconst vueApp = new Vue({ \n  el: '#app', \n  router, \n  data: { \n    App: {\n      identity: {\n        showLogin() { alert(\"TODO\") },\n        logout() { alert(\"TODO\") },\n      }\n    }, \n    siteBrand: " + JSON.stringify(this.options.siteBrand) + ",\n    navMenuItems: vues.filter(v => v.menuText).map(v => ({ url: v.route, text: v.menuText })),\n    deviceState: { user: null },\n  },\n  created() {\n  }\n})");
        // return ";(function(){\n" + out.join("\n") + "\n})()"
        return out.join("\n");
    };
    return ZipFrontend;
}());

export default ZipRunner;
export { Bundler, ZipFrontend, quickRpc };
