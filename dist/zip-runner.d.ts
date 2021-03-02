import * as _Bundler from './bundler';
export declare const Bundler: typeof _Bundler;
declare type Dict<T> = Record<string, T>;
declare type ZipSite = {
    siteName: string;
    siteBrand?: string;
    files: Dict<ZipFile>;
    basePath?: string;
    router?: {
        mode?: "history" | "hash";
    };
};
declare type ZipFile = {
    data: string;
};
export default class ZipRunner {
    site: ZipSite;
    backend: any;
    backendRpc: ReturnType<typeof quickRpc>;
    constructor(site: ZipSite);
    getFile(path: string): string;
    getFrontendIndex(): string;
    startBackend(): void;
    handleRequest(path: string, req: any, resp: any): void;
    getFrontendScript(): string;
}
export declare function quickRpc(backend: Record<string, Function>, endpointUrl?: string): {
    script: string;
    handler: (req: any, res: any) => Promise<void>;
    setup: (expressApp: {
        post: Function;
    }) => any;
};
declare type ZipFrontendOptions = {
    basePath?: string;
    router?: {
        mode?: "history" | "hash";
    };
    siteName: string;
};
export declare class ZipFrontend {
    files: {
        path: string;
        contents: string;
    }[];
    options: ZipFrontendOptions;
    static fromMemory(files: {
        path: string;
        contents: string;
    }[], options: ZipFrontendOptions): ZipFrontend;
    _vueFiles(): {
        autoRoute: string;
        componentKey: string;
        path: string;
        contents: string;
    }[];
    _vueModules(): string[];
    script(): string;
}
export {};
