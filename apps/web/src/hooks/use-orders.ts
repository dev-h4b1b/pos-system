import type { CartItem, Order } from '../types'
import { useCallback, useState } from 'react'

const STORAGE_KEY = 'pos_orders'

function loadOrders(): Order[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Order[]) : []
  }
  catch { return [] }
}

function saveOrders(orders: Order[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(orders)) }
  catch { /* quota */ }
}

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>(loadOrders)

  const addOrder = useCallback((data: Omit<Order, 'id' | 'orderNumber' | 'createdAt'>) => {
    setOrders((prev) => {
      const order: Order = {
        ...data,
        id: crypto.randomUUID(),
        orderNumber: prev.length + 1,
        createdAt: new Date().toISOString(),
      }
      const updated = [order, ...prev]
      saveOrders(updated)
      return updated
    })
  }, [])

  const markAsReturned = useCallback((orderId: string): CartItem[] => {
    let returnedItems: CartItem[] = []
    setOrders((prev) => {
      const updated = prev.map((o) => {
        if (o.id !== orderId)
          return o
        returnedItems = o.items.filter(i => i.product.type === 'rental')
        return { ...o, rentalStatus: 'returned' as const }
      })
      saveOrders(updated)
      return updated
    })
    return returnedItems
  }, [])

  const todayOrders = orders.filter((o) => {
    const d = new Date(o.createdAt)
    return d.toDateString() === new Date().toDateString()
  })

  const activeRentals = orders.filter(o => o.rentalStatus === 'active')

  const overdueCount = activeRentals.filter(o =>
    o.returnDate && new Date(o.returnDate) < new Date(),
  ).length

  const todayRevenue = todayOrders.reduce((s, o) => s + o.total, 0)
  const avgOrder = todayOrders.length > 0 ? todayRevenue / todayOrders.length : 0

  return { orders, addOrder, markAsReturned, todayOrders, todayRevenue, avgOrder, activeRentals, overdueCount }
}
