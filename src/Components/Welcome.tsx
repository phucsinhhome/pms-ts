import React, { useEffect } from "react";

type WelcomeProps = {
    activeMenu: any,
    organizationName?: string
}

export const Welcome = (props: WelcomeProps) => {
    useEffect(() => {
        props.activeMenu()
        // eslint-disable-next-line
    }, []);

    return (
        <div className="flex flex-col items-center mt-12 px-4 text-center bg-white">
            {props.organizationName ? (
                <>
                    <h1 className="text-3xl font-bold text-gray-700 mb-2 break-words max-w-full">{props.organizationName}</h1>
                    <p className="text-lg text-gray-500">Hospitality management · PMS</p>
                </>
            ) : (
                <>
                    <h1 className="text-3xl font-bold text-gray-700 mb-2">Welcome to PMS</h1>
                    <p className="text-lg text-gray-500">Your hospitality management assistant</p>
                </>
            )}
        </div>
    );
}
