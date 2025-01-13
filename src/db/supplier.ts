import { SupplierInvoice } from "../Components/SupplierManager";

export const listSupplierInvoices = (createdTime: string, page: number, size: number) => {
  console.info("Fetching supplier invoices from backend")
  const opts = {
    method: 'GET'
  }
  return fetch(`${process.env.REACT_APP_SUPPLIER_ENDPOINT}/invoice/list?createdTime=${createdTime}&page=${page}&size=${size}`, opts);
}

export const listAllSupplierInvoices = (page: number, size: number) => {
  console.info("Fetching all supplier invoices from backend")
  const opts = {
    method: 'GET'
  }
  return fetch(`${process.env.REACT_APP_SUPPLIER_ENDPOINT}/invoice/list?page=${page}&size=${size}`, opts);
}

export const listSupplierInvoicesByStatus = (statuses: string[], page: number, size: number) => {
  console.info("Fetching supplier invoices from backend by statuses")
  const opts = {
    method: 'GET'
  }
  return fetch(`${process.env.REACT_APP_SUPPLIER_ENDPOINT}/invoice/list?statuses=${statuses}&page=${page}&size=${size}`, opts);
}

export const listSupplierInvoicesByTimeAndStatus = (createdTime: string, statuses: string[], page: number, size: number) => {
  console.info("Fetching supplier invoices by time and status")
  const opts = {
    method: 'GET'
  }
  return fetch(`${process.env.REACT_APP_SUPPLIER_ENDPOINT}/invoice/list?createdTime=${createdTime}&statuses=${statuses}&page=${page}&size=${size}`, opts);
}


export const generateSInvoice = (text: string) => {
  console.info("Generate supplier invoice")
  var opts = {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(text)
  }
  return fetch(`${process.env.REACT_APP_SUPPLIER_ENDPOINT}/invoice/generate`, opts);
}

export const saveSInvoice = (invoice: SupplierInvoice) => {
  console.info("Save supplier invoice")
  var opts = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(invoice)
  }
  return fetch(`${process.env.REACT_APP_SUPPLIER_ENDPOINT}/invoice/save`, opts);
}

export const takenPlaceSInvoice = (invoice: SupplierInvoice) => {
  console.info("Taken place supplier invoice")
  var opts = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(invoice)
  }
  return fetch(`${process.env.REACT_APP_SUPPLIER_ENDPOINT}/invoice/take-place`, opts);
}

export const paidSInvoice = (invoice: SupplierInvoice) => {
  console.info("Paid supplier invoice")
  var opts = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(invoice)
  }
  return fetch(`${process.env.REACT_APP_SUPPLIER_ENDPOINT}/invoice/paid`, opts);
}

export const rejectSInvoice = (invoiceId: string, staffId: string) => {
  console.info("Reject supplier invoice")
  var opts = {
    method: 'POST'
  }
  return fetch(`${process.env.REACT_APP_SUPPLIER_ENDPOINT}/invoice/reject?invoiceId=${invoiceId}&staffId=${staffId}`, opts);
}
