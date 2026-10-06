const fs = require('fs');
const path = require('path');

function parseJsonFile(filePath) {
  const absolutePath = path.resolve(filePath);
  const raw = fs.readFileSync(absolutePath, 'utf8');
  const data = JSON.parse(raw);

  if (!data || typeof data !== 'object') {
    throw new Error('JSON payload must be an object.');
  }

  return data;
}

function normalizeOrders(payload) {
  const rawOrders = Array.isArray(payload?.orders) ? payload.orders : [];

  const orders = [];
  const orderItems = [];

  for (const order of rawOrders) {
    if (!order || typeof order !== 'object') continue;

    const orderId = String(order.order_id || '').trim();
    const customerId = String(order.customer?.id || '').trim();
    const customerName = String(order.customer?.name || '').trim();
    const orderDate = order.order_date || null;

    if (orderId) {
      orders.push({
        order_id: orderId,
        customer_id: customerId,
        customer_name: customerName,
        order_date: orderDate,
      });
    }

    const items = Array.isArray(order.items) ? order.items : [];
    for (const item of items) {
      if (!item || typeof item !== 'object') continue;

      const productId = String(item.product_id || '').trim();
      const quantity = Number(item.qty ?? 0);
      const unitPrice = Number(item.price ?? 0);
      const lineTotal = Number(quantity * unitPrice);

      if (!productId) {
        continue;
      }

      orderItems.push({
        order_id: orderId,
        product_id: productId,
        quantity: Number.isFinite(quantity) ? quantity : 0,
        unit_price: Number.isFinite(unitPrice) ? unitPrice : 0,
        line_total: Number.isFinite(lineTotal) ? lineTotal : 0,
      });
    }
  }

  return { orders, orderItems };
}

module.exports = { parseJsonFile, normalizeOrders };
