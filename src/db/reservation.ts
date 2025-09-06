import { Reservation } from "../Components/ReservationManager";
import { reservationApi } from "./apis";

export const updateReservation = async (reservation: Reservation) => {
  console.info("Call API to update reservation");
  return reservationApi.post(
    `/update`,
    reservation,
    { headers: { 'Content-Type': 'application/json' } }
  );
}

export const listLatestReservations = async (fromDate: string, toDate: string, pageNumber: number, pageSize: number) => {
  console.info("Fetching reservations from backend")
  return reservationApi.get(
    `/list`,
    { params: { fromDate, toDate, page: pageNumber, size: pageSize } }
  );
}

export const listStayingAndComingReservations = async (fromDate: string, pageNumber: number, pageSize: number) => {
  console.info("Fetching reservations from backend")
  return reservationApi.get(
    `/list/upcoming`,
    { params: { fromDate, page: pageNumber, size: pageSize } }
  );
}

export const getReservation = async (reservationId: string) => {
  console.info("Fetching reservation from backend")
  return reservationApi.get(
    `/${reservationId}`
  );
}

export const syncReservationFromMailbox = () => {
  console.info("Sync reservation from backend")
  return reservationApi.put(`/sync`)
}