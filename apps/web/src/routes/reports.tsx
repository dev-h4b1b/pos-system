import type { Order } from '../types'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '../context/auth-context'
import { useOrders } from '../hooks/use-orders'
import { formatCurrency } from '../lib/format'
import { cn } from '../lib/utils'

export const Route = createFileRoute('/reports')({ component: ReportsPage })

type Tab = 'day' | 'week'

function toLocalDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getOrdersForDate(orders: Order[], dateStr: string): Order[] {
  return orders.filter(o => toLocalDateStr(new Date(o.createdAt)) === dateStr)
}

interface DayStats {
  revenue: number
  count: number
  avg: number
  itemsSold: number
  itemsRented: number
  cash: number
  cashOrders: number
  qr: number
  qrOrders: number
  sales: number
  rentals: number
}

function computeCategorySales(orders: Order[]): { category: string, count: number }[] {
  const map: Record<string, number> = {}
  for (const order of orders) {
    for (const item of order.items) {
      if (item.product.type !== 'sale')
        continue
      map[item.product.category] = (map[item.product.category] ?? 0) + item.quantity
    }
  }
  return Object.entries(map)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
}

function computeStats(orders: Order[]): DayStats {
  const revenue = orders.reduce((s, o) => s + o.total, 0)
  const count = orders.length
  const avg = count > 0 ? revenue / count : 0
  const itemsSold = orders.reduce((s, o) => s + o.items.filter(i => i.product.type === 'sale').reduce((si, i) => si + i.quantity, 0), 0)
  const itemsRented = orders.reduce((s, o) => s + o.items.filter(i => i.product.type === 'rental').reduce((si, i) => si + i.quantity, 0), 0)
  const cashOrders = orders.filter(o => o.paymentMethod === 'cash').length
  const cash = orders.filter(o => o.paymentMethod === 'cash').reduce((s, o) => s + o.total, 0)
  const qrOrders = orders.filter(o => o.paymentMethod === 'qr').length
  const qr = orders.filter(o => o.paymentMethod === 'qr').reduce((s, o) => s + o.total, 0)
  // Revenue split by item type (not order type) so mixed orders are counted correctly
  const sales = orders.reduce((s, o) => s + o.items
    .filter(i => i.product.type === 'sale')
    .reduce((si, i) => si + i.product.price * i.quantity, 0), 0)
  const rentals = orders.reduce((s, o) => s + o.items
    .filter(i => i.product.type === 'rental')
    .reduce((si, i) => si + i.product.price * i.quantity * (i.rentalDays ?? 1), 0), 0)
  return { revenue, count, avg, itemsSold, itemsRented, cash, cashOrders, qr, qrOrders, sales, rentals }
}

function ReportsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { orders } = useOrders()
  const [tab, setTab] = useState<Tab>('day')

  const today = toLocalDateStr(new Date())
  const [selectedDate, setSelectedDate] = useState(today)

  useEffect(() => {
    if (user?.role !== 'admin')
      navigate({ to: '/orders' })
  }, [user, navigate])

  const goDay = (delta: number) => {
    const d = new Date(`${selectedDate}T00:00:00`)
    d.setDate(d.getDate() + delta)
    const next = toLocalDateStr(d)
    if (next <= today)
      setSelectedDate(next)
  }

  // ── Day view ──
  const dayOrders = getOrdersForDate(orders, selectedDate)
  const dayStats = computeStats(dayOrders)
  const dayCategorySales = computeCategorySales(dayOrders)

  // ── Week view — last 7 days ──
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const dateStr = toLocalDateStr(d)
    const dayOrders = getOrdersForDate(orders, dateStr)
    return { dateStr, date: d, orders: dayOrders, ...computeStats(dayOrders) }
  })

  const weekRevenue = weekDays.reduce((s, d) => s + d.revenue, 0)
  const weekOrders = weekDays.reduce((s, d) => s + d.count, 0)
  const maxRevenue = Math.max(...weekDays.map(d => d.revenue), 1)
  const weekCategorySales = computeCategorySales(weekDays.flatMap(d => d.orders))

  const selectedLabel = new Date(`${selectedDate}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="bg-white border-b border-slate-200 px-4 sm:px-8 py-5">
        <h1 className="text-xl font-bold text-slate-800">Sales Report</h1>
        <p className="text-sm text-slate-500 mt-0.5">Revenue and order analytics</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Tabs */}
        <div className="flex gap-1 border-b border-slate-200">
          {([['day', 'Daily'], ['week', 'Weekly (Last 7 Days)']] as [Tab, string][]).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── DAILY ── */}
        {tab === 'day' && (
          <>
            {/* Date navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => goDay(-1)}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <ChevronLeft size={16} className="text-slate-500" />
              </button>
              <input
                type="date"
                value={selectedDate}
                max={today}
                onChange={e => e.target.value && setSelectedDate(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {selectedDate !== today && (
                <button
                  onClick={() => setSelectedDate(today)}
                  className="text-xs text-indigo-600 font-medium hover:text-indigo-700 px-2"
                >
                  Today
                </button>
              )}
              <button
                onClick={() => goDay(1)}
                disabled={selectedDate >= today}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} className="text-slate-500" />
              </button>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-xl bg-blue-50 border border-blue-100 shadow-sm px-5 py-4">
                <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Total Revenue</p>
                <p className="text-2xl font-bold text-blue-700 mt-1">{formatCurrency(dayStats.revenue)}</p>
                <p className="text-xs text-blue-400">
                  {dayStats.count}
                  {' '}
                  orders
                </p>
              </div>
              <div className="rounded-xl bg-indigo-50 border border-indigo-100 shadow-sm px-5 py-4">
                <p className="text-xs font-medium text-indigo-600 uppercase tracking-wide">Avg Order</p>
                <p className="text-2xl font-bold text-indigo-700 mt-1">{formatCurrency(dayStats.avg)}</p>
                <p className="text-xs text-indigo-400">per transaction</p>
              </div>
              <div className="rounded-xl bg-emerald-50 border border-emerald-100 shadow-sm px-5 py-4">
                <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide">Total Sales</p>
                <p className="text-2xl font-bold text-emerald-700 mt-1">{formatCurrency(dayStats.sales)}</p>
                <p className="text-xs text-emerald-400">
                  {dayStats.itemsSold}
                  {' '}
                  item
                  {dayStats.itemsSold !== 1 ? 's' : ''}
                  {' '}
                  sold
                </p>
              </div>
              <div className="rounded-xl bg-violet-50 border border-violet-100 shadow-sm px-5 py-4">
                <p className="text-xs font-medium text-violet-600 uppercase tracking-wide">Total Rentals</p>
                <p className="text-2xl font-bold text-violet-700 mt-1">{formatCurrency(dayStats.rentals)}</p>
                <p className="text-xs text-violet-400">
                  {dayStats.itemsRented}
                  {' '}
                  item
                  {dayStats.itemsRented !== 1 ? 's' : ''}
                  {' '}
                  rented
                </p>
              </div>
            </div>

            {/* Payment method cards */}
            {dayStats.count > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="rounded-xl bg-emerald-50 border border-emerald-100 shadow-sm px-5 py-4">
                  <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide">💵 Cash</p>
                  <p className="text-2xl font-bold text-emerald-700 mt-1">{formatCurrency(dayStats.cash)}</p>
                  <p className="text-xs text-emerald-400">
                    {dayStats.cashOrders}
                    {' '}
                    order
                    {dayStats.cashOrders !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="rounded-xl bg-indigo-50 border border-indigo-100 shadow-sm px-5 py-4">
                  <p className="text-xs font-medium text-indigo-600 uppercase tracking-wide">📱 QR Pay</p>
                  <p className="text-2xl font-bold text-indigo-700 mt-1">{formatCurrency(dayStats.qr)}</p>
                  <p className="text-xs text-indigo-400">
                    {dayStats.qrOrders}
                    {' '}
                    order
                    {dayStats.qrOrders !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            )}

            {/* Items sold by category */}
            {dayCategorySales.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Items Sold by Category</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                  {dayCategorySales.map(({ category, count }) => (
                    <div key={category} className="rounded-xl bg-white border border-slate-100 shadow-sm px-4 py-3">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide capitalize truncate">{category}</p>
                      <p className="text-2xl font-bold text-slate-800 mt-1">{count}</p>
                      <p className="text-xs text-slate-400">
                        item
                        {count !== 1 ? 's' : ''}
                        {' '}
                        sold
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Orders table */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">{selectedLabel}</h3>
              {dayOrders.length === 0
                ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-300">
                      <TrendingUp size={44} strokeWidth={1} />
                      <p className="text-sm font-medium">No orders on this day</p>
                    </div>
                  )
                : (
                    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-100 bg-slate-50 text-left">
                              {['Order', 'Customer', 'Items', 'Method', 'Type', 'Total'].map(h => (
                                <th key={h} className={cn('px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide', h === 'Total' ? 'text-right' : '')}>
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {dayOrders.map((order, idx) => {
                              const totalItems = order.items.reduce((s, i) => s + i.quantity, 0)
                              return (
                                <tr key={order.id} className={cn('border-b border-slate-100 last:border-0', idx % 2 === 1 ? 'bg-slate-50/50' : '')}>
                                  <td className="px-4 py-3 font-medium text-slate-700">
                                    #
                                    {order.orderNumber}
                                  </td>
                                  <td className="px-4 py-3 text-slate-600">{order.studentName ?? '—'}</td>
                                  <td className="px-4 py-3 text-slate-500">
                                    {totalItems}
                                    {' '}
                                    item
                                    {totalItems !== 1 ? 's' : ''}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', order.paymentMethod === 'cash' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700')}>
                                      {order.paymentMethod === 'cash' ? '💵 Cash' : '📱 QR Pay'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', order.rentalStatus ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700')}>
                                      {order.rentalStatus ? 'Rental' : 'Sale'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-right font-semibold text-slate-800">{formatCurrency(order.total)}</td>
                                </tr>
                              )
                            })}
                          </tbody>
                          <tfoot>
                            <tr className="bg-slate-50 border-t border-slate-200">
                              <td colSpan={5} className="px-4 py-3 text-sm font-semibold text-slate-700">Total</td>
                              <td className="px-4 py-3 text-right text-sm font-bold text-slate-800">{formatCurrency(dayStats.revenue)}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  )}
            </div>
          </>
        )}

        {/* ── WEEKLY ── */}
        {tab === 'week' && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-xl bg-blue-50 border border-blue-100 shadow-sm px-5 py-4">
                <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Weekly Revenue</p>
                <p className="text-2xl font-bold text-blue-700 mt-1">{formatCurrency(weekRevenue)}</p>
                <p className="text-xs text-blue-400">
                  {weekOrders}
                  {' '}
                  orders total
                </p>
              </div>
              <div className="rounded-xl bg-indigo-50 border border-indigo-100 shadow-sm px-5 py-4">
                <p className="text-xs font-medium text-indigo-600 uppercase tracking-wide">Daily Average</p>
                <p className="text-2xl font-bold text-indigo-700 mt-1">{formatCurrency(weekRevenue / 7)}</p>
                <p className="text-xs text-indigo-400">per day</p>
              </div>
              <div className="rounded-xl bg-emerald-50 border border-emerald-100 shadow-sm px-5 py-4">
                <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide">Total Sales</p>
                <p className="text-2xl font-bold text-emerald-700 mt-1">{formatCurrency(weekDays.reduce((s, d) => s + d.sales, 0))}</p>
                <p className="text-xs text-emerald-400">
                  {weekDays.reduce((s, d) => s + d.itemsSold, 0)}
                  {' '}
                  items sold
                </p>
              </div>
              <div className="rounded-xl bg-violet-50 border border-violet-100 shadow-sm px-5 py-4">
                <p className="text-xs font-medium text-violet-600 uppercase tracking-wide">Total Rentals</p>
                <p className="text-2xl font-bold text-violet-700 mt-1">{formatCurrency(weekDays.reduce((s, d) => s + d.rentals, 0))}</p>
                <p className="text-xs text-violet-400">
                  {weekDays.reduce((s, d) => s + d.itemsRented, 0)}
                  {' '}
                  items rented
                </p>
              </div>
            </div>

            {/* Items sold by category — weekly */}
            {weekCategorySales.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Items Sold by Category</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                  {weekCategorySales.map(({ category, count }) => (
                    <div key={category} className="rounded-xl bg-white border border-slate-100 shadow-sm px-4 py-3">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide capitalize truncate">{category}</p>
                      <p className="text-2xl font-bold text-slate-800 mt-1">{count}</p>
                      <p className="text-xs text-slate-400">
                        item
                        {count !== 1 ? 's' : ''}
                        {' '}
                        sold
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bar chart */}
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h3 className="text-sm font-semibold text-slate-700 mb-6">Revenue — Last 7 Days</h3>
              <div className="flex items-end gap-2" style={{ height: '160px' }}>
                {weekDays.map((day) => {
                  const isToday = day.dateStr === today
                  const barH = maxRevenue > 0 ? Math.max((day.revenue / maxRevenue) * 120, day.revenue > 0 ? 6 : 0) : 0
                  return (
                    <div key={day.dateStr} className="flex-1 flex flex-col items-center justify-end gap-1.5" style={{ height: '160px' }}>
                      <span className="text-xs font-medium text-slate-500 text-center leading-tight">
                        {day.revenue > 0 ? formatCurrency(day.revenue) : ''}
                      </span>
                      <div
                        className="w-full rounded-t-lg transition-all"
                        style={{
                          height: `${barH}px`,
                          backgroundColor: isToday ? '#4f46e5' : '#c7d2fe',
                          minHeight: day.revenue > 0 ? '6px' : '0',
                        }}
                      />
                      <div className="text-center pb-1">
                        <p className="text-xs font-semibold" style={{ color: isToday ? '#4f46e5' : '#64748b' }}>
                          {new Date(`${day.dateStr}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short' })}
                        </p>
                        <p className="text-xs text-slate-400">
                          {new Date(`${day.dateStr}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Daily breakdown table */}
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-left">
                      {['Date', 'Orders', 'Items Sold', 'Items Rented', 'Cash', 'QR Pay', 'Sales', 'Rentals', 'Revenue'].map(h => (
                        <th key={h} className={cn('px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide', h !== 'Date' ? 'text-right' : '')}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...weekDays].reverse().map((day, idx) => {
                      const isToday = day.dateStr === today
                      return (
                        <tr key={day.dateStr} className={cn('border-b border-slate-100 last:border-0', isToday ? 'bg-indigo-50/50' : idx % 2 === 1 ? 'bg-slate-50/30' : '')}>
                          <td className="px-4 py-3">
                            <span className={cn('font-medium', isToday ? 'text-indigo-700' : 'text-slate-700')}>
                              {new Date(`${day.dateStr}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </span>
                            {isToday && (
                              <span className="ml-2 text-xs bg-indigo-100 text-indigo-600 rounded-full px-1.5 py-0.5 font-medium">Today</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600">{day.count || '—'}</td>
                          <td className="px-4 py-3 text-right text-slate-600">{day.itemsSold || '—'}</td>
                          <td className="px-4 py-3 text-right text-slate-600">{day.itemsRented || '—'}</td>
                          <td className="px-4 py-3 text-right text-slate-600">{day.cash > 0 ? formatCurrency(day.cash) : '—'}</td>
                          <td className="px-4 py-3 text-right text-slate-600">{day.qr > 0 ? formatCurrency(day.qr) : '—'}</td>
                          <td className="px-4 py-3 text-right text-slate-600">{day.sales > 0 ? formatCurrency(day.sales) : '—'}</td>
                          <td className="px-4 py-3 text-right text-slate-600">{day.rentals > 0 ? formatCurrency(day.rentals) : '—'}</td>
                          <td className={cn('px-4 py-3 text-right font-semibold', day.revenue > 0 ? 'text-slate-800' : 'text-slate-300')}>
                            {day.revenue > 0 ? formatCurrency(day.revenue) : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 border-t border-slate-200 font-semibold text-slate-700 text-sm">
                      <td className="px-4 py-3">7-Day Total</td>
                      <td className="px-4 py-3 text-right">{weekOrders}</td>
                      <td className="px-4 py-3 text-right">{weekDays.reduce((s, d) => s + d.itemsSold, 0)}</td>
                      <td className="px-4 py-3 text-right">{weekDays.reduce((s, d) => s + d.itemsRented, 0)}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(weekDays.reduce((s, d) => s + d.cash, 0))}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(weekDays.reduce((s, d) => s + d.qr, 0))}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(weekDays.reduce((s, d) => s + d.sales, 0))}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(weekDays.reduce((s, d) => s + d.rentals, 0))}</td>
                      <td className="px-4 py-3 text-right font-bold text-slate-800">{formatCurrency(weekRevenue)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
