import React from "react";

type LoadingSpinnerProps = {
    size?: "sm" | "lg",
    className?: string
}

// Green ring spinner used across the app; public/index.html mirrors the "lg" variant in plain CSS
export const LoadingSpinner = ({ size = "lg", className = "" }: LoadingSpinnerProps) => {
    const sizeClass = size === "sm" ? "w-8 h-8 border-[3px]" : "w-14 h-14 border-4";
    return (
        <div
            className={`${sizeClass} rounded-full border-green-100 border-t-green-700 animate-spin motion-reduce:animate-none ${className}`}
            aria-hidden="true"
        />
    );
}
