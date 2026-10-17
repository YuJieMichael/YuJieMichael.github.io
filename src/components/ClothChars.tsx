/**
 * 把文字拆成逐字的 inline-block，每个字是布料上的独立一块，
 * 按压时能看到局部凹陷，而不是整行一起倾斜。
 * 有空格的文字（英文、法文）按单词成组，只在单词之间换行；中文可以在任意两个字之间换行。
 */
export default function ClothChars({ text, charClass = '' }: { text: string; charClass?: string }) {
  const char = (c: string, key: number) => (
    <span key={key} data-cloth className={`inline-block ${charClass}`}>
      {c}
    </span>
  )
  if (!text.includes(' ')) return <>{Array.from(text).map(char)}</>
  return (
    <>
      {text.split(' ').map((word, w) => (
        <span key={w}>
          {w > 0 && ' '}
          <span className="inline-block whitespace-nowrap">{Array.from(word).map(char)}</span>
        </span>
      ))}
    </>
  )
}
