import { resolveOptions } from './core/config'
import { setLogger, log } from './core/logger'
import { EventBus } from './core/event-bus'
import { startSecurity, type SecurityHandle } from './modules/security'
import type { MajiSDKOptions } from './types'

export const VERSION = '0.1.0'

let initialized = false
let securityHandle: SecurityHandle | null = null
const bus = new EventBus()

export function init(options: MajiSDKOptions = {}): void {
  if (initialized) {
    log.warn('already initialized, ignored')
    return
  }
  initialized = true
  const opts = resolveOptions(options)
  setLogger(opts.debug)
  log.info('init', { gameId: opts.gameId, version: VERSION })
  securityHandle = startSecurity(opts.security)
  bus.emit('ready')
}

export function destroy(): void {
  securityHandle?.stop()
  securityHandle = null
  initialized = false
  bus.emit('destroy')
  bus.clear()
}

export function isReady(): boolean {
  return initialized
}

export function isDetected(): boolean {
  return securityHandle?.isDetected() ?? false
}

export const on = (event: string, fn: (...args: unknown[]) => void): (() => void) =>
  bus.on(event, fn)
export const off = (event: string, fn: (...args: unknown[]) => void): void => bus.off(event, fn)

export type { MajiSDKOptions } from './types'

export default {
  VERSION,
  init,
  destroy,
  isReady,
  isDetected,
  on,
  off,
}
