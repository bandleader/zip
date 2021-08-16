export declare class VueSfcs {
    static vueClassTransformerScript(): string;
    static convVueSfcToESModule(vueSfcCode: string, opts?: {
        classTransformer?: string;
        customMutationCode?: string;
        registerGlobally?: boolean | string;
    }): string;
}
export declare function vueClassComponent(opts: Record<string, any>, cl: any): any;
export declare type InputModule = {
    codeString: string;
    key?: string;
    main?: boolean;
};
export declare class SimpleBundler {
    modulesToBundle: InputModule[];
    resolver: (path: string, fromPath: string) => string[];
    loader: (idOrNormalizedPath: string) => void | {
        code: string;
    };
    resolveAndAddModule(pathString: string, opts?: {
        fromModuleAtPath?: string;
        main?: boolean;
    }): InputModule;
    static _createModuleLoader: (factories: {
        factory: Function;
        key: string;
    }[]) => {
        requireByKey: (key: string, useDefaultExportIfNoNamedExports?: boolean) => any;
    };
    bundle(): string;
    static moduleCodeToFactoryFunc_simple(jsCode: string, importCallback?: (path: string) => {
        key: string;
    } | void): void;
    static moduleCodeToFactoryFunc(jsCode: string, importCallback?: (path: string) => {
        key: string;
    } | void): string;
    static moduleCodeToIife(jsCode: string, useDefaultExportIfNoNamedExports?: boolean, blockRequire?: boolean): string;
}
export declare function evalEx(exprCode: string, customScope?: {}): any;
