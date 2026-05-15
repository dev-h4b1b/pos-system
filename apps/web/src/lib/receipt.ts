import type { Order } from '../types'
import { formatCurrency } from './format'

export function buildReceiptHTML(order: Order): string {
  const created = new Date(order.createdAt)
  const dateStr = created.toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })
  const timeStr = created.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  const isRental = !!order.studentName
  const sessionLabel: Record<string, string> = { morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening' }

  const itemRows = order.items.map((item) => {
    const days = item.rentalDays ?? 1
    const lineTotal = item.product.price * item.quantity * days
    let row = `<div class="row"><span class="iname">${item.product.emoji} ${item.product.name}</span><span>${formatCurrency(lineTotal)}</span></div>`
    if (item.rentalDays) {
      row += `<div class="sub">x${item.quantity} @ ${formatCurrency(item.product.price)}/day &times; ${item.rentalDays}d</div>`
    }
    else {
      row += `<div class="sub">x${item.quantity} @ ${formatCurrency(item.product.price)}</div>`
    }
    if (item.selectedUnits && item.selectedUnits.length > 0) {
      row += item.selectedUnits.map(u => `<div class="sub unit">&rarr; ${u.label}${u.serialNo ? ` (${u.serialNo})` : ''}</div>`).join('')
    }
    return row
  }).join('')

  const returnDateStr = order.returnDate
    ? new Date(order.returnDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : ''

  const orderTag = `#${String(order.orderNumber).padStart(4, '0')}`

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Receipt ${orderTag}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Courier New',Courier,monospace;font-size:12px;max-width:300px;margin:0 auto;padding:16px;color:#000}
.center{text-align:center}
.shop{font-size:17px;font-weight:bold;letter-spacing:2px}
.tagline{font-size:10px;color:#666;margin-top:2px}
.dash{border-top:1px dashed #000;margin:8px 0}
.solid{border-top:2px solid #000;margin:8px 0}
.row{display:flex;justify-content:space-between;margin-bottom:2px}
.iname{flex:1;padding-right:8px}
.sub{padding-left:14px;color:#555;font-size:10px;margin-bottom:1px}
.unit{font-style:italic}
.ttl{font-size:14px;font-weight:bold;margin:3px 0}
.hdr{font-weight:bold;font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px}
.rf{display:flex;gap:6px;margin-bottom:2px;font-size:11px}
.rl{color:#555;min-width:78px}
.thanks{font-size:10px;color:#555;margin-top:10px}
@media print{body{padding:0}button{display:none}}
</style></head><body>
<div class="center"><div class="shop">TECH SHOP</div><div class="tagline">Point of Sale Receipt</div></div>
<div class="dash"></div>
<div class="row"><span>Order</span><span>${orderTag}</span></div>
<div class="row"><span>Date</span><span>${dateStr}</span></div>
<div class="row"><span>Time</span><span>${timeStr}</span></div>
<div class="solid"></div>
<div class="hdr">Items</div>
${itemRows}
<div class="dash"></div>
<div class="row"><span>Subtotal</span><span>${formatCurrency(order.subtotal)}</span></div>
<div class="row"><span>Tax (6%)</span><span>${formatCurrency(order.tax)}</span></div>
<div class="dash"></div>
<div class="row ttl"><span>TOTAL</span><span>${formatCurrency(order.total)}</span></div>
<div class="dash"></div>
<div class="row"><span>Payment</span><span>${order.paymentMethod === 'cash' ? 'Cash' : 'QR Pay'}</span></div>
${order.paymentMethod === 'cash' && order.cashTendered !== undefined ? `<div class="row"><span>Tendered</span><span>${formatCurrency(order.cashTendered)}</span></div>${order.change !== undefined && order.change > 0 ? `<div class="row"><span>Change</span><span>${formatCurrency(order.change)}</span></div>` : ''}` : ''}
${isRental
  ? `<div class="solid"></div><div class="hdr">Rental Info</div>
<div class="rf"><span class="rl">Student</span><span>${order.studentName}</span></div>
<div class="rf"><span class="rl">ID</span><span>${order.studentId ?? ''}</span></div>
${order.phone ? `<div class="rf"><span class="rl">Phone</span><span>${order.phone}</span></div>` : ''}
${order.email ? `<div class="rf"><span class="rl">Email</span><span>${order.email}</span></div>` : ''}
${order.roomNo ? `<div class="rf"><span class="rl">Room</span><span>${order.roomNo}</span></div>` : ''}
${order.session ? `<div class="rf"><span class="rl">Session</span><span>${sessionLabel[order.session] ?? order.session}</span></div>` : ''}
${returnDateStr ? `<div class="rf"><span class="rl">Return by</span><span>${returnDateStr}</span></div>` : ''}`
  : ''}
<div class="solid"></div>
<div class="center thanks">Thank you for your purchase!</div>
<script>window.onload=()=>window.print();</script>
</body></html>`
}

export function printOrderReceipt(order: Order): void {
  const win = window.open('', '_blank', 'width=400,height=600')
  if (!win)
    return
  win.document.write(buildReceiptHTML(order))
  win.document.close()
}
