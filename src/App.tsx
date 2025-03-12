import React, { useEffect, useState } from "react";
import "./App.css";
import ProfitReport from "./Components/ProfitReport";
import { InvoiceManager } from "./Components/InvoiceManager"
import { InvoiceEditor } from "./Components/InvoiceEditor"
import { Link, Route, Routes, Navigate, useNavigate } from "react-router-dom"
import { ExpenseManager } from "./Components/ExpenseManager";
import { ReservationManager } from "./Components/ReservationManager";
import { Settings } from "./Components/Settings";
import { IoMdSettings } from "react-icons/io";
import { OrderManager } from "./Components/OrderManager";
import { OrderEditor } from "./Components/OrderEditor";
import { Inventory } from "./Components/Inventory";
import { PGroupManager } from "./Components/PGroupManager";
import { SupplierManager } from "./Components/SupplierManager";
import { AppConfig, appConfigs, defaultAppConfigs } from "./db/configs";
import { Login } from "./Components/Login";

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
  username: 'minhtranes'
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

export const App = () => {

  const [chat, setChat] = useState<Chat>()
  const [authorizedUserId, setAuthorizedUserId] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncingRes, setSyncingRes] = useState(false)
  const [activeMenu, setActiveMenu] = useState(menus[0])
  const [configs, setConfigs] = useState<AppConfig>(defaultAppConfigs)
  const foredLogin = process.env.REACT_APP_FORCED_LOGIN === 'true'

  const navigate = useNavigate()

  function loadLauchParams() {

    if (chat) {
      console.info(`Filter the user with id ${chat.id}`)
      var user = configs?.users.find(u => u.id === chat.id)
      if (user !== null) {
        setChat(user)
      }
      return
    }
    if (!foredLogin) {
      console.error("User is not authorized. Use the default user.")
      return
    }
    navigate('login', { replace: true })
    console.warn("No authorized user login. So, use the default user and chat.")
  }

  useEffect(() => {
    document.title = "PMS"
    fetchConfig()
  }, []);

  useEffect(() => {
    if (configs) {
      loadLauchParams()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configs]);

  useEffect(() => {
    if (!chat) {
      setAuthorizedUserId(null)
      return
    }
    console.log(chat)
    setAuthorizedUserId(chat.id)
  }, [chat]);


  const fullName = () => {
    return [chat?.firstName, chat?.lastName].join(' ')
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

  const getChat = () => chat ? chat : defaultChat

  return (
    <div className="flex flex-col relative h-[100dvh] min-h-0 bg-slate-50">
      {/* <Router> */}

      {
        getChat() ? <div className="mt-2 ml-2 pr-1 w-full flex flex-row items-center space-x-0.5">
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
          : <></>
      }
      <Routes>
        <Route path="/" element={<Navigate to={"profit"} />} />
        <Route path="profit" element={<ProfitReport activeMenu={() => setActiveMenu(menus[0])} />} />
        <Route path="invoice" element={<InvoiceManager activeMenu={() => setActiveMenu(menus[1])} />} />
        <Route path="invoice/:invoiceId" element={<InvoiceEditor chat={getChat()} displayName={fullName()} authorizedUserId={authorizedUserId} activeMenu={() => setActiveMenu(menus[1])} />} />
        <Route path="expenses" element={<ExpenseManager chat={getChat()} displayName={fullName()} authorizedUserId={authorizedUserId} activeMenu={() => setActiveMenu(menus[2])} />} />
        <Route path="reservation" element={<ReservationManager activeMenu={() => setActiveMenu(menus[3])} />} />
        <Route path="order" element={<OrderManager
          chat={getChat()}
          displayName={fullName()}
          authorizedUserId={authorizedUserId}
          activeMenu={() => setActiveMenu(menus[4])}
          configs={configs}
        />} />
        <Route path="order/:orderId/:staffId"
          element={<OrderEditor
            setChat={(chat: Chat) => setChat(chat)}
            activeMenu={() => setActiveMenu(menus[4])} />}
        />
        <Route path="inventory" element={<Inventory activeMenu={() => setActiveMenu(menus[5])} />} />
        <Route path="product-group" element={<PGroupManager activeMenu={() => setActiveMenu({ path: 'product-group', displayName: 'Group' })} />} />
        <Route path="supplier" element={<SupplierManager chat={getChat()} displayName={fullName()} authorizedUserId={authorizedUserId} activeMenu={() => setActiveMenu({ path: 'supplier', displayName: 'Supplier' })} />} />
        <Route path="login"
          element={<Login
            chat={getChat()}
            setChat={(chat: Chat) => setChat(chat)}
            users={configs?.users} />}
        />
        <Route path="settings" element={<Settings
          syncing={syncing}
          changeSyncing={(n: boolean) => setSyncing(n)}
          syncingRes={syncingRes}
          changeResSyncing={(n: boolean) => setSyncingRes(n)}
          activeMenu={() => setActiveMenu({ path: 'settings', displayName: 'Settings' })}
        />} />
      </Routes>
      {configs?.app.showProfile && authorizedUserId ? <div
        className="absolute top-0 right-0 flex flex-col mt-10 mr-2 bg-neutral-200 p-1 opacity-90 rounded-md shadow-lg"
        onClick={() => {
          setChat(undefined)
          navigate('login', { replace: true })
        }}
      >
        <span className="font text-[10px] font-bold text-gray-800 dark:text-white">{fullName()}</span>
      </div> : <></>}
    </div>
  );
}
