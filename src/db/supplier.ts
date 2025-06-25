import { SupplierInvoice } from "../Components/SupplierManager";
import { getAccessToken } from "../App";

export const listSupplierInvoices = async (createdTime: string, page: number, size: number) => {
  console.info("Fetching supplier invoices from backend")
  const accessToken = await getAccessToken();
  const opts: RequestInit = {
    method: 'GET',
    headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : undefined
  }
  return fetch(`${process.env.REACT_APP_SUPPLIER_ENDPOINT}/invoice/list?createdTime=${createdTime}&page=${page}&size=${size}`, opts);
}

export const listAllSupplierInvoices = async (page: number, size: number) => {
  console.info("Fetching all supplier invoices from backend")
  const accessToken = await getAccessToken();
  const opts: RequestInit = {
    method: 'GET',
    headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : undefined
  }
  return fetch(`${process.env.REACT_APP_SUPPLIER_ENDPOINT}/invoice/list?page=${page}&size=${size}`, opts);
}

export const listSupplierInvoicesByStatus = async (statuses: string[], page: number, size: number) => {
  console.info("Fetching supplier invoices from backend by statuses")
  const accessToken = await getAccessToken();
  const opts: RequestInit = {
    method: 'GET',
    headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : undefined
  }
  return fetch(`${process.env.REACT_APP_SUPPLIER_ENDPOINT}/invoice/list?statuses=${statuses}&page=${page}&size=${size}`, opts);
}

export const listSupplierInvoicesByTimeAndStatus = async (createdTime: string, statuses: string[], page: number, size: number) => {
  console.info("Fetching supplier invoices by time and status")
  const accessToken = await getAccessToken();
  const opts: RequestInit = {
    method: 'GET',
    headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : undefined
  }
  return fetch(`${process.env.REACT_APP_SUPPLIER_ENDPOINT}/invoice/list?createdTime=${createdTime}&statuses=${statuses}&page=${page}&size=${size}`, opts);
}

export const generateSInvoice = async (text: string) => {
  console.info("Generate supplier invoice")
  const accessToken = await getAccessToken();
  const opts: RequestInit = {
    method: 'POST',
    headers: { 
      'Content-Type': 'text/plain',
      ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
    },
    body: JSON.stringify(text)
  }
  return fetch(`${process.env.REACT_APP_SUPPLIER_ENDPOINT}/invoice/generate`, opts);
}

export const saveSInvoice = async (invoice: SupplierInvoice) => {
  console.info("Save supplier invoice")
  const accessToken = await getAccessToken();
  const opts: RequestInit = {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
    },
    body: JSON.stringify(invoice)
  }
  return fetch(`${process.env.REACT_APP_SUPPLIER_ENDPOINT}/invoice/save`, opts);
}

export const takenPlaceSInvoice = async (invoice: SupplierInvoice) => {
  console.info("Taken place supplier invoice")
  const accessToken = await getAccessToken();
  const opts: RequestInit = {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
    },
    body: JSON.stringify(invoice)
  }
  return fetch(`${process.env.REACT_APP_SUPPLIER_ENDPOINT}/invoice/take-place`, opts);
}

export const paidSInvoice = async (invoice: SupplierInvoice) => {
  console.info("Paid supplier invoice")
  const accessToken = await getAccessToken();
  const opts: RequestInit = {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
    },
    body: JSON.stringify(invoice)
  }
  return fetch(`${process.env.REACT_APP_SUPPLIER_ENDPOINT}/invoice/paid`, opts);
}

export const rejectSInvoice = async (invoiceId: string, staffId: string) => {
  console.info("Reject supplier invoice")
  const accessToken = await getAccessToken();
  const opts: RequestInit = {
    method: 'POST',
    headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : undefined
  }
  return fetch(`${process.env.REACT_APP_SUPPLIER_ENDPOINT}/invoice/reject?invoiceId=${invoiceId}&staffId=${staffId}`, opts);
}
