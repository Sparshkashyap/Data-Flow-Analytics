const { safeDate, differenceInDays } = require('../utils/dateUtils');

function buildSummary(orders, orderItems, products, shipments, joinedRows) {
  const totalOrders = orders.length;
  const totalRevenue = joinedRows.reduce((sum, row) => sum + Number(row.line_total || 0), 0);
  const totalItems = joinedRows.reduce((sum, row) => sum + Number(row.quantity || 0), 0);
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const ordersByDate = {};
  const revenueByDate = {};

  for (const row of joinedRows) {
    const key = row.order_date || 'Unknown';
    ordersByDate[key] = (ordersByDate[key] || 0) + 1;
    revenueByDate[key] = (revenueByDate[key] || 0) + Number(row.line_total || 0);
  }

  const totalShipments = shipments.length;
  const matchedShipments = shipments.filter((row) => row && row.order_id).length;

  return {
    totalOrders,
    totalRevenue,
    totalItems,
    averageOrderValue,
    totalProducts: products.length,
    totalOrderItems: orderItems.length,
    totalShipments,
    matchedShipments,
    unmatchedShipments: totalShipments - matchedShipments,
    ordersByDate,
    revenueByDate,
  };
}

function calculateCategoryAnalytics(joinedRows) {
  const map = new Map();

  for (const row of joinedRows) {
    const key = row.category || 'Uncategorized';
    if (!map.has(key)) {
      map.set(key, {
        category: key,
        totalRevenue: 0,
        totalQuantity: 0,
        orderCount: new Set(),
        productCount: new Set(),
      });
    }

    const bucket = map.get(key);
    bucket.totalRevenue += Number(row.line_total || 0);
    bucket.totalQuantity += Number(row.quantity || 0);
    bucket.orderCount.add(row.order_id);
    bucket.productCount.add(row.product_id);
  }

  return Array.from(map.values()).map((item) => ({
    category: item.category,
    totalRevenue: item.totalRevenue,
    totalQuantity: item.totalQuantity,
    numberOfOrders: item.orderCount.size,
    numberOfProducts: item.productCount.size,
  }));
}

function calculateProductAnalytics(joinedRows) {
  const map = new Map();

  for (const row of joinedRows) {
    const key = row.product_id || 'Unknown';
    if (!map.has(key)) {
      map.set(key, {
        productId: key,
        productName: row.product_name || 'Unknown',
        category: row.category || 'Uncategorized',
        totalRevenue: 0,
        totalQuantity: 0,
        orderCount: new Set(),
      });
    }

    const bucket = map.get(key);
    bucket.totalRevenue += Number(row.line_total || 0);
    bucket.totalQuantity += Number(row.quantity || 0);
    bucket.orderCount.add(row.order_id);
  }

  return Array.from(map.values()).map((item) => ({
    productId: item.productId,
    productName: item.productName,
    category: item.category,
    totalRevenue: item.totalRevenue,
    totalQuantity: item.totalQuantity,
    orderCount: item.orderCount.size,
  }));
}

function calculateCustomerAnalytics(joinedRows) {
  const map = new Map();

  for (const row of joinedRows) {
    const key = row.customer_id || row.customer_name || 'Unknown';
    if (!map.has(key)) {
      map.set(key, {
        customerId: row.customer_id || key,
        customerName: row.customer_name || 'Unknown',
        orderCount: 0,
        totalRevenue: 0,
        orderIds: new Set(),
      });
    }

    const bucket = map.get(key);
    bucket.orderIds.add(row.order_id);
    bucket.orderCount = bucket.orderIds.size;
    bucket.totalRevenue += Number(row.line_total || 0);
  }

  return Array.from(map.values()).map((item) => ({
    customerId: item.customerId,
    customerName: item.customerName,
    orderCount: item.orderCount,
    totalRevenue: item.totalRevenue,
  }));
}

function calculateShipmentAnalytics(shipments) {
  const statusMap = new Map();

  for (const shipment of shipments) {
    const status = shipment.shipment_status || 'Unknown';
    if (!statusMap.has(status)) {
      statusMap.set(status, 0);
    }
    statusMap.set(status, statusMap.get(status) + 1);
  }

  const statusDistribution = Array.from(statusMap.entries()).map(([name, count]) => ({ name, count }));

  const delays = [];
  for (const shipment of shipments) {
    if (!shipment || !shipment.shipment_date || !shipment.delivery_date) continue;

    const actualDate = safeDate(shipment.delivery_date);
    const expectedDate = safeDate(shipment.expected_delivery_date) || safeDate(shipment.shipment_date);
    if (!actualDate || !expectedDate) continue;

    const days = differenceInDays(expectedDate, actualDate);
    if (days === null) continue;

    delays.push({
      shipment_id: shipment.shipment_id,
      order_id: shipment.order_id,
      deliveryDelayDays: days,
      isDelayed: days > 0,
    });
  }

  return { statusDistribution, delays };
}

module.exports = {
  buildSummary,
  calculateCategoryAnalytics,
  calculateProductAnalytics,
  calculateCustomerAnalytics,
  calculateShipmentAnalytics,
};
