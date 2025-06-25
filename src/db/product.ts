import { ManagedProduct } from "../Components/Inventory"
import { productApi } from "./apis";

export const listAllProducts = async () => {
  console.info("Fetching all products")
  return productApi.get(`/list/like`, { params: { name: "*" } });
}

export const listProducts = async (page: number, size: number) => {
  console.info("Fetching all products from the inventory")
  return productApi.get(`/list`, { params: { page, size } });
}

export const getProduct = async (productId: string) => {
  console.info(`Fetching product with id ${productId}`)
  return productApi.get(`/${productId}`);
}

export const saveProduct = async (product: ManagedProduct) => {
  console.info("Save product details")
  return productApi.post(`/save`, product, {
    headers: { 'Content-Type': 'application/json' }
  });
}

export const listProductsWithName = async (name: string) => {
  console.info("Filter products with name contains %s", name)
  return productApi.get(`/list/like`, { params: { name } });
}

export const listProductsByGroup = async (group: string, page: number, size: number) => {
  console.info("Filter products with group %s", group)
  return productApi.get(`/list/group`, { params: { group, page, size } });
}

export const listProductsWithNameAndGroup = async (name: string, group: string, page: number, size: number) => {
  console.info("Filter products with name %s and group %s", name, group)
  return productApi.get(`/search`, { params: { group, name, page, size } });
}