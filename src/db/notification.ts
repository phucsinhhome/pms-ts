import { getApp, getApps, initializeApp } from "firebase/app";
import { deleteToken, getMessaging, getToken, isSupported, Messaging, onMessage } from "firebase/messaging";
import { psBaseApi } from "./apis";
import { firebaseConfig } from "./configs";

// Order alerts: this browser registers with Firebase Cloud Messaging and hands its token to the
// backend, which pushes new orders to it (public/firebase-messaging-sw.js shows them when the
// tab is closed). Staff opt in per device from the Profile page.

const VAPID_KEY = process.env.REACT_APP_FIREBASE_VAPID_KEY;
const DEVICES_PATH = '/notification/devices';
const ORDER_ALERTS_KEY = 'pms.orderAlerts';
const UNREGISTER_TIMEOUT_MS = 2000;

export type OrderAlertResult = 'enabled' | 'denied' | 'unsupported' | 'failed';

export type OrderAlert = {
    title: string,
    body: string,
    // e.g. /order/<orderId>/<username>?tenant=org2
    path: string
}

const readOptIn = (): boolean => {
    try {
        return localStorage.getItem(ORDER_ALERTS_KEY) === 'on';
    } catch {
        return false;
    }
}

const writeOptIn = (on: boolean) => {
    try {
        on ? localStorage.setItem(ORDER_ALERTS_KEY, 'on') : localStorage.removeItem(ORDER_ALERTS_KEY);
    } catch {
        // storage unavailable - the device stays registered until its token expires
    }
}

const notificationPermission = (): NotificationPermission | undefined =>
    typeof Notification === 'undefined' ? undefined : Notification.permission;

let messagingPromise: Promise<Messaging | null> | null = null;

// Resolves to null when this browser can't receive web pushes (e.g. iPhone Safari outside a
// home-screen app) or the build has no VAPID key, which hides the feature.
const messaging = (): Promise<Messaging | null> => {
    if (!messagingPromise) {
        messagingPromise = (async () => {
            if (!VAPID_KEY || typeof Notification === 'undefined' || !('serviceWorker' in navigator)) {
                return null;
            }
            if (!(await isSupported())) {
                return null;
            }
            const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
            return getMessaging(app);
        })().catch(e => {
            console.warn("Push messaging unavailable", e);
            return null;
        });
    }
    return messagingPromise;
}

const register = async (m: Messaging) => {
    const token = await getToken(m, { vapidKey: VAPID_KEY });
    const rsp = await psBaseApi.post(DEVICES_PATH, { token });
    // An expired backend session answers with a redirect to the login page, which the browser
    // follows and axios reports as success - treat it as a failed registration
    const responseURL: string | undefined = rsp.request?.responseURL;
    if (rsp.status !== 204 || (responseURL && !responseURL.includes(DEVICES_PATH))) {
        throw new Error(`Device registration was not accepted (status ${rsp.status})`);
    }
}

export const orderAlertsSupported = async (): Promise<boolean> => (await messaging()) !== null;

export const orderAlertsEnabled = (): boolean => readOptIn() && notificationPermission() === 'granted';

export const orderAlertsBlocked = (): boolean => notificationPermission() === 'denied';

// Must run from a user action (click): browsers only show the permission prompt then
export const enableOrderAlerts = async (): Promise<OrderAlertResult> => {
    const m = await messaging();
    if (!m) {
        return 'unsupported';
    }
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
        return 'denied';
    }
    try {
        await register(m);
        writeOptIn(true);
        return 'enabled';
    } catch (e) {
        console.error("Failed to enable order alerts", e);
        return 'failed';
    }
}

// Called on every app start: refreshes the token and the organizations stored with it
export const refreshOrderAlerts = async () => {
    if (!orderAlertsEnabled()) {
        return;
    }
    const m = await messaging();
    if (!m) {
        return;
    }
    try {
        await register(m);
    } catch (e) {
        console.warn("Failed to refresh order alerts registration", e);
    }
}

export const disableOrderAlerts = async () => {
    const wasOn = readOptIn();
    writeOptIn(false);
    const m = await messaging();
    if (!m || !wasOn || notificationPermission() !== 'granted') {
        return;
    }
    try {
        const token = await getToken(m, { vapidKey: VAPID_KEY });
        // Bounded so a slow backend never holds up sign-out
        await Promise.race([
            psBaseApi.delete(DEVICES_PATH, { data: { token } }),
            new Promise(resolve => setTimeout(resolve, UNREGISTER_TIMEOUT_MS))
        ]);
        await deleteToken(m);
    } catch (e) {
        console.warn("Failed to unregister order alerts", e);
    }
}

// Pushes arriving while the app is open come here instead of a system notification
export const listenForOrderAlerts = (onAlert: (alert: OrderAlert) => void): (() => void) => {
    let unsubscribe = () => { };
    let cancelled = false;
    messaging().then(m => {
        if (!m || cancelled) {
            return;
        }
        unsubscribe = onMessage(m, payload => {
            const data = payload.data || {};
            if (data.type !== 'order_committed') {
                return;
            }
            onAlert({
                title: data.title || payload.notification?.title || 'New order',
                body: data.body || payload.notification?.body || '',
                path: data.path || '/order'
            });
        });
    });
    return () => {
        cancelled = true;
        unsubscribe();
    };
}
