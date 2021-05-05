export declare function Loginner<T extends {
    email: string;
    id?: string;
    passwordHash?: string;
}, TMe = {}>(_opts?: {
    sendCode?: (email: string, code: string) => Promise<void>;
    newAcct?: (email: string) => T | Promise<T>;
    me?: (acct: T) => Promise<TMe>;
    hashPassword?: (raw: string) => string | Promise<string>;
}): {
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
        me(token: string): Promise<TMe>;
        logout(token: string): boolean;
    };
    verifyToken: (token: string) => string;
};
