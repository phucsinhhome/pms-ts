import { PGroup } from "../Components/PGroupManager";
import { productGroupApi } from "./apis";

export const listAllPGroups = async () => {
  console.info("Fetching all product groups")
  const response = await productGroupApi.get(
    `/list`,
    { params: { page: 0, size: 10 } }
  );
  return response;
}

export const deletePGroup = async (pgroup: PGroup) => {
  console.info("Delete product group %s", pgroup.groupId)
  const response = await productGroupApi.delete(
    `/${pgroup.groupId}`
  );
  return response;
}

export const savePGroup = async (group: PGroup) => {
  console.info("Saving product group %s", group.groupId)
  const response = await productGroupApi.post(
    `/save`,
    group,
    { headers: { 'Content-Type': 'application/json' } }
  );
  return response;
}