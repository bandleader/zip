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
    static moduleCodeToFactoryFunc2(jsCode: string): string;
    static convertES6ExportSyntax(jsCode: string): string;
    static moduleCodeToIife(jsCode: string, useDefaultExportIfNoNamedExports?: boolean): string;
    static processRequires(jsCode: string, importCallback: (path: string, es6Namespace: boolean) => string): string;
}
export declare function evalEx(exprCode: string, customScope?: {}): any;
