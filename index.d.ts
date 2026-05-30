import type { MajiSDKOptions } from './types';
export declare const VERSION: string;
export declare function init(options?: MajiSDKOptions): void;
export declare function destroy(): void;
export declare function isReady(): boolean;
export declare function isDetected(): boolean;
export declare const on: (event: string, fn: (...args: unknown[]) => void) => (() => void);
export declare const off: (event: string, fn: (...args: unknown[]) => void) => void;
export type { MajiSDKOptions } from './types';
declare const _default: {
    VERSION: string;
    init: typeof init;
    destroy: typeof destroy;
    isReady: typeof isReady;
    isDetected: typeof isDetected;
    on: (event: string, fn: (...args: unknown[]) => void) => (() => void);
    off: (event: string, fn: (...args: unknown[]) => void) => void;
};
export default _default;
