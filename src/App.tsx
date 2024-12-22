import React, { useEffect, useState } from "react";
import "./App.css";
import ProfitReport from "./Components/Profit/ProfitReport";
import { InvoiceManager } from "./Components/Invoice/InvoiceManager"
import { EditInvoice } from "./Components/Invoice/EditInvoice"
import { BrowserRouter as Router, Link, Route, Routes } from "react-router-dom"
import { ExpenseManager } from "./Components/Expense/ExpenseManager";
import { ReservationManager } from "./Components/Reservation/ReservationManager";
import { Settings } from "./Components/Settings/Settings";
import { IoMdSettings } from "react-icons/io";
import { OrderManager } from "./Components/Order/OrderManager";
import { EditOrder } from "./Components/Order/EditOrder";
import { Inventory } from "./Components/Inventory/Inventory";

const tele = window.Telegram.WebApp;
export const DEFAULT_PAGE_SIZE = Number(process.env.REACT_APP_DEFAULT_PAGE_SIZE)

export const initialUser = tele.initDataUnsafe.user
export const currentUser = tele.initDataUnsafe.user || {
  id: "1351151927",
  first_name: "Minh",
  last_name: "Tran"
}

export const currentUserFullname = () => {
  let sufix = currentUser.last_name === null || currentUser.last_name === undefined || currentUser.last_name === "" ? "" : (" " + currentUser.last_name)
  return currentUser.first_name + sufix
}

export default function App() {

  const [syncing, setSyncing] = useState(false)
  const [syncingRes, setSyncingRes] = useState(false)

  useEffect(() => {
    document.title = "PMS"
    tele.ready();
    tele.expand();
    tele.disableVerticalSwipes();
    console.info("TELEGRAM BOT API VERSION: %s", tele.version)

  }, []);


  return (
    <div className="flex flex-col relative h-[100dvh] min-h-0 bg-slate-50">
      <Router>
        <div className="mt-2 ml-2 pr-1 w-full flex flex-row items-center space-x-0.5">
          <Link to="profit" className="px-1 py-1 bg-gray-200 text-center text-amber-900 text-sm font-sans rounded-sm shadow-sm">Profit</Link>
          <Link to="invoice" className="px-1 py-1 bg-gray-200 text-center text-amber-900 text-sm font-sans rounded-sm shadow-sm" state={{ pageNumber: 0, pageSize: DEFAULT_PAGE_SIZE }}>Invoice</Link>
          <Link to="expenses" className="px-1 py-1 bg-gray-200 text-center text-amber-900 text-sm font-sans rounded-sm shadow-sm" state={{ pageNumber: 0, pageSize: DEFAULT_PAGE_SIZE }}>Expense</Link>
          <Link to="reservation" className="px-1 py-1 bg-gray-200 text-center text-amber-900 text-sm font-sans rounded-sm shadow-sm">Res</Link>
          <Link to="order" className="px-1 py-1 bg-gray-200 text-center text-amber-900 text-sm font-sans rounded-sm shadow-sm">Order</Link>
          <Link to="inventory" className="px-1 py-1 bg-gray-200 text-center text-amber-900 text-sm font-sans rounded-sm shadow-sm">Inventory</Link>
          <Link to="settings" className="absolute right-2">
            <IoMdSettings
              className="pointer-events-auto cursor-pointer w-14 h-7"
            />
          </Link>
        </div>
        <Routes>
          <Route path="profit" element={<ProfitReport />} />
          <Route path="invoice" element={<InvoiceManager />} />
          <Route path="invoice/:invoiceId" element={<EditInvoice />} />
          <Route path="expenses" element={<ExpenseManager />} />
          {/* <Route path="expenses/:expenseId" element={<EditExpense />} /> */}
          <Route path="reservation" element={<ReservationManager />} />
          {/* <Route path="reservation/:reservationId" element={<EditReservation />} /> */}
          <Route path="order" element={<OrderManager />} />
          <Route path="order/:orderId/:staffId" element={<EditOrder />} />
          <Route path="inventory" element={<Inventory />} />
          {/* <Route path="settings" element={<Settings
            syncing={syncing} changeSyncing={(n:boolean) => setSyncing(n)}
            syncingRes={syncingRes} changeResSyncing={(n:boolean) => setSyncingRes(n)}
          />} /> */}
          <Route path="settings" element={<Settings
            // props={
            syncing={syncing}
            changeSyncing={(n: boolean) => setSyncing(n)}
            syncingRes={syncingRes}
            changeResSyncing={(n: boolean) => setSyncingRes(n)}
          // }
          />} />
        </Routes>
      </Router>
      <div className="absolute top-0 right-0 flex flex-col mt-10 mr-2 bg-neutral-200 p-1 opacity-90 rounded-md shadow-lg">
        <span className=" font text-[10px] font-bold text-gray-800 dark:text-white">{currentUserFullname()}</span>
        <span className=" font text-[8px] italic text-gray-600 dark:text-white">{currentUser.id}</span>
        <span className=" font font-mono text-center text-[8px] text-gray-900 dark:text-white">{"API " + tele.version}</span>
      </div>
    </div>
  );
}
