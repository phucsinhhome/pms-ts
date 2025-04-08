import { Tour } from "../Components/TourManager"

export const listTourRequest = () => {
  console.info("Fetching all tour requests from the inventory")
  const opts = {
    method: 'GET'
  }
  return fetch(`${process.env.REACT_APP_TOUR_REQUEST_ENDPOINT}/list?page=0&size=100`, opts)
}

export const saveTour = (tour: Tour) => {
  console.info("Saving the tour request %s", tour.name)
  const opts = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tour)
  }
  return fetch(`${process.env.REACT_APP_TOUR_REQUEST_ENDPOINT}/quantity/adjust`, opts)
}