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

    for (const order of orders) {
      if (!order.customer_id) invalidRecords.push({ type: 'order', id: order.order_id, issue: 'Missing customer ID' });
      if (!order.order_date) invalidRecords.push({ type: 'order', id: order.order_id, issue: 'Missing order date' });
    }

    for (const item of orderItems) {
      if (!item.product_id) invalidRecords.push({ type: 'order_item', id: item.order_id, issue: 'Missing product ID' });
      if (Number(item.quantity) <= 0 || Number.isNaN(Number(item.quantity))) invalidRecords.push({ type: 'order_item', id: item.order_id, issue: 'Invalid quantity' });
      if (Number(item.unit_price) < 0 || Number.isNaN(Number(item.unit_price))) invalidRecords.push({ type: 'order_item', id: item.order_id, issue: 'Invalid price' });
    }

    for (const product of products) {
      if (!product.product_id) invalidRecords.push({ type: 'product', id: product.product_name || 'unknown', issue: 'Missing product ID' });
    }

    const unmatchedProducts = joinedRows.filter((row) => !row.matchedProduct).length;
    const unmatchedShipments = shipments.filter((shipment) => !shipment.order_id).length;
    const duplicateOrderIds = new Set();
    const duplicateRecords = [];
    for (const order of orders) {
      if (duplicateOrderIds.has(order.order_id)) {
        duplicateRecords.push(order.order_id);
      } else {
        duplicateOrderIds.add(order.order_id);
      }
    }

    return {
      totalOrders: orders.length,
      totalProducts: products.length,
      totalOrderItems: orderItems.length,
      totalShipments: shipments.length,
      validRecords: Math.max(0, orders.length + orderItems.length + products.length + shipments.length - invalidRecords.length),
      invalidRecords: invalidRecords.length,
      duplicateRecords: duplicateRecords.length,
      missingValues: invalidRecords.filter((entry) => /Missing|Invalid/.test(entry.issue)).length,
      unmatchedProducts,
      unmatchedShipments,
      details: invalidRecords,
    };
  }
}

module.exports = DataProcessingService;
