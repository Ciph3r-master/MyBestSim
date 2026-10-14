import { useState, type ReactNode } from 'react'
import type { Product } from '@/types/catalog'
import type { ChangedField, FieldChange, PriceChange, ProviderDiff } from '@/services/catalogDiff'
import { useProductDetail } from '@/hooks/useProductDetail'
import { dataTierLabel } from '@/services/catalogStats'
import { selections } from '@/services/selections'
import { formatNumber, formatPrice, formatSignedPercent } from '@/utils/format'
import { Panel } from '@/components/ui/Panel'
import { PanelEmpty } from '@/components/ui/PanelEmpty'
import styles from './ChangesTables.module.css'

const PAGE = 15

/** Affiche les premières lignes d'une liste, puis « afficher plus ». */
function Paged<T>({ items, render, empty }: { items: T[]; render: (items: T[]) => ReactNode; empty: string }) {
  const [visible, setVisible] = useState(PAGE)
  if (!items.length) return <PanelEmpty>{empty}</PanelEmpty>
  return (
    <>
      <div className={styles.scroll}>{render(items.slice(0, visible))}</div>
      {items.length > visible && (
        <button type="button" className={styles.more} onClick={() => setVisible((v) => v + PAGE * 2)}>
          Afficher plus · {formatNumber(visible)} sur {formatNumber(items.length)}
        </button>
      )}
    </>
  )
}

function ProductLink({ product }: { product: Product }) {
  const { openDetail } = useProductDetail()
  return (
    <button type="button" className={styles.link} onClick={() => openDetail(selections.product(product))}>
      {product.productName}
    </button>
  )
}

const Change = ({ value }: { value: number }) => (
  <span className={value < 0 ? styles.down : styles.up}>
    {value < 0 ? '▼' : '▲'} {formatSignedPercent(value, 1)}
  </span>
)

export function ProviderChangesTable({ providers }: { providers: ProviderDiff[] }) {
  return (
    <Panel title="Par fournisseur" subtitle="Fournisseurs concernés par l’import" wide>
      <Paged
        items={providers}
        empty="Aucun fournisseur concerné."
        render={(rows) => (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Fournisseur</th>
                <th className={styles.num}>Ajoutés</th>
                <th className={styles.num}>Retirés</th>
                <th className={styles.num}>Hausses</th>
                <th className={styles.num}>Baisses</th>
                <th className={styles.num}>Variation moyenne</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.provider}>
                  <td>{p.provider}</td>
                  <td className={styles.num}>{p.added || '—'}</td>
                  <td className={styles.num}>{p.removed || '—'}</td>
                  <td className={styles.num}>{p.increases || '—'}</td>
                  <td className={styles.num}>{p.decreases || '—'}</td>
                  <td className={styles.num}>{p.averageChange == null ? '—' : <Change value={p.averageChange} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      />
    </Panel>
  )
}

export function PriceChangesTable({ changes }: { changes: PriceChange[] }) {
  return (
    <Panel title="Variations de prix" subtitle="Plus fortes variations en premier · cliquez sur un produit pour sa fiche" wide>
      <Paged
        items={changes}
        empty="Aucun prix modifié."
        render={(rows) => (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Produit</th>
                <th>Fournisseur</th>
                <th className={styles.num}>Avant</th>
                <th className={styles.num}>Après</th>
                <th className={styles.num}>Variation</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.after.sku}>
                  <td>
                    <ProductLink product={c.after} />
                  </td>
                  <td>{c.after.provider}</td>
                  <td className={styles.num}>{formatPrice(c.before.price, c.before.currency)}</td>
                  <td className={styles.num}>{formatPrice(c.after.price, c.after.currency)}</td>
                  <td className={styles.num}>
                    <Change value={c.change} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      />
    </Panel>
  )
}

export function ProductChangesList({
  title,
  subtitle,
  products,
  linkable,
  empty,
}: {
  title: string
  subtitle: string
  products: Product[]
  /** Produits encore présents dans le catalogue : leur fiche peut être ouverte. */
  linkable: boolean
  empty: string
}) {
  return (
    <Panel title={title} subtitle={subtitle}>
      <Paged
        items={products}
        empty={empty}
        render={(rows) => (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Produit</th>
                <th>Fournisseur</th>
                <th className={styles.num}>Prix</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.sku}>
                  <td>{linkable ? <ProductLink product={p} /> : p.productName}</td>
                  <td>{p.provider}</td>
                  <td className={styles.num}>{formatPrice(p.price, p.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      />
    </Panel>
  )
}

const FIELD_LABELS: Record<ChangedField, { label: string; value: (p: Product) => string }> = {
  productName: { label: 'Nom', value: (p) => p.productName },
  destination: { label: 'Destination', value: (p) => `${p.countryName} (${p.countryCode})` },
  data: { label: 'Volume', value: dataTierLabel },
  validityDays: { label: 'Durée', value: (p) => `${p.validityDays} j` },
  network: { label: 'Réseau', value: (p) => p.network },
  topUp: { label: 'Recharge', value: (p) => (p.topUp ? 'oui' : 'non') },
  currency: { label: 'Devise', value: (p) => p.currency || '—' },
}

export function FieldChangesTable({ changes }: { changes: FieldChange[] }) {
  return (
    <Panel title="Autres modifications" subtitle="Même SKU, caractéristiques modifiées" wide>
      <Paged
        items={changes}
        empty="Aucune autre modification."
        render={(rows) => (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Produit</th>
                <th>Fournisseur</th>
                <th>Modification</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.after.sku}>
                  <td>
                    <ProductLink product={c.after} />
                  </td>
                  <td>{c.after.provider}</td>
                  <td className={styles.fields}>
                    {c.fields.map((f) => (
                      <span key={f}>
                        {FIELD_LABELS[f].label} : {FIELD_LABELS[f].value(c.before)} → <strong>{FIELD_LABELS[f].value(c.after)}</strong>
                      </span>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      />
    </Panel>
  )
}
