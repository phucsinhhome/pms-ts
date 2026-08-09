import { Invoice } from "../Components/InvoiceManager";
import { invoiceApi } from "./apis";

export const Configs = {
  logo: process.env.REACT_APP_PS_LOGO
}

export const updateInvoice = (invoice: Invoice) => {
  console.info("Call API to update invoice");
  return invoiceApi.post(
    ``,
    invoice,
    { headers: { 'Content-Type': 'application/json' } }
  );
}

export const createInvoice = (invoice: Invoice) => {
  console.info("Call API to create invoice");
  return invoiceApi.put(
    ``,
    invoice,
    { headers: { 'Content-Type': 'application/json' } }
  );
}

export const deleteInvoice = (invoiceId: string) => {
  console.info("Call API to delete invoice");
  return invoiceApi.delete(
    `/${invoiceId}`,
    {
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

export const listStayingAndComingInvoices = (fromDate: string, pageNumber: number, pageSize: number) => {
  console.info("Fetching invoices from backend include prepaid")
  return listStayingAndComingInvoicesAndPrepaid(fromDate, true, pageNumber, pageSize)
}

export function listStayingAndComingInvoicesAndPrepaid(fromDate: string, includePrepaid: boolean, pageNumber: number, pageSize: number) {
  console.info("Fetching invoices from backend")
  return invoiceApi.get(
    ``,
    { params: { fromDate, includePrepaid, page: pageNumber, size: pageSize } }
  );
}

export const listInvoiceByGuestName = async (fromDate: string, guestName: string, pageNumber: number, pageSize: number) => {
  console.info("Fetching invoices by guest name")
  
  return await invoiceApi.get(
    `/search/name`,
    { params: { fromDate, guestName, page: pageNumber, size: pageSize } }
  );
}

export const getInvoice = (invoiceId: string) => {
  console.info("Fetching invoice from backend")
  
  return invoiceApi.get(`/${invoiceId}`);
}


