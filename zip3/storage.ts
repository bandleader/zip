import * as RPC from './rpc'

export function Storage(endpoint: string, initialValue = {}) {
    const storage: Record<string, any> = initialValue
    const rpc = RPC.QRPC({
        getItem(key: string) { return storage[key] },
        setItem(key: string, value: any) { storage[key] = value; return true }
    }, endpoint)
    const script = `(function() {
        return ${rpc.script}
    })()`
    return { rpc, script }
}