import type { ResolvedDomainLockOptions } from '../../types'
import { log } from '../../core/logger'

function hostMatches(host: string, pattern: string): boolean {
  if (!pattern) return false
  if (pattern === host) return true
  if (pattern.startsWith('*.')) {
    const base = pattern.slice(2)
    return host === base || host.endsWith('.' + base)
  }
  return false
}

function referrerMatches(referrerUrl: string, allowed: string[]): boolean {
  if (!referrerUrl) return false
  try {
    const u = new URL(referrerUrl)
    return allowed.some((p) => hostMatches(u.hostname, p))
  } catch {
    return false
  }
}

export interface DomainLockResult {
  ok: boolean
  reason?: string
}

export function checkDomain(
  opts: ResolvedDomainLockOptions & { enabled: boolean },
): DomainLockResult {
  if (!opts.enabled) return { ok: true }
  if (typeof window === 'undefined' || !window.location) return { ok: true }
  if (window.location.protocol === 'file:') return { ok: true }

  const host = window.location.hostname

  if (opts.allowedHosts.length > 0) {
    const hostOk = opts.allowedHosts.some((p) => hostMatches(host, p))
    if (!hostOk) return { ok: false, reason: 'hostname not allowed: ' + host }
  }

  if (opts.checkReferrer && opts.allowedReferrers.length > 0) {
    const referrer = document.referrer || ''
    if (!referrerMatches(referrer, opts.allowedReferrers)) {
      return { ok: false, reason: 'referrer not allowed: ' + referrer }
    }
  }

  return { ok: true }
}

export function applyDomainViolation(
  opts: ResolvedDomainLockOptions & { enabled: boolean },
  reason: string,
): void {
  log.warn('domain lock violation:', reason)
  const a = opts.onViolation
  switch (a) {
    case 'redirect':
      if (opts.redirectUrl) {
        try {
          location.replace(opts.redirectUrl)
        } catch {}
      }
      break
    case 'reload':
      try {
        location.reload()
      } catch {}
      break
    case 'report':
      if (opts.reportUrl) {
        try {
          const data = JSON.stringify({
            type: 'domain-violation',
            host: location.hostname,
            referrer: document.referrer,
            ua: navigator.userAgent,
            reason,
            ts: Date.now(),
          })
          if (navigator.sendBeacon) {
            navigator.sendBeacon(opts.reportUrl, data)
          } else {
            fetch(opts.reportUrl, { method: 'POST', body: data, keepalive: true }).catch(() => {})
          }
        } catch {}
      }
      break
    case 'noop':
    default:
      break
  }
}
