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
export {};
