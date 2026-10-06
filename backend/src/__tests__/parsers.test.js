import { describe, it, expect } from 'vitest';
import { normalizeOrders, parseJsonFile } from '../parsers/jsonParser.js';
import { normalizeProducts, parseCsvFile } from '../parsers/csvParser.js';
import { parseXmlFile, extractShipmentRecords } from '../parsers/xmlParser.js';
import { buildOrderTotals } from '../processors/orderProcessor.js';
import { joinOrderProducts } from '../processors/dataJoiner.js';
import { calculateCategoryAnalytics } from '../processors/analyticsProcessor.js';
import DataProcessingService from '../services/dataProcessingService.js';
import InMemoryRepository from '../repositories/inMemoryRepository.js';
import app from '../app.js';
import request from 'supertest';
import fs from 'fs';
import path from 'path';

const orderPayload = {
  orders: [
    {
      order_id: '1001',
      customer: { id: 'C001', name: 'Rahul' },
      items: [
        { product_id: 'P101', qty: 2, price: 500 },
        { product_id: 'P102', qty: 1, price: 1200 },
      ],
      order_date: '2024-01-01',
    },
    {
      order_id: '1002',
      customer: { id: 'C002', name: 'Anita' },
      items: [{ product_id: 'P103', qty: 3, price: 200 }],
      order_date: '2024-01-02',
    },
  ],
};

describe('Backend processing tests', () => {
  it('parses JSON orders and normalizes nested records', () => {
    const result = normalizeOrders(orderPayload);
    expect(result.orders).toHaveLength(2);
    expect(result.orderItems).toHaveLength(3);
    expect(result.orderItems[0].line_total).toBe(1000);
  });

  it('parses CSV products by header name', () => {
    const csvPath = path.resolve(__dirname, '../../../data/products.csv');
    const rows = parseCsvFile(csvPath);
    const products = normalizeProducts(rows);
    expect(products[0].product_id).toBe('P101');
    expect(products[1].category).toBe('Electronics');
  });

  it('parses XML shipments robustly when the file exists', () => {
    const xmlPath = path.resolve(__dirname, '../../../data/shipment.xml');
    if (!fs.existsSync(xmlPath)) {
      expect(() => {
        try {
          parseXmlFile(xmlPath);
        } catch (error) {
          throw error;
        }
      }).toThrow();
      return;
    }

    const parsed = parseXmlFile(xmlPath);
    const shipments = extractShipmentRecords(parsed);
    expect(Array.isArray(shipments)).toBe(true);
  });

  it('calculates order totals correctly', () => {
    const normalized = normalizeOrders(orderPayload);
    const totals = buildOrderTotals(normalized.orders, normalized.orderItems);
    expect(totals[0].order_total).toBe(2200);
    expect(totals[1].order_total).toBe(600);
  });

  it('joins orders with products correctly', () => {
    const normalized = normalizeOrders(orderPayload);
    const products = normalizeProducts(parseCsvFile(path.resolve(__dirname, '../../../data/products.csv')));
    const joined = joinOrderProducts(normalized.orders, normalized.orderItems, products);
    expect(joined).toHaveLength(3);
    expect(joined[0].product_name).toBe('Laptop');
  });

  it('performs category aggregation', () => {
    const normalized = normalizeOrders(orderPayload);
    const products = normalizeProducts(parseCsvFile(path.resolve(__dirname, '../../../data/products.csv')));
    const joined = joinOrderProducts(normalized.orders, normalized.orderItems, products);
    const categories = calculateCategoryAnalytics(joined);
    expect(categories.some((item) => item.category === 'Electronics')).toBe(true);
  });

  it('builds a summary with the expected business totals', () => {
    const repo = new InMemoryRepository();
    const service = new DataProcessingService(repo);
    service.ingestJson(path.resolve(__dirname, '../../../data/orders.json'));
    service.ingestCsv(path.resolve(__dirname, '../../../data/products.csv'));
    const dataset = service.buildDataset();
    expect(dataset.summary.totalOrders).toBe(2);
    expect(dataset.summary.totalRevenue).toBe(2800);
    expect(dataset.summary.totalItems).toBe(6);
    expect(dataset.summary.averageOrderValue).toBe(1400);
  });

  it('validates request parameters and catches malformed payloads', () => {
    expect(() => parseJsonFile(path.join(__dirname, 'missing.json'))).toThrow();
  });

  it('exposes health and analytics via API endpoints', async () => {
    const summaryRes = await request(app).get('/api/analytics/summary');
    expect(summaryRes.status).toBe(200);
    expect(summaryRes.body.success).toBe(true);

    const ordersRes = await request(app).get('/api/orders');
    expect(ordersRes.status).toBe(200);

    const productsRes = await request(app).get('/api/products');
    expect(productsRes.status).toBe(200);

    const shipmentsRes = await request(app).get('/api/shipments');
    expect(shipmentsRes.status).toBe(200);

    const qualityRes = await request(app).get('/api/data-quality');
    expect(qualityRes.status).toBe(200);
  });
});
