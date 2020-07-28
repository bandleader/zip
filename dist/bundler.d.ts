declare type Dict<T> = Record<string, T>;
export default class Bundler {
    static convJsModuleToFunction(jsCode: string, execute?: boolean): string;
    static getLoaderCode(modules: Dict<string>): string;
    static getLoader(modules: Dict<Function>): (moduleName: string) => Function;
    static convVueModuleToInitGlobalCode(componentKey: string, jsModuleCode: string): string;
    static convVueSfcToJsModule(vueSfcCode: string): string;
}
export {};
