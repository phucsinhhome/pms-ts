import { RatePlan } from "../Components/RatePlanManager";
import { ratePlanApi } from "./apis";


export const list = (page: number, size: number) => {
  console.info("Fetching all rate plans");
  return ratePlanApi.get('', { params: { page, size } });
}

export const get = (ratePlanId: string) => {
  console.info("Fetching the rate plan %s", ratePlanId);
  return ratePlanApi.get(`/${ratePlanId}`);
}

export const save = (ratePlan: RatePlan) => {
  console.info("Saving the rate plan %s", ratePlan.name);
  return ratePlanApi.post(`/${ratePlan.id}`, ratePlan, {
    headers: { 'Content-Type': 'application/json' }
  });
}

export const create = (ratePlan: RatePlan) => {
  console.info("Creating the rate plan %s", ratePlan.name);
  return ratePlanApi.put('', ratePlan, {
    headers: { 'Content-Type': 'application/json' }
  });
}

export const deleteObject = (ratePlanId: string) => {
  console.info("Deleting the rate plan %s", ratePlanId);
  return ratePlanApi.delete(`/${ratePlanId}`);
}