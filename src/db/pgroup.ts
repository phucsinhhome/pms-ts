import { PGroup } from "../Components/PGroupManager"

export const listAllPGroups = () => {
  console.info("Fetching all product groups")
  const opts = {
    method: 'GET'
  }
  return fetch(`${process.env.REACT_APP_PRODUCT_GROUP_ENDPOINT}?page=0&size=10`, opts)
}


export const deletePGroup = (pgroup: PGroup) => {
  console.info("Delet product group %s", pgroup.groupId)
  const opts = {
    method: 'DELETE'
  }
  return fetch(`${process.env.REACT_APP_PRODUCT_GROUP_ENDPOINT}/${pgroup.groupId}`, opts)
}

// Ensure that savePGroup is exported from this module
export const savePGroup = (group: PGroup) => {
  console.info("Saving product group %s", group.groupId)
  const opts = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(group)
  }
  return fetch(`${process.env.REACT_APP_PRODUCT_GROUP_ENDPOINT}/save`, opts)
};