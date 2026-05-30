import type { ResolvedAntiDebugOptions } from '../../../types'
import { createDetector, type Detector } from './detectors'
import { Overlay } from './overlay'
import { log } from '../../../core/logger'

const TRAP: () => void = (() => {
  try {
    return new Function('debugger') as () => void
  } catch {
    return () => {}
  }
})()

export interface AntiDebugCallbacks {
  onDetect?: (detectorName: string) => void
  onRecover?: () => void
}

export class AntiDebugManager {
  private detectors: Detector[] = []
  private pollHandle: ReturnType<typeof setInterval> | null = null
  private trapHandle: ReturnType<typeof setInterval> | null = null
  private overlay: Overlay
  private detected = false
  private opts: ResolvedAntiDebugOptions & { enabled: boolean }
  private cbs: AntiDebugCallbacks

  constructor(
    opts: ResolvedAntiDebugOptions & { enabled: boolean },
    cbs: AntiDebugCallbacks = {},
  ) {
    this.opts = opts
    this.cbs = cbs
    this.overlay = new Overlay({
      tipText: opts.tipText,
      tipTitle: opts.tipTitle,
      zIndex: opts.zIndex,
    })
    this.detectors = opts.detectors
      .map((n) => createDetector(n))
      .filter((d): d is Detector => d !== null)
  }

  start(): void {
    if (!this.opts.enabled) return
    if (this.pollHandle) return
    this.tick()
    this.pollHandle = setInterval(() => this.tick(), this.opts.interval)
  }

  stop(): void {
    if (this.pollHandle) {
      clearInterval(this.pollHandle)
      this.pollHandle = null
    }
    this.stopFreeze()
    this.overlay.hide()
    this.detected = false
  }

  isDetected(): boolean {
    return this.detected
  }

  private tick(): void {
    let hit = false
    let hitName = ''
    for (const d of this.detectors) {
      try {
        if (d.check()) {
          hit = true
          hitName = d.name
          break
        }
      } catch {}
    }
    if (hit) {
      if (!this.detected) {
        this.detected = true
        log.warn('anti-debug triggered by', hitName)
        this.applyAction()
        this.cbs.onDetect?.(hitName)
      }
    } else if (this.detected && this.opts.autoRecover) {
      this.detected = false
      log.info('anti-debug recovered')
      this.recover()
      this.cbs.onRecover?.()
    }
  }

  private applyAction(): void {
    const a = this.opts.onDetect
    switch (a) {
      case 'freeze+tip':
        this.startFreeze()
        this.overlay.show()
        break
      case 'freeze':
        this.startFreeze()
        break
      case 'tip':
      case 'blur':
        this.overlay.show()
        break
      case 'redirect':
        if (this.opts.redirectUrl) {
          try {
            location.replace(this.opts.redirectUrl)
          } catch {}
        }
        break
      case 'reload':
        try {
          location.reload()
        } catch {}
        break
      case 'report':
        this.report()
        break
      case 'noop':
        break
    }
  }

  private recover(): void {
    this.stopFreeze()
    this.overlay.hide()
  }

  private startFreeze(): void {
    if (this.trapHandle) return
    this.trapHandle = setInterval(() => {
      try {
        TRAP()
      } catch {}
    }, 50)
  }

  private stopFreeze(): void {
    if (this.trapHandle) {
      clearInterval(this.trapHandle)
      this.trapHandle = null
    }
  }

  private report(): void {
    const url = this.opts.reportUrl
    if (!url) return
    try {
      const data = JSON.stringify({
        type: 'anti-debug',
        ua: navigator.userAgent,
        url: location.href,
        ts: Date.now(),
      })
      if (navigator.sendBeacon) {
        navigator.sendBeacon(url, data)
      } else {
        fetch(url, { method: 'POST', body: data, keepalive: true }).catch(() => {})
      }
    } catch {}
  }
}
