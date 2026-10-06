const { toNumber } = require('../utils/dateUtils');

function buildOrderTotals(orders, orderItems) {
  const orderTotals = new Map();

  for (const item of orderItems) {
    const key = item.order_id;
    const current = orderTotals.get(key) || 0;
    orderTotals.set(key, current + toNumber(item.line_total, 0));
  }

  return orders.map((order) => ({
    ...order,
    order_total: orderTotals.get(order.order_id) || 0,
  }));
}

module.exports = { buildOrderTotals };
