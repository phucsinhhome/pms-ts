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
  return fetch(`${process.env.REACT_APP_PRODUCT_GROUP_ENDPOINT}`, opts)
}
