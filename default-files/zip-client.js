const Zip = {
}

Zip.Utils = {
    asyncLoader(factory, _default) {
        var fired = false
        const ret = function() { 
        if (!fired) fire()
        return ret.value
        }        
        Vue.util.defineReactive(ret, 'value', _default || null)
        Vue.util.defineReactive(ret, 'error', null)
        Vue.util.defineReactive(ret, 'loading', false)
        Vue.util.defineReactive(ret, 'ready', false)
        const fire = () => {
        fired = true
        ret.loading = true
        const result = (typeof factory === 'function') ? factory() : factory
        const resultPromise = result.then ? result : Promise.resolve(result)
        resultPromise.then(result => {
            ret.value = result
            ret.loading = false
            ret.ready = true
        }, err => {
            ret.error = err
            ret.loading = false
        })
        }
        fire()
        return ret
    }
}

Zip.Backend = {
    _call(method, ...args) {
        const result = fetch("/api/" + method + "?args=" + encodeURIComponent(JSON.stringify(args)), {
          method: "POST"
        })
        const jsonResult = result.then(x => x.json())
        return jsonResult.then(json => {
          if (json.err) throw "Server returned error: " + json.err
          return json.result
        })
    }
}
