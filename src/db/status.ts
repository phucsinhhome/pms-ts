import { statusApi } from "./apis"


export const syncStatusOfMonth = (partition: string) => {
    console.info("Trigger assistant service to sync the status of " + partition)
    return statusApi.post(`sync`, null, { params: { partition } })
}