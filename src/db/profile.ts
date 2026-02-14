import { profileApi } from "./apis";

export const getProfile = () => {
    console.info("Get user profile %s", profileApi.getUri());
    return profileApi.get(``);
}