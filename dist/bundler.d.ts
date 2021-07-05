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
    pathResolver: (pathString: string, fromModule: InputModule) => InputModule | undefined;
    static _moduleLoader: (factories: {
        factory: Function;
        key: string;
    }[]) => (key: string, useDefaultExportIfThereIsOnlyThat?: boolean) => any;
    bundle(): string;
    static moduleCodeToFactoryFunc(jsCode: string, importCallback?: (path: string) => string): string;
    static moduleCodeToIife(jsCode: string, useDefaultExportIfAny?: boolean, allowRequire?: boolean): string;
}
export declare function evalEx(exprCode: string, customScope?: {}): any;
