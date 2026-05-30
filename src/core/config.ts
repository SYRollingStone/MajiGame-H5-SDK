import type {
  MajiSDKOptions,
  ResolvedOptions,
  AntiDebugOptions,
  ShortcutsOptions,
  DomainLockOptions,
} from '../types'

const DEFAULT_ANTI_DEBUG: Required<AntiDebugOptions> = {
  enabled: true,
  detectors: ['debugger', 'timing', 'console', 'size', 'toString'],
  interval: 1500,
  onDetect: 'freeze+tip',
  tipText: '检测到您打开了开发者工具，请关闭后继续游戏',
  tipTitle: '安全提示',
  redirectUrl: '',
  reportUrl: '',
  autoRecover: true,
  zIndex: 2147483647,
}

const DEFAULT_SHORTCUTS: Required<ShortcutsOptions> = {
  enabled: true,
  blockContextMenu: true,
  blockSelection: false,
  blockKeys: true,
  allowSelector: 'input, textarea, [contenteditable="true"]',
}

const DEFAULT_DOMAIN_LOCK: Required<DomainLockOptions> = {
  enabled: false,
  allowedHosts: [],
  checkReferrer: false,
  allowedReferrers: [],
  onViolation: 'redirect',
  redirectUrl: '',
  reportUrl: '',
}

function normalize<T extends { enabled: boolean }>(
  input: Partial<T> | boolean | undefined,
  defaults: T,
): T {
  if (input === false) return { ...defaults, enabled: false }
  if (input === true || input === undefined) return { ...defaults }
  return { ...defaults, ...input }
}

export function resolveOptions(input: MajiSDKOptions = {}): ResolvedOptions {
  const security = input.security ?? {}
  return {
    gameId: input.gameId ?? 'unknown',
    debug: input.debug ?? false,
    security: {
      antiDebug: normalize(security.antiDebug, DEFAULT_ANTI_DEBUG),
      shortcuts: normalize(security.shortcuts, DEFAULT_SHORTCUTS),
      domainLock: normalize(security.domainLock, DEFAULT_DOMAIN_LOCK),
    },
  }
}
