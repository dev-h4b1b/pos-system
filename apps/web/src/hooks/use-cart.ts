import type { CartItem, Product, SelectedUnit } from '../types'
import { useCallback, useState } from 'react'

const TAX_RATE = 0.08

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([])

  const addItem = useCallback((product: Product, selectedUnits?: SelectedUnit[]) => {
    setItems((prev) => {
      const idx = prev.findIndex(i => i.product.id === product.id)

      if (product.units && product.units.length > 0) {
        // Unit-tracked product: replace selection entirely
        if (!selectedUnits || selectedUnits.length === 0) {
          return prev.filter(i => i.product.id !== product.id)
        }
        const item: CartItem = {
          product,
          quantity: selectedUnits.length,
          rentalDays: product.type === 'rental' ? (prev[idx]?.rentalDays ?? 1) : undefined,
          selectedUnits,
        }
        if (idx >= 0)
          return prev.map((i, n) => n === idx ? item : i)
        return [...prev, item]
      }

      // Regular: quantity-based
      if (idx >= 0) {
        return prev.map((i, n) => n === idx ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { product, quantity: 1, rentalDays: product.type === 'rental' ? 1 : undefined }]
    })
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.product.id !== id))
  }, [])

  const updateQty = useCallback((id: string, qty: number) => {
    setItems((prev) => {
      const item = prev.find(i => i.product.id === id)
      if (item?.selectedUnits)
        return prev // unit-tracked: qty is locked
      if (qty <= 0)
        return prev.filter(i => i.product.id !== id)
      return prev.map(i => i.product.id === id ? { ...i, quantity: qty } : i)
    })
  }, [])

  const setRentalDays = useCallback((id: string, days: number) => {
    setItems(prev => prev.map(i => i.product.id === id ? { ...i, rentalDays: Math.max(1, days) } : i))
  }, [])

  const clear = useCallback(() => setItems([]), [])

  const subtotal = items.reduce((sum, i) => {
    const days = i.product.type === 'rental' ? (i.rentalDays ?? 1) : 1
    return sum + i.product.price * i.quantity * days
  }, 0)

  const tax = subtotal * TAX_RATE
  const total = subtotal + tax
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)
  const hasRentals = items.some(i => i.product.type === 'rental')

  return { items, addItem, removeItem, updateQty, setRentalDays, clear, subtotal, tax, total, itemCount, hasRentals }
}
