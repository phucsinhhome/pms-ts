import { Tour } from "../Components/TourManager";
import { tourRequestApi } from "./apis";

export const listTourRequest = () => {
  console.info("Fetching all tour requests from the inventory");
  return tourRequestApi.get(`/list`, { params: { page: 0, size: 100 } });
}

export const saveTourRequest = (tour: Tour) => {
  console.info("Saving the tour request %s", tour.name);
  return tourRequestApi.post(`/quantity/adjust`, tour, {
    headers: { 'Content-Type': 'application/json' }
  });
}