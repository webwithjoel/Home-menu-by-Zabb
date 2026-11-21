export function clampQty(value) {
  const numeric = Number.parseInt(value, 10)
  if (Number.isNaN(numeric)) return 1
  return Math.min(500, Math.max(1, numeric))
}
export function bulkDiscount(qty, subtotal) {
  const rate = qty >= 50 ? 0.1 : qty >= 10 ? 0.05 : 0
  return Math.round(subtotal * rate)
}
export function lineTotal(product, selection = {}, qty = 1) {
  const size = product.sizes.find((item) => item.name === selection.size) || product.sizes[0]
  let subtotal = size.price
  for (const addon of product.addons || []) subtotal += addon.price * Number(selection.addons?.[addon.name] || 0)
  subtotal *= clampQty(qty)
  const discount = bulkDiscount(clampQty(qty), subtotal)
  return { subtotal, discount, total: subtotal - discount }
}
export function cartTotals(cart, delivery = 0) {
  let subtotal = 0
  for (const line of cart) subtotal += lineTotal(line.product, line.selection, line.qty).total
  return { subtotal, delivery: Number(delivery) || 0, total: subtotal + (Number(delivery) || 0) }
}
