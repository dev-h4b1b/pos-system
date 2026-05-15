import type { CartItem, RentalInfo, RentalSession } from '../../types'
import { CalendarDays, Camera, CheckCircle, Printer, RotateCcw, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { formatCurrency, formatDate } from '../../lib/format'
import { printOrderReceipt } from '../../lib/receipt'
import { cn } from '../../lib/utils'
import { Button } from '../ui/button'

interface PaymentModalProps {
  total: number
  subtotal: number
  tax: number
  items: CartItem[]
  hasRentals: boolean
  onComplete: (method: 'cash' | 'qr', cashTendered?: number, rentalInfo?: RentalInfo, receiptImage?: string) => number
  onClose: () => void
}

type PaymentMethod = 'cash' | 'qr'

async function compressImage(file: File): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const MAX = 900
      let { width, height } = img
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round((height * MAX) / width); width = MAX }
        else { width = Math.round((width * MAX) / height); height = MAX }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', 0.75))
    }
    img.src = url
  })
}

export function PaymentModal({ total, subtotal, tax, items, hasRentals, onComplete, onClose }: PaymentModalProps) {
  const [method, setMethod] = useState<PaymentMethod>('cash')
  const [cashInput, setCashInput] = useState('')
  const [studentName, setStudentName] = useState('')
  const [studentId, setStudentId] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [roomNo, setRoomNo] = useState('')
  const [session, setSession] = useState<RentalSession | ''>('')
  const [receiptImage, setReceiptImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [completedOrderNum, setCompletedOrderNum] = useState(0)
  const [receiptSnapshot, setReceiptSnapshot] = useState<{
    items: CartItem[]
    subtotal: number
    tax: number
    total: number
    method: 'cash' | 'qr'
    cashAmount: number
    change: number
    hasRentals: boolean
    returnDate: Date
    studentName: string
    studentId: string
    phone: string
    email: string
    roomNo: string
    session: string
    createdAt: string
  } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const cashAmount = Number.parseFloat(cashInput) || 0
  const change = cashAmount - total
  const cashValid = cashAmount >= total

  const maxRentalDays = hasRentals
    ? Math.max(...items.filter(i => i.product.type === 'rental').map(i => i.rentalDays ?? 1))
    : 0

  const returnDate = new Date()
  returnDate.setDate(returnDate.getDate() + maxRentalDays)

  const rentalValid = !hasRentals || (studentName.trim().length > 0 && studentId.trim().length > 0 && roomNo.trim().length > 0 && session !== '')
  const qrValid = method !== 'qr' || receiptImage !== null
  const canComplete = (method === 'qr' || cashValid) && rentalValid && qrValid

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file)
      return
    const compressed = await compressImage(file)
    setReceiptImage(compressed)
  }

  const handleComplete = () => {
    setIsProcessing(true)
    setTimeout(() => {
      // Snapshot all receipt data BEFORE onComplete clears the cart
      const snapshot = {
        items: [...items],
        subtotal,
        tax,
        total,
        method,
        cashAmount,
        change,
        hasRentals,
        returnDate: new Date(returnDate.getTime()),
        studentName: studentName.trim(),
        studentId: studentId.trim(),
        phone: phone.trim(),
        email: email.trim(),
        roomNo: roomNo.trim(),
        session,
        createdAt: new Date().toISOString(),
      }
      const rentalInfo: RentalInfo | undefined = hasRentals
        ? { studentName: snapshot.studentName, studentId: snapshot.studentId, phone: snapshot.phone, email: snapshot.email, roomNo: snapshot.roomNo, session: session as RentalSession, returnDate: snapshot.returnDate.toISOString() }
        : undefined
      const orderNum = onComplete(method, method === 'cash' ? cashAmount : undefined, rentalInfo, receiptImage ?? undefined)
      setReceiptSnapshot(snapshot)
      setCompletedOrderNum(orderNum)
      setIsProcessing(false)
      setIsComplete(true)
    }, method === 'qr' ? 800 : 400)
  }

  const handlePrint = () => {
    if (!receiptSnapshot)
      return
    const s = receiptSnapshot
    printOrderReceipt({
      id: '',
      orderNumber: completedOrderNum,
      items: s.items,
      subtotal: s.subtotal,
      tax: s.tax,
      total: s.total,
      paymentMethod: s.method,
      cashTendered: s.method === 'cash' ? s.cashAmount : undefined,
      change: s.method === 'cash' ? s.change : undefined,
      createdAt: s.createdAt,
      studentName: s.hasRentals ? s.studentName : undefined,
      studentId: s.hasRentals ? s.studentId : undefined,
      phone: s.hasRentals && s.phone ? s.phone : undefined,
      email: s.hasRentals && s.email ? s.email : undefined,
      roomNo: s.hasRentals ? s.roomNo : undefined,
      session: s.hasRentals && s.session ? s.session as RentalSession : undefined,
      returnDate: s.hasRentals ? s.returnDate.toISOString() : undefined,
    })
  }

  const totalItems = items.reduce((s, i) => s + i.quantity, 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl mx-4 overflow-hidden max-h-[90vh] flex flex-col">

        {/* Success overlay */}
        {isComplete && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-white px-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle size={48} className="text-emerald-500" strokeWidth={1.5} />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold text-slate-800">
                {hasRentals ? 'Rental Confirmed!' : 'Order Complete!'}
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                Order #
                {String(completedOrderNum).padStart(4, '0')}
              </p>
              {hasRentals && (
                <p className="text-violet-600 text-sm font-medium mt-1">
                  Return by
                  {' '}
                  {formatDate(returnDate.toISOString())}
                </p>
              )}
            </div>
            {method === 'cash' && change > 0 && (
              <div className="rounded-xl bg-slate-50 px-6 py-3 text-center">
                <p className="text-xs text-slate-500">Change due</p>
                <p className="text-2xl font-bold text-slate-800">{formatCurrency(change)}</p>
              </div>
            )}
            <div className="flex gap-3 w-full mt-2">
              <Button variant="outline" onClick={onClose} className="flex-1">Done</Button>
              <Button onClick={handlePrint} className="flex-1 gap-2">
                <Printer size={16} />
                Print Receipt
              </Button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 shrink-0">
          <h2 className="text-lg font-semibold text-slate-800">
            {hasRentals ? 'Confirm Rental' : 'Collect Payment'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {/* Amount summary */}
          <div className="rounded-xl bg-slate-50 px-5 py-4 text-center">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Total Due</p>
            <p className="text-4xl font-bold text-slate-800">{formatCurrency(total)}</p>
            <p className="text-xs text-slate-400 mt-1">
              {totalItems}
              {' '}
              item
              {totalItems !== 1 ? 's' : ''}
              {' '}
              · Subtotal
              {formatCurrency(subtotal)}
              {' '}
              · Tax
              {formatCurrency(tax)}
            </p>
          </div>

          {/* Rental student info */}
          {hasRentals && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Student Details</p>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Student name *"
                  value={studentName}
                  onChange={e => setStudentName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="ID number *"
                  value={studentId}
                  onChange={e => setStudentId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="tel"
                  placeholder="Phone number"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Room number *"
                  value={roomNo}
                  onChange={e => setRoomNo(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
                <select
                  value={session}
                  onChange={e => setSession(e.target.value as RentalSession | '')}
                  className={cn(
                    'w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent',
                    session === '' ? 'border-slate-200 text-slate-400' : 'border-slate-200 text-slate-800',
                  )}
                >
                  <option value="" disabled>Session *</option>
                  <option value="morning">🌅 Morning</option>
                  <option value="afternoon">☀️ Afternoon</option>
                  <option value="evening">🌙 Evening</option>
                </select>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-violet-50 border border-violet-100 px-4 py-3 text-sm">
                <CalendarDays size={16} className="text-violet-500 shrink-0" />
                <span className="text-slate-600">
                  Return by
                  {' '}
                  <span className="font-semibold text-violet-700">{formatDate(returnDate.toISOString())}</span>
                  {' '}
                  (
                  {maxRentalDays}
                  {' '}
                  day
                  {maxRentalDays !== 1 ? 's' : ''}
                  )
                </span>
              </div>
            </div>
          )}

          {/* Payment method */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Payment Method</p>
            <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
              {(['cash', 'qr'] as PaymentMethod[]).map(m => (
                <button
                  key={m}
                  onClick={() => { setMethod(m); setReceiptImage(null) }}
                  className={cn(
                    'flex-1 rounded-lg py-2 text-sm font-medium transition-all',
                    method === m ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700',
                  )}
                >
                  {m === 'cash' ? '💵 Cash' : '📱 QR Pay'}
                </button>
              ))}
            </div>
          </div>

          {/* Cash section */}
          {method === 'cash' && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {[total, 50, 100].filter((v, i, arr) => arr.indexOf(v) === i).map(amt => (
                  <button
                    key={amt}
                    onClick={() => setCashInput(amt.toFixed(2))}
                    className={cn(
                      'rounded-lg border py-2 text-sm font-medium transition-colors',
                      cashInput === amt.toFixed(2)
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                    )}
                  >
                    {amt === total ? 'Exact' : formatCurrency(amt)}
                  </button>
                ))}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-medium">RM</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="0.00"
                  value={cashInput}
                  onChange={e => setCashInput(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              {cashInput && (
                <div className={cn(
                  'flex justify-between rounded-lg px-4 py-3 text-sm font-medium',
                  cashValid ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600',
                )}
                >
                  <span>{cashValid ? 'Change due' : 'Amount insufficient'}</span>
                  {cashValid && <span className="font-bold">{formatCurrency(change)}</span>}
                </div>
              )}
            </div>
          )}

          {/* QR section */}
          {method === 'qr' && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Payment Receipt
                {' '}
                <span className="text-red-400">*</span>
              </p>

              {receiptImage
                ? (
                    <div className="relative rounded-xl overflow-hidden border border-emerald-200">
                      <img src={receiptImage} alt="Payment receipt" className="w-full object-contain max-h-48" />
                      <div className="absolute top-2 right-2 flex gap-1.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500">
                          <CheckCircle size={16} className="text-white" strokeWidth={2.5} />
                        </div>
                        <button
                          onClick={() => {
                            setReceiptImage(null); if (fileRef.current)
                              fileRef.current.value = ''
                          }}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-sm text-slate-500 hover:text-red-500 transition-colors"
                        >
                          <RotateCcw size={13} />
                        </button>
                      </div>
                      <div className="bg-emerald-50 border-t border-emerald-100 px-3 py-1.5">
                        <p className="text-xs text-emerald-700 font-medium">Receipt uploaded — ready to confirm</p>
                      </div>
                    </div>
                  )
                : (
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-300 py-6 text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors"
                    >
                      <Camera size={28} strokeWidth={1.5} />
                      <span className="text-sm font-medium">Take photo or upload receipt</span>
                      <span className="text-xs">Required to confirm QR payment</span>
                    </button>
                  )}

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFile}
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 pb-5 shrink-0">
          <Button variant="outline" onClick={onClose} className="w-28 shrink-0">Cancel</Button>
          <Button className="flex-1" size="lg" disabled={!canComplete || isProcessing} onClick={handleComplete}>
            {isProcessing
              ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Processing…
                  </span>
                )
              : hasRentals
                ? `Confirm · ${formatCurrency(total)}`
                : `Complete Sale · ${formatCurrency(total)}`}
          </Button>
        </div>
      </div>
    </div>
  )
}
