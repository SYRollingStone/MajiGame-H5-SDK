import type { ResolvedShortcutsOptions } from '../../types'
import { log } from '../../core/logger'

type Unbind = () => void

function isInAllowedEl(target: EventTarget | null, selector: string): boolean {
  if (!selector || !target) return false
  if (!(target instanceof Element)) return false
  try {
    return !!target.closest(selector)
  } catch {
    return false
  }
}

function shouldBlockKey(e: KeyboardEvent): boolean {
  if (e.key === 'F12' || e.keyCode === 123) return true

  const ctrlOrMeta = e.ctrlKey || e.metaKey

  if (ctrlOrMeta && e.shiftKey) {
    const k = e.key.toLowerCase()
    if (k === 'i' || k === 'j' || k === 'c') return true
  }

  if (ctrlOrMeta && !e.shiftKey) {
    const k = e.key.toLowerCase()
    if (k === 'u' || k === 's') return true
  }

  return false
}

export class ShortcutsBlocker {
  private unbinds: Unbind[] = []
  private active = false

  constructor(private opts: ResolvedShortcutsOptions & { enabled: boolean }) {}

  start(): void {
    if (this.active || !this.opts.enabled) return
    this.active = true

    if (this.opts.blockKeys) {
      this.unbinds.push(
        bind(window, 'keydown', (e: KeyboardEvent) => {
          if (isInAllowedEl(e.target, this.opts.allowSelector)) return
          if (shouldBlockKey(e)) {
            e.preventDefault()
            e.stopPropagation()
            log.info('blocked shortcut:', e.key)
          }
        }, true),
      )
    }

    if (this.opts.blockContextMenu) {
      this.unbinds.push(
        bind(window, 'contextmenu', (e: Event) => {
          if (isInAllowedEl(e.target, this.opts.allowSelector)) return
          e.preventDefault()
        }, true),
      )
    }

    if (this.opts.blockSelection) {
      this.unbinds.push(
        bind(window, 'selectstart', (e: Event) => {
          if (isInAllowedEl(e.target, this.opts.allowSelector)) return
          e.preventDefault()
        }, true),
        bind(window, 'dragstart', (e: Event) => {
          if (isInAllowedEl(e.target, this.opts.allowSelector)) return
          e.preventDefault()
        }, true),
        bind(window, 'copy', (e: Event) => {
          if (isInAllowedEl(e.target, this.opts.allowSelector)) return
          e.preventDefault()
        }, true),
      )
    }
  }

  stop(): void {
    this.unbinds.forEach((u) => u())
    this.unbinds = []
    this.active = false
  }
}

function bind<E extends Event>(
  target: EventTarget,
  type: string,
  handler: (e: E) => void,
  capture: boolean,
): Unbind {
  const fn = handler as EventListener
  target.addEventListener(type, fn, capture)
  return () => target.removeEventListener(type, fn, capture)
}
