const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const env = require('./config/env');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const InMemoryRepository = require('./repositories/inMemoryRepository');
const DataProcessingService = require('./services/dataProcessingService');
const { successResponse, errorResponse } = require('./utils/apiResponse');
const { fetchCountries, searchCountries, getCountryByCode, getCurrencyInfo } = require('./services/countryService');
const { convertCurrency } = require('./services/currencyService');
const { z } = require('zod');

const app = express();
const repository = new InMemoryRepository();
const dataProcessingService = new DataProcessingService(repository);

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, '_');
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: (env.uploadMaxSizeMb || 10) * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = ['application/json', 'text/csv', 'application/csv', 'application/xml', 'text/xml'];
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = ['.json', '.csv', '.xml'];

    if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
      cb(null, true);
      return;
    }

    cb(Object.assign(new Error('Unsupported file type. Allowed: JSON, CSV, XML.'), {
      statusCode: 400,
      code: 'INVALID_FILE_TYPE',
      publicMessage: 'Unsupported file type. Allowed: JSON, CSV, XML.',
    }));
  },
});

app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [env.frontendUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('CORS origin not allowed'));
  },
  credentials: true,
}));
app.use(helmet({
  crossOriginResourcePolicy: false,
}));
app.use(express.json({ limit: `${Math.max(env.uploadMaxSizeMb, 10)}mb` }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

const ingestJsonSchema = z.object({
  file: z.any().optional(),
});

const convertSchema = z.object({
  from: z.string().min(3).max(5),
  to: z.string().min(3).max(5),
  amount: z.coerce.number().positive(),
});

const listSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(20),
  search: z.string().optional(),
  customer: z.string().optional(),
  product: z.string().optional(),
  category: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

function seedDefaultData() {
  const rootDataDir = path.join(__dirname, '../../data');
  const ordersPath = path.join(rootDataDir, 'orders.json');
  const productsPath = path.join(rootDataDir, 'products.csv');
  const shipmentsPath = path.join(rootDataDir, 'shipment.xml');

  try {
    if (fs.existsSync(ordersPath)) {
      dataProcessingService.ingestJson(ordersPath);
    }
    if (fs.existsSync(productsPath)) {
      dataProcessingService.ingestCsv(productsPath);
    }
    if (fs.existsSync(shipmentsPath)) {
      dataProcessingService.ingestXml(shipmentsPath);
    } else {
      console.warn('Shipment XML is not present at data/shipment.xml. Upload it through the ingestion API or place the file in the data folder to enable shipment joins.');
    }
    dataProcessingService.buildDataset();
  } catch (error) {
    console.warn('The default dataset could not be loaded:', error.message);
  }
}

seedDefaultData();

app.get('/api/health', (_req, res) => {
  res.json(successResponse({ status: 'ok' }));
});

app.post('/api/ingest/json', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json(errorResponse('INVALID_INPUT', 'JSON file is required.'));
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    if (ext !== '.json') {
      return res.status(400).json(errorResponse('INVALID_FILE_TYPE', 'Only JSON files are allowed.'));
    }

    const result = dataProcessingService.ingestJson(req.file.path);
    const dataset = dataProcessingService.buildDataset();
    return res.status(201).json(successResponse({
      message: 'JSON ingestion processed successfully.',
      ...result,
      dataQuality: dataset.dataQuality,
      summary: dataset.summary,
    }));
  } catch (error) {
    next(error);
  }
});

app.post('/api/ingest/csv', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json(errorResponse('INVALID_INPUT', 'CSV file is required.'));
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    if (ext !== '.csv') {
      return res.status(400).json(errorResponse('INVALID_FILE_TYPE', 'Only CSV files are allowed.'));
    }

    const result = dataProcessingService.ingestCsv(req.file.path);
    const dataset = dataProcessingService.buildDataset();
    return res.status(201).json(successResponse({
      message: 'CSV ingestion processed successfully.',
      ...result,
      summary: dataset.summary,
      dataQuality: dataset.dataQuality,
    }));
  } catch (error) {
    next(error);
  }
});

app.post('/api/ingest/xml', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json(errorResponse('INVALID_INPUT', 'XML file is required.'));
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    if (ext !== '.xml') {
      return res.status(400).json(errorResponse('INVALID_FILE_TYPE', 'Only XML files are allowed.'));
    }

    const result = dataProcessingService.ingestXml(req.file.path);
    const dataset = dataProcessingService.buildDataset();
    return res.status(201).json(successResponse({
      message: 'XML ingestion processed successfully.',
      ...result,
      summary: dataset.summary,
      dataQuality: dataset.dataQuality,
    }));
  } catch (error) {
    next(error);
  }
});

app.get('/api/analytics/summary', async (_req, res, next) => {
  try {
    const dataset = dataProcessingService.buildDataset();
    return res.json(successResponse(dataset.summary));
  } catch (error) {
    next(error);
  }
});

app.get('/api/analytics/revenue', async (req, res, next) => {
  try {
    const from = req.query.from;
    const to = req.query.to;
    const category = req.query.category;
    const product = req.query.product;

    const rows = repository.getJoinedOrders();
    const filtered = rows.filter((row) => {
      if (from && row.order_date < String(from)) return false;
      if (to && row.order_date > String(to)) return false;
      if (category && row.category !== category) return false;
      if (product && row.product_id !== product) return false;
      return true;
    });

    return res.json(successResponse(filtered));
  } catch (error) {
    next(error);
  }
});

app.get('/api/analytics/orders', async (req, res, next) => {
  try {
    const { customer, status } = req.query;
    const rows = repository.getJoinedOrders();
    const filtered = rows.filter((row) => {
      if (customer && row.customer_id !== customer && row.customer_name !== customer) return false;
      if (status && row.shipment_status !== status) return false;
      return true;
    });
    return res.json(successResponse(filtered));
  } catch (error) {
    next(error);
  }
});

app.get('/api/analytics/categories', async (_req, res, next) => {
  try {
    const analytics = repository.getAnalytics();
    return res.json(successResponse(analytics.categories || []));
  } catch (error) {
    next(error);
  }
});

app.get('/api/analytics/products', async (_req, res, next) => {
  try {
    const analytics = repository.getAnalytics();
    return res.json(successResponse(analytics.products || []));
  } catch (error) {
    next(error);
  }
});

app.get('/api/orders', async (req, res, next) => {
  try {
    const parsed = listSchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(422).json(errorResponse('VALIDATION_ERROR', 'Invalid pagination query.'));
    }

    const { page, limit, search, customer, product, category, from, to } = parsed.data;
    const rows = repository.getJoinedOrders();
    const filtered = rows.filter((row) => {
      const searchText = `${row.order_id} ${row.customer_name} ${row.product_name || ''}`.toLowerCase();
      if (search && !searchText.includes(search.toLowerCase())) return false;
      if (customer && row.customer_id !== customer && row.customer_name !== customer) return false;
      if (product && row.product_id !== product) return false;
      if (category && row.category !== category) return false;
      if (from && row.order_date < from) return false;
      if (to && row.order_date > to) return false;
      return true;
    });

    const total = filtered.length;
    const offset = (page - 1) * limit;
    const paginated = filtered.slice(offset, offset + limit);

    return res.json(successResponse({
      items: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    }));
  } catch (error) {
    next(error);
  }
});

app.get('/api/orders/:orderId', async (req, res, next) => {
  try {
    const orderId = req.params.orderId;
    const orders = repository.getOrders();
    const order = orders.find((entry) => String(entry.order_id) === String(orderId));
    if (!order) {
      return res.status(404).json(errorResponse('ORDER_NOT_FOUND', 'Order not found.'));
    }

    const items = repository.getJoinedOrders().filter((row) => String(row.order_id) === String(orderId));
    const shipment = repository.getShipments().find((entry) => String(entry.order_id) === String(orderId)) || null;

    return res.json(successResponse({
      order,
      customer: { id: order.customer_id, name: order.customer_name },
      items,
      products: items.map((entry) => ({
        product_id: entry.product_id,
        product_name: entry.product_name,
        category: entry.category,
        quantity: entry.quantity,
        unit_price: entry.unit_price,
        line_total: entry.line_total,
      })),
      shipment,
    }));
  } catch (error) {
    next(error);
  }
});

app.get('/api/products', async (_req, res, next) => {
  try {
    const products = repository.getProducts();
    return res.json(successResponse(products));
  } catch (error) {
    next(error);
  }
});

app.get('/api/shipments', async (_req, res, next) => {
  try {
    const shipments = repository.getShipments();
    return res.json(successResponse(shipments));
  } catch (error) {
    next(error);
  }
});

app.get('/api/data-quality', async (_req, res, next) => {
  try {
    const dataQuality = repository.getDataQuality();
    return res.json(successResponse(dataQuality || { totalOrders: 0, invalidRecords: 0 }));
  } catch (error) {
    next(error);
  }
});

app.get('/api/countries', async (req, res, next) => {
  try {
    const query = req.query.q;
    const countries = await searchCountries(String(query || ''));
    return res.json(successResponse(countries));
  } catch (error) {
    next(error);
  }
});

app.get('/api/countries/:code', async (req, res, next) => {
  try {
    const country = await getCountryByCode(req.params.code);
    if (!country) {
      return res.status(404).json(errorResponse('COUNTRY_NOT_FOUND', 'Country not found.'));
    }
    return res.json(successResponse(country));
  } catch (error) {
    next(error);
  }
});

app.get('/api/currency/convert', async (req, res, next) => {
  try {
    const parsed = convertSchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(422).json(errorResponse('VALIDATION_ERROR', 'Invalid currency conversion parameters.'));
    }

    const result = await convertCurrency(parsed.data.amount, parsed.data.from, parsed.data.to);
    return res.json(successResponse(result));
  } catch (error) {
    next(error);
  }
});

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
