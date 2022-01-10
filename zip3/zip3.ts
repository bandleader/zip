import * as RPC from './rpc'
import * as Identity from './identity'
import * as Analytics from './analytics'

export class BackendServices {
    handler() {
        const identity = Identity.identity()
        const analytics = Analytics.Analytics()
        
        const storage: Record<string, string> = {}
        const storageRpc = RPC.QRPC({
            getItem(key: string) { return storage[key] },
            setItem(key: string, value: string) { storage[key] = value; return true }
        }, "/api/storage")

        const handler = async (req: any, res: any) => {
            if (req.params?.section === 'storage') return storageRpc.handler(req, res)
            if (req.params?.section === 'analytics') return analytics.rpc.handler(req, res)
            if (req.params?.section === 'identity') return identity.apiHandler.handler(req, res)
            if (req.query.expose || req.query.callback) return await RPC.handlerForJsObj(`
                window.API = ${storageRpc.script}
                window.Analytics = ${analytics.script}
                window.Identity = ${identity.script}                
            `)(req, res)
            throw "Invalid URL: " + req.path
        }
        return handler
    }
}
