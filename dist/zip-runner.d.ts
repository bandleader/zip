declare type Dict<T> = Record<string, T>;
declare type ZipSite = {
    siteName: string;
    siteBrand: string;
    files: Dict<ZipFile>;
};
declare type ZipFile = {
    data: string;
};
export default class ZipRunner {
    site: ZipSite;
    protocolAndDomain: string;
    basePath: string;
    constructor(site: ZipSite, protocolAndDomain: string, basePath?: string);
    getFile(path: string): string;
    getFrontendIndex(): string;
    handleRequest(path: string, req: any, resp: any): void;
    getFrontendScript(): string;
}
export {};
