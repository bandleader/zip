import * as _Bundler from './bundler';
export declare const Bundler: typeof _Bundler;
export declare function getPackageRoot(): string;
declare type Dict<T> = Record<string, T>;
declare type ZipSite = {
    siteName?: string;
    siteBrand?: string;
    app?: any;
    files?: Dict<ZipFile>;
    basePath?: string;
    router?: {
        mode?: "history" | "hash";
    };
    backend?: Record<string, Function>;
};
declare type ZipFile = {
    data: string;
    isDefault: boolean;
};
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
    constructor(site?: ZipSite);
    getFile(path: string): string;
    getFrontendIndex(newMode?: boolean): string;
    startBackend(): void;
    get handler(): (req: any, resp: any) => void;
    handleRequest(path: string, req: any, resp: any): void;
    getFrontendScript(newMode?: boolean): string;
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
    files: Dict<ZipFile>;
    options: ZipFrontendOptions;
    static fromMemory(files: Dict<ZipFile>, options: ZipFrontendOptions): ZipFrontend;
    static _filesFromDir(localPath: string, fs: any, isDefault: boolean): Record<string, ZipFile>;
    static fromFilesystem(path: string, fs: any, options: ZipFrontendOptions, isDefault: boolean): ZipFrontend;
    _allFiles(): {
        path: string;
        data: string;
        isDefault: boolean;
    }[];
    _vueFiles(): {
        autoRoute: string;
        componentKey: string;
        path: string;
        data: string;
        isDefault: boolean;
    }[];
    _vueModules(): string[];
    script(newMode?: boolean): string;
}
