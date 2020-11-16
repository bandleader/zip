'use strict';

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
    Bundler.convVueSfcToJsModule = function (vueSfcCode) {
        var getTag = function (tag, text) {
            var start = text.indexOf('>', text.indexOf("<" + tag)) + 1;
            var end = text.lastIndexOf("</" + tag + ">");
            if (start === -1)
                return "";
            if (end === -1)
                return "";
            return text.substring(start, end);
        };
        var script = getTag("script", vueSfcCode) || "export default {}";
        var script2 = Bundler.convJsModuleToFunction(script);
        var template = getTag("template", vueSfcCode);
        var css = getTag("style", vueSfcCode);
        var btoa = function (str) { return new Buffer(str).toString('base64'); };
        return "\n            const exp = " + script2 + ";\n            exp.template = atob(\"" + btoa(template) + "\")\n            const addTag = (where, tagName, attrs) => {           \n                const el = document.createElement(tagName)\n                for (const k of Object.keys(attrs)) el[k] = attrs[k]\n                where.appendChild(el)\n            }\n            const addCss = css => addTag(document.head, \"style\", {type: 'text/css', innerHTML: css})                  \n            let alreadyAddedCss = false\n            // TODO remove too\n            const oldCreated = exp.created\n            exp.created = function () {\n                if (!alreadyAddedCss) addCss(atob(\"" + btoa(css) + "\"))\n                alreadyAddedCss = true\n                if (oldCreated) oldCreated.call(this)\n            }\n            export default exp\n        ";
    };
    return Bundler;
}());

//   ________  ___  ________   
var ZipRunner = /** @class */ (function () {
    function ZipRunner(site) {
        this.site = site;
        site.siteBrand = site.siteBrand || site.siteName;
        site.router = site.router || {};
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
    ZipRunner.prototype.handleRequest = function (path, req, resp) {
        console.log(path);
        if (path === "/favicon.ico") {
            resp.send("404 Not Found");
        }
        else {
            resp.send(this.getFrontendIndex());
        }
    };
    ZipRunner.prototype.getFrontendScript = function () {
        var _this = this;
        var scripts = [];
        // TODO Create RPC for backend methods
        // Add all Vue components
        var getFileName = function (path) { return path.split("/")[path.split("/").length - 1]; };
        var minusExt = function (fileName) { return fileName.substr(0, fileName.lastIndexOf(".")); };
        var vues = Object.keys(this.site.files).filter(function (x) { return x.endsWith(".vue"); }).map(function (localPath) { return ({
            path: localPath,
            componentKey: minusExt(getFileName(localPath)).replace(/[^a-zA-Z0-9א-ת]+/g, "-"),
            contents: _this.site.files[localPath].data
        }); });
        var vuesPages = vues.filter(function (x) { return x.path.startsWith("pages/"); });
        scripts.push.apply(scripts, vuesPages.map(function (v) { return Bundler.convVueModuleToInitGlobalCode(v.componentKey, Bundler.convVueSfcToJsModule(v.contents)); }));
        // Set up frontend routes
        scripts.push("\n      const routes = [\n        { path: '/', component: window.vues['Home'] },\n        " + vuesPages.map(function (v) { return "{ path: '/" + v.componentKey + "', component: window.vues['" + v.componentKey + "'] }"; }).join(", ") + "\n      ]\n      const router = new VueRouter({\n        routes,\n        base: '" + (this.site.basePath || "/") + "',\n        mode: '" + (this.site.router.mode || 'history') + "'\n      })");
        // Call Vue
        scripts.push("\n      vueApp = new Vue({ \n        el: '#app', \n        router, \n        data: { \n          App: {\n            identity: {\n              showLogin() { alert(\"TODO\") },\n              logout() { alert(\"TODO\") },\n            }\n          }, \n          siteName: `" + this.site.siteName + "`,\n          deviceState: { user: null },\n          navMenuItems: " + JSON.stringify(vuesPages.filter(function (x) { return x.path.substr(9, 1) === x.path.substr(9, 1).toUpperCase(); }).map(function (x) { return ({ url: '/' + x.componentKey, text: x.path.substr(9, x.path.length - 9 - 4) }); })) + ",\n        },\n        created() {\n        }\n      })");
        return scripts.join("\n");
    };
    return ZipRunner;
}());

module.exports = ZipRunner;
