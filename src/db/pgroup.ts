import { PGroup } from "../Components/PGroupManager";
import { getAccessToken } from "../App";

export const listAllPGroups = async () => {
  console.info("Fetching all product groups")

  const accessToken = await getAccessToken();
  const opts = {
    method: 'GET',
    headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : undefined
  }
  return fetch(`${process.env.REACT_APP_PRODUCT_GROUP_ENDPOINT}?page=0&size=10`, opts)
}


export const deletePGroup = async (pgroup: PGroup) => {
  console.info("Delet product group %s", pgroup.groupId)
  const accessToken = await getAccessToken();
  const opts = {
    method: 'DELETE',
    headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : undefined
  }
  return fetch(`${process.env.REACT_APP_PRODUCT_GROUP_ENDPOINT}/${pgroup.groupId}`, opts)
}

// Ensure that savePGroup is exported from this module
export const savePGroup = async (group: PGroup) => {
  console.info("Saving product group %s", group.groupId)

  const accessToken = await getAccessToken();
  const opts = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify(group)
  }
  return fetch(`${process.env.REACT_APP_PRODUCT_GROUP_ENDPOINT}/save`, opts)
};