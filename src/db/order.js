
export const fetchOrders = (fromTime, page, size) => {
  console.info("Fetch upcoming orders")
  var opts = {
    method: 'GET'
  }
  return fetch(`${process.env.REACT_APP_ORDER_ENDPOINT}/list/coming?fromTime=${fromTime}&page=${page}&size=${size}`, opts);
}

export const startOrder = (resolverId, startTime) => {
  console.info("Start an order")
  var opts = {
    method: 'GET'
  }
  return fetch(`${process.env.REACT_APP_ORDER_ENDPOINT}/start?resolverId=${resolverId}&startTime=${startTime}`, opts);
}

export const adjustOrderItem = (orderId, item) => {
  console.info("Add item into order")
  var opts = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item)
  }
  return fetch(`${process.env.REACT_APP_ORDER_ENDPOINT}/${orderId}/product/adjust`, opts);
}

export const fetchAvailability = (itemIds) => {
  console.info("Commit the order")
  var opts = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(itemIds)
  }
  return fetch(`${process.env.REACT_APP_ORDER_ENDPOINT}/availability`, opts);
}

export const fetchItems = (group, page, size) => {
  console.info("Fetch all the available items of group %s", group)
  var opts = {
    method: 'GET'
  }
  return fetch(`${process.env.REACT_APP_ORDER_ENDPOINT}/items?group=${group}&page=${page}&size=${size}`, opts);
}

export const commitOrder = (order) => {
  console.info("Commit the order")
  var opts = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order)
  }
  return fetch(`${process.env.REACT_APP_ORDER_ENDPOINT}/commit`, opts);
}

export const getPotentialInvoices = (orderId) => {
  console.info("Fetch the potential invoices of the order")
  var opts = {
    method: 'GET'
  }
  return fetch(`${process.env.REACT_APP_ORDER_ENDPOINT}/${orderId}/guests`, opts);
}

export const resolveInvoiceId = (resolverId) => {
  console.info("Resolve the invoice id from the id %s", resolverId)
  var opts = {
    method: 'GET'
  }
  return fetch(`${process.env.REACT_APP_ORDER_ENDPOINT}/resolve?resolverId=${resolverId}`, opts);
}

export const fetchOrder = (orderId) => {
  console.info("Fetch the order")
  var opts = {
    method: 'GET'
  }
  return fetch(`${process.env.REACT_APP_ORDER_ENDPOINT}/${orderId}`, opts);
}

export const confirmOrder = (order) => {
  console.info("Confirm the order")
  var opts = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order)
  }
  return fetch(`${process.env.REACT_APP_ORDER_ENDPOINT}/confirm`, opts);
}

export const rejectOrder = (orderId, staffId) => {
  console.info("Reject the order")
  var opts = {
    method: 'POST'
  }
  return fetch(`${process.env.REACT_APP_ORDER_ENDPOINT}/reject?orderId=${orderId}&staffId=${staffId}`, opts);
}