import ZipRunner from './zip-runner';
export declare function quickRollupProvidePlugin(fn2: Function): {
    name: string;
    resolveId: (...args: any[]) => Promise<any>;
    load: (...args: any[]) => any;
};
export declare function checkAndLoadDeps(): {
    version: any;
    vite: any;
    vuePlugin: (opts?: any) => any;
};
export declare function zipFsProvider(zr: ZipRunner, opts?: {
    includingNonDefault?: boolean;
}): {
    name: string;
    resolveId: (...args: any[]) => Promise<any>;
    load: (...args: any[]) => any;
};
