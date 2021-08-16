import * as _Bundler from './bundler';
export declare const Bundler: typeof _Bundler;
import * as Express from 'express';
import * as _ViteEtc from './vite-etc';
export declare const ViteEtc: typeof _ViteEtc;
export declare function getPackageRoot(): string;
declare type ZipSite = {
    siteName?: string;
    siteBrand?: string;
    basePath?: string;
    router?: {
        mode?: "history" | "hash";
    };
    backend?: Record<string, Function>;
};
declare function localFilesystem(root: string): {
    getFiles: (dirPrefix?: string) => {
        path: string;
        localPath?: string;
    }[];
    readFileSync: (path: string) => string;
};
declare type LocalFS = ReturnType<typeof localFilesystem>;
export declare class ZipRunner {
    site: ZipSite;
    backendRpc: ReturnType<typeof quickRpc>;
    auth: {
        api: {
            useEmail(email: string): Promise<{
                type: string;
            }>;
            loginWithEmailAndPassword(email: string, password: string): Promise<{
                error: string;
                token?: undefined;
            } | {
                token: string;
                error?: undefined;
            }>;
            loginWithCode(code: string): Promise<{
                token: string;
            }>;
            me(token: string): Promise<{}>;
            logout(token: string): boolean;
        };
        verifyToken: (token: string) => string;
    };
    authRpc: {
        script: string;
        handler: (req: any, res: any) => Promise<void>;
        setup: (expressApp: {
            post: Function;
        }) => any;
    };
    files: LocalFS;
    constructor(site?: ZipSite);
    serve(opts?: {
        app?: Express.Application;
        preBind?: (app: Express.Application) => void;
        port?: number;
        listen?: boolean;
    }): Express.Application;
    getFile(path: string): string;
    static mode: "ZIPBUNDLER" | "VITE" | "ROLLUP";
    getFrontendIndex(): string;
    startBackend(): void;
    get handler(): (req: any, resp: any) => void;
    handleRequest(path: string, req: any, resp: any): Promise<void>;
    getFrontendScript(): Promise<string>;
}
export declare function quickRpc(backend: Record<string, Function>, endpointUrl?: string): {
    script: string;
    handler: (req: any, res: any) => Promise<void>;
    setup: (expressApp: {
        post: Function;
    }) => any;
};
export default ZipRunner;
declare type ZipFrontendOptions = {
    basePath?: string;
    router?: {
        mode?: "history" | "hash";
    };
    siteBrand: string;
};
export declare class ZipFrontend {
    files: LocalFS;
    options: ZipFrontendOptions;
    constructor(files: LocalFS, options: ZipFrontendOptions);
    _vueFiles(): {
        autoRoute: string;
        componentKey: string;
        path: string;
        localPath?: string;
    }[];
    _vueModules(): string[];
    script(vue3?: boolean): string;
}
