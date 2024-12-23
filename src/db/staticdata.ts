import { PaymentMethod } from "../Components/InvoiceEditor"

export const paymentMethods: PaymentMethod[] = [
    {
        id: "cash",
        name: "Cash",
        feeRate: 0,
        template: "invoice_without_transfer_fee",
        srcLargeImg: "/cash.svg",
        paymentInfo: "/payment/cash.jpeg",
        defaultIssuerId: "6456500785"
    },
    {
        id: "creditCard",
        name: "Credit Card",
        feeRate: 0.025,
        template: "invoice_with_transfer_fee",
        srcLargeImg: "/mastercard.svg",
        paymentInfo: "/payment/creditcard.jpeg",
        defaultIssuerId: "1351151927"
    },
    {
        id: "momo",
        name: "MoMo",
        feeRate: 0,
        template: "invoice_without_transfer_fee",
        srcLargeImg: "/momo-square.png",
        paymentInfo: "/payment/mono.jpg",
        defaultIssuerId: "1351151927"
    }, {
        id: "paypal",
        name: "Paypal",
        feeRate: 0.025,
        template: "invoice_without_transfer_fee",
        srcLargeImg: "/paypal.svg",
        paymentInfo: "/payment/paypal.png",
        defaultIssuerId: "1351151927"
    }, {
        id: "bankTransfer",
        name: "Bank Transfer",
        feeRate: 0.0,
        template: "invoice_without_transfer_fee",
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
        bookingName: "Bungalow with Garden View"
    },
    {
        id: "r2",
        name: "R2",
        rate: 450000,
        bookingName: "Bungalow with Garden View"
    },
    {
        id: "r3",
        name: "R3",
        rate: 450000,
        bookingName: "Bungalow with Pond View"
    }, {
        id: "r4",
        name: "R4",
        rate: 550000,
        bookingName: "Air-conditioned room with Garden View",
    }, {
        id: "r5",
        name: "R5",
        rate: 550000,
        bookingName: "Air-conditioned room with Garden View"
    }, {
        id: "r6",
        name: "R6",
        rate: 650000,
        bookingName: "Family room with Garden View"
    }
]