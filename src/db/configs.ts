import { Chat } from "../App"
import { configApi } from "./apis";

export type PaymentMethod = {
  id: string;
  name: string;
  feeRate: number;
  template: string;
  srcLargeImg: string;
  paymentInfo: string;
  defaultIssuerId: string;
};

export type AppConfig = {
    app: {
        showProfile: boolean
    },
    users: Chat[],
    orderManagement: {
        copyLink: {
            defaultGroup: string,
            defaultMenuApp: string,
            menuAppMappings: [{ app: string, startWiths: string }]
        }
    },
    invoice: {
        paymentMethods: PaymentMethod[]
    }
}

export const defaultAppConfigs: AppConfig = {
    app: {
        showProfile: true
    },
    users: [{
        id: '1351151927',
        firstName: "Minh",
        lastName: "Tran",
        username: 'minhtran',
        iss: 'https://phucsinhhcm.hopto.org/iam/realm/ps',
        tenantId: '',
    }],
    orderManagement: {
        copyLink: {
            defaultGroup: 'food',
            defaultMenuApp: "REACT_APP_MENU_WEB_APP",
            menuAppMappings: [{ app: "REACT_APP_MENU_VI_WEB_APP", startWiths: "/vi[a-z]+/" }]
        }
    },
    invoice: {
        paymentMethods: [
            {
                id: "creditCard",
                name: "Credit Card",
                feeRate: 0.031,
                template: "invoice_with_transfer_fee",
                srcLargeImg: "/mastercard.svg",
                paymentInfo: "/payment/creditcard.jpeg",
                defaultIssuerId: "minhtran"
            },
            {
                id: "cash",
                name: "Cash",
                feeRate: 0,
                template: "invoice_without_transfer_fee",
                srcLargeImg: "/cash.svg",
                paymentInfo: "/payment/cash.jpeg",
                defaultIssuerId: "khatran"
            },
            {
                id: "momo",
                name: "MoMo",
                feeRate: 0,
                template: "invoice_without_transfer_fee",
                srcLargeImg: "/momo-square.png",
                paymentInfo: "/payment/mono.jpg",
                defaultIssuerId: "minhtran"
            }, {
                id: "paypal",
                name: "Paypal",
                feeRate: 0.031,
                template: "invoice_without_transfer_fee",
                srcLargeImg: "/paypal.svg",
                paymentInfo: "/payment/paypal.png",
                defaultIssuerId: "minhtran"
            }, {
                id: "bankTransfer",
                name: "Bank Transfer",
                feeRate: 0,
                template: "invoice_without_transfer_fee",
                srcLargeImg: "/bank.svg",
                paymentInfo: "/payment/bankTransfer.jpg",
                defaultIssuerId: "minhtran"
            }
        ]
    }
}

export const appConfigs = async (): Promise<AppConfig> => {
    const configUrl = 'https://raw.githubusercontent.com/phucsinhhome/configs/refs/heads/ps-prod/pms/app.json'

    const opts = {
        method: 'GET'
    }
    const res = await fetch(configUrl, opts);
    const jsn = await res.json()
    return jsn as AppConfig
}

export const getConfigs = (config: string) => {
    console.info(`Fetching ${config} configs`)
    return configApi.get(`/${config}`);
}

export const setAutoUpdateAvailability = (enabled: boolean) => {
    console.info(`Change auto update availability to ${enabled}`)
    return configApi.post(`/inventory/availability/${enabled}`);
}

export const firebaseConfig = {
  apiKey: "AIzaSyBKvyANzUnHjRnV5rkdAoWSwBdO1twrWzY",
  authDomain: "splendid-sonar-174914.firebaseapp.com",
  projectId: "splendid-sonar-174914",
  storageBucket: "splendid-sonar-174914.firebasestorage.app",
  messagingSenderId: "523563262000",
  appId: "1:523563262000:web:93f803b191f7a62acbcdf5"
};