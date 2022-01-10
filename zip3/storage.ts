import * as RPC from './rpc'

export function Storage(endpoint: string) {
    const storage: Record<string, string> = {}
    const rpc = RPC.QRPC({
        getItem(key: string) { return storage[key] },
        setItem(key: string, value: any) { storage[key] = value; return true }
    }, endpoint)
    const script = `(function() {
        return ${rpc.script}
    })()`
    return { rpc, script }
}