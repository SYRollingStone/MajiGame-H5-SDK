import type { ResolvedDomainLockOptions } from '../../types';
export interface DomainLockResult {
    ok: boolean;
    reason?: string;
}
export declare function checkDomain(opts: ResolvedDomainLockOptions & {
    enabled: boolean;
}): DomainLockResult;
export declare function applyDomainViolation(opts: ResolvedDomainLockOptions & {
    enabled: boolean;
}, reason: string): void;
