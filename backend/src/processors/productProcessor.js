function joinProducts(orderItems, products) {
  const productMap = new Map();
  for (const product of products) {
    if (product && product.product_id) {
      productMap.set(product.product_id, product);
    }
  }

  return orderItems
    .map((item) => {
      const product = productMap.get(item.product_id);
      if (!product) {
        return { ...item, matchedProduct: false, product_name: null, category: null };
      }
      return {
        ...item,
        matchedProduct: true,
        product_name: product.product_name,
        category: product.category,
      };
    })
    .filter((item) => item.product_id || item.matchedProduct || item.product_name !== null);
}

module.exports = { joinProducts };
