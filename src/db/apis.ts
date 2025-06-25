import axios, { AxiosInstance } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';

// Function to get the access token from sessionStorage
const getAccessToken = (): string | null => {
    // Retrieve from sessionStorage instead of localStorage
    return sessionStorage.getItem('accessToken');
};

const configureAccessToken = (config: InternalAxiosRequestConfig) => {
    const accessToken = getAccessToken();
    if (accessToken) {
        config.headers?.set?.('Authorization', `Bearer ${accessToken}`);
    }
    return config;
}



// reportApi
const reportApi: AxiosInstance = axios.create({
    baseURL: `${process.env.REACT_APP_PROFIT_SERVICE_ENDPOINT}`
});
reportApi
    .interceptors
    .request
    .use(configureAccessToken, (error) => Promise.reject(error));

// expenseApi
const expenseApi: AxiosInstance = axios.create({
    baseURL: `${process.env.REACT_APP_EXPENSE_SERVICE_ENDPOINT}`
});
expenseApi
    .interceptors
    .request
    .use(configureAccessToken, (error) => Promise.reject(error));

// invoiceApi
const invoiceApi: AxiosInstance = axios.create({
    baseURL: `${process.env.REACT_APP_INVOICE_SERVICE_ENDPOINT}`
});
invoiceApi
    .interceptors
    .request
    .use(configureAccessToken, (error) => Promise.reject(error));

// inventoryApi
const inventoryApi: AxiosInstance = axios.create({
    baseURL: `${process.env.REACT_APP_INVENTORY_ENDPOINT}`
});
inventoryApi
    .interceptors
    .request
    .use(configureAccessToken, (error) => Promise.reject(error));

// productApi
const productApi: AxiosInstance = axios.create({
    baseURL: `${process.env.REACT_APP_PRODUCT_SERVICE_ENDPOINT}`
});
productApi
    .interceptors
    .request
    .use(configureAccessToken, (error) => Promise.reject(error));

// productGroupApi
const productGroupApi: AxiosInstance = axios.create({
    baseURL: `${process.env.REACT_APP_PRODUCT_GROUP_ENDPOINT}`
});
productGroupApi
    .interceptors
    .request
    .use(configureAccessToken, (error) => Promise.reject(error));

// orderApi
const orderApi: AxiosInstance = axios.create({
    baseURL: `${process.env.REACT_APP_ORDER_ENDPOINT}`
});
orderApi
    .interceptors
    .request
    .use(configureAccessToken, (error) => Promise.reject(error));

// reservationApi
const reservationApi: AxiosInstance = axios.create({
    baseURL: `${process.env.REACT_APP_RESERVATION_SERVICE_ENDPOINT}`
});
reservationApi
    .interceptors
    .request
    .use(configureAccessToken, (error) => Promise.reject(error));

// reservationExtractApi
const reservationExtractApi: AxiosInstance = axios.create({
    baseURL: `${process.env.REACT_APP_RESERVATION_EXTRACT_ENDPOINT}`
});
reservationExtractApi
    .interceptors
    .request
    .use(configureAccessToken, (error) => Promise.reject(error));

// supplierApi
const supplierApi: AxiosInstance = axios.create({
    baseURL: `${process.env.REACT_APP_SUPPLIER_ENDPOINT}`
});
supplierApi
    .interceptors
    .request
    .use(configureAccessToken, (error) => Promise.reject(error));

// tourApi
const tourApi: AxiosInstance = axios.create({
    baseURL: `${process.env.REACT_APP_TOUR_ENDPOINT}`
});
tourApi
    .interceptors
    .request
    .use(configureAccessToken, (error) => Promise.reject(error));

// configApi
const configApi: AxiosInstance = axios.create({
    baseURL: `${process.env.REACT_APP_CONFIG_ENDPOINT}`
});
configApi
    .interceptors
    .request
    .use(configureAccessToken, (error) => Promise.reject(error));

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
    configApi
}
