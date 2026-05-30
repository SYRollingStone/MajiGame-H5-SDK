const TAG = '[MajiSDK]'
let enabled = false

export function setLogger(on: boolean): void {
  enabled = on
}

export const log = {
  info(...args: unknown[]): void {
    if (enabled) console.log(TAG, ...args)
  },
  warn(...args: unknown[]): void {
    if (enabled) console.warn(TAG, ...args)
  },
  error(...args: unknown[]): void {
    if (enabled) console.error(TAG, ...args)
  },
}
