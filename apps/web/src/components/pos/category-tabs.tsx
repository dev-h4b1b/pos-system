import { useProducts } from '../../context/products-context'
import { cn } from '../../lib/utils'

export type FilterCategory = 'all' | string

interface CategoryTabsProps {
  value: FilterCategory
  typeFilter: 'all' | 'sale' | 'rental'
  onChange: (cat: FilterCategory) => void
}

export function CategoryTabs({ value, typeFilter, onChange }: CategoryTabsProps) {
  const { products, categories } = useProducts()

  const saleCats = categories.filter(c => products.some(p => p.category === c && p.type === 'sale'))
  const rentalCats = categories.filter(c => products.some(p => p.category === c && p.type === 'rental'))

  const visibleSale = typeFilter !== 'rental' ? saleCats : []
  const visibleRental = typeFilter !== 'sale' ? rentalCats : []
  const showDivider = typeFilter === 'all' && visibleSale.length > 0 && visibleRental.length > 0

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-px">
      <button
        onClick={() => onChange('all')}
        className={cn(
          'flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors shrink-0',
          value === 'all'
            ? 'bg-slate-800 text-white shadow-sm'
            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50',
        )}
      >
        🛒 All
      </button>

      {visibleSale.map(cat => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          className={cn(
            'whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors shrink-0',
            value === cat
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white border border-blue-100 text-slate-600 hover:bg-blue-50',
          )}
        >
          {cat.charAt(0).toUpperCase() + cat.slice(1)}
        </button>
      ))}

      {showDivider && <div className="h-5 w-px bg-slate-200 shrink-0 mx-1" />}

      {visibleRental.map(cat => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          className={cn(
            'whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors shrink-0',
            value === cat
              ? 'bg-violet-600 text-white shadow-sm'
              : 'bg-white border border-violet-100 text-slate-600 hover:bg-violet-50',
          )}
        >
          {cat.charAt(0).toUpperCase() + cat.slice(1)}
        </button>
      ))}
    </div>
  )
}
