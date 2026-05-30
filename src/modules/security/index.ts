import type { ResolvedSecurityOptions } from '../../types'
import { ShortcutsBlocker } from './shortcuts'
import { AntiDebugManager } from './anti-debug'
import { checkDomain, applyDomainViolation } from './domain-lock'
import { log } from '../../core/logger'

export interface SecurityHandle {
  stop(): void
  isDetected(): boolean
}

export function startSecurity(opts: ResolvedSecurityOptions): SecurityHandle {
  const domainResult = checkDomain(opts.domainLock)
  if (!domainResult.ok) {
    applyDomainViolation(opts.domainLock, domainResult.reason || 'unknown')
    return {
      stop() {},
      isDetected() {
        return true
      },
    }
  }

  const shortcuts = new ShortcutsBlocker(opts.shortcuts)
  shortcuts.start()

  const antiDebug = new AntiDebugManager(opts.antiDebug, {
    onDetect: (name) => log.warn('anti-debug detected by', name),
    onRecover: () => log.info('anti-debug recovered'),
  })
  antiDebug.start()

  return {
    stop() {
      shortcuts.stop()
      antiDebug.stop()
    },
    isDetected() {
      return antiDebug.isDetected()
    },
  }
}
