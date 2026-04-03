import { roomApi } from "./apis";

export const listRoom = (page: number, size: number) => {
    return roomApi.get(``, { params: { page, size } });
}
