import type { ResolvedAntiDebugOptions } from '../../../types';
export interface AntiDebugCallbacks {
    onDetect?: (detectorName: string) => void;
    onRecover?: () => void;
}
export declare class AntiDebugManager {
    private detectors;
    private pollHandle;
    private trapHandle;
    private overlay;
    private detected;
    private opts;
    private cbs;
    constructor(opts: ResolvedAntiDebugOptions & {
        enabled: boolean;
    }, cbs?: AntiDebugCallbacks);
    start(): void;
    stop(): void;
    isDetected(): boolean;
    private tick;
    private applyAction;
    private recover;
    private startFreeze;
    private stopFreeze;
    private report;
}
