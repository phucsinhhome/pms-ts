import { AxiosResponse } from "axios";
import { immigrationRegistrationApi } from "./apis";

export type ImmigrationGuest = {
  id: string;
  name: string;
  dateOfBirth: string;
  country: string;
};

export type ImmigrationRegistration = {
  invoiceId: string;
  status: string;
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

export const addImmigrationRegistration = (invoiceId: string) =>
  immigrationRegistrationApi.post<ImmigrationRegistration>("/registrations", { invoiceId });

export const removeImmigrationRegistration = (invoiceId: string) =>
  immigrationRegistrationApi.delete(`/registrations/${invoiceId}`);

export const addImmigrationGuest = (
  invoiceId: string,
  guest: ImmigrationGuest,
) => immigrationRegistrationApi.post<ImmigrationRegistration>(
  `/registrations/${invoiceId}/guests`,
  guest,
);

export const removeImmigrationGuest = (invoiceId: string, guestId: string) =>
  immigrationRegistrationApi.delete(`/registrations/${invoiceId}/guests/${encodeURIComponent(guestId)}`);

export { unwrapPage };
