declare type GraphQuery = true | {
    _args?: any[];
    [index: string]: GraphQuery | any[];
};
export default class GraphQueryRunner {
    static resolve_inner(on: any | Function | Promise<any>, args?: any[] | undefined, pathForDiag?: string): Promise<any>;
    static followField(obj: object, field: string, pathForDiag?: string): Function | Promise<any>;
    static resolve(on: any | Function | Promise<any>, queryOrTrue: GraphQuery, pathForDiag?: string): Promise<any>;
}
export {};
