type GraphQuery = { args?: any[], subQueries?: Record<string, GraphQuery> }
export default class GraphQueryRunner {
  static runField(resolver: any, field: string, args: any[]|undefined) {
    let result = resolver[field]
    if (args && args.length && typeof result !== 'function') throw "Args specified for a graph node that is not a function" // TODO diags
    if (typeof result === 'function') result = result(...(args || []))
    return result
  }  
  static async run(resolver: any, query: GraphQuery, pathForDiag = "/") {
    // console.log(pathForDiag, "running!")
    const keys = Object.keys(query.subQueries || {})
    console.log("Q",query)
    if (!keys.length) throw `${pathForDiag} returned a queryable object but no further subqueries were found`
    const ret: Record<string, any> = {}
    for (const k of keys) {
      const sq = query.subQueries![k] || {} // A null subquery is equivalent to an empty one
      let result: any = null
      try {
        result = await GraphQueryRunner.runField(resolver, k, sq.args)        
      } catch (ex) { 
        if (typeof ex === 'string' && ex.startsWith('Error in graph')) throw ex
        throw `Error in graph query node '${pathForDiag}': ${ex}`
      }
      const isLiteral = (x: any) => x === null || x === undefined || (typeof x !== 'object') || ((x._literal===true) && !Object.keys(sq.subQueries || {}).length)
      const handleSingleResult = (x: any) => isLiteral(x) ? x : GraphQueryRunner.run(x, sq, `${pathForDiag}${k}/`)
      const handleArrayResult = (x: any[]) => Promise.all(x.map(handleSingleResult))
      //(y,i) => GraphQueryRunner.run(sq, y, `${pathForDiag}/${k}[${i}]/`)
      ret[k] = await (Array.isArray(result) ? handleArrayResult(result) : handleSingleResult(result))
    }
    // console.log(pathForDiag, ret)
    return ret
  }
}