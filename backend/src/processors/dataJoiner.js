const { joinProducts } = require('./productProcessor');

function joinOrderProducts(orders, orderItems, products) {
  const productMap = new Map();
  for (const product of products) {
    if (product && product.product_id) {
      productMap.set(String(product.product_id), product);
    }
  }

  const orderMap = new Map();
  for (const order of orders) {
    if (order && order.order_id) {
      orderMap.set(String(order.order_id), order);
    }
  }

  const rows = [];

  for (const item of orderItems) {
    const order = orderMap.get(String(item.order_id));
    if (!order) continue;

    const product = productMap.get(String(item.product_id));
    if (!product) {
      rows.push({
        order_id: order.order_id,
        customer_id: order.customer_id,
        customer_name: order.customer_name,
        order_date: order.order_date,
        product_id: item.product_id,
        product_name: null,
        category: null,
        quantity: item.quantity,
        unit_price: item.unit_price,
        line_total: item.line_total,
        matchedProduct: false,
      });
      continue;
    }

    rows.push({
      order_id: order.order_id,
      customer_id: order.customer_id,
      customer_name: order.customer_name,
      order_date: order.order_date,
      product_id: item.product_id,
      product_name: product.product_name,
      category: product.category,
      quantity: item.quantity,
      unit_price: item.unit_price,
      line_total: item.line_total,
      matchedProduct: true,
    });
  }

  return rows;
}

function joinShipments(joinedOrders, shipments) {
  const shipmentMap = new Map();
  for (const shipment of shipments) {
    if (shipment && shipment.order_id) {
      shipmentMap.set(String(shipment.order_id), shipment);
    }
  }

  return joinedOrders.map((row) => {
    const shipment = shipmentMap.get(String(row.order_id));
    return {
      ...row,
      shipment_id: shipment?.shipment_id || null,
      shipment_date: shipment?.shipment_date || null,
      delivery_date: shipment?.delivery_date || null,
      expected_delivery_date: shipment?.expected_delivery_date || null,
      shipment_status: shipment?.shipment_status || null,
      shipment_match: Boolean(shipment),
    };
  });
}

module.exports = { joinOrderProducts, joinShipments, joinProducts };
