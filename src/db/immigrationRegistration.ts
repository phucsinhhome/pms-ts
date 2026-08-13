import { AxiosResponse } from "axios";
import { immigrationRegistrationApi } from "./apis";
import { Invoice } from "../Components/InvoiceManager";

export type ImmigrationGuest = {
  id: string;
  name: string;
  dateOfBirth: string;
  country: string;
};

export type ImmigrationRegistration = {
  invoiceId: string;
  status: string;
  checkInDate: string;
  checkOutDate: string;
  guests: ImmigrationGuest[];
};

export type ImmigrationRegistrationPage = {
  content: ImmigrationRegistration[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

const unwrapPage = (
  response: AxiosResponse<ImmigrationRegistrationPage | ImmigrationRegistration[]>,
): ImmigrationRegistrationPage | ImmigrationRegistration[] => response.data;

export const listImmigrationRegistrations = (
  fromDate: string,
  toDate: string,
  pageNumber: number,
  pageSize: number,
) =>
  immigrationRegistrationApi.get<ImmigrationRegistrationPage | ImmigrationRegistration[]>(
    "",
    { params: { fromDate, toDate, page: pageNumber, size: pageSize } },
  );

export const listInvoicesForImmigration = (
  fromDate: string,
  toDate: string
) =>
  immigrationRegistrationApi.get<Invoice | Invoice[]>(
    "/invoices",
    { params: { fromDate, toDate } },
  );

export const addImmigrationRegistration = (
  invoiceId: string,
  guests: ImmigrationGuest[],
) => immigrationRegistrationApi.post<ImmigrationRegistration>(
  `/${encodeURIComponent(invoiceId)}`,
  { guests },
);

export const removeImmigrationRegistration = (invoiceId: string) =>
  immigrationRegistrationApi.delete(`/${encodeURIComponent(invoiceId)}`);

export const addImmigrationGuest = (
  invoiceId: string,
  guest: ImmigrationGuest,
) => immigrationRegistrationApi.post<ImmigrationRegistration>(
  `/${encodeURIComponent(invoiceId)}/guests`,
  guest,
);

export const removeImmigrationGuest = (invoiceId: string, guestId: string) =>
  immigrationRegistrationApi.delete(`/${invoiceId}/guests/${encodeURIComponent(guestId)}`);

export { unwrapPage };
