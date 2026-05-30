export interface OverlayOptions {
  tipText: string
  tipTitle: string
  zIndex: number
}

export class Overlay {
  private el: HTMLDivElement | null = null
  private pending = false

  constructor(private opts: OverlayOptions) {}

  show(): void {
    if (this.el || this.pending) return
    const create = () => {
      if (this.el) return
      const el = document.createElement('div')
      el.setAttribute('data-maji-overlay', '1')
      el.style.cssText = [
        'position:fixed',
        'left:0',
        'top:0',
        'width:100vw',
        'height:100vh',
        'background:rgba(0,0,0,.88)',
        'color:#fff',
        'z-index:' + this.opts.zIndex,
        'display:flex',
        'flex-direction:column',
        'align-items:center',
        'justify-content:center',
        'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
        'user-select:none',
        '-webkit-user-select:none',
        'pointer-events:auto',
      ].join(';')

      const title = document.createElement('div')
      title.textContent = this.opts.tipTitle
      title.style.cssText = 'font-size:24px;font-weight:600;margin-bottom:14px;letter-spacing:1px;'

      const tip = document.createElement('div')
      tip.textContent = this.opts.tipText
      tip.style.cssText =
        'font-size:16px;opacity:.92;padding:0 24px;text-align:center;line-height:1.6;max-width:560px;'

      el.appendChild(title)
      el.appendChild(tip)
      document.body.appendChild(el)
      this.el = el
    }

    if (document.body) {
      create()
    } else {
      this.pending = true
      const onReady = () => {
        this.pending = false
        create()
      }
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', onReady, { once: true })
      } else {
        setTimeout(onReady, 0)
      }
    }
  }

  hide(): void {
    this.pending = false
    if (this.el && this.el.parentNode) {
      this.el.parentNode.removeChild(this.el)
    }
    this.el = null
  }
}
