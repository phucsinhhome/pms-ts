import { Reservation } from "../Components/ReservationManager";
import { getAccessToken } from "../App";

export const updateReservation = async (reservation: Reservation) => {
  console.info("Call API to export reservation");
  const accessToken = await getAccessToken();
  const opts: RequestInit = {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
    },
    body: new Blob([JSON.stringify(reservation)])
  }
  return fetch(`${process.env.REACT_APP_RESERVATION_SERVICE_ENDPOINT}/update`, opts);
}

export const listLatestReservations = async (fromDate: string, toDate: string, pageNumber: number, pageSize: number) => {
  console.info("Fetching reservations from backend")
  const accessToken = await getAccessToken();
  const opts: RequestInit = {
    method: 'GET',
    headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : undefined
  }
  return fetch(`${process.env.REACT_APP_RESERVATION_SERVICE_ENDPOINT}/list?fromDate=${fromDate}&toDate=${toDate}&page=${pageNumber}&size=${pageSize}`, opts)
    .then(response => response.json())
}

export const listStayingAndComingReservations = async (fromDate: string, pageNumber: number, pageSize: number) => {
  console.info("Fetching reservations from backend")
  const accessToken = await getAccessToken();
  const opts: RequestInit = {
    method: 'GET',
    headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : undefined
  }
  return fetch(`${process.env.REACT_APP_RESERVATION_SERVICE_ENDPOINT}/list/upcoming?fromDate=${fromDate}&page=${pageNumber}&size=${pageSize}`, opts)
    .then(response => response.json())
}

export const getReservation = async (reservationId: string) => {
  console.info("Fetching reservation from backend")
  const accessToken = await getAccessToken();
  const opts: RequestInit = {
    method: 'GET',
    headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : undefined
  }
  return fetch(`${process.env.REACT_APP_RESERVATION_SERVICE_ENDPOINT}/${reservationId}`, opts)
    .then(response => response.json())
}