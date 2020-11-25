type GraphQuery = true | { _args?: any[], [index: string]: GraphQuery | any[] }
// const a: NewGraphQuery = {
//   _args: [23],
//   fred: true,
//   beet: {
//     args: {
//       _args?: [23],
//       fish: true
//     },
//     feish: true
//   }
// }

export default class GraphQueryRunner {
  static resolve_inner(on: any|Function|Promise<any>, args?: any[]|undefined, pathForDiag = "🌳"): Promise<any> {
    if (args?.length && typeof on !== 'function') throw `${pathForDiag} cannot accept arguments`
    if (typeof on === 'function') on = on(...(args || []))
    if (!on.then) on = Promise.resolve(on)
    return on
  }
  static followField(obj: object, field: string, pathForDiag = "🌳"): Function|Promise<any> {
    // Returns a resolver (i.e. optionally function for optionally promise for a value or object)
    // if (field === "[]") {
    //   if (!Array.isArray(obj)) throw `Can't execute '[]' on non-array: ${pathForDiag}`
    //   return Promise.resolve(obj.map((x,i) => NewGraphQueryRunner.followField(x, field, `${pathForDiag}[${i}]`)))
    // }
    if (typeof obj !== 'object' || obj === null) throw `Can't get field '${field}' on ${pathForDiag} because it is not an object but ` + typeof obj
    // NAH if (Array.isArray(obj)) throw `Can't get field '${field}' on ${pathForDiag} because it is an array` // Should never happen
    const result = (obj as any)[field]
    if (result === undefined) throw `Field '${field}' on ${pathForDiag} does not exist`
    return result
  }
  static resolve(on: any|Function|Promise<any>, queryOrTrue: GraphQuery, pathForDiag = "🌳"): Promise<any> {
    // Same as `resolve_inner`, but allows for optionally subquerying the result.
        const getSqKeys = (obj: object) => Object.keys(obj).filter(x => x !== "_args")
    try {
      let result = GraphQueryRunner.resolve_inner(on, (queryOrTrue as any)._args, pathForDiag)
      // PERHAPS: if it's `true` but the result is complex, disallow. Or at least clean, send known keys, force implementing a toJson() method, etc.
      if (queryOrTrue === true || !getSqKeys(queryOrTrue).length) return result
      // Otherwise, treat `result` as a Promise<object|Array<object>>, run subqueries, and return an object

      const handleObject = async (queryable: Record<string, any>) => {
        if (typeof queryable !== 'object' || queryable === null) throw `${pathForDiag} is a '${typeof queryable}', not an object, and so cannot accept subqueries`
        // NAH if (Array.isArray(queryable)) throw `${pathForDiag} is an array, so can only be subqueried with key '[]'`
        const ret: Record<string, any> = {}
        for (const sqKey of getSqKeys(queryOrTrue)) {
          const sqQueryOrTrue = queryOrTrue[sqKey]
          if (sqKey === "[]") {
            // He wants to run subqueries on array contents
            if (!Array.isArray(queryable)) throw `Can't run '[]' on non-array: ${pathForDiag}`
            ret[sqKey] = await Promise.all(queryable.map((arrayItem, ind) => GraphQueryRunner.resolve(arrayItem, sqQueryOrTrue as any, `${pathForDiag}[${ind}]`)))
          } else {
            const sqValue = GraphQueryRunner.followField(queryable, sqKey, pathForDiag)
            ret[sqKey] = await GraphQueryRunner.resolve(sqValue, sqQueryOrTrue as any, `${pathForDiag}.${sqKey}`)
          }
        }
        return ret
      }

      return result.then(handleObject, ex => Promise.reject(`Error in query node ${pathForDiag}: ${ex}`))
      // queryableOrArray => {
      //   if (Array.isArray(queryableOrArray)) return Promise.all(queryableOrArray.map((x, i) => handleObject(x, `${pathForDiag}[${i}]`)))
      //  return handleObject(queryableOrArray, pathForDiag)
      //})
    } catch (ex) {
      return Promise.reject(`Error in query node ${pathForDiag}: ${ex}`)
    }

  }
}
