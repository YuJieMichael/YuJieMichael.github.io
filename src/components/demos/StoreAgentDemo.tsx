import { Bot, Check, RotateCcw, ShieldCheck, Sparkles, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { DEMO_EVAL, DEMO_EXCHANGES, DEMO_PURCHASE_ORDERS, DEMO_TOOLS, type DemoExchange, type DemoTool } from '../../data/storeAgentDemo'
import { prefersReducedMotion } from '../../effects/gsap'
import { useLanguage } from '../../i18n/LanguageContext'
import type { Lang } from '../../i18n/strings'
import { cn } from '../../lib/utils'

const UI: Record<
  Lang,
  {
    title: string
    replay: string
    note: string
    tools: string
    read: string
    approval: string
    thinking: string
    draft: string
    pending: string
    pendingMsg: string
    summary: string
    approve: string
    reject: string
    approved: string
    rejected: string
    reset: string
    evalLabel: string
    mcp: string
  }
> = {
  zh: {
    title: 'Store Agent',
    replay: '演示回放',
    note: '回答原文取自项目本地 Agent 在评测门店数据上的输出',
    tools: '8 个工具',
    read: '只读',
    approval: '需店主审批',
    thinking: '正在调用工具…',
    draft: '帮我生成采购单草稿',
    pending: '待店主审批',
    pendingMsg: '提案已登记。店主批准之前，什么都不会改变。',
    summary: '4 个商品 · 4 家供应商',
    approve: '批准',
    reject: '拒绝',
    approved: '已批准 · 已按供应商生成采购单草稿 · 已记入审计',
    rejected: '已拒绝 · 没有下任何单 · 已记入审计',
    reset: '重来',
    evalLabel: `三语评测 · ${DEMO_EVAL.cases} 题`,
    mcp: '同一套工具也通过 MCP 提供给 Claude Desktop',
  },
  en: {
    title: 'Store Agent',
    replay: 'Demo replay',
    note: "Answers are the project's local agent output on its eval store, verbatim",
    tools: '8 tools',
    read: 'read-only',
    approval: 'needs owner approval',
    thinking: 'Calling a tool…',
    draft: 'Draft the purchase orders',
    pending: 'Pending owner approval',
    pendingMsg: 'Proposal recorded. Nothing has changed yet: the store owner must approve it under Pending actions.',
    summary: '4 items · 4 suppliers',
    approve: 'Approve',
    reject: 'Reject',
    approved: 'Approved · supplier-grouped drafts created · audit logged',
    rejected: 'Rejected · nothing ordered · audit logged',
    reset: 'Reset',
    evalLabel: `Trilingual eval · ${DEMO_EVAL.cases} cases`,
    mcp: 'The same tools are exposed over MCP to Claude Desktop',
  },
  fr: {
    title: 'Store Agent',
    replay: 'Démo rejouée',
    note: "Réponses de l'agent local du projet sur son magasin d'évaluation, telles quelles",
    tools: '8 outils',
    read: 'lecture seule',
    approval: 'approbation requise',
    thinking: "Appel d'un outil…",
    draft: "Prépare les bons de commande",
    pending: 'En attente du propriétaire',
    pendingMsg: "Proposition enregistrée. Rien n'a changé : le propriétaire doit l'approuver.",
    summary: '4 articles · 4 fournisseurs',
    approve: 'Approuver',
    reject: 'Refuser',
    approved: "Approuvé · brouillons par fournisseur créés · audit enregistré",
    rejected: 'Refusé · aucune commande · audit enregistré',
    reset: 'Recommencer',
    evalLabel: `Évaluation trilingue · ${DEMO_EVAL.cases} questions`,
    mcp: 'Les mêmes outils sont offerts à Claude Desktop par MCP',
  },
}

type Message =
  | { kind: 'user'; text: string }
  | { kind: 'agent'; exchange: DemoExchange; shown: number }
  | { kind: 'proposal'; state: 'pending' | 'approved' | 'rejected' }

const money = (n: number) => `$${n.toFixed(2)}`
const total = DEMO_PURCHASE_ORDERS.reduce((sum, o) => sum + o.total, 0)

/** 采购单号和项目里一样：PO-<多伦多当天日期>-<供应商编号> */
function poNumber(supplierId: number) {
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto' }).format(new Date()).replace(/-/g, '')
  return `PO-${date}-${supplierId}`
}

/**
 * SmartDépanneur 的 Store Agent 交互演示：
 * 点问题 → 右边出现调用的工具和耗时 → 回答逐字打出来；
 * 「生成采购单」只登记提案，点「批准」才按供应商生成草稿，和项目里的审批流程一致。
 * 卡片滚进视野时自动播第一问。
 * 宽屏：左栏是项目介绍（intro）+ 评测，右栏对话占满卡片高度，顶部一排 8 个工具；手机：上下排。
 */
export default function StoreAgentDemo({ intro, className }: { intro: ReactNode; className?: string }) {
  const { lang } = useLanguage()
  const ui = UI[lang]
  const exchanges = DEMO_EXCHANGES[lang]
  const [messages, setMessages] = useState<Message[]>([])
  const [activeTool, setActiveTool] = useState<DemoTool | null>(null)
  const [busy, setBusy] = useState(false)
  const [evalShown, setEvalShown] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const chat = useRef<HTMLDivElement>(null)
  const strip = useRef<HTMLUListElement>(null)
  const timers = useRef<number[]>([])

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, prefersReducedMotion() ? 0 : ms))
  }
  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id))
    timers.current = []
  }

  const ask = useCallback(
    (exchange: DemoExchange) => {
      setBusy(true)
      setMessages((m) => [...m, { kind: 'user', text: exchange.question }])
      later(() => setActiveTool(exchange.tool), 350)
      later(() => {
        setMessages((m) => [...m, { kind: 'agent', exchange, shown: prefersReducedMotion() ? exchange.answer.length : 0 }])
        // 逐字打出回答
        const length = exchange.answer.length
        let shown = 0
        const step = () => {
          shown = Math.min(length, shown + 4)
          const value = shown
          setMessages((m) => m.map((msg, i) => (i === m.length - 1 && msg.kind === 'agent' ? { ...msg, shown: value } : msg)))
          if (shown >= length) setBusy(false)
          else timers.current.push(window.setTimeout(step, 16))
        }
        if (prefersReducedMotion()) setBusy(false)
        else step()
      }, 900)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const draft = () => {
    setBusy(true)
    setMessages((m) => [...m, { kind: 'user', text: ui.draft }])
    later(() => setActiveTool('propose_purchase_orders'), 350)
    later(() => {
      setMessages((m) => [...m, { kind: 'proposal', state: 'pending' }])
      setBusy(false)
    }, 900)
  }

  const decide = (state: 'approved' | 'rejected') =>
    setMessages((m) => m.map((msg) => (msg.kind === 'proposal' && msg.state === 'pending' ? { ...msg, state } : msg)))

  const reset = () => {
    clearTimers()
    setMessages([])
    setActiveTool(null)
    setBusy(false)
  }

  // 滚进视野时自动问第一题；换语言时从头再来
  useEffect(() => {
    reset()
    const el = root.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        io.disconnect()
        setEvalShown(true)
        ask(exchanges[0])
      },
      { threshold: 0.35 },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      clearTimers()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang])

  useEffect(() => {
    const list = strip.current
    const chipEl = activeTool && list?.querySelector<HTMLElement>(`[data-tool="${activeTool}"]`)
    if (list && chipEl) list.scrollTo({ left: chipEl.offsetLeft - list.offsetLeft - 16, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
  }, [activeTool])

  // 新内容出现时，聊天框自己滚到底（不带动整页）
  useEffect(() => {
    const el = chat.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  const pendingOrDone = messages.some((m) => m.kind === 'proposal')
  const chip =
    'rounded-full border border-ink/20 px-3 py-1.5 text-left text-xs text-ink/85 transition-colors duration-200 hover:border-fox hover:text-fox disabled:pointer-events-none disabled:opacity-40'

  return (
    <div ref={root} className={cn('flex flex-col gap-3 md:flex-row md:gap-6', className)}>
      <div className="flex min-h-0 flex-col gap-3 md:w-[42%] md:gap-4">
        {intro}
        {/* 宽屏：评测结果和 MCP（屏幕不够高时收起） */}
        <aside className="mt-auto hidden flex-col gap-2 rounded-2xl border border-ink/10 bg-[#15161A] p-3 md:flex lg:p-4 [@media(max-height:799px)]:hidden">
          <div>
            <p className="flex items-baseline justify-between font-mono text-[11px] text-muted">
              <span>{ui.evalLabel}</span>
              <span className="text-ink">
                {DEMO_EVAL.before}% → <span className="text-fox">{DEMO_EVAL.after}%</span>
              </span>
            </p>
            <div className="relative mt-2 h-1.5 overflow-hidden rounded-full bg-ink/10">
              <span className="absolute inset-y-0 left-0 rounded-full bg-ink/25" style={{ width: `${DEMO_EVAL.before}%` }} />
              <span
                className="absolute inset-y-0 left-0 rounded-full bg-fox transition-[width] duration-[1600ms] ease-out"
                style={{ width: evalShown ? `${DEMO_EVAL.after}%` : `${DEMO_EVAL.before}%` }}
              />
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-[11px] leading-snug text-muted">
              <Sparkles size={12} className="shrink-0 text-fox" /> {ui.mcp}
            </p>
          </div>
        </aside>
      </div>

      {/* 右栏：对话 */}
      <section className="flex h-[520px] min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-ink/10 bg-[#15161A] md:h-auto md:flex-1">
        <header className="flex items-center justify-between gap-3 border-b border-ink/10 px-4 py-2.5">
          <p className="flex items-center gap-2 text-sm text-ink">
            <Bot size={16} className="text-fox" /> {ui.title}
            <span className="rounded-full bg-fox/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-fox">{ui.replay}</span>
          </p>
          <button type="button" onClick={reset} className="flex items-center gap-1 font-mono text-[11px] text-muted transition-colors hover:text-fox" aria-label={ui.reset}>
            <RotateCcw size={12} /> {ui.reset}
          </button>
        </header>
        {/* 宽屏：8 个工具一字排开，正在调用的那个亮起来 */}
        <div className="hidden items-center gap-2 border-b border-ink/10 px-4 py-2 md:flex">
          <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">{ui.tools}</span>
          <ul ref={strip} className="flex min-w-0 flex-1 gap-1 overflow-x-auto [mask-image:linear-gradient(to_right,black_88%,transparent)] [scrollbar-width:none]">
            {DEMO_TOOLS.map((tool) => {
              const active = tool.name === activeTool
              return (
                <li
                  key={tool.name}
                  data-tool={tool.name}
                  title={tool.write ? ui.approval : ui.read}
                  className={cn(
                    'flex shrink-0 items-center gap-1.5 rounded-md border px-1.5 py-0.5 font-mono text-[10.5px] transition-colors duration-300',
                    active
                      ? 'border-fox/60 bg-fox/15 text-fox'
                      : tool.write
                        ? 'border-amber-300/25 text-amber-200/70'
                        : 'border-ink/10 text-ink/55',
                  )}
                >
                  <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', active ? 'animate-pulse bg-fox' : tool.write ? 'bg-amber-300/60' : 'bg-ink/25')} />
                  {tool.name}
                </li>
              )
            })}
          </ul>
        </div>

        <div ref={chat} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3" aria-live="polite">
          {messages.map((msg, i) => {
            if (msg.kind === 'user')
              return (
                <p key={i} className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-fox px-3 py-2 text-sm text-bg">
                  {msg.text}
                </p>
              )
            if (msg.kind === 'agent')
              return (
                <div key={i} className="max-w-[95%]">
                  <p className="mb-1 font-mono text-[10px] text-muted">
                    <span className="text-fox">{msg.exchange.tool}</span> · {msg.exchange.latencyMs} ms · local agent
                  </p>
                  <p className="whitespace-pre-line rounded-2xl rounded-tl-md border border-ink/10 bg-bg/60 px-3 py-2 font-mono text-[12px] leading-relaxed text-ink/90">
                    {msg.exchange.answer.slice(0, msg.shown)}
                    {msg.shown < msg.exchange.answer.length && <span className="ml-0.5 inline-block h-3 w-1.5 animate-pulse bg-fox align-middle" />}
                  </p>
                </div>
              )
            return (
              <div key={i} className="max-w-[95%] rounded-2xl border border-amber-300/30 bg-amber-300/5 p-3 text-sm">
                <p className="mb-1 font-mono text-[10px] text-muted">
                  <span className="text-amber-300">propose_purchase_orders</span> · {ui.summary} · {money(total)}
                </p>
                {msg.state === 'pending' ? (
                  <>
                    <p className="flex items-center gap-2 font-medium text-amber-200">
                      <ShieldCheck size={15} /> {ui.pending}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-ink/70">{ui.pendingMsg}</p>
                    <div className="mt-3 flex gap-2">
                      <button type="button" onClick={() => decide('approved')} className="flex items-center gap-1 rounded-full bg-fox px-3 py-1.5 text-xs font-medium text-bg hover:brightness-110">
                        <Check size={13} /> {ui.approve}
                      </button>
                      <button type="button" onClick={() => decide('rejected')} className="flex items-center gap-1 rounded-full border border-ink/20 px-3 py-1.5 text-xs text-ink hover:border-ink/50">
                        <X size={13} /> {ui.reject}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className={cn('flex items-center gap-2 text-xs', msg.state === 'approved' ? 'text-emerald-300' : 'text-ink/60')}>
                      {msg.state === 'approved' ? <Check size={14} /> : <X size={14} />}
                      {msg.state === 'approved' ? ui.approved : ui.rejected}
                    </p>
                    {msg.state === 'approved' && (
                      <ul className="mt-2 space-y-1 font-mono text-[11px] text-ink/80">
                        {DEMO_PURCHASE_ORDERS.map((o) => (
                          <li key={o.supplierId} className="flex flex-wrap justify-between gap-x-3 border-t border-ink/10 pt-1">
                            <span>
                              <span className="text-fox">{poNumber(o.supplierId)}</span> {o.supplier}
                            </span>
                            <span className="text-muted">
                              {o.item} × {o.qty} {o.unit} · {money(o.total)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </div>
            )
          })}
          {busy && messages[messages.length - 1]?.kind === 'user' && (
            <p className="flex items-center gap-2 font-mono text-[11px] text-muted">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-fox" /> {activeTool ?? ui.thinking}
            </p>
          )}
        </div>

        <footer className="border-t border-ink/10 px-4 py-3">
          <div className="flex flex-wrap gap-2">
            {exchanges.map((ex) => (
              <button key={ex.id} type="button" disabled={busy} onClick={() => ask(ex)} className={chip}>
                {ex.question}
              </button>
            ))}
            <button type="button" disabled={busy || pendingOrDone} onClick={draft} className={cn(chip, 'border-amber-300/40 text-amber-200')}>
              {ui.draft}
            </button>
          </div>
          <p className="mt-2 text-[10px] leading-snug text-muted/80">{ui.note}</p>
        </footer>
      </section>
    </div>
  )
}
