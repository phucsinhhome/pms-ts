type PaymentMethod = {
    id: string,
    name: string,
    feeRate: number,
    template: string,
    src: string,
    srcLargeImg: string,
    paymentInfo: string,
    defaultIssuerId: string
}

export const paymentMethods: PaymentMethod[] = [
    {
        id: "cash",
        name: "Cash",
        feeRate: 0,
        template: "invoice_without_transfer_fee",
        src: "<svg class=\"w-6 h-6 text-gray-800 dark:text-white\" aria-hidden=\"true\" xmlns = \"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" fill=\"currentColor\" viewBox=\"0 0 24 24\" ><path fill-rule=\"evenodd\" d = \"M7 6a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-2v-4a3 3 0 0 0-3-3H7V6Z\" clip-rule=\"evenodd\" /><path fill-rule=\"evenodd\" d = \"M2 11a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-7Zm7.5 1a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z\" clip-rule=\"evenodd\" /><path d=\"M10.5 14.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z\" /></svg>",
        srcLargeImg: "/cash.svg",
        paymentInfo: "/payment/cash.jpeg",
        defaultIssuerId: "6456500785"
    },
    {
        id: "creditCard",
        name: "Credit Card",
        feeRate: 0.025,
        template: "invoice_with_transfer_fee",
        src: "<svg class=\"w-6 h-6 text-gray-800 dark:text-white\" aria-hidden=\"true\" xmlns = \"http://www.w3.org/2000/svg\" width = \"24\" height = \"24\" fill = \"none\" viewBox = \"0 0 24 24\" ><path stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M3 10h18M6 14h2m3 0h5M3 7v10a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1Z\" /></svg >",
        srcLargeImg: "/mastercard.svg",
        paymentInfo: "/payment/creditcard.jpeg",
        defaultIssuerId: "1351151927"
    },
    {
        id: "momo",
        name: "MoMo",
        feeRate: 0,
        template: "invoice_without_transfer_fee",
        src: "<svg class=\"w-6 h-6 text-gray-800 dark:text-white\" aria-hidden=\"true\" xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" fill=\"none\" viewBox=\"0 0 24 24\"><path stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M3 10h18M6 14h2m3 0h5M3 7v10a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1Z\" /></svg>",
        srcLargeImg: "/momo-square.png",
        paymentInfo: "/payment/mono.jpg",
        defaultIssuerId: "1351151927"
    }, {
        id: "paypal",
        name: "Paypal",
        feeRate: 0.025,
        template: "invoice_without_transfer_fee",
        src: "<svg class=\"w-6 h-6 text-gray-800 dark:text-white\" aria-hidden=\"true\" xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" fill=\"none\" viewBox=\"0 0 24 24\"><path stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M3 10h18M6 14h2m3 0h5M3 7v10a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1Z\" /></svg>",
        srcLargeImg: "/paypal.svg",
        paymentInfo: "/payment/paypal.png",
        defaultIssuerId: "1351151927"
    }, {
        id: "bankTransfer",
        name: "Bank Transfer",
        feeRate: 0.0,
        template: "invoice_without_transfer_fee",
        src: "<svg class=\"w-6 h-6 text-gray-800 dark:text-white\" aria-hidden=\"true\" xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" fill=\"none\" viewBox=\"0 0 24 24\"><path stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M3 10h18M6 14h2m3 0h5M3 7v10a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1Z\" /></svg>",
        srcLargeImg: "/bank.svg",
        paymentInfo: "/payment/bankTransfer.jpg",
        defaultIssuerId: "1351151927"
    }
]

export const rooms = [
    {
        id: "r1",
        name: "R1",
        rate: 450000,
        bookingName: "Bungalow with Garden View",
        src: "<svg xmlns=\"http://www.w3.org/2000/svg\" fill=\"none\" viewBox=\"0 0 24 24\" stroke-width=\"1.5\" stroke=\"currentColor\" class=\"size-6\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25\" /></svg>"
    },
    {
        id: "r2",
        name: "R2",
        rate: 450000,
        bookingName: "Bungalow with Garden View",
        src: "<svg xmlns=\"http://www.w3.org/2000/svg\" fill=\"none\" viewBox=\"0 0 24 24\" stroke-width=\"1.5\" stroke=\"currentColor\" class=\"size-6\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25\" /></svg>"
    },
    {
        id: "r3",
        name: "R3",
        rate: 450000,
        bookingName: "Bungalow with Pond View",
        src: "<svg xmlns=\"http://www.w3.org/2000/svg\" fill=\"none\" viewBox=\"0 0 24 24\" stroke-width=\"1.5\" stroke=\"currentColor\" class=\"size-6\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25\" /></svg>"
    }, {
        id: "r4",
        name: "R4",
        rate: 550000,
        bookingName: "Air-conditioned room with Garden View",
        src: "<svg xmlns=\"http://www.w3.org/2000/svg\" fill=\"none\" viewBox=\"0 0 24 24\" stroke-width=\"1.5\" stroke=\"currentColor\" class=\"size-6\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21\" /></svg>"
    }, {
        id: "r5",
        name: "R5",
        rate: 550000,
        bookingName: "Air-conditioned room with Garden View",
        src: "<svg xmlns=\"http://www.w3.org/2000/svg\" fill=\"none\" viewBox=\"0 0 24 24\" stroke-width=\"1.5\" stroke=\"currentColor\" class=\"size-6\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21\" /></svg>"
    }, {
        id: "r6",
        name: "R6",
        rate: 650000,
        bookingName: "Family room with Garden View",
        src: "<svg xmlns=\"http://www.w3.org/2000/svg\" fill=\"none\" viewBox=\"0 0 24 24\" stroke-width=\"1.5\" stroke=\"currentColor\" class=\"size-6\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205 3 1m1.5.5-1.5-.5M6.75 7.364V3h-3v18m3-13.636 10.5-3.819\" /></svg>"
    }
]