import React from "react";
import { GiHouse } from "react-icons/gi";
import { roomApi } from "./apis";

export type Room = {
  id: string;
  name: string;
  internalName: string;
  status?: 'ACTIVE' | 'INACTIVE';
  maxAdults?: number;
  numDoubleBeds?: number;
};

export const listRoom = (page: number, size: number) => {
    return roomApi.get(``, { params: { page, size } });
}

export const createRoom = (room: Partial<Room>) => {
    return roomApi.put(``, room);
}

export const updateRoom = (room: Room) => {
    return roomApi.post(`/${room.id}`, room);
}

export const deleteRoom = (id: string) => {
    return roomApi.delete(`/${id}`);
}
