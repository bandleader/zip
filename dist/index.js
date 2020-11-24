'use strict';

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

var Bundler = /** @class */ (function () {
    function Bundler() {
    }
    Bundler.convJsModuleToFunction = function (jsCode, execute) {
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
        if (execute === void 0) { execute = true; }
        jsCode = jsCode.replace("export default", "_defaultExport = ");
        jsCode = jsCode.split("\n").map(function (x) { return "  " + x; }).join("\n"); // Indent nicely
        jsCode = "(function() {\n  let _defaultExport = undefined\n\n" + jsCode + "\n\n\n  return _defaultExport\n})" + (execute ? "()\n" : "\n");
        return jsCode;
    };
    Bundler.getLoaderCode = function (modules) {
        var moduleCode = Object.keys(modules).map(function (k) { return "'" + k + "': " + Bundler.convJsModuleToFunction(modules[k], false); }).join(", ");
        return "\n            const __makeLoader = " + String(Bundler.getLoader) + "\n            const require = __makeLoader({" + moduleCode + "})\n        ";
    };
    Bundler.getLoader = function (modules) {
        var loadedModules = {};
        // TODO: keep a stack to detect infinite recursion
        // TODO: trap errors during module init and say so
        return function (moduleName) {
            if (!modules[moduleName])
                throw "Module '" + moduleName + "' not found";
            if (!loadedModules[moduleName])
                loadedModules[moduleName] = modules[moduleName]();
            return loadedModules[moduleName];
        };
    };
    Bundler.convVueModuleToInitGlobalCode = function (componentKey, jsModuleCode) {
        return "\n            window.vues = window.vues || {}\n            window.vues['" + componentKey + "'] = " + Bundler.convJsModuleToFunction(jsModuleCode) + "\n            Vue.component(\"" + componentKey + "\", window.vues['" + componentKey + "']);\n        ";
    };
    Bundler.vueClassTransformerScript = function () {
        // We also include the __assign function replacement for Object.assign, since Rollup is transpiling {...foo} to that.
        // In the future we should just include a Zip client JS file which should already be transpiled
        return "\n            (function() {\n                var __assign = function() { \n                    __assign = Object.assign || function __assign(t) {\n                        for (var s, i = 1, n = arguments.length; i < n; i++) {\n                            s = arguments[i];\n                            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];\n                        }\n                        return t;\n                    };\n                    return __assign.apply(this, arguments);\n                }\n                return " + vueClassComponent + "\n            })()\n        ";
    };
    Bundler.convVueSfcToJsModule = function (vueSfcCode, classTransformer) {
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
        var scriptIife = Bundler.convJsModuleToFunction(scriptModule);
        if (classTransformer)
            scriptIife = "(" + classTransformer + ")(" + scriptIife + ")";
        var template = getTag("template", vueSfcCode);
        var css = getTag("style", vueSfcCode);
        var btoa = function (str) { return new Buffer(str).toString('base64'); };
        return "\n            let exp = " + scriptIife + ";\n            exp.template = atob(\"" + btoa(template) + "\")\n            const addTag = (where, tagName, attrs) => {           \n                const el = document.createElement(tagName)\n                for (const k of Object.keys(attrs)) el[k] = attrs[k]\n                where.appendChild(el)\n            }\n            const addCss = css => addTag(document.head, \"style\", {type: 'text/css', innerHTML: css})                  \n            let alreadyAddedCss = false\n            // TODO remove too\n            const oldCreated = exp.created\n            exp.created = function () {\n                if (!alreadyAddedCss) addCss(atob(\"" + btoa(css) + "\"))\n                alreadyAddedCss = true\n                if (oldCreated) oldCreated.call(this)\n            }\n            export default exp\n        ";
    };
    return Bundler;
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

//   ________  ___  ________   
var ZipRunner = /** @class */ (function () {
    function ZipRunner(site) {
        this.site = site;
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
        this.backend = eval(Bundler.convJsModuleToFunction(backendModuleText, true));
        if (typeof this.backend === 'function')
            this.backend = this.backend();
        if (Object.keys(this.backend).filter(function (x) { return x !== 'greeting'; }).length) {
            console.log("Loaded backend with methods:", Object.keys(this.backend).join(", "));
        }
    };
    ZipRunner.prototype.handleRequest = function (path, req, resp) {
        var _a;
        // console.log(path)
        if (path === "/favicon.ico") {
            resp.send("404 Not Found");
        }
        else if (path.startsWith("/api/")) {
            var method = path.split("/")[2];
            var sendErr = function (err) { return resp.send({ err: String(err) }); };
            if (!this.backend[method]) {
                sendErr("Backend method '" + method + "' not found");
            }
            else {
                try {
                    var args = JSON.parse(req.query.args || '[""]');
                    var result = (_a = this.backend)[method].apply(_a, args);
                    var resultPromise = result['then'] ? result : Promise.resolve(result);
                    resultPromise.then(function (result) { return resp.send({ result: result }); }, sendErr);
                }
                catch (ex) {
                    sendErr(ex);
                }
            }
        }
        else {
            resp.send(this.getFrontendIndex());
        }
    };
    ZipRunner.prototype.getFrontendScript = function () {
        var _this = this;
        var scripts = [];
        // Create RPC for backend methods
        var methods = Object.keys(this.backend);
        scripts.push("\n      function AsyncLoader(factory, _default) {\n        var fired = false\n        const ret = function() { \n          if (!fired) fire()\n          return ret.value\n        }        \n        Vue.util.defineReactive(ret, 'value', _default || null)\n        Vue.util.defineReactive(ret, 'error', null)\n        Vue.util.defineReactive(ret, 'loading', false)\n        Vue.util.defineReactive(ret, 'ready', false)\n        const fire = () => {\n          fired = true\n          ret.loading = true\n          const result = (typeof factory === 'function') ? factory() : factory\n          const resultPromise = result.then ? result : Promise.resolve(result)\n          resultPromise.then(result => {\n            ret.value = result\n            ret.loading = false\n            ret.ready = true\n          }, err => {\n            ret.error = err\n            ret.loading = false\n          })\n        }\n        fire()\n        return ret\n      }\n\n      /*function AsyncLoader(factory, _default) {\n        const ret = AsyncLoaderLazy(factory, _default)\n        ret()\n        return ret\n      }*/\n\n      function _callZipBackend(method, ...args) {\n        const result = fetch(\"/api/\" + method + \"?args=\" + encodeURIComponent(JSON.stringify(args)), {\n          method: \"POST\"\n        })\n        const jsonResult = result.then(x => x.json())\n        return jsonResult.then(json => {\n          if (json.err) throw \"Server returned error: \" + json.err\n          return json.result\n        })\n      }\n\n      const Backend = {}\n    ");
        for (var _i = 0, _a = Object.keys(this.backend); _i < _a.length; _i++) {
            var key = _a[_i];
            scripts.push("Backend['" + key + "'] = (...args) => _callZipBackend('" + key + "', ...args)");
            scripts.push("Backend['" + key + "'].loader = (_default, ...args) => AsyncLoader(() => _callZipBackend('" + key + "', ...args), _default)");
        }
        // Add all Vue components
        var getFileName = function (path) { return path.split("/")[path.split("/").length - 1]; };
        var minusExt = function (fileName) { return fileName.substr(0, fileName.lastIndexOf(".")); };
        var vues = Object.keys(this.site.files).filter(function (x) { return x.endsWith(".vue"); }).map(function (localPath) { return ({
            path: localPath,
            componentKey: minusExt(getFileName(localPath)).replace(/[^a-zA-Z0-9א-ת]+/g, "-"),
            contents: _this.site.files[localPath].data
        }); });
        scripts.push.apply(scripts, vues.map(function (v) { return Bundler.convVueModuleToInitGlobalCode(v.componentKey, Bundler.convVueSfcToJsModule(v.contents, Bundler.vueClassTransformerScript())); }));
        // Set up frontend routes
        var vuesPages = vues.filter(function (x) { return x.path.startsWith("pages/"); });
        scripts.push("\n      const routes = [\n        { path: '/', component: window.vues['Home'] || window.vues['home'] },\n        " + vuesPages.map(function (v) { return "{ path: '/" + v.componentKey.replace(/__/g, ":") + "', component: window.vues['" + v.componentKey + "'] }"; }).join(", ") + "\n      ]\n      // Add special routes for components that declare one\n      Object.values(window.vues).forEach(comp => {\n        if (comp.route) { \n          routes.push({ path: comp.route, component: comp })\n        }\n      })\n      const router = new VueRouter({\n        routes,\n        base: '" + (this.site.basePath || "/") + "',\n        mode: '" + (this.site.router.mode || 'history') + "'\n      })");
        // Call Vue
        scripts.push("\n      vueApp = new Vue({ \n        el: '#app', \n        router, \n        data: { \n          App: {\n            identity: {\n              showLogin() { alert(\"TODO\") },\n              logout() { alert(\"TODO\") },\n            }\n          }, \n          siteName: `" + this.site.siteName + "`,\n          deviceState: { user: null },\n          navMenuItems: " + JSON.stringify(vuesPages.filter(function (x) { return x.path.substr(9, 1) === x.path.substr(9, 1).toUpperCase(); }).map(function (x) { return ({ url: '/' + x.componentKey, text: x.path.substr(9, x.path.length - 9 - 4) }); })) + ",\n        },\n        created() {\n        }\n      })");
        return scripts.join("\n");
    };
    return ZipRunner;
}());

module.exports = ZipRunner;
