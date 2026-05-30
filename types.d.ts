export type DetectAction = 'freeze+tip' | 'freeze' | 'blur' | 'tip' | 'redirect' | 'reload' | 'report' | 'noop';
export type DetectorName = 'debugger' | 'timing' | 'console' | 'size' | 'toString';
export interface AntiDebugOptions {
    enabled?: boolean;
    detectors?: DetectorName[];
    interval?: number;
    onDetect?: DetectAction;
    tipText?: string;
    tipTitle?: string;
    redirectUrl?: string;
    reportUrl?: string;
    autoRecover?: boolean;
    zIndex?: number;
}
export interface ShortcutsOptions {
    enabled?: boolean;
    blockContextMenu?: boolean;
    blockSelection?: boolean;
    blockKeys?: boolean;
    allowSelector?: string;
}
export interface DomainLockOptions {
    enabled?: boolean;
    allowedHosts?: string[];
    checkReferrer?: boolean;
    allowedReferrers?: string[];
    onViolation?: DetectAction;
    redirectUrl?: string;
    reportUrl?: string;
}
export interface SecurityOptions {
    antiDebug?: AntiDebugOptions | boolean;
    shortcuts?: ShortcutsOptions | boolean;
    domainLock?: DomainLockOptions | boolean;
}
export interface MajiSDKOptions {
    gameId?: string;
    debug?: boolean;
    security?: SecurityOptions;
}
export interface ResolvedAntiDebugOptions extends Required<AntiDebugOptions> {
}
export interface ResolvedShortcutsOptions extends Required<ShortcutsOptions> {
}
export interface ResolvedDomainLockOptions extends Required<DomainLockOptions> {
}
export interface ResolvedSecurityOptions {
    antiDebug: ResolvedAntiDebugOptions & {
        enabled: boolean;
    };
    shortcuts: ResolvedShortcutsOptions & {
        enabled: boolean;
    };
    domainLock: ResolvedDomainLockOptions & {
        enabled: boolean;
    };
}
export interface ResolvedOptions {
    gameId: string;
    debug: boolean;
    security: ResolvedSecurityOptions;
}
