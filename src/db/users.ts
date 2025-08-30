import { Issuer } from "../Components/InvoiceManager";

export const getUsers: Issuer[] = [{
    id: "1351151927",
    displayName: "Mẫn Trịnh"
},
{
    id: "5114683375",
    displayName: "Liễu Lê"
},
{
    id: "6159537383",
    displayName: "Hương Thanh"
},
{
    id: "6456500785",
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