declare type GraphQuery = {
    args?: any[];
    subQueries?: Record<string, GraphQuery>;
};
export default class GraphQueryRunner {
    static runField(resolver: any, field: string, args: any[] | undefined): any;
    static run(resolver: any, query: GraphQuery, pathForDiag?: string): Promise<Record<string, any>>;
}
export {};
