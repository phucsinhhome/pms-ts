import { AxiosResponse } from "axios";
import { taxApi } from "./apis";
import { TaxableInvoice } from "../Components/TaxableInvoiceManager";

export type TaxInvoicePage = {
  content: TaxableInvoice[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export const listTaxableInvoices = (
  fromDate: string,
  toDate: string,
  pageNumber: number,
  pageSize: number,
): Promise<AxiosResponse<TaxInvoicePage | TaxableInvoice[]>> => {
  return taxApi.get("/report/invoices", {
    params: { fromDate, toDate, page: pageNumber, size: pageSize },
  });
};

export const getTaxableInvoice = (invoiceId: string) =>
  taxApi.get(`/tax/${invoiceId}`);
