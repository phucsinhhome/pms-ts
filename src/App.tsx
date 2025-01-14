import React, { useEffect, useState } from "react";
import "./App.css";
import ProfitReport from "./Components/ProfitReport";
import { InvoiceManager } from "./Components/InvoiceManager"
import { InvoiceEditor } from "./Components/InvoiceEditor"
import { BrowserRouter as Router, Link, Route, Routes, Navigate } from "react-router-dom"
import { ExpenseManager } from "./Components/ExpenseManager";
import { ReservationManager } from "./Components/ReservationManager";
import { Settings } from "./Components/Settings";
import { IoMdSettings } from "react-icons/io";
import { OrderManager } from "./Components/OrderManager";
import { OrderEditor } from "./Components/OrderEditor";
import { Inventory } from "./Components/Inventory";
import { init, retrieveLaunchParams } from '@telegram-apps/sdk-react';
import { PGroupManager } from "./Components/PGroupManager";
import { SupplierManager } from "./Components/SupplierManager";
import { AppConfig, appConfigs, defaultAppConfigs } from "./db/configs";

export const DEFAULT_PAGE_SIZE = Number(process.env.REACT_APP_DEFAULT_PAGE_SIZE)

export type Chat = {
  id: string,
  firstName: string,
  lastName: string | undefined,
  username: string | undefined
}
export const defaultChat: Chat = {
  id: '1351151927',
  firstName: "Minh",
  lastName: "Tran",
  username: undefined
}

type MenuItem = {
  path: string,
  displayName: string
}

const menus: MenuItem[] = [{
  path: 'profit',
  displayName: 'Profit'
}, {
  path: 'invoice',
  displayName: 'Invoice'
}, {
  path: 'expenses',
  displayName: 'Expense'
}, {
  path: 'reservation',
  displayName: 'Res'
}, {
  path: 'order',
  displayName: 'Order'
}, {
  path: 'inventory',
  displayName: 'Inventory'
}]

export default function App() {

  const [chat, setChat] = useState<Chat>(defaultChat)
  const [apiVersion, setAPIVersion] = useState<string>('6.0')
  const [authorizedUserId, setAuthorizedUserId] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncingRes, setSyncingRes] = useState(false)
  const [activeMenu, setActiveMenu] = useState(menus[0])
  const [configs, setConfigs] = useState<AppConfig>(defaultAppConfigs)

  function Component() {
    let launchParams = null
    try {
      init();
      launchParams = retrieveLaunchParams();
    } catch (e) {
      console.warn("Failed to retrieve launch params")
    }
    if (launchParams === null) {
      console.warn("No authorized user login. So, use the default user and chat.")
      return
    }
    if (launchParams.initData && launchParams.initData.user) {
      const user = launchParams.initData.user
      setChat({
        id: String(user.id),
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username
      })
      setAuthorizedUserId(String(user.id))
      console.warn("User %s", String(user.id))
    }
    setAPIVersion(launchParams.version)
    console.info("API VERSION: %s", launchParams.version)
  }

  useEffect(() => {
    document.title = "PMS"
    Component()
    fetchConfig()
  }, []);

  const fullName = () => {
    return [chat.firstName, chat.lastName].join(' ')
  }
  const menuStyle = (m: string) => {
    return m === activeMenu.path ? "px-1 py-1 bg-gray-500 text-center text-amber-900 text-sm font-sans rounded-sm shadow-sm"
      : "px-1 py-1 bg-gray-200 text-center text-amber-900 text-sm font-sans rounded-sm shadow-sm"
  }

  const fetchConfig = async () => {
    console.info("Fetch the configuration...")
    let cfg = await appConfigs()
    setConfigs(cfg)
  }

  return (
    <div className="flex flex-col relative h-[100dvh] bg-slate-50">
      <Router>
        <div className="mt-2 ml-2 pr-1 w-full flex flex-row items-center space-x-0.5">
          {
            menus.map((menu: MenuItem) => <Link key={menu.path} to={menu.path} className={menuStyle(menu.path)}>
              {menu.displayName}
            </Link>)
          }
          <Link to="settings" className="absolute right-2">
            <IoMdSettings
              className="pointer-events-auto cursor-pointer w-14 h-7"
            />
          </Link>
        </div>
        <Routes>
          <Route path="/" element={<Navigate to={"profit"} />} />
          <Route path="profit" element={<ProfitReport activeMenu={() => setActiveMenu(menus[0])} />} />
          <Route path="invoice" element={<InvoiceManager activeMenu={() => setActiveMenu(menus[1])} />} />
          <Route path="invoice/:invoiceId" element={<InvoiceEditor chat={chat} displayName={fullName()} authorizedUserId={authorizedUserId} activeMenu={() => setActiveMenu(menus[1])} />} />
          <Route path="expenses" element={<ExpenseManager chat={chat} displayName={fullName()} authorizedUserId={authorizedUserId} activeMenu={() => setActiveMenu(menus[2])} />} />
          <Route path="reservation" element={<ReservationManager activeMenu={() => setActiveMenu(menus[3])} />} />
          <Route path="order" element={<OrderManager chat={chat} displayName={fullName()} authorizedUserId={authorizedUserId} activeMenu={() => setActiveMenu(menus[4])} />} />
          <Route path="order/:orderId/:staffId" element={<OrderEditor activeMenu={() => setActiveMenu(menus[4])} />} />
          <Route path="inventory" element={<Inventory activeMenu={() => setActiveMenu(menus[5])} />} />
          <Route path="product-group" element={<PGroupManager activeMenu={() => setActiveMenu({ path: 'product-group', displayName: 'Group' })} />} />
          <Route path="supplier" element={<SupplierManager chat={chat} displayName={fullName()} authorizedUserId={authorizedUserId} activeMenu={() => setActiveMenu({ path: 'supplier', displayName: 'Supplier' })} />} />
          <Route path="settings" element={<Settings
            syncing={syncing}
            changeSyncing={(n: boolean) => setSyncing(n)}
            syncingRes={syncingRes}
            changeResSyncing={(n: boolean) => setSyncingRes(n)}
            activeMenu={() => setActiveMenu({ path: 'settings', displayName: 'Settings' })}
          />} />
        </Routes>
      </Router>
      {configs.app.showProfile ? <div className="absolute top-0 right-0 flex flex-col mt-10 mr-2 bg-neutral-200 p-1 opacity-90 rounded-md shadow-lg">
        <span className=" font text-[10px] font-bold text-gray-800 dark:text-white">{fullName()}</span>
        <span className=" font text-[8px] italic text-gray-600 dark:text-white">{chat.id}</span>
        <span className=" font font-mono text-center text-[8px] text-gray-900 dark:text-white">{"API " + apiVersion}</span>
      </div> : <></>}
    </div>
  );
}
