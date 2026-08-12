import React, { useEffect, useState } from "react";
import { Button, Modal, Spinner } from "flowbite-react";
import { formatISODate, formatVND } from "../Service/Utils";
import { listTaxableInvoices } from "../db/tax";
import { Pagination } from "./ProfitReport";

export type TaxableInvoiceItem = {
  id?: string;
  itemName?: string;
  name?: string;
  quantity?: number;
  unitPrice?: number;
  amount?: number;
  service?: string;
};

export type TaxableInvoice = {
  id: string;
  guestName?: string;
  name?: string;
  checkOutDate?: string;
  checkoutDate?: string;
  invoiceCheckoutDate?: string;
  subTotal?: number;
  subtotal?: number;
  paymentMethod?: string;
  items?: TaxableInvoiceItem[];
};

type TaxableInvoiceManagerProps = {
  activeMenu: () => void;
  handleUnauthorized: () => void;
};

const emptyPage: Pagination = {
  pageNumber: 0,
  pageSize: Number(process.env.REACT_APP_DEFAULT_PAGE_SIZE) || 10,
  totalElements: 0,
  totalPages: 0,
};

const dateValue = (invoice: TaxableInvoice) =>
  invoice.checkOutDate || invoice.checkoutDate || invoice.invoiceCheckoutDate || "";
const guestValue = (invoice: TaxableInvoice) => invoice.guestName || invoice.name || "-";
const subtotalValue = (invoice: TaxableInvoice) => invoice.subTotal ?? invoice.subtotal ?? 0;

export const TaxableInvoiceManager = (props: TaxableInvoiceManagerProps) => {
  const today = formatISODate(new Date());
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [invoices, setInvoices] = useState<TaxableInvoice[]>([]);
  const [pagination, setPagination] = useState<Pagination>(emptyPage);
  const [selectedInvoice, setSelectedInvoice] = useState<TaxableInvoice>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const fetchInvoices = async () => {
    if (fromDate > toDate) {
      setError("The from date must not be after the to date.");
      setInvoices([]);
      return;
    }
    setLoading(true);
    setError(undefined);
    try {
      const response = await listTaxableInvoices(
        fromDate,
        toDate,
        pagination.pageNumber,
        pagination.pageSize,
      );
      if (response.status === 401 || response.status === 403) {
        props.handleUnauthorized();
        return;
      }
      if (response.status !== 200) throw new Error(`Tax API returned ${response.status}`);
      const data: any = response.data;
      if (Array.isArray(data)) {
        setInvoices(data);
        setPagination({ ...pagination, totalElements: data.length, totalPages: data.length ? 1 : 0 });
      } else {
        setInvoices(data.content || []);
        setPagination({
          pageNumber: data.number ?? pagination.pageNumber,
          pageSize: data.size ?? pagination.pageSize,
          totalElements: data.totalElements ?? 0,
          totalPages: data.totalPages ?? 0,
        });
      }
    } catch (e) {
      console.error("Error while fetching taxable invoices", e);
      setInvoices([]);
      setError("Unable to load taxable invoices.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    props.activeMenu();
    fetchInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDate, pagination.pageNumber]);

  const changePage = (pageNumber: number) => {
    setPagination({ ...pagination, pageNumber: Math.max(0, Math.min(pageNumber, Math.max(0, pagination.totalPages - 1))) });
  };

  return (
    <div className="relative flex h-[calc(100dvh-3rem)] flex-col">
      <div className="flex flex-wrap items-end gap-3 border-b pb-3">
        <label className="flex flex-col text-xs font-semibold text-green-900">
          From date
          <input className="rounded border border-green-700 px-2 py-1 text-sm" type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPagination(emptyPage); }} />
        </label>
        <label className="flex flex-col text-xs font-semibold text-green-900">
          To date
          <input className="rounded border border-green-700 px-2 py-1 text-sm" type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setPagination(emptyPage); }} />
        </label>
        <Button size="sm" color="green" onClick={fetchInvoices}>Search</Button>
      </div>

      {error && <div className="p-3 text-sm text-red-700">{error}</div>}
      <div className="flex-1 overflow-y-auto">
        {loading ? <div className="flex justify-center p-8"><Spinner /></div> : invoices.length === 0 ? <div className="p-8 text-center text-gray-500">No taxable invoices found.</div> : (
          <div className="divide-y">
            {invoices.map((invoice) => (
              <button key={invoice.id} type="button" onClick={() => setSelectedInvoice(invoice)} className="flex w-full items-center justify-between px-2 py-3 text-left hover:bg-green-50">
                <span className="text-sm text-gray-700">{dateValue(invoice) ? new Date(dateValue(invoice)).toLocaleDateString() : "-"}</span>
                <span className="flex-1 px-4 font-medium text-green-900">{guestValue(invoice)}</span>
                <span className="font-mono text-sm">{formatVND(subtotalValue(invoice))}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex justify-center gap-2 border-t bg-slate-100 p-2">
        <Button size="xs" color="light" disabled={pagination.pageNumber === 0} onClick={() => changePage(pagination.pageNumber - 1)}>Previous</Button>
        <span className="px-2 py-1 text-sm">Page {pagination.totalPages ? pagination.pageNumber + 1 : 0} of {pagination.totalPages}</span>
        <Button size="xs" color="light" disabled={pagination.pageNumber >= pagination.totalPages - 1} onClick={() => changePage(pagination.pageNumber + 1)}>Next</Button>
      </div>

      <Modal show={!!selectedInvoice} onClose={() => setSelectedInvoice(undefined)}>
        <Modal.Header>Taxable transaction details</Modal.Header>
        <Modal.Body>
          {selectedInvoice && <div className="space-y-3 text-sm">
            <div><strong>Date:</strong> {dateValue(selectedInvoice) ? new Date(dateValue(selectedInvoice)).toLocaleDateString() : "-"}</div>
            <div><strong>Guest:</strong> {guestValue(selectedInvoice)}</div>
            <div><strong>Payment method:</strong> {selectedInvoice.paymentMethod || "-"}</div>
            <div className="border-t pt-2"><strong>Line items</strong></div>
            {(selectedInvoice.items || []).length === 0 ? <div className="text-gray-500">No line items.</div> : (selectedInvoice.items || []).map((item, index) => <div key={item.id || index} className="flex justify-between border-b py-1"><span>{item.itemName || item.name || item.service || "Item"} × {item.quantity ?? 1}</span><span>{formatVND(item.amount ?? (item.unitPrice || 0) * (item.quantity || 1))}</span></div>)}
            <div className="flex justify-between border-t pt-2 font-semibold"><span>Subtotal</span><span>{formatVND(subtotalValue(selectedInvoice))}</span></div>
          </div>}
        </Modal.Body>
        <Modal.Footer><Button color="gray" onClick={() => setSelectedInvoice(undefined)}>Close</Button></Modal.Footer>
      </Modal>
    </div>
  );
};
