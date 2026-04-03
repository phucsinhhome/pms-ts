import axios, { AxiosInstance } from 'axios';

const createApiInstance = (baseURL: string | undefined, withCredentials = true): AxiosInstance => {
    return axios.create({
        baseURL,
        withCredentials
    });
};

// reportApi
const reportApi = createApiInstance(process.env.REACT_APP_PROFIT_SERVICE_ENDPOINT);
// profileApi
const profileApi = createApiInstance(process.env.REACT_APP_PROFILE_ENDPOINT);

// expenseApi
const expenseApi = createApiInstance(process.env.REACT_APP_EXPENSE_SERVICE_ENDPOINT);

// invoiceApi
const invoiceApi = createApiInstance(process.env.REACT_APP_INVOICE_SERVICE_ENDPOINT);

// inventoryApi
const inventoryApi = createApiInstance(process.env.REACT_APP_INVENTORY_ENDPOINT);

// productApi
const productApi = createApiInstance(process.env.REACT_APP_PRODUCT_SERVICE_ENDPOINT);

// productGroupApi
const productGroupApi = createApiInstance(process.env.REACT_APP_PRODUCT_GROUP_ENDPOINT);

// orderApi
const orderApi = createApiInstance(process.env.REACT_APP_ORDER_ENDPOINT);

// reservationApi
const reservationApi = createApiInstance(process.env.REACT_APP_RESERVATION_SERVICE_ENDPOINT);

// reservationExtractApi
const reservationExtractApi = createApiInstance(process.env.REACT_APP_RESERVATION_EXTRACT_SERVICE_ENDPOINT, false);

// supplierApi
const supplierApi = createApiInstance(process.env.REACT_APP_SUPPLIER_ENDPOINT);

// tourApi
const tourApi = createApiInstance(process.env.REACT_APP_TOUR_ENDPOINT);

// tourRequestApi
const tourRequestApi = createApiInstance(process.env.REACT_APP_TOUR_REQUEST_ENDPOINT);

// configApi
const configApi = createApiInstance(process.env.REACT_APP_CONFIG_ENDPOINT);

// classificationApi
const classificationApi = createApiInstance(process.env.REACT_APP_SERVICE_CLASSIFICATION_ENDPOINT);

// statusApi
const statusApi = createApiInstance(process.env.REACT_APP_STATUS_ENDPOINT);

// userApi
const userApi = createApiInstance(process.env.REACT_APP_USER_ENDPOINT);

// botApi
const botApi = createApiInstance(process.env.REACT_APP_BOT_SERVICE_ENDPOINT);

const psBaseApi = createApiInstance(process.env.REACT_APP_PS_BASE_URL);

// room
const roomApi = createApiInstance(process.env.REACT_APP_ROOM_ENDPOINT);

// ratePlan
const ratePlanApi = createApiInstance(process.env.REACT_APP_RATE_PLAN_ENDPOINT);

export {
    reportApi,
    expenseApi,
    invoiceApi,
    inventoryApi,
    productApi,
    productGroupApi,
    orderApi,
    reservationApi,
    reservationExtractApi,
    supplierApi,
    tourApi,
    tourRequestApi,
    configApi,
    classificationApi,
    statusApi,
    profileApi,
    userApi,
    botApi,
    psBaseApi,
    roomApi,
    ratePlanApi
}
