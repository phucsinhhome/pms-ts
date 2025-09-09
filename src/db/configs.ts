import { Chat } from "../App"
import { configApi } from "./apis";

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
        iss: 'https://phucsinhhcm.hopto.org/iam/realm/ps'
    }],
    orderManagement: {
        copyLink: {
            defaultGroup: 'food',
            defaultMenuApp: "REACT_APP_MENU_WEB_APP",
            menuAppMappings: [{ app: "REACT_APP_MENU_VI_WEB_APP", startWiths: "/vi[a-z]+/" }]
        }
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