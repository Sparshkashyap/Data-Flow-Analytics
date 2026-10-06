class InMemoryRepository {
  constructor() {
    this.state = {
      orders: [],
      orderItems: [],
      products: [],
      shipments: [],
      joinedOrders: [],
      analytics: {
        summary: null,
        revenue: [],
        orders: [],
        categories: [],
        products: [],
      },
      dataQuality: null,
    };
  }

  setOrders(orders) {
    this.state.orders = orders;
  }

  setOrderItems(orderItems) {
    this.state.orderItems = orderItems;
  }

  setProducts(products) {
    this.state.products = products;
  }

  setShipments(shipments) {
    this.state.shipments = shipments;
  }

  setJoinedOrders(joinedOrders) {
    this.state.joinedOrders = joinedOrders;
  }

  setAnalytics(analytics) {
    this.state.analytics = analytics;
  }

  setDataQuality(dataQuality) {
    this.state.dataQuality = dataQuality;
  }

  getOrders() {
    return this.state.orders;
  }

  getOrderItems() {
    return this.state.orderItems;
  }

  getProducts() {
    return this.state.products;
  }

  getShipments() {
    return this.state.shipments;
  }

  getJoinedOrders() {
    return this.state.joinedOrders;
  }

  getAnalytics() {
    return this.state.analytics;
  }

  getDataQuality() {
    return this.state.dataQuality;
  }
}

module.exports = InMemoryRepository;
