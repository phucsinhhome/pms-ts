import { Order, OrderItem } from "../Components/OrderManager";

export const listOrders = (fromTime: string, page: number, size: number) => {
  console.info(`Fetch orders from backend from ${fromTime}`)
  var opts = {
    method: 'GET'
  }
  return fetch(`${process.env.REACT_APP_ORDER_ENDPOINT}/list?fromTime=${fromTime}&page=${page}&size=${size}`, opts);
}

export const listOrderByStatuses = (fromTime: string, statuses: string[], page: number, size: number) => {
  console.info(`Fetch orders from backend from ${fromTime} with statuses ${statuses}`)
  var opts = {
    method: 'GET'
  }
  return fetch(`${process.env.REACT_APP_ORDER_ENDPOINT}/list?fromTime=${fromTime}&statuses=${statuses}&page=${page}&size=${size}`, opts);
}

export const fetchUpcomingOrders = (fromTime: string, filter: string, page: number, size: number) => {
  console.info("Fetch orders from backend")
  var opts = {
    method: 'GET'
  }
  return fetch(`${process.env.REACT_APP_ORDER_ENDPOINT}/list/${filter}?fromTime=${fromTime}&page=${page}&size=${size}`, opts);
}

export const startOrder = (resolverId: string, startTime: string) => {
  console.info("Start an order")
  var opts = {
    method: 'GET'
  }
  return fetch(`${process.env.REACT_APP_ORDER_ENDPOINT}/start?resolverId=${resolverId}&startTime=${startTime}`, opts);
}

export const adjustOrderItem = (orderId: string, item: OrderItem) => {
  console.info("Add item into order")
  var opts = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item)
  }
  return fetch(`${process.env.REACT_APP_ORDER_ENDPOINT}/${orderId}/product/adjust`, opts);
}

export const saveOrder = (order: Order) => {
  console.info("Save order %s", order.id)
  var opts = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order)
  }
  return fetch(`${process.env.REACT_APP_ORDER_ENDPOINT}/save`, opts);
}

export const fetchAvailability = (itemIds: string[]) => {
  console.info("Commit the order")
  var opts = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(itemIds)
  }
  return fetch(`${process.env.REACT_APP_ORDER_ENDPOINT}/availability`, opts);
}

export const fetchItems = (group: string, page: number, size: number) => {
  console.info("Fetch all the available items of group %s", group)
  var opts = {
    method: 'GET'
  }
  return fetch(`${process.env.REACT_APP_ORDER_ENDPOINT}/items?group=${group}&page=${page}&size=${size}`, opts);
}

export const commitOrder = (order: Order) => {
  console.info("Commit the order")
  var opts = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order)
  }
  return fetch(`${process.env.REACT_APP_ORDER_ENDPOINT}/commit`, opts);
}

export const getPotentialInvoices = (orderId: string) => {
  console.info("Fetch the potential invoices of the order")
  var opts = {
    method: 'GET'
  }
  return fetch(`${process.env.REACT_APP_ORDER_ENDPOINT}/${orderId}/guests`, opts);
}

export const resolveInvoiceId = (resolverId: string) => {
  console.info("Resolve the invoice id from the id %s", resolverId)
  var opts = {
    method: 'GET'
  }
  return fetch(`${process.env.REACT_APP_ORDER_ENDPOINT}/resolve?resolverId=${resolverId}`, opts);
}

export const fetchOrder = (orderId: string) => {
  console.info("Fetch the order")
  var opts = {
    method: 'GET'
  }
  return fetch(`${process.env.REACT_APP_ORDER_ENDPOINT}/${orderId}`, opts);
}

export const confirmOrder = (order: Order) => {
  console.info("Confirm the order")
  var opts = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order)
  }
  return fetch(`${process.env.REACT_APP_ORDER_ENDPOINT}/confirm`, opts);
}

export const serveOrder = (order: Order) => {
  console.info("Serve the order")
  var opts = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order)
  }
  return fetch(`${process.env.REACT_APP_ORDER_ENDPOINT}/serve`, opts);
}

export const rejectOrder = (orderId: string, staffId: string) => {
  console.info("Reject the order")
  var opts = {
    method: 'POST'
  }
  return fetch(`${process.env.REACT_APP_ORDER_ENDPOINT}/reject?orderId=${orderId}&staffId=${staffId}`, opts);
}