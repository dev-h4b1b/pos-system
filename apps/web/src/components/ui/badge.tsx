import { cn } from '../../lib/utils'

const categoryColors: Record<string, string> = {
  earphones: 'bg-purple-100 text-purple-800',
  chargers: 'bg-yellow-100 text-yellow-800',
  cables: 'bg-sky-100 text-sky-800',
  accessories: 'bg-pink-100 text-pink-800',
  laptops: 'bg-indigo-100 text-indigo-800',
  webcams: 'bg-cyan-100 text-cyan-800',
  displays: 'bg-teal-100 text-teal-800',
  peripherals: 'bg-orange-100 text-orange-800',
}

const FALLBACK_COLORS = [
  'bg-rose-100 text-rose-800',
  'bg-amber-100 text-amber-800',
  'bg-lime-100 text-lime-800',
  'bg-emerald-100 text-emerald-800',
  'bg-cyan-100 text-cyan-800',
  'bg-violet-100 text-violet-800',
  'bg-fuchsia-100 text-fuchsia-800',
  'bg-slate-100 text-slate-700',
]

function getCategoryColor(cat: string): string {
  if (categoryColors[cat])
    return categoryColors[cat]
  const idx = Math.abs(cat.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % FALLBACK_COLORS.length
  return FALLBACK_COLORS[idx]
}

interface BadgeProps {
  children: React.ReactNode
  variant?: 'category' | 'cash' | 'qr' | 'sale' | 'rental' | 'active' | 'returned' | 'overdue' | 'success' | 'danger' | 'default'
  category?: string
  className?: string
}

const variantClasses: Record<NonNullable<BadgeProps['variant']>, string> = {
  category: '',
  cash: 'bg-emerald-100 text-emerald-800',
  qr: 'bg-indigo-100 text-indigo-800',
  sale: 'bg-blue-100 text-blue-700',
  rental: 'bg-violet-100 text-violet-700',
  active: 'bg-amber-100 text-amber-800',
  returned: 'bg-emerald-100 text-emerald-800',
  overdue: 'bg-red-100 text-red-700',
  success: 'bg-emerald-100 text-emerald-800',
  danger: 'bg-red-100 text-red-800',
  default: 'bg-slate-100 text-slate-700',
}

export function Badge({ children, variant = 'default', category, className }: BadgeProps) {
  const colorClass = variant === 'category' && category
    ? getCategoryColor(category)
    : variantClasses[variant]

  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', colorClass, className)}>
      {children}
    </span>
  )
}
