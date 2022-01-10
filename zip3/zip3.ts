import * as RPC from './rpc'
import * as Identity from './identity'
import * as Analytics from './analytics'
import * as Storage from './storage'

export class BackendServices {
    handler() {
        const identity = Identity.Identity()
        const analytics = Analytics.Analytics()
        
        const storage = Storage.Storage("/api/storage")

        const handler = async (req: any, res: any) => {
            if (req.params?.section === 'storage') return storage.rpc.handler(req, res)
            if (req.params?.section === 'analytics') return analytics.rpc.handler(req, res)
            if (req.params?.section === 'identity') return identity.apiHandler.handler(req, res)
            if (req.query.expose || req.query.callback) return await RPC.handlerForJsObj(`
                window.API = ${storage.script}
                window.Analytics = ${analytics.script}
                window.Identity = ${identity.script}                
            `)(req, res)
            throw "Invalid URL: " + req.path
        }
        return handler
    }
}
