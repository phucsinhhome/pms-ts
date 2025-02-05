import { ItemAdjustment } from "../Components/Inventory"

export const listProductItems = (page: number, size: number) => {
  console.info("Fetching all products from the inventory")
  const opts = {
    method: 'GET'
  }
  return fetch(`${process.env.REACT_APP_INVENTORY_ENDPOINT}/list?page=${page}&size=${size}`, opts)
}

export const adjustQuantity = (adjustment: ItemAdjustment) => {
  console.info("Adjust the product")
  const opts = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(adjustment)
  }
  return fetch(`${process.env.REACT_APP_INVENTORY_ENDPOINT}/quantity/adjust`, opts)
}

export const listProductItemsWithName = (name: string) => {
  console.info("Filter products with name contains %s", name)

  const opts = {
    method: 'GET'
  }
  return fetch(`${process.env.REACT_APP_INVENTORY_ENDPOINT}/list?name=${name}&page=0&size=100`, opts)
}

export const listProductItemsByGroup = (group: string, page: number, size: number) => {
  console.info("Filter products with group %s", group)

  const opts = {
    method: 'GET'
  }
  return fetch(`${process.env.REACT_APP_INVENTORY_ENDPOINT}/list?group=${group}&page=${page}&size=${size}`, opts)
}

export const listProductItemsWithNameAndGroup = (name: string, group: string, page: number, size: number) => {
  console.info("Filter products with name %s and group %s", name, group)

  const opts = {
    method: 'GET'
  }
  return fetch(`${process.env.REACT_APP_INVENTORY_ENDPOINT}/list?group=${group}&name=${name}&page=${page}&size=${size}`, opts)
}