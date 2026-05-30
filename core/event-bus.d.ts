type Listener = (...args: unknown[]) => void;
export declare class EventBus {
    private map;
    on(event: string, fn: Listener): () => void;
    off(event: string, fn: Listener): void;
    emit(event: string, ...args: unknown[]): void;
    clear(): void;
}
export {};
