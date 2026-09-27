import React, { useEffect } from "react";
import { OrderAlert } from "../db/notification";

type OrderAlertToastProps = {
    alert: OrderAlert,
    onOpen: () => void,
    onClose: () => void
}

const AUTO_HIDE_MS = 8000;

// In-app notice for an order push that arrives while the app is open
export const OrderAlertToast = ({ alert, onOpen, onClose }: OrderAlertToastProps) => {
    useEffect(() => {
        const timer = setTimeout(onClose, AUTO_HIDE_MS);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [alert]);

    return (
        <div
            className="fixed top-2 left-1/2 z-50 flex w-11/12 max-w-md -translate-x-1/2 items-start rounded-lg border border-green-700 bg-green-50 p-3 shadow-lg"
            role="alert"
        >
            <button type="button" className="flex-1 min-w-0 text-left" onClick={onOpen}>
                <div className="truncate text-sm font-bold text-green-900">{alert.title}</div>
                {alert.body && <div className="truncate text-sm text-green-800">{alert.body}</div>}
                <div className="text-xs text-green-700 underline">Open order</div>
            </button>
            <button
                type="button"
                className="ml-2 px-2 text-lg leading-none text-green-900"
                aria-label="Dismiss"
                onClick={onClose}
            >
                &times;
            </button>
        </div>
    );
}
