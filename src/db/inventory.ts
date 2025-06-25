import { AvailabilityChange, ItemAdjustment, ItemStatusChange } from "../Components/Inventory"
import { getAccessToken } from "../App";

export const listAllProductItems = async () => {
  console.info("Fetching all products from the inventory")
  const accessToken = await getAccessToken();
  const opts: RequestInit = {
    method: 'GET',
    headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : undefined
  }
  return fetch(`${process.env.REACT_APP_INVENTORY_ENDPOINT}/list?page=0&size=100`, opts)
}

export const listProductItems = async (page: number, size: number) => {
  console.info("Fetching all products from the inventory")
  const accessToken = await getAccessToken();
  const opts: RequestInit = {
    method: 'GET',
    headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : undefined
  }
  return fetch(`${process.env.REACT_APP_INVENTORY_ENDPOINT}/list?page=${page}&size=${size}`, opts)
}

export const adjustQuantity = async (adjustment: ItemAdjustment) => {
  console.info("Adjust the product")
  const accessToken = await getAccessToken();
  const opts: RequestInit = {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
    },
    body: JSON.stringify(adjustment)
  }
  return fetch(`${process.env.REACT_APP_INVENTORY_ENDPOINT}/quantity/adjust`, opts)
}

export const changeItemStatus = async (statusChange: ItemStatusChange) => {
  console.info("Adjust the item status")
  const accessToken = await getAccessToken();
  const opts: RequestInit = {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
    },
    body: JSON.stringify(statusChange)
  }
  return fetch(`${process.env.REACT_APP_INVENTORY_ENDPOINT}/status`, opts)
}

export const planAvailability = async (change: AvailabilityChange) => {
  console.info("Plan availability for %s", change.requestId)
  const accessToken = await getAccessToken();
  const opts: RequestInit = {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
    },
    body: JSON.stringify(change)
  }
  return fetch(`${process.env.REACT_APP_INVENTORY_ENDPOINT}/availability`, opts)
}

export const listProductItemsWithName = async (name: string) => {
  console.info("Filter products with name contains %s", name)
  const accessToken = await getAccessToken();
  const opts: RequestInit = {
    method: 'GET',
    headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : undefined
  }
  return fetch(`${process.env.REACT_APP_INVENTORY_ENDPOINT}/list?name=${name}&page=0&size=100`, opts)
}

export const listProductItemsByGroup = async (group: string, page: number, size: number) => {
  console.info("Filter products with group %s", group)
  const accessToken = await getAccessToken();
  const opts: RequestInit = {
    method: 'GET',
    headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : undefined
  }
  return fetch(`${process.env.REACT_APP_INVENTORY_ENDPOINT}/list?group=${group}&page=${page}&size=${size}`, opts)
}

export const listProductItemsWithNameAndGroup = async (name: string, group: string, page: number, size: number) => {
  console.info("Filter products with name %s and group %s", name, group)
  const accessToken = await getAccessToken();
  const opts: RequestInit = {
    method: 'GET',
    headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : undefined
  }
  return fetch(`${process.env.REACT_APP_INVENTORY_ENDPOINT}/list?group=${group}&name=${name}&page=${page}&size=${size}`, opts)
}