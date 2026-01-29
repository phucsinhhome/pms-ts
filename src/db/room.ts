import { Room } from "../Components/RoomManager";
import { roomApi } from "./apis";


export const listRoom = (page: number, size: number) => {
  console.info("Fetching all rooms");
  return roomApi.get('', { params: { page, size } });
}

export const getRoom = (roomId: string) => {
  console.info("Fetching the room %s", roomId);
  return roomApi.get(`/${roomId}`);
}

export const saveRoom = (room: Room) => {
  console.info("Saving the room %s", room.name);
  return roomApi.post(`/${room.id}`, room, {
    headers: { 'Content-Type': 'application/json' }
  });
}

export const createRoom = (room: Room) => {
  console.info("Creating the room %s", room.name);
  return roomApi.put('', room, {
    headers: { 'Content-Type': 'application/json' }
  });
}

export const deleteRoom = (roomId: string) => {
  console.info("Deleting the room %s", roomId);
  return roomApi.delete(`/${roomId}`);
}