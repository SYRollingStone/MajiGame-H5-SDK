import type { DetectorName } from '../../../types'

export interface Detector {
  name: DetectorName
  check(): boolean
  reset?(): void
}

const NOW: () => number =
  typeof performance !== 'undefined' && performance.now
    ? () => performance.now()
    : () => Date.now()

const TRAP: () => void = (() => {
  try {
    return new Function('debugger') as () => void
  } catch {
    return () => {}
  }
})()

function createDebuggerDetector(): Detector {
  return {
    name: 'debugger',
    check() {
      const t0 = NOW()
      try {
        TRAP()
      } catch {}
      return NOW() - t0 > 100
    },
  }
}

function createTimingDetector(): Detector {
  let baseline = -1
  return {
    name: 'timing',
    check() {
      const t0 = NOW()
      try {
        TRAP()
      } catch {}
      const dt = NOW() - t0
      if (baseline < 0 || dt < baseline) baseline = dt
      return dt > baseline + 30 && dt > 30
    },
    reset() {
      baseline = -1
    },
  }
}

function createConsoleDetector(): Detector {
  let triggered = false
  const probe: Record<string, unknown> = {}
  Object.defineProperty(probe, 'id', {
    get() {
      triggered = true
      return ''
    },
    configurable: true,
  })
  return {
    name: 'console',
    check() {
      triggered = false
      try {
        ;(console as Console).log('%c ', 'color:transparent', probe)
      } catch {}
      return triggered
    },
    reset() {
      triggered = false
    },
  }
}

function createSizeDetector(): Detector {
  return {
    name: 'size',
    check() {
      if (typeof window === 'undefined') return false
      const oh = window.outerHeight
      const ih = window.innerHeight
      const ow = window.outerWidth
      const iw = window.innerWidth
      if (!oh || !ow) return false
      const threshold = 160
      return oh - ih > threshold || ow - iw > threshold
    },
  }
}

function createToStringDetector(): Detector {
  return {
    name: 'toString',
    check() {
      try {
        const s = Function.prototype.toString.toString()
        return s.indexOf('[native code]') === -1
      } catch {
        return true
      }
    },
  }
}

export function createDetector(name: DetectorName): Detector | null {
  switch (name) {
    case 'debugger':
      return createDebuggerDetector()
    case 'timing':
      return createTimingDetector()
    case 'console':
      return createConsoleDetector()
    case 'size':
      return createSizeDetector()
    case 'toString':
      return createToStringDetector()
    default:
      return null
  }
}
