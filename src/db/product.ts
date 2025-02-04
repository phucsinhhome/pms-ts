import { ItemAdjustment, Product } from "../Components/Inventory"

export const listAllProducts = () => {
  console.info("Fetching all products")
  const opts = {
    method: 'GET'
  }
  return fetch(`${process.env.REACT_APP_INVENTORY_ENDPOINT}/list/like?name=*`, opts)
    .then(response => response.json())
}

export const listProducts = (page: number, size: number) => {
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

export const saveProduct = (product: Product) => {
  console.info("Save product details")
  const opts = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product)
  }
  return fetch(`${process.env.REACT_APP_INVENTORY_ENDPOINT}/save`, opts)
}

export const listProductsWithName = (name: string) => {
  console.info("Filter products with name contains %s", name)

  const opts = {
    method: 'GET'
  }
  return fetch(`${process.env.REACT_APP_INVENTORY_ENDPOINT}/list/like?name=${name}`, opts)
}

export const listProductsByGroup = (group: string, page: number, size: number) => {
  console.info("Filter products with group %s", group)

  const opts = {
    method: 'GET'
  }
  return fetch(`${process.env.REACT_APP_INVENTORY_ENDPOINT}/list/group?group=${group}&page=${page}&size=${size}`, opts)
}

export const listProductsWithNameAndGroup = (name: string, group: string, page: number, size: number) => {
  console.info("Filter products with name %s and group %s", name, group)

  const opts = {
    method: 'GET'
  }
  return fetch(`${process.env.REACT_APP_INVENTORY_ENDPOINT}/search?group=${group}&name=${name}&page=${page}&size=${size}`, opts)
}