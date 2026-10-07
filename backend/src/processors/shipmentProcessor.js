const { differenceInDays } = require('../utils/dateUtils');

function attachShipmentData(orders, shipments) {
  const shipmentMap = new Map();

  for (const shipment of shipments) {
    if (shipment && shipment.order_id) {
      const key = String(shipment.order_id);
      shipmentMap.set(key, shipment);
    }
  }

  return orders.map((order) => {
    const shipment = shipmentMap.get(String(order.order_id));
    const withShipment = {
      ...order,
      shipment: shipment || null,
    };

    if (shipment && shipment.delivery_date && shipment.expected_delivery_date) {
      const actualDelay = differenceInDays(shipment.expected_delivery_date, shipment.delivery_date);
      withShipment.delivery_delay_days = actualDelay;
      withShipment.is_delayed = actualDelay > 0;
    } else if (shipment && shipment.shipment_date && shipment.delivery_date) {
      const durationDays = differenceInDays(shipment.shipment_date, shipment.delivery_date);
      withShipment.delivery_duration_days = durationDays;
      withShipment.is_delayed = false;
    }

    return withShipment;
  });
}

module.exports = { attachShipmentData };
