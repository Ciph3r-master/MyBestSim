import { useMemo, useState } from 'react'
import type { Product } from '@/types/catalog'
import type { SortKey, SortOrder } from '@/types/selection'
import { dataTierLabel } from '@/services/catalogStats'
import { searchProducts, sortProducts } from '@/services/selections'
import { formatCount, formatNumber, formatPrice } from '@/utils/format'
import { Icon } from '@/components/ui/Icon'
import styles from './ProductTable.module.css'

const PAGE_SIZE = 50

const COLUMNS: { key: SortKey; label: string; numeric?: boolean }[] = [
  { key: 'destination', label: 'Destination' },
  { key: 'provider', label: 'Fournisseur' },
  { key: 'data', label: 'Volume', numeric: true },
  { key: 'validityDays', label: 'Durée', numeric: true },
  { key: 'price', label: 'Prix', numeric: true },
  { key: 'pricePerGb', label: 'Prix / Go', numeric: true },
]

interface ProductTableProps {
  products: Product[]
  initialSort?: SortOrder
  onSelect: (product: Product) => void
}

export function ProductTable({ products, initialSort = { key: 'price', direction: 'asc' }, onSelect }: ProductTableProps) {
  const [sort, setSort] = useState<SortOrder>(initialSort)
  const [query, setQuery] = useState('')
  const [visible, setVisible] = useState(PAGE_SIZE)

  const rows = useMemo(() => sortProducts(searchProducts(products, query), sort), [products, query, sort])

  const toggleSort = (key: SortKey) => {
    setSort((current) =>
      current.key === key ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' } : { key, direction: 'asc' },
    )
    setVisible(PAGE_SIZE)
  }

  return (
    <section aria-label="Liste des produits">
      <div className={styles.searchRow}>
        <input
          type="search"
          className={styles.search}
          placeholder="Rechercher un produit, un fournisseur, une destination…"
          aria-label="Rechercher dans la sélection"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setVisible(PAGE_SIZE)
          }}
        />
        <span className={styles.count}>{formatCount(rows.length, 'résultat')}</span>
      </div>

      {rows.length === 0 ? (
        <p className={styles.empty}>Aucun produit ne correspond.</p>
      ) : (
        <div className={styles.scroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                {COLUMNS.map((col) => {
                  const active = sort.key === col.key
                  return (
                    <th
                      key={col.key}
                      className={col.numeric ? styles.num : undefined}
                      aria-sort={active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                    >
                      <button type="button" className={active ? styles.sortActive : styles.sortButton} onClick={() => toggleSort(col.key)}>
                        {col.label}
                        <span className={styles.sortIcon} aria-hidden>
                          {active ? (sort.direction === 'asc' ? '↑' : '↓') : <Icon name="sort" size={11} />}
                        </span>
                      </button>
                    </th>
                  )
                })}
                <th>Réseau</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, visible).map((p) => (
                <tr key={p.sku}>
                  <td>
                    <button type="button" className={styles.productLink} onClick={() => onSelect(p)}>
                      {p.countryName}
                      <Icon name="chevron" size={12} />
                    </button>
                  </td>
                  <td>{p.provider}</td>
                  <td className={styles.num}>{dataTierLabel(p)}</td>
                  <td className={styles.num}>{p.validityDays} j</td>
                  <td className={styles.num}>{formatPrice(p.price, p.currency)}</td>
                  <td className={styles.num}>{p.dataGb ? formatPrice(p.price / p.dataGb, p.currency) : '—'}</td>
                  <td>
                    {p.network}
                    {p.topUp && <span className={styles.tag}>rech.</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rows.length > visible && (
        <button type="button" className={styles.more} onClick={() => setVisible((v) => v + PAGE_SIZE)}>
          Afficher {formatNumber(Math.min(PAGE_SIZE, rows.length - visible))} de plus · {formatNumber(visible)} sur{' '}
          {formatNumber(rows.length)}
        </button>
      )}
    </section>
  )
}
