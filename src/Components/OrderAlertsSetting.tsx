import React, { useEffect, useState } from "react";
import {
    disableOrderAlerts,
    enableOrderAlerts,
    orderAlertsBlocked,
    orderAlertsEnabled,
    orderAlertsSupported
} from "../db/notification";

const isIPhoneOutsideHomeScreenApp = () =>
    /iPhone|iPad|iPod/.test(navigator.userAgent) && !window.matchMedia('(display-mode: standalone)').matches;

// Per-device opt-in for new-order push notifications
export const OrderAlertsSetting = () => {
    const [supported, setSupported] = useState<boolean | null>(null);
    const [enabled, setEnabled] = useState(orderAlertsEnabled());
    const [blocked, setBlocked] = useState(orderAlertsBlocked());
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        orderAlertsSupported().then(s => active && setSupported(s));
        return () => { active = false; };
    }, []);

    // Builds without a VAPID key don't offer the feature at all
    if (!process.env.REACT_APP_FIREBASE_VAPID_KEY || supported === null) {
        return null;
    }

    const toggle = async () => {
        setBusy(true);
        setMessage(null);
        try {
            if (enabled) {
                await disableOrderAlerts();
                setEnabled(false);
                setMessage("Order alerts are off on this device.");
                return;
            }
            const result = await enableOrderAlerts();
            setEnabled(result === 'enabled');
            setBlocked(orderAlertsBlocked());
            setMessage({
                enabled: "Order alerts are on. New orders will notify this device.",
                denied: "Notifications were not allowed.",
                unsupported: "This browser can't receive order alerts.",
                failed: "Could not turn on order alerts. Please try again."
            }[result]);
        } finally {
            setBusy(false);
        }
    };

    let content: React.ReactNode;
    if (!supported) {
        content = (
            <div className="text-sm text-gray-600">
                {isIPhoneOutsideHomeScreenApp()
                    ? "Add PMS to the Home Screen, then open it from there to enable order alerts."
                    : "Not supported on this browser."}
            </div>
        );
    } else if (blocked && !enabled) {
        content = (
            <div className="text-sm text-gray-600">
                Notifications are blocked for this site. Allow them in the browser's site settings, then come back here.
            </div>
        );
    } else {
        content = (
            <button
                type="button"
                role="switch"
                aria-checked={enabled}
                disabled={busy}
                onClick={toggle}
                className="flex items-center space-x-2 disabled:opacity-50"
            >
                <span className={`relative inline-block h-6 w-11 rounded-full transition-colors ${enabled ? "bg-green-700" : "bg-gray-300"}`}>
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-5" : "translate-x-0.5"}`} />
                </span>
                <span className="text-sm text-gray-900">{enabled ? "On for this device" : "Off"}</span>
            </button>
        );
    }

    return (
        <div className="mb-4">
            <label className="block text-gray-700">Order alerts:</label>
            {content}
            {message && <div className="mt-1 text-sm text-green-700">{message}</div>}
        </div>
    );
}
