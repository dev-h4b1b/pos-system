import { CalendarDays, Minus, Plus, ShoppingCart, Trash2, X } from "lucide-react";
import { formatCurrency } from "../../lib/format";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import type { CartItem } from "../../types";

interface CartPanelProps {
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  itemCount: number;
  hasRentals: boolean;
  onUpdateQty: (id: string, qty: number) => void;
  onSetRentalDays: (id: string, days: number) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onCharge: () => void;
  onClose?: () => void; // mobile bottom sheet close
}

export function CartPanel({ items, subtotal, tax, total, itemCount, hasRentals, onUpdateQty, onSetRentalDays, onRemove, onClear, onCharge, onClose }: CartPanelProps) {
  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-slate-800">Current Order</h2>
          {itemCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1.5 text-xs font-bold text-white">
              {itemCount}
            </span>
          )}
          {hasRentals && (
            <span className="flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">
              <CalendarDays size={11} /> Rental
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {items.length > 0 && (
            <button
              onClick={onClear}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors"
            >
              <Trash2 size={13} /> Clear
            </button>
          )}
          {onClose && (
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto">
        {items.length === 0
          ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-300 py-16">
                <ShoppingCart size={48} strokeWidth={1} />
                <p className="text-sm font-medium">Cart is empty</p>
                <p className="text-xs text-center px-8">Tap a product to add it to the order</p>
              </div>
            )
          : (
              <ul className="divide-y divide-slate-50 px-4 py-2">
                {items.map(item => (
                  <CartItemRow
                    key={item.product.id}
                    item={item}
                    onUpdateQty={onUpdateQty}
                    onSetRentalDays={onSetRentalDays}
                    onRemove={onRemove}
                  />
                ))}
              </ul>
            )}
      </div>

      {/* Footer */}
      <div className={cn("border-t border-slate-100 px-5 py-4 space-y-3 shrink-0", items.length === 0 && "opacity-50")}>
        <div className="space-y-1.5">
          <div className="flex justify-between text-sm text-slate-500">
            <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-slate-500">
            <span>Tax (8%)</span><span>{formatCurrency(tax)}</span>
          </div>
          <div className="flex justify-between font-semibold text-slate-800 pt-1 border-t border-slate-100">
            <span>Total</span>
            <span className="text-lg">{formatCurrency(total)}</span>
          </div>
        </div>
        <Button size="lg" className="w-full" disabled={items.length === 0} onClick={onCharge}>
          {hasRentals ? "Confirm Rental" : "Charge"} · {formatCurrency(total)}
        </Button>
      </div>
    </div>
  );
}

interface CartItemRowProps {
  item: CartItem;
  onUpdateQty: (id: string, qty: number) => void;
  onSetRentalDays: (id: string, days: number) => void;
  onRemove: (id: string) => void;
}

function QtyButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50 transition-colors active:bg-slate-100"
    >
      {children}
    </button>
  );
}

function CartItemRow({ item, onUpdateQty, onSetRentalDays, onRemove }: CartItemRowProps) {
  const { product, quantity, rentalDays, selectedUnits } = item;
  const isRental = product.type === "rental";
  const hasUnits = selectedUnits && selectedUnits.length > 0;
  const days = rentalDays ?? 1;
  const lineTotal = product.price * quantity * (isRental ? days : 1);

  return (
    <li className="py-3 space-y-2">
      <div className="flex items-center gap-3">
        <span className="text-xl shrink-0">{product.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-800 truncate">{product.name}</p>
          <p className="text-xs text-slate-400">
            {isRental ? `${formatCurrency(product.price)}/day` : `${formatCurrency(product.price)} each`}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-semibold text-slate-700 w-16 text-right">{formatCurrency(lineTotal)}</span>
          <button onClick={() => onRemove(product.id)} className="text-slate-300 hover:text-red-400 transition-colors">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Unit tags */}
      {hasUnits && (
        <div className="flex flex-wrap gap-1 pl-8">
          {selectedUnits.map(u => (
            <span key={u.id} className="inline-flex flex-col rounded-lg bg-violet-50 border border-violet-100 px-2 py-0.5">
              <span className="text-xs font-semibold text-violet-700 leading-tight">{u.label}</span>
              {u.serialNo && <span className="text-xs font-mono text-violet-400 leading-tight">{u.serialNo}</span>}
            </span>
          ))}
        </div>
      )}

      <div className={cn("flex items-center gap-4 pl-8", isRental ? "justify-between" : "justify-end")}>
        {isRental && (
          <div className="flex items-center gap-1.5">
            <CalendarDays size={12} className="text-violet-400" />
            <span className="text-xs text-slate-500">Days:</span>
            <QtyButton onClick={() => onSetRentalDays(product.id, days - 1)}><Minus size={10} /></QtyButton>
            <span className="w-5 text-center text-sm font-semibold text-violet-700">{days}</span>
            <QtyButton onClick={() => onSetRentalDays(product.id, days + 1)}><Plus size={10} /></QtyButton>
          </div>
        )}
        {!hasUnits && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500">Qty:</span>
            <QtyButton onClick={() => onUpdateQty(product.id, quantity - 1)}><Minus size={10} /></QtyButton>
            <span className="w-5 text-center text-sm font-semibold text-slate-700">{quantity}</span>
            <QtyButton onClick={() => onUpdateQty(product.id, quantity + 1)}><Plus size={10} /></QtyButton>
          </div>
        )}
        {hasUnits && (
          <span className="text-xs text-slate-400">{quantity} unit{quantity !== 1 ? "s" : ""}</span>
        )}
      </div>
    </li>
  );
}
