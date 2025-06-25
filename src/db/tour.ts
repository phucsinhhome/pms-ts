import { Tour } from "../Components/TourManager";
import { tourApi } from "./apis";

export const listTour = () => {
  console.info("Fetching all tours from the inventory");
  return tourApi.get(`/list`, { params: { page: 0, size: 100 } });
}

export const getTour = (tourId: string) => {
  console.info("Fetching the tour %s", tourId);
  return tourApi.get(`/${tourId}`);
}

export const saveTour = (tour: Tour) => {
  console.info("Saving the tour %s", tour.name);
  return tourApi.post(`/quantity/adjust`, tour, {
    headers: { 'Content-Type': 'application/json' }
  });
}