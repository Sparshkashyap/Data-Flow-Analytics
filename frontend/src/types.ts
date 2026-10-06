export type Summary = {
  totalOrders: number;
  totalRevenue: number;
  totalItems: number;
  averageOrderValue: number;
  totalProducts: number;
  totalOrderItems: number;
  totalShipments: number;
  matchedShipments: number;
  unmatchedShipments: number;
  ordersByDate?: Record<string, number>;
  revenueByDate?: Record<string, number>;
};

export type OrderRow = {
  order_id: string;
  customer_id: string;
  customer_name: string;
  order_date: string;
  product_id: string;
  product_name: string | null;
  category: string | null;
  quantity: number;
  unit_price: number;
  line_total: number;
  shipment_status?: string | null;
  shipment_id?: string | null;
  shipment_match?: boolean;
};

export type ProductMetric = {
  productId: string;
  productName: string;
  category: string;
  totalRevenue: number;
  totalQuantity: number;
  orderCount: number;
};

export type CategoryMetric = {
  category: string;
  totalRevenue: number;
  totalQuantity: number;
  numberOfOrders: number;
  numberOfProducts: number;
};

export type CountryRecord = {
  name: string;
  cca2: string;
  cca3: string;
  currencies: Array<{ code: string; name: string; symbol: string | null }>;
  languages: string[];
  region: string;
  population: number;
  flag: string;
};
