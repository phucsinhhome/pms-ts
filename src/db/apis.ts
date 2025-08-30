import axios, { AxiosInstance } from 'axios';
// reportApi
const reportApi: AxiosInstance = axios.create({
    baseURL: `${process.env.REACT_APP_PROFIT_SERVICE_ENDPOINT}`,
    withCredentials: true
});
// reportApi
//     .interceptors
//     .request
//     .use(configureAccessToken, (error) => Promise.reject(error));

// expenseApi
const expenseApi: AxiosInstance = axios.create({
    baseURL: `${process.env.REACT_APP_EXPENSE_SERVICE_ENDPOINT}`,
    withCredentials: true
});
// expenseApi
//     .interceptors
//     .request
//     .use(configureAccessToken, (error) => Promise.reject(error));

// invoiceApi
const invoiceApi: AxiosInstance = axios.create({
    baseURL: `${process.env.REACT_APP_INVOICE_SERVICE_ENDPOINT}`,
    withCredentials: true
});
// invoiceApi
//     .interceptors
//     .request
//     .use(configureAccessToken, (error) => Promise.reject(error));

// inventoryApi
const inventoryApi: AxiosInstance = axios.create({
    baseURL: `${process.env.REACT_APP_INVENTORY_ENDPOINT}`,
    withCredentials: true
});
// inventoryApi
//     .interceptors
//     .request
//     .use(configureAccessToken, (error) => Promise.reject(error));

// productApi
const productApi: AxiosInstance = axios.create({
    baseURL: `${process.env.REACT_APP_PRODUCT_SERVICE_ENDPOINT}`,
    withCredentials: true
});
// productApi
//     .interceptors
//     .request
//     .use(configureAccessToken, (error) => Promise.reject(error));

// productGroupApi
const productGroupApi: AxiosInstance = axios.create({
    baseURL: `${process.env.REACT_APP_PRODUCT_GROUP_ENDPOINT}`,
    withCredentials: true
});
// productGroupApi
//     .interceptors
//     .request
//     .use(configureAccessToken, (error) => Promise.reject(error));

// orderApi
const orderApi: AxiosInstance = axios.create({
    baseURL: `${process.env.REACT_APP_ORDER_ENDPOINT}`,
    withCredentials: true
});
// orderApi
//     .interceptors
//     .request
//     .use(configureAccessToken, (error) => Promise.reject(error));

// reservationApi
const reservationApi: AxiosInstance = axios.create({
    baseURL: `${process.env.REACT_APP_RESERVATION_SERVICE_ENDPOINT}`,
    withCredentials: true
});
// reservationApi
//     .interceptors
//     .request
//     .use(configureAccessToken, (error) => Promise.reject(error));

// reservationExtractApi
const reservationExtractApi: AxiosInstance = axios.create({
    baseURL: `${process.env.REACT_APP_RESERVATION_EXTRACT_ENDPOINT}`,
    withCredentials: true
});
// reservationExtractApi
//     .interceptors
//     .request
//     .use(configureAccessToken, (error) => Promise.reject(error));

// supplierApi
const supplierApi: AxiosInstance = axios.create({
    baseURL: `${process.env.REACT_APP_SUPPLIER_ENDPOINT}`,
    withCredentials: true
});
// supplierApi
//     .interceptors
//     .request
//     .use(configureAccessToken, (error) => Promise.reject(error));

// tourApi
const tourApi: AxiosInstance = axios.create({
    baseURL: `${process.env.REACT_APP_TOUR_ENDPOINT}`,
    withCredentials: true
});
// tourApi
//     .interceptors
//     .request
//     .use(configureAccessToken, (error) => Promise.reject(error));
// tourRequestApi
const tourRequestApi: AxiosInstance = axios.create({
    baseURL: `${process.env.REACT_APP_TOUR_REQUEST_ENDPOINT}`,
    withCredentials: true
});
// tourRequestApi
//     .interceptors
//     .request
//     .use(configureAccessToken, (error) => Promise.reject(error));

// configApi
const configApi: AxiosInstance = axios.create({
    baseURL: `${process.env.REACT_APP_CONFIG_ENDPOINT}`,
    withCredentials: true
});
// configApi
//     .interceptors
//     .request
//     .use(configureAccessToken, (error) => Promise.reject(error));

// classificationApi
const classificationApi: AxiosInstance = axios.create({
    baseURL: `${process.env.REACT_APP_SERVICE_CLASSIFICATION_ENDPOINT}`,
    withCredentials: true
});

// statusApi
const statusApi: AxiosInstance = axios.create({
    baseURL: `${process.env.REACT_APP_STATUS_ENDPOINT}`,
    withCredentials: true
});

// statusApi
const userApi: AxiosInstance = axios.create({
    baseURL: `${process.env.REACT_APP_USER_ENDPOINT}`,
    withCredentials: true
});

const psBaseApi: AxiosInstance = axios.create({
    baseURL: `${process.env.REACT_APP_PS_BASE_URL}`,
    withCredentials: true
});


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
    userApi,
    psBaseApi
}
