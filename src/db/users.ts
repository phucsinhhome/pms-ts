import { Issuer } from "../Components/InvoiceManager";

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