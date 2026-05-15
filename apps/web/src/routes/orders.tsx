import type { Order } from '../types'
import { createFileRoute } from '@tanstack/react-router'
import { CalendarDays, ChevronDown, ChevronUp, Printer, RotateCcw, Search, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { useProducts } from '../context/products-context'
import { useOrders } from '../hooks/use-orders'
import { formatCurrency, formatDate, formatTime } from '../lib/format'
import { printOrderReceipt } from '../lib/receipt'
import { cn } from '../lib/utils'

export const Route = createFileRoute('/orders')({ component: OrdersPage })

type Tab = 'all' | 'rentals'

function OrdersPage() {
  const [tab, setTab] = useState<Tab>('all')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const { orders, todayOrders, todayRevenue, avgOrder, activeRentals, overdueCount, markAsReturned } = useOrders()
  const { addStock } = useProducts()

  const handleReturn = (orderId: string) => {
    const returnedItems = markAsReturned(orderId)
    addStock(returnedItems)
  }

  const displayOrders = tab === 'rentals'
    ? activeRentals
    : orders.filter(o =>
        String(o.orderNumber).includes(search)
        || o.paymentMethod.includes(search.toLowerCase())
        || (o.studentName?.toLowerCase().includes(search.toLowerCase()) ?? false),
      )

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-8 py-5">
        <h1 className="text-xl font-bold text-slate-800">Orders</h1>
        <p className="text-sm text-slate-500 mt-0.5">Sales and active rentals</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Today's Revenue" value={formatCurrency(todayRevenue)} sub={`${todayOrders.length} orders`} icon="💰" />
          <StatCard label="Orders Today" value={String(todayOrders.length)} sub="transactions" icon="🧾" />
          <StatCard label="Avg Order" value={formatCurrency(avgOrder)} sub="per transaction" icon="📊" />
          <div
            className={cn(
              'rounded-xl border shadow-sm px-5 py-4 cursor-pointer transition-colors',
              overdueCount > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-slate-100',
            )}
            onClick={() => setTab('rentals')}
          >
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Active Rentals</p>
            <p className={cn('text-2xl font-bold mt-1', overdueCount > 0 ? 'text-red-600' : 'text-amber-500')}>
              {activeRentals.length}
            </p>
            {overdueCount > 0
              ? (
                  <p className="text-xs text-red-500 font-medium">
                    {overdueCount}
                    {' '}
                    overdue
                  </p>
                )
              : <p className="text-xs text-slate-400">click to view</p>}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-slate-200">
          {([['all', 'All Orders'], ['rentals', 'Active Rentals']] as [Tab, string][]).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                tab === t
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700',
              )}
            >
              {label}
              {t === 'rentals' && activeRentals.length > 0 && (
                <span className={cn(
                  'ml-2 rounded-full px-1.5 py-0.5 text-xs font-bold',
                  overdueCount > 0 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700',
                )}
                >
                  {activeRentals.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search (all tab only) */}
        {tab === 'all' && (
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search by order #, customer, or payment method…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        )}

        {/* Orders list */}
        {displayOrders.length === 0
          ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-300">
                {tab === 'rentals' ? <CalendarDays size={48} strokeWidth={1} /> : <TrendingUp size={48} strokeWidth={1} />}
                <p className="text-sm font-medium">
                  {tab === 'rentals' ? 'No active rentals' : orders.length === 0 ? 'No orders yet' : 'No results'}
                </p>
              </div>
            )
          : (
              <div className="space-y-2">
                {displayOrders.map(order => (
                  <OrderRow
                    key={order.id}
                    order={order}
                    isExpanded={expandedId === order.id}
                    onToggle={() => setExpandedId(expandedId === order.id ? null : order.id)}
                    onReturn={handleReturn}
                  />
                ))}
              </div>
            )}
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, icon }: { label: string, value: string, sub: string, icon: string }) {
  return (
    <div className="rounded-xl bg-white border border-slate-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
    </div>
  )
}

interface OrderRowProps {
  order: Order
  isExpanded: boolean
  onToggle: () => void
  onReturn: (id: string) => void
}

function OrderRow({ order, isExpanded, onToggle, onReturn }: OrderRowProps) {
  const isRental = !!order.rentalStatus
  const isOverdue = isRental && order.rentalStatus === 'active' && order.returnDate && new Date(order.returnDate) < new Date()
  const totalItems = order.items.reduce((s, i) => s + i.quantity, 0)

  return (
    <div className={cn(
      'rounded-xl border bg-white shadow-sm overflow-hidden transition-all',
      isExpanded ? 'border-indigo-200' : isOverdue ? 'border-red-200' : 'border-slate-100',
      isOverdue && 'bg-red-50/30',
    )}
    >
      <button
        className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-slate-50/50 transition-colors"
        onClick={onToggle}
      >
        <div className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold',
          isOverdue ? 'bg-red-100 text-red-600' : isRental ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-600',
        )}
        >
          #
          {order.orderNumber}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-slate-800">
              {order.studentName ?? `${totalItems} item${totalItems !== 1 ? 's' : ''}`}
            </p>
            {isOverdue && <Badge variant="overdue">Overdue</Badge>}
            {isRental && order.rentalStatus === 'returned' && <Badge variant="returned">Returned</Badge>}
          </div>
          <p className="text-xs text-slate-400">
            {formatDate(order.createdAt)}
            {' '}
            ·
            {formatTime(order.createdAt)}
            {order.returnDate && ` · Return by ${formatDate(order.returnDate)}`}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Badge variant={order.paymentMethod}>{order.paymentMethod === 'cash' ? '💵 Cash' : '📱 QR Pay'}</Badge>
          {isRental && (
            <Badge variant={isOverdue ? 'overdue' : order.rentalStatus === 'returned' ? 'returned' : 'active'}>
              {isRental ? 'Rental' : ''}
            </Badge>
          )}
          <span className="font-semibold text-slate-800 w-20 text-right">{formatCurrency(order.total)}</span>
          {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-slate-100 px-5 py-4 bg-slate-50/50 space-y-4">
          {/* Student info */}
          {order.studentName && (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Student</p>
                  <p className="font-medium text-slate-700">{order.studentName}</p>
                </div>
                {order.studentId && (
                  <div>
                    <p className="text-xs text-slate-400 mb-0.5">ID No.</p>
                    <p className="font-medium text-slate-700">{order.studentId}</p>
                  </div>
                )}
                {order.roomNo && (
                  <div>
                    <p className="text-xs text-slate-400 mb-0.5">Room</p>
                    <p className="font-medium text-slate-700">{order.roomNo}</p>
                  </div>
                )}
                {order.session && (
                  <div>
                    <p className="text-xs text-slate-400 mb-0.5">Session</p>
                    <p className="font-medium text-slate-700 capitalize">{order.session}</p>
                  </div>
                )}
                {order.returnDate && (
                  <div>
                    <p className="text-xs text-slate-400 mb-0.5">Return By</p>
                    <p className={cn('font-semibold', isOverdue ? 'text-red-600' : 'text-violet-700')}>
                      {formatDate(order.returnDate)}
                    </p>
                  </div>
                )}
              </div>
              {(order.phone || order.email) && (
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                  {order.phone && (
                    <div>
                      <p className="text-xs text-slate-400 mb-0.5">Phone</p>
                      <p className="font-medium text-slate-700">{order.phone}</p>
                    </div>
                  )}
                  {order.email && (
                    <div>
                      <p className="text-xs text-slate-400 mb-0.5">Email</p>
                      <p className="font-medium text-slate-700">{order.email}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* QR receipt */}
          {order.receiptImage && (
            <div>
              <p className="text-xs text-slate-400 mb-1.5 font-medium">QR Payment Receipt</p>
              <img
                src={order.receiptImage}
                alt="Payment receipt"
                className="rounded-lg border border-slate-200 max-h-40 object-contain"
              />
            </div>
          )}

          {/* Items */}
          <div className="space-y-3">
            {order.items.map(item => (
              <div key={item.product.id} className="space-y-1.5">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-base">{item.product.emoji}</span>
                  <span className="flex-1 text-slate-700">{item.product.name}</span>
                  {item.product.type === 'rental' && item.rentalDays && (
                    <span className="text-xs text-violet-500 bg-violet-50 rounded-full px-2 py-0.5">
                      {item.rentalDays}
                      d
                    </span>
                  )}
                  <span className="text-slate-400">
                    ×
                    {item.quantity}
                  </span>
                  <span className="font-medium text-slate-700 w-16 text-right">
                    {formatCurrency(item.product.price * item.quantity * (item.rentalDays ?? 1))}
                  </span>
                </div>
                {item.selectedUnits && item.selectedUnits.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pl-7">
                    {item.selectedUnits.map(u => (
                      <span key={u.id} className="inline-flex items-center gap-1.5 rounded-lg border border-violet-100 bg-violet-50 px-2 py-0.5">
                        <span className="text-xs font-semibold text-violet-700">{u.label}</span>
                        {u.serialNo && <span className="text-xs font-mono text-violet-400">{u.serialNo}</span>}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="pt-3 border-t border-slate-200 space-y-1">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>Tax</span>
              <span>{formatCurrency(order.tax)}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold text-slate-800">
              <span>Total</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
            {order.paymentMethod === 'cash' && order.change !== undefined && order.change > 0 && (
              <div className="flex justify-between text-xs text-emerald-600 font-medium">
                <span>Change given</span>
                <span>{formatCurrency(order.change)}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className={cn('flex gap-2', order.rentalStatus === 'active' ? '' : 'justify-end')}>
            {order.rentalStatus === 'active' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onReturn(order.id)}
                className="flex-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              >
                <RotateCcw size={14} className="mr-2" />
                {' '}
                Mark as Returned
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => printOrderReceipt(order)}
              className="gap-1.5 text-slate-600"
            >
              <Printer size={14} />
              Print Receipt
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
