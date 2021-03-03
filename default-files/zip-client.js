const Zip = {
    get Graph() { return _zipGraphQuery() }
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

const _zipGraphQuery = function() {
    const queryBuilderNode = (promise, path = "🌳") => {
        const subQueries = {}
        const args = []
        const ret = new Proxy(promise, {
          get(t, p, r) {
            if (p==='then' || p==='catch') return promise[p].bind(promise)
            // if (p==="_self") return { path, promise, subQueries, args }
            // if (p==="_print") return { args, subQueries: Object.keys(subQueries).reduce((a,c) => ((a[c] = subQueries[c]._print), a), {}) }
            if (p==="$raw") {
              const sqKeys = Object.keys(subQueries)
              if (!sqKeys.length && !args.length) return true // We're an empty query
              const baseObj = args.length ? { _args: args } : {}
              return sqKeys.reduce((a,c) => ((a[c] = subQueries[c].$raw), a), baseObj)
            }
            if (p==="$with") return fn => (fn(ret), ret)
            if (p==="$items") return (fn = (()=>{}), fld='[]') => ret[fld].$with(fn)
            if (p==="$custom") return (fld, fn = (()=>{})) => ret[fld].$with(fn)
            // It's a subquery
            if (!subQueries[p]) subQueries[p] = queryBuilderNode(promise.then(x => x[p]), path + '.' + p)
            return subQueries[p]
          },
          apply(target, that, newArgs) {
            if (args.length) throw "This query already has arguments"
            args.push(...newArgs)
            return ret
          }
        })
        return ret
    }
  
    // Required for `apply` to work — because Proxy only allows that if the target is also a function
    var funcPromise = prom => {
    const ret = () => null
    ret.then = (...args) => funcPromise(prom.then(...args))
    ret.catch = (...args) => funcPromise(prom.catch(...args))
    return ret
    }
  
    const deferredPromise = () => {
    const ret = {res: null, rej: null, promise: null}
    ret.promise = new Promise((res,rej) => {
        ret.res = res
        ret.rej = rej
    })
    return ret
    }
  
    const dp = deferredPromise()
    const rootQuery = queryBuilderNode(funcPromise(dp.promise))
    setTimeout(() => { // Fire the query on next tick
    if (window.debug) alert("Firing query:\n\n"+JSON.stringify(rootQuery.$raw, undefined, 2)) 
    Zip.Backend.graph(rootQuery.$raw).then(dp.res, dp.rej)
    }, 1)
    return rootQuery
}

Vue.component('async-value', {
  props: ['promise'],
  computed: {
    info() {
      const ret = Vue.observable({
        resolved: false,
        error: null,
        value: null
      })
      let promise = this.promise
      if (typeof promise === 'function') promise = promise()
      if (typeof promise !== 'object' || typeof promise.then !== 'function') throw "<async-value>: prop 'promise' must be a Promise/PromiseLike or a function returning one; got: " + typeof promise
      promise.then(x => {ret.resolved = true; ret.value = x}, err => ret.error = err)
      return ret
    }
  },
  template: `
    <div v-if="info.resolved"><slot v-bind="{value: info.value}" /></div>
    <div v-else-if="info.error" class="text-danger"><i class="fa fa-exclamation-triangle" /> {{info.error}}</div>
    <div v-else class="text-center"><div class="spinner-border text-primary" /></div>
  `
})