import type { DetectorName } from '../../../types';
export interface Detector {
    name: DetectorName;
    check(): boolean;
    reset?(): void;
}
export declare function createDetector(name: DetectorName): Detector | null;
