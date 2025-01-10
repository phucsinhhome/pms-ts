import { SupplierInvoice } from "../Components/SupplierManager";

export const listSupplierInvoices = (createdTime: string, page: number, size: number) => {
  console.info("Fetching supplier invoices from backend")
  const opts = {
    method: 'GET'
  }
  return fetch(`${process.env.REACT_APP_SUPPLIER_ENDPOINT}/invoice/list?createdTime=${createdTime}&page=${page}&size=${size}`, opts);
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
