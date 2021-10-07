import ZipRunner from './zip-runner';
import type * as Vite from 'vite';
export declare function quickRollupProvidePlugin(fn2: Function): {
    name: string;
    resolveId: (...args: any[]) => Promise<any>;
    load: (...args: any[]) => any;
};
export declare function checkAndLoadDeps(): {
    version: any;
    vite: typeof Vite;
    vuePlugin: (opts?: any) => any;
};
export declare function zipFsProvider(zr: ZipRunner, opts?: {
    includingNonDefault?: boolean;
}): {
    name: string;
    resolveId: (...args: any[]) => Promise<any>;
    load: (...args: any[]) => any;
};
