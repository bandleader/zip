export declare class VueSfcs {
    static convVueModuleToInitGlobalCode(componentKey: string, jsModuleCode: string): string;
    static vueClassTransformerScript(): string;
    static convVueSfcToJsModule(vueSfcCode: string, classTransformer?: string, customMutationCode?: string): string;
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
    loader: (idOrNormalizedPath: string) => string | void;
    resolveAndAddModule(pathString: string, opts?: {
        fromModuleAtPath?: string;
        main?: boolean;
    }): InputModule;
    static _createModuleLoader: (factories: {
        factory: Function;
        key: string;
    }[]) => {
        requireByKey: (key: string, useDefaultExportIfThereIsOnlyThat?: boolean) => any;
    };
    bundle(): string;
    static moduleCodeToFactoryFunc(jsCode: string, importCallback?: (path: string) => {
        key: string;
    }): string;
    static moduleCodeToIife(jsCode: string, useDefaultExportIfAny?: boolean, allowRequire?: boolean): string;
}
export declare function evalEx(exprCode: string, customScope?: {}): any;
