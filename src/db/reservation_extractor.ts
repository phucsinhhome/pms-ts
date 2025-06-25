import { reservationExtractApi } from "./apis";

export const collectRes = (fromDate: string, toDate: string) => {
  console.info("Call API to collect reservations");
  return reservationExtractApi.get(
    `/reservation/collect`,
    {
      params: {
        fromDate,
        toDate,
        topic: process.env.REACT_APP_RESERVATION_TOPIC
      }
    }
  );
}