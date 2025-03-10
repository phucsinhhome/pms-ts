import { Chat } from "../App"

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
        showProfile: false
    },
    users: [{
        id: '1351151927',
        firstName: "Minh",
        lastName: "Tran",
        username: 'minhtranes'
    }],
    orderManagement: {
        copyLink: {
            defaultGroup: 'food',
            defaultMenuApp: "REACT_APP_MENU_WEB_APP",
            menuAppMappings: [{app: "REACT_APP_MENU_VI_WEB_APP", startWiths: "/vi[a-z]+/"}]
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