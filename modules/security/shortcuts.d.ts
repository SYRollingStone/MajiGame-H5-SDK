import type { ResolvedShortcutsOptions } from '../../types';
export declare class ShortcutsBlocker {
    private opts;
    private unbinds;
    private active;
    constructor(opts: ResolvedShortcutsOptions & {
        enabled: boolean;
    });
    start(): void;
    stop(): void;
}
