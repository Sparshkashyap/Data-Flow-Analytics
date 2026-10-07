const fs = require('fs');
const path = require('path');
const { normalizeOrders, parseJsonFile } = require('../parsers/jsonParser');
const { normalizeProducts, parseCsvFile } = require('../parsers/csvParser');
const { parseXmlFile, extractShipmentRecords } = require('../parsers/xmlParser');
const { buildOrderTotals } = require('../processors/orderProcessor');
const { joinOrderProducts, joinShipments } = require('../processors/dataJoiner');
const { buildSummary, calculateCategoryAnalytics, calculateProductAnalytics, calculateCustomerAnalytics, calculateShipmentAnalytics } = require('../processors/analyticsProcessor');

class DataProcessingService {
  constructor(repository) {
    this.repository = repository;
  }

  ingestJson(filePath) {
    const raw = parseJsonFile(filePath);
    const normalized = normalizeOrders(raw);
    const ordersWithTotals = buildOrderTotals(normalized.orders, normalized.orderItems);

    this.repository.setOrders(ordersWithTotals);
    this.repository.setOrderItems(normalized.orderItems);

    return {
      totalOrders: ordersWithTotals.length,
      totalOrderItems: normalized.orderItems.length,
      summary: {
        totalOrders: ordersWithTotals.length,
        totalOrderItems: normalized.orderItems.length,
      },
    };
  }

  ingestCsv(filePath) {
    const records = parseCsvFile(filePath);
    const products = normalizeProducts(records);
    this.repository.setProducts(products);
    return {
      totalProducts: products.length,
      products,
    };
  }

  ingestXml(filePath) {
    if (!fs.existsSync(filePath)) {
      throw new Error('Shipment XML file is required.');
    }

    const parsed = parseXmlFile(filePath);
    const shipments = extractShipmentRecords(parsed);
    this.repository.setShipments(shipments);
    return {
      totalShipments: shipments.length,
      shipments,
    };
  }

  buildDataset() {
    const orders = this.repository.getOrders();
    const orderItems = this.repository.getOrderItems();
    const products = this.repository.getProducts();
    const shipments = this.repository.getShipments();

    const joinedRows = joinOrderProducts(orders, orderItems, products);
    const joinedWithShipments = joinShipments(joinedRows, shipments);
    const summary = buildSummary(orders, orderItems, products, shipments, joinedWithShipments);
    const categories = calculateCategoryAnalytics(joinedWithShipments);
    const productsAnalytics = calculateProductAnalytics(joinedWithShipments);
    const customers = calculateCustomerAnalytics(joinedWithShipments);
    const shipmentAnalytics = calculateShipmentAnalytics(shipments);

    this.repository.setJoinedOrders(joinedWithShipments);
    this.repository.setAnalytics({
      summary,
      revenue: joinedWithShipments,
      orders: joinedWithShipments,
      categories,
      products: productsAnalytics,
      customers,
      shipments: shipmentAnalytics,
    });

    const dataQuality = this.calculateDataQuality({
      orders,
      orderItems,
      products,
      shipments,
      joinedRows: joinedWithShipments,
    });

    this.repository.setDataQuality(dataQuality);

    return {
      joinedRows: joinedWithShipments,
      summary,
      categories,
      products: productsAnalytics,
      customers,
      shipmentAnalytics,
      dataQuality,
    };
  }

  calculateDataQuality({ orders, orderItems, products, shipments, joinedRows }) {
    const invalidRecords = [];
    const orderIds = new Set();

    for (const order of orders) {
      const orderId = String(order?.order_id || '').trim();
      if (!orderId) {
        invalidRecords.push({ type: 'order', id: 'unknown', issue: 'Missing order ID' });
      } else if (orderIds.has(orderId)) {
        invalidRecords.push({ type: 'order', id: orderId, issue: 'Duplicate order ID' });
      } else {
        orderIds.add(orderId);
      }

      if (!order?.customer_id) invalidRecords.push({ type: 'order', id: orderId || 'unknown', issue: 'Missing customer ID' });
      if (!order?.order_date) invalidRecords.push({ type: 'order', id: orderId || 'unknown', issue: 'Missing order date' });
    }

    for (const item of orderItems) {
      const orderId = String(item?.order_id || '').trim() || 'unknown';
      if (!item?.product_id) invalidRecords.push({ type: 'order_item', id: orderId, issue: 'Missing product ID' });
      if (Number(item?.quantity) <= 0 || Number.isNaN(Number(item?.quantity))) invalidRecords.push({ type: 'order_item', id: orderId, issue: 'Invalid quantity' });
      if (Number(item?.unit_price) < 0 || Number.isNaN(Number(item?.unit_price))) invalidRecords.push({ type: 'order_item', id: orderId, issue: 'Invalid price' });
    }

    for (const product of products) {
      if (!product?.product_id) invalidRecords.push({ type: 'product', id: product?.product_name || 'unknown', issue: 'Missing product ID' });
    }

    const unmatchedProducts = joinedRows.filter((row) => !row.matchedProduct).length;
    for (const row of joinedRows.filter((entry) => !entry.matchedProduct)) {
      invalidRecords.push({ type: 'product', id: row.product_id || 'unknown', issue: 'Unmatched product' });
    }

    const validOrderIds = new Set(
      orders
        .map((order) => String(order?.order_id || '').trim())
        .filter(Boolean),
    );

    const unmatchedShipments = shipments.filter((shipment) => {
      const shipmentOrderId = String(shipment?.order_id || '').trim();
      return !shipmentOrderId || !validOrderIds.has(shipmentOrderId);
    });

    for (const shipment of unmatchedShipments) {
      const shipmentOrderId = String(shipment?.order_id || '').trim();
      invalidRecords.push({
        type: 'shipment',
        id: shipment?.shipment_id || shipmentOrderId || 'unknown',
        issue: shipmentOrderId ? 'Unmatched shipment' : 'Missing order ID',
      });
    }

    const totalRecords = orders.length + orderItems.length + products.length + shipments.length;
    const validRecords = Math.max(0, totalRecords - invalidRecords.length);
    const duplicateRecords = invalidRecords.filter((issue) => issue.issue === 'Duplicate order ID').length;

    return {
      totalOrders: orders.length,
      totalProducts: products.length,
      totalOrderItems: orderItems.length,
      totalShipments: shipments.length,
      validRecords,
      invalidRecords: invalidRecords.length,
      duplicateRecords,
      missingValues: invalidRecords.filter((entry) => /Missing|Invalid/.test(entry.issue)).length,
      unmatchedProducts,
      unmatchedShipments: unmatchedShipments.length,
      details: invalidRecords,
    };
  }
}

module.exports = DataProcessingService;
