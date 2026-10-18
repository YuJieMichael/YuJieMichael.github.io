import { useEffect, useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'

interface Line {
  cmd: string
  out: string
}

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** 首页右侧的终端：逐字敲命令，回车后输出结果，最后光标闪烁 */
export default function Terminal({ start = true }: { start?: boolean }) {
  const { t } = useLanguage()
  const lines: Line[] = [
    { cmd: 'whoami', out: `Yujie Xie — ${t.heroRole}` },
    { cmd: 'cat stack.txt', out: 'React · TypeScript · Next.js · NestJS · PostgreSQL · OpenAI API · MCP' },
    { cmd: 'echo $LANGUAGES', out: 'English · Français · 中文' },
    { cmd: 'status --job', out: `● ${t.available}` },
  ]
  // 进度：已完成的行数 + 当前行已敲出的字符数
  const [row, setRow] = useState(0)
  const [col, setCol] = useState(0)

  useEffect(() => {
    if (reduced()) {
      setRow(lines.length)
      return
    }
    setRow(0)
    setCol(0)
  }, [t]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!start || row >= lines.length) return
    const cmd = lines[row].cmd
    const id = window.setTimeout(
      () => {
        if (col < cmd.length) setCol(col + 1)
        else {
          setRow(row + 1)
          setCol(0)
        }
      },
      col === 0 ? 450 : col < cmd.length ? 55 + Math.random() * 60 : 260,
    )
    return () => clearTimeout(id)
  })

  return (
    <div
      data-spotlight
      className="spotlight w-full max-w-md overflow-hidden rounded-2xl border border-ink/15 bg-surface/80 font-mono text-[12.5px] leading-relaxed shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)] backdrop-blur-sm md:text-[13px]"
    >
      <div className="flex items-center gap-2 border-b border-ink/10 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-3 text-xs text-muted">~/yujie — zsh</span>
      </div>
      <div className="min-h-[13.5rem] px-4 py-4" aria-live="off">
        {lines.map((l, i) => {
          if (i > row) return null
          const typed = i < row ? l.cmd : l.cmd.slice(0, col)
          return (
            <div key={i} className="mb-2">
              <div className="text-ink">
                <span className="text-fox">❯</span> {typed}
                {i === row && <span className="ml-0.5 inline-block h-4 w-2 translate-y-0.5 animate-pulse bg-ink/80" />}
              </div>
              {i < row && (
                <div className="text-muted">
                  {l.out.startsWith('●') ? (
                    <>
                      <span className="text-fox">●</span>
                      {l.out.slice(1)}
                    </>
                  ) : (
                    l.out
                  )}
                </div>
              )}
            </div>
          )
        })}
        {row >= lines.length && (
          <div className="text-ink">
            <span className="text-fox">❯</span>
            <span className="ml-2 inline-block h-4 w-2 translate-y-0.5 animate-pulse bg-ink/80" />
          </div>
        )}
      </div>
    </div>
  )
}
