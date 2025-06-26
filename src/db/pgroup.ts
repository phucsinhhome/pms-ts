import { PGroup } from "../Components/PGroupManager";
import { productGroupApi } from "./apis";

export const listAllPGroups = async () => {
  console.info("Fetching all product groups")

  return await productGroupApi.get(
    ``,
    { params: { page: 0, size: 10 } }
  );
}

export const deletePGroup = async (pgroup: PGroup) => {
  console.info("Delete product group %s", pgroup.groupId)

  return await productGroupApi.delete(
    `/${pgroup.groupId}`
  );
}

export const savePGroup = async (group: PGroup) => {
  console.info("Saving product group %s", group.groupId)

  return await productGroupApi.post(
    `/save`,
    group,
    { headers: { 'Content-Type': 'application/json' } }
  );
}