# PMS

This Web App help to view business status with following features:
   - Manage expense
   - Manage invoice
   - Reservation status
   - Profit report

## Get Started

### Configure project

From the root folder of the project. Create `.env` file which contains following properties:

| Name | Description |
|---|---|
| `REACT_APP_EXPENSE_SERVICE_ENDPOINT` | The URL of expense service. E.g: `https://localhost:8443/expense`
| `REACT_APP_INVOICE_SERVICE_ENDPOINT` | The URL of invoice service. E.g: `https://localhost:8443/invoice`
| `REACT_APP_TAX_POLICY_ENDPOINT` | The URL of tax policy service. E.g: `https://localhost:8443/tax-policy`
| `REACT_APP_PROFIT_SERVICE_ENDPOINT` | The URL of profit report service. E.g: `https://localhost:8443/profit`
| `REACT_APP_RESERVATION_SERVICE_ENDPOINT` | The URL of reservation service. E.g: `https://localhost:8443/reservation`
| `REACT_APP_SERVICE_CLASSIFICATION_ENDPOINT` | The URL of item classifcation service. E.g: `https://localhost:8443/classification`


### Start the App

Runs the app in the development mode with command `npm run start`.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.