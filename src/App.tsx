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
import { AppConfig, appConfigs } from "./db/configs";
import { TourManager } from "./Components/TourManager";
import { TourEditor } from "./Components/TourEditor";
import { initializeApp } from "firebase/app";
import { firebaseConfig } from "./db/configs";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, User } from "firebase/auth";
import CreateAccountForm from "./Components/CreateAccountForm";
import LoginForm from "./Components/LoginForm";
import UserProfile from "./Components/UserProfile";

export const firebaseApp = initializeApp(firebaseConfig);

export const DEFAULT_PAGE_SIZE = Number(process.env.REACT_APP_DEFAULT_PAGE_SIZE)

export type Chat = {
  id: string,
  firstName: string,
  lastName: string | undefined,
  username: string | undefined
}
const defaultChatId = '0000000000'
export const defaultChat: Chat = {
  id: defaultChatId,
  firstName: "Login",
  lastName: "",
  username: 'no-user'
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

  const [chat, setChat] = useState<Chat>(defaultChat)
  const [authorizedUserId, setAuthorizedUserId] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncingRes, setSyncingRes] = useState(false)
  const [activeMenu, setActiveMenu] = useState(menus[0])
  const [configs, setConfigs] = useState<AppConfig>()
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const foredLogin = process.env.REACT_APP_FORCED_LOGIN === 'true'
  const LOCAL_STATORAGE_SIGNED_IN = 'PS-SIGNED-IN'
  const [showCreateAccount, setShowCreateAccount] = useState(false);

  function loadLauchParams() {

    if (chat.id !== defaultChatId) {
      console.info(`Find the user with id ${chat.id}`)
      var user = configs?.users.find(u => u.id === chat.id)
      if (user) {
        setChat(user)
      }
      return
    }
    if (!foredLogin) {
      console.error("Forced login disabled.")
      return
    }
    if (isSignedIn()) {
      console.info("The user is already signed in.")
      return
    }
    // navigate('login', { replace: true })
    console.warn("No authorized user login. So, use the default user and chat.")
  }

  useEffect(() => {
    document.title = "PMS"
    let signedInChatId = localStorage.getItem(LOCAL_STATORAGE_SIGNED_IN)
    if (signedInChatId) {
      console.info(`The signed in chat id is ${signedInChatId}`)
      setChat(chat => ({ ...chat, id: signedInChatId }))
    }
    fetchConfig()
  }, []);

  useEffect(() => {
    if (configs === undefined) {
      return
    }
    loadLauchParams()

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configs]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STATORAGE_SIGNED_IN, chat?.id)
    if (chat?.id === defaultChatId) {
      setAuthorizedUserId(null)
      return
    }
    console.log(chat)
    setAuthorizedUserId(chat.id)
  }, [chat]);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const isSignedIn = () => {
    console.info(`The chat id is ${chat.id}`)
    return user !== null 
  }

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

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return showCreateAccount ? (
      <CreateAccountForm onAccountCreated={() => setShowCreateAccount(false)} />
    ) : (
      <LoginForm onCreateAccountClick={() => setShowCreateAccount(true)} />
    );
  }

  return (
    <div className="flex flex-col relative h-[100dvh] min-h-0 bg-slate-50">
      {
        isSignedIn() ? <div className="mt-2 ml-2 pr-1 w-full flex flex-row items-center space-x-0.5">
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
        </div> : <></>
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
        <Route path="tour" element={<TourManager
          chat={getChat()}
          displayName={fullName()}
          authorizedUserId={authorizedUserId}
          activeMenu={() => setActiveMenu({ path: 'tour', displayName: 'Tour' })}
        />} />
        <Route path="tour/:tourId"
          element={<TourEditor
            chat={getChat()}
            displayName={fullName()}
            authorizedUserId={authorizedUserId}
            activeMenu={() => setActiveMenu({ path: 'tour', displayName: 'Tour' })}
          />} />
        {/* <Route path="login"
          element={<Login
            chat={getChat()}
            setChat={(chat: Chat) => setChat(chat)}
            users={configs?.users} />}
        /> */}
        <Route path="settings" element={<Settings
          syncing={syncing}
          changeSyncing={(n: boolean) => setSyncing(n)}
          syncingRes={syncingRes}
          changeResSyncing={(n: boolean) => setSyncingRes(n)}
          activeMenu={() => setActiveMenu({ path: 'settings', displayName: 'Settings' })}
        />} />
        <Route path="profile" element={<UserProfile />} />
      </Routes>
      {configs?.app.showProfile && user ?
        <div
          className="absolute top-0 right-0 flex flex-col mt-10 mr-2 bg-neutral-200 p-1 opacity-90 rounded-md shadow-lg cursor-pointer"
          onClick={() => {
            navigate('/profile');
          }}
        >
          <span className="font text-[10px] font-bold text-gray-800 dark:text-white">
            {user.displayName || user.email}
          </span>
        </div> : null}
    </div>
  );
}
