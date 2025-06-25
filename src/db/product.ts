import { ManagedProduct } from "../Components/Inventory"
import { getAccessToken } from "../App";

export const listAllProducts = async () => {
  console.info("Fetching all products")
  const accessToken = await getAccessToken();
  const opts: RequestInit = {
    method: 'GET',
    headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : undefined
  }
  return fetch(`${process.env.REACT_APP_PRODUCT_SERVICE_ENDPOINT}/list/like?name=*`, opts)
    .then(response => response.json())
}

export const listProducts = async (page: number, size: number) => {
  console.info("Fetching all products from the inventory")
  const accessToken = await getAccessToken();
  const opts: RequestInit = {
    method: 'GET',
    headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : undefined
  }
  return fetch(`${process.env.REACT_APP_PRODUCT_SERVICE_ENDPOINT}/list?page=${page}&size=${size}`, opts)
}

export const getProduct = async (productId: string) => {
  console.info(`Fetching product with id ${productId}`)
  const accessToken = await getAccessToken();
  const opts: RequestInit = {
    method: 'GET',
    headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : undefined
  }
  return fetch(`${process.env.REACT_APP_PRODUCT_SERVICE_ENDPOINT}/${productId}`, opts)
}

export const saveProduct = async (product: ManagedProduct) => {
  console.info("Save product details")
  const accessToken = await getAccessToken();
  const opts: RequestInit = {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
    },
    body: JSON.stringify(product)
  }
  return fetch(`${process.env.REACT_APP_PRODUCT_SERVICE_ENDPOINT}/save`, opts)
}

export const listProductsWithName = async (name: string) => {
  console.info("Filter products with name contains %s", name)
  const accessToken = await getAccessToken();
  const opts: RequestInit = {
    method: 'GET',
    headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : undefined
  }
  return fetch(`${process.env.REACT_APP_PRODUCT_SERVICE_ENDPOINT}/list/like?name=${name}`, opts)
}

export const listProductsByGroup = async (group: string, page: number, size: number) => {
  console.info("Filter products with group %s", group)
  const accessToken = await getAccessToken();
  const opts: RequestInit = {
    method: 'GET',
    headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : undefined
  }
  return fetch(`${process.env.REACT_APP_PRODUCT_SERVICE_ENDPOINT}/list/group?group=${group}&page=${page}&size=${size}`, opts)
}

export const listProductsWithNameAndGroup = async (name: string, group: string, page: number, size: number) => {
  console.info("Filter products with name %s and group %s", name, group)
  const accessToken = await getAccessToken();
  const opts: RequestInit = {
    method: 'GET',
    headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : undefined
  }
  return fetch(`${process.env.REACT_APP_PRODUCT_SERVICE_ENDPOINT}/search?group=${group}&name=${name}&page=${page}&size=${size}`, opts)
}