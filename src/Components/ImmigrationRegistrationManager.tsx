import React, { FormEvent, useEffect, useState } from "react";
import { Button, Label, Modal, Spinner, TextInput } from "flowbite-react";
import { formatISODate } from "../Service/Utils";
import {
  addImmigrationGuest,
  addImmigrationRegistration,
  ImmigrationGuest,
  ImmigrationRegistration,
  listImmigrationRegistrations,
  removeImmigrationGuest,
  removeImmigrationRegistration,
  unwrapPage,
} from "../db/immigrationRegistration";
import { Pagination } from "./ProfitReport";
import { HiOutlineArrowLeft, HiOutlineArrowRight, HiPlus, HiTrash } from "react-icons/hi";

type Props = {
  activeMenu: () => void;
  handleUnauthorized: () => void;
};

type GuestForm = Omit<ImmigrationGuest, "id"> & { id: string };

const emptyPagination: Pagination = {
  pageNumber: 0,
  pageSize: Number(process.env.REACT_APP_DEFAULT_PAGE_SIZE) || 10,
  totalElements: 0,
  totalPages: 0,
};

const emptyGuest: GuestForm = { id: "", name: "", dateOfBirth: "", country: "" };

export const ImmigrationRegistrationManager = ({ activeMenu, handleUnauthorized }: Props) => {
  const today = formatISODate(new Date());
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [registrations, setRegistrations] = useState<ImmigrationRegistration[]>([]);
  const [pagination, setPagination] = useState<Pagination>(emptyPagination);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [invoiceId, setInvoiceId] = useState("");
  const [selectedRegistration, setSelectedRegistration] = useState<ImmigrationRegistration>();
  const [guest, setGuest] = useState<GuestForm>(emptyGuest);

  const loadRegistrations = async () => {
    if (fromDate > toDate) {
      setError("The from date must not be after the to date.");
      return;
    }
    setLoading(true);
    setError(undefined);
    try {
      const response = await listImmigrationRegistrations(fromDate, toDate, pagination.pageNumber, pagination.pageSize);
      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        return;
      }
      if (response.status !== 200) throw new Error(`Immigration API returned ${response.status}`);
      const data = unwrapPage(response);
      if (Array.isArray(data)) {
        setRegistrations(data);
        setPagination((current) => ({ ...current, totalElements: data.length, totalPages: data.length ? 1 : 0 }));
      } else {
        setRegistrations(data.content || []);
        setPagination({
          pageNumber: data.number ?? pagination.pageNumber,
          pageSize: data.size ?? pagination.pageSize,
          totalElements: data.totalElements ?? 0,
          totalPages: data.totalPages ?? 0,
        });
      }
    } catch (e) {
      console.error("Unable to load immigration registrations", e);
      setRegistrations([]);
      setError("Unable to load immigration registrations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    activeMenu();
    loadRegistrations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDate, pagination.pageNumber]);

  const request = async (operation: () => Promise<{ status: number }>) => {
    setSaving(true);
    setError(undefined);
    try {
      const response = await operation();
      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        return false;
      }
      if (response.status < 200 || response.status >= 300) throw new Error(`Immigration API returned ${response.status}`);
      await loadRegistrations();
      return true;
    } catch (e) {
      console.error("Immigration registration operation failed", e);
      setError("Unable to update immigration registration.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const addRegistration = async (event: FormEvent) => {
    event.preventDefault();
    const value = invoiceId.trim();
    if (!value) return;
    const success = await request(() => addImmigrationRegistration(value));
    if (success) setInvoiceId("");
  };

  const addGuest = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedRegistration || !guest.id.trim() || !guest.name.trim() || !guest.dateOfBirth || !guest.country.trim()) {
      setError("Complete all guest fields before adding the guest.");
      return;
    }
    const success = await request(() => addImmigrationGuest(selectedRegistration.invoiceId, guest));
    if (success) {
      setGuest(emptyGuest);
      setSelectedRegistration(undefined);
    }
  };

  const removeGuest = (registration: ImmigrationRegistration, guestId: string) =>
    request(() => removeImmigrationGuest(registration.invoiceId, guestId));

  return (
    <div className="relative flex h-[calc(100dvh-3rem)] flex-col">
      <div className="flex flex-wrap items-end gap-3 border-b pb-3">
        <label className="flex flex-col text-xs font-semibold text-green-900">From date
          <input className="rounded border border-green-700 px-2 py-1 text-sm" type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPagination(emptyPagination); }} />
        </label>
        <label className="flex flex-col text-xs font-semibold text-green-900">To date
          <input className="rounded border border-green-700 px-2 py-1 text-sm" type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setPagination(emptyPagination); }} />
        </label>
        <Button size="sm" color="green" onClick={loadRegistrations} disabled={loading}>Refresh</Button>
        <form className="flex items-end gap-2" onSubmit={addRegistration}>
          <div><Label htmlFor="invoice-id" value="Invoice ID" /><TextInput id="invoice-id" value={invoiceId} onChange={(e) => setInvoiceId(e.target.value)} /></div>
          <Button type="submit" size="sm" color="blue" disabled={saving || !invoiceId.trim()}><HiPlus className="mr-1" /> Add registration</Button>
        </form>
      </div>
      {error && <div className="p-3 text-sm text-red-700">{error}</div>}
      <div className="flex-1 overflow-y-auto">
        {loading ? <div className="flex justify-center p-8"><Spinner /></div> : registrations.length === 0 ? <div className="p-8 text-center text-gray-500">No immigration registrations found.</div> : registrations.map((registration) => (
          <div key={registration.invoiceId} className="border-b p-3">
            <div className="flex items-center gap-3">
              <button type="button" className="flex-1 text-left" onClick={() => { setSelectedRegistration(registration); setGuest(emptyGuest); }}>
                <div className="font-medium text-green-900">{registration.invoiceId}</div>
                <div className="text-sm text-gray-600">Status: {registration.status} · Guests: {registration.guests?.length || 0}</div>
              </button>
              <Button size="xs" color="failure" disabled={saving} onClick={() => request(() => removeImmigrationRegistration(registration.invoiceId))}><HiTrash /></Button>
            </div>
            {(registration.guests || []).map((item) => <div key={item.id} className="ml-4 mt-2 flex items-center justify-between rounded bg-gray-50 px-3 py-2 text-sm">
              <span>{item.name} · {item.dateOfBirth} · {item.country} · {item.id}</span>
              <Button size="xs" color="failure" disabled={saving} onClick={() => removeGuest(registration, item.id)}><HiTrash /></Button>
            </div>)}
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-2 border-t bg-slate-100 p-1">
        <Button size="xs" color="light" disabled={pagination.pageNumber === 0} onClick={() => setPagination({ ...pagination, pageNumber: pagination.pageNumber - 1 })}><HiOutlineArrowLeft /></Button>
        <span className="px-2 py-1 text-sm">{pagination.totalPages ? pagination.pageNumber + 1 : 0} of {pagination.totalPages}</span>
        <Button size="xs" color="light" disabled={pagination.pageNumber >= pagination.totalPages - 1} onClick={() => setPagination({ ...pagination, pageNumber: pagination.pageNumber + 1 })}><HiOutlineArrowRight /></Button>
      </div>
      <Modal show={!!selectedRegistration} onClose={() => setSelectedRegistration(undefined)}>
        <Modal.Header>Add guest to registration</Modal.Header>
        <Modal.Body>
          <form className="space-y-3" onSubmit={addGuest}>
            <div><Label htmlFor="guest-id" value="Guest ID" /><TextInput id="guest-id" value={guest.id} onChange={(e) => setGuest({ ...guest, id: e.target.value })} /></div>
            <div><Label htmlFor="guest-name" value="Name" /><TextInput id="guest-name" value={guest.name} onChange={(e) => setGuest({ ...guest, name: e.target.value })} /></div>
            <div><Label htmlFor="guest-dob" value="Date of birth" /><TextInput id="guest-dob" type="date" value={guest.dateOfBirth} onChange={(e) => setGuest({ ...guest, dateOfBirth: e.target.value })} /></div>
            <div><Label htmlFor="guest-country" value="Country" /><TextInput id="guest-country" value={guest.country} onChange={(e) => setGuest({ ...guest, country: e.target.value })} /></div>
            <Button type="submit" color="blue" disabled={saving}>Add guest</Button>
          </form>
        </Modal.Body>
      </Modal>
    </div>
  );
};
