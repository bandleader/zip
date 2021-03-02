import * as _Bundler from './bundler';
export declare const Bundler: typeof _Bundler;
declare type Dict<T> = Record<string, T>;
declare type ZipSite = {
    siteName: string;
    siteBrand?: string;
    files: Dict<ZipFile>;
    basePath?: string;
    router?: {
        mode?: string;
    };
};
declare type ZipFile = {
    data: string;
};
export default class ZipRunner {
    site: ZipSite;
    backend: any;
    constructor(site: ZipSite);
    getFile(path: string): string;
    getFrontendIndex(): string;
    startBackend(): void;
    handleRequest(path: string, req: any, resp: any): Promise<any>;
    getFrontendScript(): string;
}
export declare function quickRpc(backend: Record<string, Function>, endpointUrl?: string): {
    script: string;
    handler: (req: any, res: any) => Promise<void>;
    setup: (expressApp: {
        post: Function;
    }) => any;
};
export {};
