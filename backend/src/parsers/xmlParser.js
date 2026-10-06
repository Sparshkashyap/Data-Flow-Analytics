const fs = require('fs');
const path = require('path');
const { XMLParser } = require('fast-xml-parser');

function parseXmlFile(filePath) {
  const absolutePath = path.resolve(filePath);
  const raw = fs.readFileSync(absolutePath, 'utf8');
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    parseTagValue: true,
    trimValues: true,
    allowBooleanAttributes: true,
    parseNodeValue: true,
    preserveOrder: false,
  });

  return parser.parse(raw);
}

function extractShipmentRecords(xmlRoot) {
  if (!xmlRoot || typeof xmlRoot !== 'object') {
    return [];
  }

  const possibleRoots = [];
  if (Array.isArray(xmlRoot.shipments)) possibleRoots.push(xmlRoot.shipments);
  if (Array.isArray(xmlRoot.shipment)) possibleRoots.push(xmlRoot.shipment);
  if (xmlRoot.shipments || xmlRoot.shipment) {
    possibleRoots.push(xmlRoot.shipments || xmlRoot.shipment);
  }

  const candidateNodes = [];
  for (const root of possibleRoots) {
    if (Array.isArray(root)) candidateNodes.push(...root);
    else if (root && typeof root === 'object') candidateNodes.push(root);
  }

  if (candidateNodes.length === 0) {
    const nestedEntries = Object.values(xmlRoot).flatMap((val) => {
      if (Array.isArray(val)) return val;
      if (val && typeof val === 'object') return [val];
      return [];
    });
    candidateNodes.push(...nestedEntries.filter((entry) => entry && typeof entry === 'object'));
  }

  const shipmentRecords = candidateNodes
    .filter((record) => record && typeof record === 'object')
    .map((record) => normalizeShipmentRecord(record))
    .filter(Boolean);

  return shipmentRecords;
}

function normalizeShipmentRecord(record) {
  if (!record || typeof record !== 'object') return null;

  const shipmentId = getFieldValue(record, ['shipment_id', 'shipmentId', 'id', 'shipmentID']);
  const orderId = getFieldValue(record, ['order_id', 'orderId', 'order', 'orderID']);
  const shipmentDate = getFieldValue(record, ['shipment_date', 'shipmentDate', 'ship_date', 'created_at']);
  const deliveryDate = getFieldValue(record, ['delivery_date', 'deliveryDate', 'delivered_at', 'actual_delivery_date']);
  const expectedDeliveryDate = getFieldValue(record, ['expected_delivery_date', 'expectedDeliveryDate', 'eta']);
  const shipmentStatus = getFieldValue(record, ['shipment_status', 'status', 'shipmentStatus', 'delivery_status']);

  const normalized = {
    shipment_id: shipmentId || null,
    order_id: orderId || null,
    shipment_date: shipmentDate || null,
    delivery_date: deliveryDate || null,
    expected_delivery_date: expectedDeliveryDate || null,
    shipment_status: shipmentStatus || null,
  };

  const hasMeaningfulData = Object.values(normalized).some((value) => value !== null && value !== undefined && value !== '');
  return hasMeaningfulData ? normalized : null;
}

function getFieldValue(record, candidates) {
  for (const key of candidates) {
    if (record[key] !== undefined && record[key] !== null && record[key] !== '') {
      if (typeof record[key] === 'object' && record[key].value !== undefined) {
        return String(record[key].value).trim();
      }
      return String(record[key]).trim();
    }
  }

  for (const [key, value] of Object.entries(record)) {
    const normalizedKey = String(key).toLowerCase();
    if (candidates.some((candidate) => candidate.toLowerCase() === normalizedKey)) {
      if (value !== undefined && value !== null && value !== '') {
        if (typeof value === 'object' && value.value !== undefined) {
          return String(value.value).trim();
        }
        return String(value).trim();
      }
    }
  }

  return null;
}

module.exports = { parseXmlFile, extractShipmentRecords, normalizeShipmentRecord };
