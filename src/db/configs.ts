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
    version: string,
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
    version: "1.0.0",
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

const CACHE_KEY = 'pms_app_config';

export const appConfigs = async (): Promise<AppConfig> => {
    const configUrl = 'https://raw.githubusercontent.com/phucsinhhome/configs/refs/heads/ps-prod/pms/app.json'

    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
        try {
            const parsed = JSON.parse(cached) as AppConfig;
            // Background refresh (non-blocking)
            fetchWithRetry(configUrl, 1, 0)
                .then(fresh => {
                    const freshStr = JSON.stringify(fresh);
                    if (fresh.version !== parsed.version || freshStr !== cached) {
                        localStorage.setItem(CACHE_KEY, freshStr);
                        console.info(`Configuration updated. New version: ${fresh.version || 'unversioned'}`);
                    } else {
                        console.info("Configuration is up to date.");
                    }
                })
                .catch(err => console.warn("Background refresh failed", err));
            return parsed;
        } catch (e) {
            console.warn("Cache corrupted, fetching fresh...");
        }
    }

    // No cache: Fetch with 3 retries
    const fresh = await fetchWithRetry(configUrl, 3, 1000);
    localStorage.setItem(CACHE_KEY, JSON.stringify(fresh));
    return fresh as AppConfig;
}

const fetchWithRetry = async (url: string, retries: number, delay: number): Promise<any> => {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch(url, { cache: 'no-cache' });
            if (!res.ok) throw new Error(`Status: ${res.status}`);
            return await res.json();
        } catch (err) {
            console.warn(`Fetch attempt ${i + 1} failed:`, err);
            if (i === retries - 1) throw new Error(`Failed to load configuration after ${retries} retries`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
};

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