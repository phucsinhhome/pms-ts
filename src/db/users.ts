import { Issuer } from "../Components/InvoiceManager";
import { userApi } from "./apis";

export type UserInfo = {
    firstName?: string,
    lastName?: string,
    username: string,
    email?: string,
    kcId?: string
}

export const getUsers: Issuer[] = [{
    id: "minhtran",
    displayName: "Mẫn Trịnh"
},
{
    id: "khatran",
    displayName: "Kha Trần"
}]

export const getProfile = () => {
    console.info("Get user profile");
    return fetch(`${process.env.REACT_APP_USER_ENDPOINT}/profile`, {
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include'
    });
}

export const listUsers = (page: number, size: number) => {
    console.info("List the users");
    return userApi.get(`/`, { params: { page: page, size: size } });
}