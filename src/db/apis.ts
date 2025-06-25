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


// orderApi
const orderApi: AxiosInstance = axios.create({
    baseURL: `${process.env.REACT_APP_ORDER_ENDPOINT}`
});
orderApi
    .interceptors
    .request
    .use(configureAccessToken, (error) => Promise.reject(error));


export {
    reportApi,
    expenseApi,
    invoiceApi,
    orderApi
}
