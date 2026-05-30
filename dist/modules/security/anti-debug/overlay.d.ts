export interface OverlayOptions {
    tipText: string;
    tipTitle: string;
    zIndex: number;
}
export declare class Overlay {
    private opts;
    private el;
    private pending;
    constructor(opts: OverlayOptions);
    show(): void;
    hide(): void;
}
