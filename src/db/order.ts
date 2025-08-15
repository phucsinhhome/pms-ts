import { Order, OrderItem } from "../Components/OrderManager";
import { orderApi } from "./apis";

export const listOrders = (fromTime: string, page: number, size: number) => {
  console.info(`Fetch orders from backend from ${fromTime}`)
  return orderApi.get(`/list`, { params: { fromTime, page, size } });
}

export const listOrderByStatuses = (fromTime: string, statuses: string[], page: number, size: number) => {
  console.info(`Fetch orders from backend from ${fromTime} with statuses ${statuses}`)
  return orderApi.get(`/list`, { params: { fromTime, statuses: statuses.join(','), page, size } });
}

export const fetchUpcomingOrders = (fromTime: string, filter: string, page: number, size: number) => {
  console.info("Fetch orders from backend")
  return orderApi.get(`/list/${filter}`, { params: { fromTime, page, size } });
}

export const startOrder = (resolverId: string, startTime: string) => {
  console.info("Start an order")
  return orderApi.get(`/start`, { params: { resolverId, startTime } });
}

export const adjustOrderItem = (orderId: string, item: OrderItem) => {
  console.info("Add item into order")
  return orderApi.post(`/${orderId}/product/adjust`, item, {
    headers: { 'Content-Type': 'application/json' }
  });
}

export const saveOrder = (order: Order) => {
  console.info("Save order %s", order.id)
  return orderApi.post(`/save`, order, {
    headers: { 'Content-Type': 'application/json' }
  });
}

export const fetchAvailability = (itemIds: string[]) => {
  console.info("Commit the order")
  return orderApi.post(`/availability`, itemIds, {
    headers: { 'Content-Type': 'application/json' }
  });
}

export const fetchItems = (group: string, page: number, size: number) => {
  console.info("Fetch all the available items of group %s", group)
  return orderApi.get(`/items`, { params: { group, page, size } });
}

export const commitOrder = (order: Order) => {
  console.info("Commit the order")
  return orderApi.post(`/commit`, order, {
    headers: { 'Content-Type': 'application/json' }
  });
}

export const getPotentialInvoices = (orderId: string) => {
  console.info("Fetch the potential invoices of the order")
  return orderApi.get(`/${orderId}/guests`);
}

export const resolveInvoiceId = (resolverId: string) => {
  console.info("Resolve the invoice id from the id %s", resolverId)
  return orderApi.get(`/resolve`, { params: { resolverId } });
}

export const fetchOrder = (orderId: string) => {
  console.info("Fetch the order")
  return orderApi.get(`/${orderId}`);
}

export const confirmOrder = (order: Order) => {
  console.info("Confirm the order")
  return orderApi.post(`/confirm`, order, {
    headers: { 'Content-Type': 'application/json' }
  });
}

export const serveOrder = (order: Order) => {
  console.info("Serve the order")
  return orderApi.post(`/serve`, order, {
    headers: { 'Content-Type': 'application/json' }
  });
}

export const rejectOrder = (orderId: string, staffId: string) => {
  console.info("Reject the order")
  return orderApi.post(`/reject`, null, { params: { orderId, staffId } });
}