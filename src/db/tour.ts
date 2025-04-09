import { Tour } from "../Components/TourManager"

export const listTour = () => {
  console.info("Fetching all tours from the inventory")
  const opts = {
    method: 'GET'
  }
  return fetch(`${process.env.REACT_APP_TOUR_ENDPOINT}/list?page=0&size=100`, opts)
}

export const getTour = (tourId: string) => {
  console.info("Fetching the tour %s", tourId)
  const opts = {
    method: 'GET'
  }
  return fetch(`${process.env.REACT_APP_TOUR_ENDPOINT}/${tourId}`, opts)
}

export const saveTour = (tour: Tour) => {
  console.info("Saving the tour %s", tour.name)
  const opts = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tour)
  }
  return fetch(`${process.env.REACT_APP_TOUR_ENDPOINT}/quantity/adjust`, opts)
}