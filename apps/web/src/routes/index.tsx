import type { FilterCategory } from '../components/pos/category-tabs'
import type { Product, RentalInfo, SelectedUnit } from '../types'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Search, ShoppingCart, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { CartPanel } from '../components/pos/cart-panel'
import { CategoryTabs } from '../components/pos/category-tabs'
import { PaymentModal } from '../components/pos/payment-modal'
import { ProductCard } from '../components/pos/product-card'
import { Button } from '../components/ui/button'
import { useAuth } from '../context/auth-context'
import { useProducts } from '../context/products-context'
import { useCart } from '../hooks/use-cart'
import { useOrders } from '../hooks/use-orders'
import { formatCurrency } from '../lib/format'
import { cn } from '../lib/utils'

export const Route = createFileRoute('/')({ component: PosTerminal })

type TypeFilter = 'all' | 'sale' | 'rental'

function PosTerminal() {
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user?.role === 'admin')
      navigate({ to: '/orders' })
  }, [user, navigate])

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [category, setCategory] = useState<FilterCategory>('all')
  const [showPayment, setShowPayment] = useState(false)
  const [cartSheetOpen, setCartSheetOpen] = useState(false)
  const [unitPickerProduct, setUnitPickerProduct] = useState<Product | null>(null)

  const { products, deductStock } = useProducts()
  const { items, addItem, removeItem, updateQty, setRentalDays, clear, subtotal, tax, total, itemCount, hasRentals } = useCart()
  const { addOrder, orders } = useOrders()

  const handleTypeFilter = (type: TypeFilter) => {
    setTypeFilter(type)
    setCategory('all')
  }

  const filtered = products.filter(p =>
    (typeFilter === 'all' || p.type === typeFilter)
    && (category === 'all' || p.category === category)
    && p.name.toLowerCase().includes(search.toLowerCase()),
  )

  const handlePaymentComplete = (method: 'cash' | 'qr', cashTendered?: number, rentalInfo?: RentalInfo, receiptImage?: string): number => {
    const nextOrderNumber = orders.length + 1
    addOrder({
      items,
      subtotal,
      tax,
      total,
      paymentMethod: method,
      cashTendered,
      change: cashTendered !== undefined ? cashTendered - total : undefined,
      receiptImage,
      studentName: rentalInfo?.studentName,
      studentId: rentalInfo?.studentId,
      phone: rentalInfo?.phone,
      email: rentalInfo?.email,
      roomNo: rentalInfo?.roomNo,
      session: rentalInfo?.session,
      returnDate: rentalInfo?.returnDate,
      rentalStatus: hasRentals ? 'active' : undefined,
    })
    deductStock(items)
    clear()
    setCartSheetOpen(false)
    return nextOrderNumber
  }

  const cartProps = {
    items,
    subtotal,
    tax,
    total,
    itemCount,
    hasRentals,
    onUpdateQty: updateQty,
    onSetRentalDays: setRentalDays,
    onRemove: removeItem,
    onClear: clear,
    onCharge: () => setShowPayment(true),
  }

  return (
    <div className="flex h-full relative">
      {/* Products panel */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="space-y-3 border-b border-slate-200 bg-white px-4 sm:px-6 py-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search products…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Type filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
            {(['all', 'sale', 'rental'] as TypeFilter[]).map(t => (
              <button
                key={t}
                onClick={() => handleTypeFilter(t)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors whitespace-nowrap',
                  typeFilter === t
                    ? t === 'rental'
                      ? 'bg-violet-600 text-white'
                      : t === 'sale'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
                )}
              >
                {t === 'all' ? 'All Items' : t === 'sale' ? 'For Sale' : 'For Rent'}
              </button>
            ))}
            <span className="text-xs text-slate-400 ml-auto whitespace-nowrap">
              {filtered.length}
              {' '}
              items
            </span>
          </div>

          <CategoryTabs value={category} typeFilter={typeFilter} onChange={setCategory} />
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 md:pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {filtered.length === 0
            ? (
                <div className="flex flex-col items-center justify-center h-64 gap-2 text-slate-300">
                  <Search size={40} strokeWidth={1} />
                  <p className="text-sm font-medium">No products found</p>
                </div>
              )
            : (
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                  {filtered.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      cartQty={items.find(i => i.product.id === product.id)?.quantity ?? 0}
                      onAdd={() => {
                        if (product.type === 'rental' && product.units && product.units.length > 0) {
                          setUnitPickerProduct(product)
                        }
                        else {
                          addItem(product)
                        }
                      }}
                    />
                  ))}
                </div>
              )}
        </div>
      </div>

      {/* Desktop cart — hidden on mobile */}
      <div className="hidden md:flex w-96 shrink-0 border-l border-slate-200">
        <CartPanel {...cartProps} />
      </div>

      {/* Mobile floating cart button */}
      <div className="fixed bottom-4 left-4 right-4 z-30 md:hidden">
        <button
          onClick={() => setCartSheetOpen(true)}
          className={cn(
            'w-full flex items-center justify-between rounded-2xl px-5 py-4 shadow-xl transition-all',
            itemCount > 0
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-800 text-slate-400 cursor-default',
          )}
        >
          <div className="flex items-center gap-3">
            <ShoppingCart size={20} />
            <span className="font-semibold text-sm">
              {itemCount > 0 ? `${itemCount} item${itemCount !== 1 ? 's' : ''}` : 'Cart is empty'}
            </span>
          </div>
          {itemCount > 0 && (
            <span className="font-bold text-sm">{formatCurrency(total)}</span>
          )}
        </button>
      </div>

      {/* Mobile cart bottom sheet */}
      {cartSheetOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0"
            style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
            onClick={() => setCartSheetOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 rounded-t-2xl overflow-hidden flex flex-col bg-white" style={{ height: '78vh' }}>
            <div className="flex-none w-12 h-1.5 rounded-full bg-slate-200 mx-auto mt-3 mb-1" />
            <CartPanel {...cartProps} onClose={() => setCartSheetOpen(false)} />
          </div>
        </div>
      )}

      {/* Unit picker modal */}
      {unitPickerProduct && (
        <UnitPickerModal
          product={unitPickerProduct}
          currentSelection={items.find(i => i.product.id === unitPickerProduct.id)?.selectedUnits ?? []}
          onConfirm={(selectedUnits) => { addItem(unitPickerProduct, selectedUnits); setUnitPickerProduct(null) }}
          onClose={() => setUnitPickerProduct(null)}
        />
      )}

      {/* Payment modal */}
      {showPayment && (
        <PaymentModal
          total={total}
          subtotal={subtotal}
          tax={tax}
          items={items}
          hasRentals={hasRentals}
          onComplete={handlePaymentComplete}
          onClose={() => setShowPayment(false)}
        />
      )}
    </div>
  )
}

interface UnitPickerModalProps {
  product: Product
  currentSelection: SelectedUnit[]
  onConfirm: (selected: SelectedUnit[]) => void
  onClose: () => void
}

function UnitPickerModal({ product, currentSelection, onConfirm, onClose }: UnitPickerModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set(currentSelection.map(u => u.id)))
  const units = product.units ?? []

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleConfirm = () => {
    const selectedUnits: SelectedUnit[] = units
      .filter(u => selected.has(u.id))
      .map(({ id, label, serialNo }) => ({ id, label, serialNo }))
    onConfirm(selectedUnits)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl mx-4 flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-slate-800">Select Unit</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {product.emoji}
              {' '}
              {product.name}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-4 py-3 space-y-2">
          {units.map((unit) => {
            const isRented = unit.status === 'rented'
            const isSelected = selected.has(unit.id)
            return (
              <button
                key={unit.id}
                type="button"
                disabled={isRented}
                onClick={() => toggle(unit.id)}
                className={cn(
                  'w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all',
                  isRented
                    ? 'border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed'
                    : isSelected
                      ? 'border-violet-400 bg-violet-50'
                      : 'border-slate-200 bg-white hover:border-violet-200 hover:bg-violet-50/30',
                )}
              >
                <div className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                  isSelected ? 'border-violet-600 bg-violet-600' : 'border-slate-300',
                )}
                >
                  {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{unit.label}</p>
                  {unit.serialNo && <p className="text-xs font-mono text-slate-400">{unit.serialNo}</p>}
                </div>
                <span className={cn(
                  'text-xs rounded-full px-2 py-0.5 font-medium shrink-0',
                  isRented ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700',
                )}
                >
                  {isRented ? 'In Use' : 'Available'}
                </span>
              </button>
            )
          })}
        </div>

        <div className="flex gap-3 px-5 py-4 border-t border-slate-100 shrink-0">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button
            className="flex-1"
            disabled={selected.size === 0}
            onClick={handleConfirm}
          >
            Add
            {' '}
            {selected.size > 0 ? `${selected.size} unit${selected.size !== 1 ? 's' : ''}` : 'to Cart'}
          </Button>
        </div>
      </div>
    </div>
  )
}
