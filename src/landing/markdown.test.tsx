import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { renderMarkdown } from './markdown'

const html = (md: string, offset?: number) => renderToStaticMarkup(<>{renderMarkdown(md, offset)}</>)

describe('renderMarkdown', () => {
  it('décale les titres sous le titre de la page', () => {
    expect(html("# Comment j'ai utilisé l'IA\n\n## Partie 1")).toBe("<h2>Comment j&#x27;ai utilisé l&#x27;IA</h2><h3>Partie 1</h3>")
  })

  it('rend paragraphes, gras, code, listes et séparateurs', () => {
    expect(html('Un **mot** et `code`\nsur deux lignes.\n\n- a\n- b\n\n---')).toBe(
      '<p>Un <strong>mot</strong> et <code>code</code> sur deux lignes.</p><ul><li>a</li><li>b</li></ul><hr/>',
    )
  })

  it('échappe le HTML du texte', () => {
    expect(html('<script>alert(1)</script>')).toBe('<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>')
  })
})
