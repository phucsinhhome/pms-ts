import React, { useEffect } from "react";

const LOTUS_IMAGE_URL = "https://www.harpercrown.com/cdn/shop/articles/everything-you-should-know-about-the-lotus-flower-450435.jpg"; // Place lotus.png in your public folder


type WelcomeProps = {
    activeMenu: any
}

export const Welcome = (props: WelcomeProps) => {


    useEffect(() => {
        props.activeMenu()

        // eslint-disable-next-line
    }, []);


    return (<div className="flex flex-col items-center justify-center h-[100dvh] bg-white">
        <img
            src={LOTUS_IMAGE_URL}
            alt="Lotus"
            className="w-1/2 h-auto mb-6 rounded-lg shadow-lg"
            style={{ aspectRatio: "1.8/1" }}
        />
        <h1 className="text-3xl font-bold text-gray-700 mb-2">Welcome to PMS</h1>
        <p className="text-lg text-gray-500">Your hospitality management assistant</p>
    </div>);
}