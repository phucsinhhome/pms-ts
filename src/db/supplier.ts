import { SupplierInvoice } from "../Components/SupplierManager";
import { supplierApi } from "./apis";

export const listSupplierInvoices = (createdTime: string, page: number, size: number) => {
  console.info("Fetching supplier invoices from backend")
  return supplierApi.get(`/invoice/list`, { params: { createdTime, page, size } });
}

export const listAllSupplierInvoices = async (page: number, size: number) => {
  console.info("Fetching all supplier invoices from backend")
  return supplierApi.get(`/invoice/list`, { params: { page, size } });
}

export const listSupplierInvoicesByStatus = async (statuses: string[], page: number, size: number) => {
  console.info("Fetching supplier invoices from backend by statuses")
  return supplierApi.get(`/invoice/list`, { params: { statuses, page, size } });
}

export const listSupplierInvoicesByTimeAndStatus = (createdTime: string, statuses: string[], page: number, size: number) => {
  console.info("Fetching supplier invoices by time and status")
  return supplierApi.get(`/invoice/list`, { params: { createdTime, statuses, page, size } });
}

export const generateSInvoice = async (text: string) => {
  console.info("Generate supplier invoice")
  return supplierApi.post(`/invoice/generate`, text, {
    headers: { 'Content-Type': 'text/plain' }
  });
}

export const saveSInvoice = async (invoice: SupplierInvoice) => {
  console.info("Save supplier invoice")
  return supplierApi.post(`/invoice/save`, invoice, {
    headers: { 'Content-Type': 'application/json' }
  });
}

export const takenPlaceSInvoice = async (invoice: SupplierInvoice) => {
  console.info("Taken place supplier invoice")
  return supplierApi.post(`/invoice/take-place`, invoice, {
    headers: { 'Content-Type': 'application/json' }
  });
}

export const paidSInvoice = async (invoice: SupplierInvoice) => {
  console.info("Paid supplier invoice")
  return supplierApi.post(`/invoice/paid`, invoice, {
    headers: { 'Content-Type': 'application/json' }
  });
}

export const rejectSInvoice = (invoiceId: string, username: string) => {
  console.info("Reject supplier invoice")
  return supplierApi.post(`/invoice/reject`, null, { params: { invoiceId, username: username } });
}
