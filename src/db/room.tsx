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

export const roomIcons = [
    {
        id: "r1",
        src: <GiHouse />
    },
    {
        id: "r2",
        src: <GiHouse />
    },
    {
        id: "r3",
        src: <GiHouse />
    },
    {
        id: "r4",
        src: <GiHouse />
    },
    {
        id: "r5",
        src: <GiHouse />
    },
    {
        id: "r6",
        src: <GiHouse />
    }
];

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
