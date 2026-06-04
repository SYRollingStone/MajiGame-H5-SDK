import type { ResolvedShortcutsOptions } from '../../types'
import { log } from '../../core/logger'

type Unbind = () => void

// Cross-window protocol — keep `version` bumped if the message shape changes
// so older portals can ignore unknown messages instead of misinterpreting them.
const PARENT_INSTALL_TYPE = 'maji-sdk:install-shortcut-blocker'
const PARENT_UNINSTALL_TYPE = 'maji-sdk:uninstall-shortcut-blocker'
const PROTOCOL_VERSION = 1

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

    // When running inside an iframe, the parent window receives key events
    // before the iframe gets focus — our in-iframe listener never sees them.
    // Ask the parent (the portal) to also block these shortcuts on its side.
    // Harmless if the parent doesn't listen: postMessage is fire-and-forget.
    this.requestParentBlocking()
  }

  stop(): void {
    this.unbinds.forEach((u) => u())
    this.unbinds = []
    this.active = false

    if (this.isInIframe()) {
      try {
        window.parent.postMessage(
          { type: PARENT_UNINSTALL_TYPE, version: PROTOCOL_VERSION },
          '*',
        )
      } catch {
        // parent unreachable (e.g. cross-origin block) — nothing to clean up there
      }
    }
  }

  private isInIframe(): boolean {
    try {
      return window.self !== window.top
    } catch {
      // cross-origin access throws → we are definitely in an iframe
      return true
    }
  }

  private requestParentBlocking(): void {
    if (!this.isInIframe()) return
    if (!this.opts.blockKeys && !this.opts.blockContextMenu) return

    const message = {
      type: PARENT_INSTALL_TYPE,
      version: PROTOCOL_VERSION,
      blockKeys: this.opts.blockKeys,
      blockContextMenu: this.opts.blockContextMenu,
    }

    const send = () => {
      try {
        window.parent.postMessage(message, '*')
      } catch {
        // parent unreachable — give up silently
      }
    }

    send()
    // Re-send on focus in case the parent missed the first one
    // (rare, but cheap insurance — e.g. parent script hadn't mounted yet).
    this.unbinds.push(bind(window, 'focus', send, false))
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
