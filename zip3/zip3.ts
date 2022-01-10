import * as RPC from './rpc'
import * as Identity from './identity'
import * as Analytics from './analytics'

export class BackendServices {
    handler() {
        const identity = Identity.Identity()
        const analytics = Analytics.Analytics()

        const handler = async (req: any, res: any) => {
            const section = req.path.split("/")[2]
            if (section === 'analytics') return analytics.rpc.handler(req, res)
            if (section === 'identity') return identity.apiHandler(req, res)
            if (req.query.expose || req.query.callback) return await RPC.handlerForJsObj(`
                window.Analytics = ${analytics.script}
                window.Identity = ${identity.script}                
            `)(req, res)
            throw "Invalid URL: " + req.path
        }
        return handler
    }
}
