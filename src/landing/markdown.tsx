import type { ReactNode } from 'react'

/**
 * Rendu Markdown minimal pour le texte « usage de l'IA » (titres, paragraphes, listes, gras, code, séparateurs).
 * Suffisant pour ce contenu, sans dépendance supplémentaire. `headingOffset` décale les niveaux de titre :
 * un « # » du fichier devient un <h2> sous le <h1> de la page.
 */
export function renderInline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>
    if (part.startsWith('`') && part.endsWith('`')) return <code key={i}>{part.slice(1, -1)}</code>
    return part
  })
}

export function renderMarkdown(markdown: string, headingOffset = 1): ReactNode[] {
  const blocks = markdown.replace(/\r\n/g, '\n').trim().split(/\n{2,}/)
  return blocks.map((block, i) => {
    const heading = /^(#{1,6})\s+(.*)$/.exec(block)
    if (heading && !block.includes('\n')) {
      const level = Math.min(heading[1].length + headingOffset, 6)
      const Tag = `h${level}` as 'h2'
      return <Tag key={i}>{renderInline(heading[2])}</Tag>
    }
    if (/^-{3,}$/.test(block.trim())) return <hr key={i} />
    const lines = block.split('\n')
    if (lines.every((l) => /^\s*[-*]\s+/.test(l))) {
      return (
        <ul key={i}>
          {lines.map((l, j) => (
            <li key={j}>{renderInline(l.replace(/^\s*[-*]\s+/, ''))}</li>
          ))}
        </ul>
      )
    }
    return <p key={i}>{renderInline(lines.join(' '))}</p>
  })
}
