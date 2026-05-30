import type { ResolvedSecurityOptions } from '../../types';
export interface SecurityHandle {
    stop(): void;
    isDetected(): boolean;
}
export declare function startSecurity(opts: ResolvedSecurityOptions): SecurityHandle;
