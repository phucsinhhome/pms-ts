import { AvailabilityChange, ItemAdjustment, ItemStatusChange } from "../Components/Inventory"
import { inventoryApi } from "./apis";

export const listAllProductItems = async () => {
  console.info("Fetching all products from the inventory")

  return await inventoryApi.get(
    `/list`,
    { params: { page: 0, size: 100 } }
  );
}

export const listProductItems = async (page: number, size: number) => {
  console.info("Fetching all products from the inventory")
  return await inventoryApi.get(
    `/list`,
    { params: { page, size } }
  );
}

export const adjustQuantity = async (adjustment: ItemAdjustment) => {
  console.info("Adjust the product")
  
  return await inventoryApi.post(
    `/quantity/adjust`,
    adjustment,
    { headers: { 'Content-Type': 'application/json' } }
  );
}

export const changeItemStatus = async (statusChange: ItemStatusChange) => {
  console.info("Adjust the item status")
  
  return await inventoryApi.post(
    `/status`,
    statusChange,
    { headers: { 'Content-Type': 'application/json' } }
  );
}

export const planAvailability = async (change: AvailabilityChange) => {
  console.info("Plan availability for %s", change.requestId)
  
  return await inventoryApi.post(
    `/availability`,
    change,
    { headers: { 'Content-Type': 'application/json' } }
  );
}

export const listProductItemsWithName = async (name: string) => {
  console.info("Filter products with name contains %s", name)
  
  return await inventoryApi.get(
    `/list`,
    { params: { name, page: 0, size: 100 } }
  );
}

export const listProductItemsByGroup = async (group: string, page: number, size: number) => {
  console.info("Filter products with group %s", group)
  
  return await inventoryApi.get(
    `/list`,
    { params: { group, page, size } }
  );
}

export const listProductItemsWithNameAndGroup = async (name: string, group: string, page: number, size: number) => {
  console.info("Filter products with name %s and group %s", name, group)
  
  return await inventoryApi.get(
    `/list`,
    { params: { group, name, page, size } }
  );
}