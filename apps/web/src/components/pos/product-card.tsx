import type { Product } from '../../types'
import { Plus } from 'lucide-react'
import { formatCurrency } from '../../lib/format'
import { cn } from '../../lib/utils'

interface ProductCardProps {
  product: Product
  cartQty: number
  onAdd: () => void
}

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0)
    return null
  if (stock <= 2) {
    return (
      <span className="text-xs font-semibold text-red-500">
        Only
        {stock}
        {' '}
        left!
      </span>
    )
  }
  if (stock <= 5) {
    return (
      <span className="text-xs font-semibold text-amber-500">
        {stock}
        {' '}
        left
      </span>
    )
  }
  return (
    <span className="text-xs text-slate-300">
      {stock}
      {' '}
      available
    </span>
  )
}

export function ProductCard({ product, cartQty, onAdd }: ProductCardProps) {
  const inStock = product.stock > 0
  const isRental = product.type === 'rental'

  return (
    <button
      onClick={onAdd}
      disabled={!inStock}
      className={cn(
        'relative flex flex-col items-center gap-2 rounded-xl border bg-white p-4 w-full',
        'transition-all duration-150',
        inStock
          ? isRental
            ? 'border-violet-100 shadow-sm hover:shadow-md hover:border-violet-300 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer'
            : 'border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer'
          : 'border-slate-100 opacity-50 cursor-not-allowed',
      )}
    >
      {/* Cart qty badge */}
      {cartQty > 0 && (
        <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
          {cartQty}
        </span>
      )}

      {/* Sale / Rental tag */}
      <span className={cn(
        'absolute top-2 left-2 rounded-full px-2 py-0.5 text-xs font-semibold',
        isRental ? 'bg-violet-100 text-violet-700' : 'bg-blue-50 text-blue-600',
      )}
      >
        {isRental ? 'RENT' : 'SALE'}
      </span>

      <span className="text-4xl leading-none mt-3">{product.emoji}</span>
      <span className="text-center text-sm font-medium text-slate-800 leading-tight">{product.name}</span>

      <span className={cn('text-sm font-semibold', isRental ? 'text-violet-600' : 'text-blue-600')}>
        {formatCurrency(product.price)}
        {isRental ? '/day' : ''}
      </span>

      <StockBadge stock={product.stock} />

      {!inStock && (
        <span className="text-xs text-slate-400">Out of stock</span>
      )}

      {inStock && (
        <span className={cn(
          'flex h-6 w-6 items-center justify-center rounded-full mt-0.5',
          isRental ? 'bg-violet-50 text-violet-600' : 'bg-blue-50 text-blue-600',
        )}
        >
          <Plus size={14} />
        </span>
      )}
    </button>
  )
}
