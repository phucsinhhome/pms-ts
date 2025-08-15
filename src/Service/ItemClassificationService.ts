import { classificationApi } from "../db/apis"

export const SERVICE_NAMES = ["STAY", "FOOD", "TOUR"]
export const classifyServiceByItemName = (itemName: string) => {
    console.info("Classify the service by its name")
    return classificationApi.get(`/classify?itemName=${itemName}`);
}