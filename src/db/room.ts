import { roomApi } from "./apis";


export const listRoom = (page: number, size: number) => {
  console.info("Fetching all rooms");
  return roomApi.get('', { params: { page, size } });
}