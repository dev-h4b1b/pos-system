import type { Product, ProductType, RentalUnit } from '../types'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Check, Package, PackagePlus, Plus, Search, Trash2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { useAuth } from '../context/auth-context'
import { useProducts } from '../context/products-context'
import { formatCurrency } from '../lib/format'
import { cn } from '../lib/utils'

export const Route = createFileRoute('/products')({ component: ProductsPage })

type FilterCategory = 'all' | string
type FilterType = 'all' | ProductType

const EMOJIS = ['🎧', '🔌', '🔗', '📱', '💼', '🔋', '⚡', '💻', '🎮', '📷', '📸', '🖥️', '📽️', '⌨️', '🖱️', '🎙️', '📦', '🛠️']

function ProductsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user?.role !== 'admin')
      navigate({ to: '/orders' })
  }, [user, navigate])

  const { products, categories, addProduct, updateProduct, deleteProduct, addCategory, removeCategory } = useProducts()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<FilterType>('all')
  const [category, setCategory] = useState<FilterCategory>('all')
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [showManageGroups, setShowManageGroups] = useState(false)
  const [stockProduct, setStockProduct] = useState<Product | null>(null)

  const filtered = products.filter(p =>
    (typeFilter === 'all' || p.type === typeFilter)
    && (category === 'all' || p.category === category)
    && p.name.toLowerCase().includes(search.toLowerCase()),
  )

  const forSale = products.filter(p => p.type === 'sale')
  const forRent = products.filter(p => p.type === 'rental')
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= 5).length
  const outOfStock = products.filter(p => p.stock === 0).length

  const saveProduct = (data: Omit<Product, 'id'>) => {
    if (editingProduct) {
      updateProduct(editingProduct.id, data)
      setEditingProduct(null)
    }
    else {
      addProduct(data)
      setShowAdd(false)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="bg-white border-b border-slate-200 px-4 sm:px-8 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Products</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage inventory for sales and rentals</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowManageGroups(true)}>Manage Groups</Button>
          <Button onClick={() => setShowAdd(true)}>+ Add Product</Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-xl bg-blue-50 border border-blue-100 shadow-sm px-5 py-4">
            <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">For Sale</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">{forSale.length}</p>
            <p className="text-xs text-blue-400">products</p>
          </div>
          <div className="rounded-xl bg-violet-50 border border-violet-100 shadow-sm px-5 py-4">
            <p className="text-xs font-medium text-violet-600 uppercase tracking-wide">For Rent</p>
            <p className="text-2xl font-bold text-violet-700 mt-1">{forRent.length}</p>
            <p className="text-xs text-violet-400">items</p>
          </div>
          <div className="rounded-xl bg-amber-50 border border-amber-100 shadow-sm px-5 py-4">
            <p className="text-xs font-medium text-amber-600 uppercase tracking-wide">Low Stock</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{lowStock}</p>
            <p className="text-xs text-amber-400">≤ 5 units</p>
          </div>
          <div className="rounded-xl bg-red-50 border border-red-100 shadow-sm px-5 py-4">
            <p className="text-xs font-medium text-red-500 uppercase tracking-wide">Out of Stock</p>
            <p className="text-2xl font-bold text-red-500 mt-1">{outOfStock}</p>
            <p className="text-xs text-red-300">unavailable</p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input placeholder="Search products…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="flex gap-2">
            {([['all', 'All'], ['sale', 'Sale'], ['rental', 'Rental']] as [FilterType, string][]).map(([t, label]) => (
              <button
                key={t}
                onClick={() => { setTypeFilter(t); setCategory('all') }}
                className={cn(
                  'rounded-lg border px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap',
                  typeFilter === t
                    ? t === 'rental'
                      ? 'border-violet-500 bg-violet-50 text-violet-700'
                      : t === 'sale'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-700 bg-slate-700 text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                )}
              >
                {label}
              </button>
            ))}
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">All Groups</option>
              {categories.filter(c => typeFilter === 'all' || products.some(p => p.category === c && p.type === typeFilter)).map(c => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Grid */}
        {filtered.length === 0
          ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-300">
                <Package size={48} strokeWidth={1} />
                <p className="text-sm font-medium">No products found</p>
              </div>
            )
          : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                {filtered.map(product => (
                  <ProductManageCard
                    key={product.id}
                    product={product}
                    onEdit={() => setEditingProduct(product)}
                    onDelete={() => deleteProduct(product.id)}
                    onAddStock={() => setStockProduct(product)}
                  />
                ))}
              </div>
            )}
      </div>

      {(editingProduct || showAdd) && (
        <ProductFormModal
          product={editingProduct ?? undefined}
          categories={categories}
          onSave={saveProduct}
          onClose={() => { setEditingProduct(null); setShowAdd(false) }}
        />
      )}

      {stockProduct && (
        <AddStockModal
          product={stockProduct}
          onClose={() => setStockProduct(null)}
        />
      )}

      {showManageGroups && (
        <ManageGroupsModal
          categories={categories}
          products={products}
          onAdd={addCategory}
          onRemove={(name) => {
            if (category === name)
              setCategory('all'); removeCategory(name)
          }}
          onClose={() => setShowManageGroups(false)}
        />
      )}
    </div>
  )
}

interface ProductManageCardProps {
  product: Product
  onEdit: () => void
  onDelete: () => void
  onAddStock: () => void
}

function ProductManageCard({ product, onEdit, onDelete, onAddStock }: ProductManageCardProps) {
  const isRental = product.type === 'rental'
  return (
    <div className={cn(
      'group relative rounded-xl border bg-white shadow-sm p-4 space-y-3',
      product.stock === 0 ? 'border-red-100 bg-red-50/20' : isRental ? 'border-violet-100' : 'border-slate-100',
    )}
    >
      <div className="flex items-start justify-between">
        <span className="text-3xl">{product.emoji}</span>
        <div className={cn(
          'flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold',
          product.stock === 0
            ? 'bg-red-100 text-red-600'
            : product.stock <= 5
              ? 'bg-amber-100 text-amber-700'
              : isRental ? 'bg-violet-50 text-violet-700' : 'bg-emerald-50 text-emerald-700',
        )}
        >
          {product.stock}
        </div>
      </div>
      <div>
        <p className="font-medium text-slate-800 text-sm leading-tight">{product.name}</p>
        <p className={cn('font-semibold mt-0.5 text-sm', isRental ? 'text-violet-600' : 'text-blue-600')}>
          {formatCurrency(product.price)}
          {isRental ? '/day' : ''}
        </p>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Badge variant={isRental ? 'rental' : 'sale'}>{isRental ? 'Rental' : 'Sale'}</Badge>
          <Badge variant="category" category={product.category}>{product.category}</Badge>
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onAddStock} className="text-slate-300 hover:text-emerald-500 transition-colors" title="Add stock"><PackagePlus size={13} /></button>
          <button onClick={onEdit} className="text-xs text-slate-400 hover:text-indigo-600 font-medium transition-colors">Edit</button>
          <button onClick={onDelete} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
        </div>
      </div>
    </div>
  )
}

interface ProductFormModalProps {
  product?: Product
  categories: string[]
  onSave: (data: Omit<Product, 'id'>) => void
  onClose: () => void
}

function ProductFormModal({ product, categories, onSave, onClose }: ProductFormModalProps) {
  const [name, setName] = useState(product?.name ?? '')
  const [price, setPrice] = useState(product ? String(product.price) : '')
  const [stock, setStock] = useState(product ? String(product.stock) : '0')
  const [type, setType] = useState<ProductType>(product?.type ?? 'sale')
  const [category, setCategory] = useState<string>(product?.category ?? categories[0] ?? '')
  const [emoji, setEmoji] = useState(product?.emoji ?? '🎧')

  // Unit tracking
  const [units, setUnits] = useState<RentalUnit[]>(product?.units ?? [])
  const [addingUnit, setAddingUnit] = useState(false)
  const [newUnitLabel, setNewUnitLabel] = useState('')
  const [newUnitSerial, setNewUnitSerial] = useState('')
  const unitLabelRef = useRef<HTMLInputElement>(null)

  const availableUnits = units.filter(u => u.status === 'available').length
  const derivedStock = type === 'rental' && units.length > 0 ? availableUnits : Number.parseInt(stock) || 0

  const isValid = name.trim().length > 0 && Number.parseFloat(price) > 0 && derivedStock >= 0 && category.length > 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid)
      return
    const finalStock = type === 'rental' && units.length > 0 ? availableUnits : Number.parseInt(stock)
    onSave({ name: name.trim(), price: Number.parseFloat(price), stock: finalStock, category, emoji, type, units: type === 'rental' ? units : undefined })
  }

  const confirmAddUnit = () => {
    const label = newUnitLabel.trim()
    if (!label)
      return
    const serial = newUnitSerial.trim() || undefined
    setUnits(prev => [...prev, { id: `u_${Date.now()}_${Math.random().toString(36).slice(2)}`, label, serialNo: serial, status: 'available' }])
    setNewUnitLabel('')
    setNewUnitSerial('')
    unitLabelRef.current?.focus()
  }

  const removeUnit = (id: string) => setUnits(prev => prev.filter(u => u.id !== id))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 shrink-0">
          <h2 className="text-lg font-semibold text-slate-800">{product ? 'Edit Product' : 'Add Product'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 overflow-y-auto">
          {/* Type */}
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-2">Type</label>
            <div className="flex gap-2">
              {(['sale', 'rental'] as ProductType[]).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={cn(
                    'flex-1 rounded-lg border py-2 text-sm font-semibold capitalize transition-colors',
                    type === t
                      ? t === 'rental'
                        ? 'border-violet-500 bg-violet-50 text-violet-700'
                        : 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300',
                  )}
                >
                  {t === 'sale' ? '💵 For Sale' : '📅 For Rent'}
                </button>
              ))}
            </div>
          </div>

          {/* Emoji */}
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-2">Icon</label>
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map(e => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg border text-lg transition-colors',
                    emoji === e ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 hover:border-slate-300',
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-1.5">Name</label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. MacBook Pro 14&quot;" required />
          </div>

          <div className={cn('grid gap-3', type === 'rental' && units.length > 0 ? 'grid-cols-2' : 'grid-cols-3')}>
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-1.5">
                {type === 'rental' ? 'Rate/Day' : 'Price'}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-medium">RM</span>
                <Input type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" className="pl-10" required />
              </div>
            </div>
            {!(type === 'rental' && units.length > 0) && (
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-1.5">Stock</label>
                <Input type="number" min="0" step="1" value={stock} onChange={e => setStock(e.target.value)} placeholder="0" required />
              </div>
            )}
            {type === 'rental' && units.length > 0 && (
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-1.5">Stock</label>
                <div className="flex h-10 items-center rounded-lg border border-slate-100 bg-slate-50 px-3 text-sm text-slate-500">
                  {availableUnits}
                  {' '}
                  of
                  {units.length}
                  {' '}
                  available
                </div>
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-1.5">Group</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Rental units */}
          {type === 'rental' && (
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-2">Rental Units</label>

              {units.length > 0 && (
                <div className="space-y-1.5 mb-2">
                  {units.map(unit => (
                    <div key={unit.id} className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm">
                      <span className="font-medium text-slate-700 w-24 shrink-0 truncate">{unit.label}</span>
                      {unit.serialNo && <span className="font-mono text-xs text-slate-400 flex-1 truncate">{unit.serialNo}</span>}
                      <span className={cn(
                        'text-xs rounded-full px-2 py-0.5 font-medium shrink-0',
                        unit.status === 'rented' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700',
                      )}
                      >
                        {unit.status === 'rented' ? 'In Use' : 'Available'}
                      </span>
                      {unit.status !== 'rented' && (
                        <button type="button" onClick={() => removeUnit(unit.id)} className="text-slate-300 hover:text-red-400 transition-colors shrink-0">
                          <X size={13} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {addingUnit
                ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          ref={unitLabelRef}
                          placeholder="Label (e.g. Laptop 1)"
                          value={newUnitLabel}
                          onChange={e => setNewUnitLabel(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); confirmAddUnit() } if (e.key === 'Escape') { setAddingUnit(false) } }}
                          className="flex h-10 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                        <Input
                          placeholder="Serial No. (optional)"
                          value={newUnitSerial}
                          onChange={e => setNewUnitSerial(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); confirmAddUnit() } if (e.key === 'Escape') { setAddingUnit(false) } }}
                          className="flex-1"
                        />
                        <button
                          type="button"
                          onClick={confirmAddUnit}
                          disabled={!newUnitLabel.trim()}
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-white disabled:opacity-40 hover:bg-violet-700 transition-colors"
                        >
                          <Check size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => { setAddingUnit(false); setNewUnitLabel(''); setNewUnitSerial('') }}
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          <X size={15} />
                        </button>
                      </div>
                      <p className="text-xs text-slate-400">Press Enter to add and continue, Esc to cancel</p>
                    </div>
                  )
                : (
                    <button
                      type="button"
                      onClick={() => { setAddingUnit(true); setTimeout(() => unitLabelRef.current?.focus(), 50) }}
                      className="flex items-center gap-1.5 text-xs font-medium text-violet-600 hover:text-violet-700 transition-colors"
                    >
                      <Plus size={13} />
                      {' '}
                      Add unit
                    </button>
                  )}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={!isValid} className="flex-1">{product ? 'Save Changes' : 'Add Product'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AddStockModal({ product, onClose }: { product: Product, onClose: () => void }) {
  const { restockProduct, updateProduct } = useProducts()
  const isUnitTracked = product.type === 'rental' && !!product.units && product.units.length > 0

  // For qty-based restock
  const [qty, setQty] = useState('1')

  // For unit-tracked restock
  const [units, setUnits] = useState<RentalUnit[]>(product.units ?? [])
  const [addingUnit, setAddingUnit] = useState(false)
  const [newUnitLabel, setNewUnitLabel] = useState('')
  const [newUnitSerial, setNewUnitSerial] = useState('')
  const unitLabelRef = useRef<HTMLInputElement>(null)

  const newUnitsAdded = units.length - (product.units?.length ?? 0)

  const confirmAddUnit = () => {
    const label = newUnitLabel.trim()
    if (!label)
      return
    setUnits(prev => [...prev, {
      id: `u_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      label,
      serialNo: newUnitSerial.trim() || undefined,
      status: 'available',
    }])
    setNewUnitLabel('')
    setNewUnitSerial('')
    unitLabelRef.current?.focus()
  }

  const handleSave = () => {
    if (isUnitTracked) {
      const availableCount = units.filter(u => u.status === 'available').length
      updateProduct(product.id, { ...product, units, stock: availableCount })
    }
    else {
      restockProduct(product.id, Number.parseInt(qty) || 0)
    }
    onClose()
  }

  const canSave = isUnitTracked ? newUnitsAdded > 0 : (Number.parseInt(qty) || 0) > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl mx-4 flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-slate-800">Add Stock</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {product.emoji}
              {' '}
              {product.name}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          {/* Current stock badge */}
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
            <div className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold',
              product.stock === 0
                ? 'bg-red-100 text-red-600'
                : product.stock <= 5
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-emerald-100 text-emerald-700',
            )}
            >
              {product.stock}
            </div>
            <div>
              <p className="text-xs text-slate-400">Current stock</p>
              <p className="text-sm font-medium text-slate-700">
                {product.stock}
                {' '}
                unit
                {product.stock !== 1 ? 's' : ''}
                {' '}
                available
              </p>
            </div>
          </div>

          {isUnitTracked
            ? (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Existing Units</p>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {units.map((unit, i) => (
                      <div
                        key={unit.id}
                        className={cn(
                          'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm',
                          i >= (product.units?.length ?? 0) ? 'border-emerald-200 bg-emerald-50' : 'border-slate-100 bg-slate-50',
                        )}
                      >
                        <span className="font-medium text-slate-700 flex-1 truncate">{unit.label}</span>
                        {unit.serialNo && <span className="font-mono text-xs text-slate-400 truncate">{unit.serialNo}</span>}
                        <span className={cn(
                          'text-xs rounded-full px-2 py-0.5 font-medium shrink-0',
                          unit.status === 'rented' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700',
                        )}
                        >
                          {unit.status === 'rented' ? 'In Use' : 'Available'}
                        </span>
                        {i >= (product.units?.length ?? 0) && (
                          <button
                            type="button"
                            onClick={() => setUnits(prev => prev.filter(u => u.id !== unit.id))}
                            className="text-slate-300 hover:text-red-400 transition-colors shrink-0"
                          >
                            <X size={13} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Add New Units</p>
                  {addingUnit
                    ? (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <input
                              ref={unitLabelRef}
                              placeholder="Label (e.g. Laptop 3)"
                              value={newUnitLabel}
                              onChange={e => setNewUnitLabel(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') { e.preventDefault(); confirmAddUnit() } if (e.key === 'Escape')
                                  setAddingUnit(false)
                              }}
                              className="flex h-10 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                            <Input
                              placeholder="Serial No. (optional)"
                              value={newUnitSerial}
                              onChange={e => setNewUnitSerial(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') { e.preventDefault(); confirmAddUnit() } if (e.key === 'Escape')
                                  setAddingUnit(false)
                              }}
                              className="flex-1"
                            />
                            <button
                              type="button"
                              onClick={confirmAddUnit}
                              disabled={!newUnitLabel.trim()}
                              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white disabled:opacity-40 hover:bg-emerald-700 transition-colors"
                            >
                              <Check size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => { setAddingUnit(false); setNewUnitLabel(''); setNewUnitSerial('') }}
                              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                              <X size={15} />
                            </button>
                          </div>
                          <p className="text-xs text-slate-400">Enter to add and continue, Esc to cancel</p>
                        </div>
                      )
                    : (
                        <button
                          type="button"
                          onClick={() => { setAddingUnit(true); setTimeout(() => unitLabelRef.current?.focus(), 50) }}
                          className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                        >
                          <Plus size={13} />
                          {' '}
                          Add unit
                        </button>
                      )}
                </div>
              )
            : (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block">Quantity to Add</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setQty(v => String(Math.max(1, (Number.parseInt(v) || 1) - 1)))}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-colors text-lg font-medium"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={qty}
                      onChange={e => setQty(e.target.value)}
                      className="flex h-10 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-center text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setQty(v => String((Number.parseInt(v) || 0) + 1))}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-colors text-lg font-medium"
                    >
                      +
                    </button>
                  </div>
                  {(Number.parseInt(qty) || 0) > 0 && (
                    <p className="text-xs text-emerald-600 font-medium">
                      New stock:
                      {' '}
                      {product.stock + (Number.parseInt(qty) || 0)}
                      {' '}
                      units
                    </p>
                  )}
                </div>
              )}
        </div>

        <div className="flex gap-3 px-6 pb-5 shrink-0">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={handleSave} disabled={!canSave} className="flex-1 gap-2">
            <PackagePlus size={15} />
            {isUnitTracked ? `Add ${newUnitsAdded} Unit${newUnitsAdded !== 1 ? 's' : ''}` : 'Add Stock'}
          </Button>
        </div>
      </div>
    </div>
  )
}

interface ManageGroupsModalProps {
  categories: string[]
  products: Product[]
  onAdd: (name: string) => void
  onRemove: (name: string) => void
  onClose: () => void
}

function ManageGroupsModal({ categories, products, onAdd, onRemove, onClose }: ManageGroupsModalProps) {
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')

  const confirm = () => {
    const trimmed = newName.trim().toLowerCase()
    if (!trimmed)
      return
    onAdd(trimmed)
    setNewName('')
    setAdding(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl mx-4 flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 shrink-0">
          <h2 className="text-lg font-semibold text-slate-800">Manage Groups</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
        </div>

        <div className="overflow-y-auto flex-1 px-4 py-3 space-y-1.5">
          {categories.map((cat) => {
            const count = products.filter(p => p.category === cat).length
            return (
              <div key={cat} className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
                <span className="flex-1 text-sm font-medium text-slate-700 capitalize">{cat}</span>
                <span className="text-xs text-slate-400">
                  {count}
                  {' '}
                  product
                  {count !== 1 ? 's' : ''}
                </span>
                <button
                  onClick={() => onRemove(cat)}
                  className="text-slate-300 hover:text-red-500 transition-colors"
                  title="Remove group"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )
          })}
          {categories.length === 0 && !adding && (
            <p className="text-sm text-slate-400 text-center py-6">No groups yet</p>
          )}
        </div>

        <div className="px-4 py-3 border-t border-slate-100 shrink-0 space-y-3">
          {adding
            ? (
                <div className="flex gap-2">
                  <Input
                    autoFocus
                    placeholder="Group name…"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter')
                        confirm(); if (e.key === 'Escape') { setAdding(false); setNewName('') }
                    }}
                    className="flex-1"
                  />
                  <button
                    onClick={confirm}
                    disabled={!newName.trim()}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white disabled:opacity-40 hover:bg-indigo-700 transition-colors"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={() => { setAdding(false); setNewName('') }}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              )
            : (
                <button
                  onClick={() => setAdding(true)}
                  className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  <Plus size={14} />
                  {' '}
                  Add group
                </button>
              )}
          <p className="text-xs text-slate-400">Removing a group doesn't delete products assigned to it.</p>
        </div>
      </div>
    </div>
  )
}
