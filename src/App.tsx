import React, { useEffect, useState } from "react";
import "./App.css";
import ProfitReport from "./Components/ProfitReport";
import { InvoiceManager } from "./Components/InvoiceManager"
import { InvoiceEditor } from "./Components/InvoiceEditor"
import { Link, Route, Routes, useNavigate } from "react-router-dom"
import { ExpenseManager } from "./Components/ExpenseManager";
import { ReservationManager } from "./Components/ReservationManager";
import { Settings } from "./Components/Settings";
import { IoMdSettings } from "react-icons/io";
import { FaHome, FaChartLine, FaFileInvoiceDollar, FaMoneyCheckAlt, FaCalendarAlt, FaClipboardList, FaBoxes } from "react-icons/fa";
import { OrderManager } from "./Components/OrderManager";
import { OrderEditor } from "./Components/OrderEditor";
import { Inventory } from "./Components/Inventory";
import { PGroupManager } from "./Components/PGroupManager";
import { SupplierManager } from "./Components/SupplierManager";
import { AppConfig, appConfigs } from "./db/configs";
import { TourManager } from "./Components/TourManager";
import { TourEditor } from "./Components/TourEditor";
import UserProfile from "./Components/UserProfile";
import { Welcome } from "./Components/Welcome";
import { getProfile } from "./db/users";

// Add a lotus image to your public folder or assets and use its path here


export const DEFAULT_PAGE_SIZE = Number(process.env.REACT_APP_DEFAULT_PAGE_SIZE)

export type Chat = {
  id: string,
  firstName: string,
  lastName: string | undefined,
  username: string,
  email?: string
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
  displayName: string,
  icon: React.ReactNode
}
const menuOrder = ['home', 'expense', 'invoice', 'inventory', 'reservation', 'order', 'profit', 'tour', 'setting']
const menus = {
  home: {
    path: 'home',
    displayName: 'Home',
    icon: <FaHome size={28} />
  },
  expense: {
    path: 'expense',
    displayName: 'Expense',
    icon: <FaMoneyCheckAlt size={28} />
  },
  invoice: {
    path: 'invoice',
    displayName: 'Invoice',
    icon: <FaFileInvoiceDollar size={28} />
  },
  inventory: {
    path: 'inventory',
    displayName: 'Inventory',
    icon: <FaBoxes size={28} />
  },
  reservation: {
    path: 'reservation',
    displayName: 'Reservation',
    icon: <FaCalendarAlt size={28} />
  },
  order: {
    path: 'order',
    displayName: 'Order',
    icon: <FaClipboardList size={28} />
  },
  profit: {
    path: 'profit',
    displayName: 'Profit',
    icon: <FaChartLine size={28} />
  },
  tour: {
    path: 'tour',
    displayName: 'Tour',
    icon: <FaClipboardList size={28} />
  },
  setting: {
    path: 'setting',
    displayName: 'Setting',
    icon: <IoMdSettings size={28} />
  }
}


export const App = () => {
  const [chat, setChat] = useState<Chat>(defaultChat);
  const [authorizedUserId, setAuthorizedUserId] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncingRes, setSyncingRes] = useState(false)

  const [filteredMenus, setFilteredMenus] = useState<MenuItem[]>([menus.home]); // Default to home menu
  const [activeMenu, setActiveMenu] = useState(menus.home)
  const [configs, setConfigs] = useState<AppConfig>()
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  // const [oidcUser, setOidcUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);

  // const userManager = new UserManager(oidcConfig);

  const fetchUserProfile = async () => {
    try {
      const rsp = await getProfile();
      if (rsp.ok) {
        const json = await rsp.json();
        if (!json) {
          console.warn("No user profile found in the response");
          return;
        }
        const data: any = json;
        console.info("User profile fetched:", data);
        setUserProfile(data);
        setChat({
          id: data.sub,
          firstName: data.given_name || "",
          lastName: data.family_name || "",
          username: data.preferred_username || data.email || "",
          email: data.email
        });
        setAuthorizedUserId(data.sub);
        setRoles(data.authorities || []);
      } else {
        setUserProfile(null);
        setChat(defaultChat);
        setAuthorizedUserId(null);
        setRoles([]);
      }
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      setUserProfile(null);
      setChat(defaultChat);
      setAuthorizedUserId(null);
      setRoles([]);
    }
    finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    document.title = "PMS";
    fetchConfig();
    fetchUserProfile();
  }, []);

  useEffect(() => {
    filterMenus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roles]);

  const filterMenus = () => {
    setFilteredMenus(
      roles.length === 0
        ? [menus.home] // Default to home if no roles
        : menuOrder
          .filter(menuKey => roles.some(role => role.toLowerCase() === menuKey.toLowerCase()))
          .map(menuKey => menus[menuKey as keyof typeof menus]) // Type guard to remove undefined values
    );
  }

  const fetchConfig = async () => {
    let cfg = await appConfigs()
    setConfigs(cfg)
  }

  const getChat = () => chat ? chat : defaultChat

  const handleLogin = () => {
    window.location.href = `${process.env.REACT_APP_PS_BASE_URL}/oauth2login.html`;
  };

  const handleSignOut = () => {
    window.location.href = `${process.env.REACT_APP_PS_BASE_URL}/logout`;
  };

  // In your React app (e.g., UserProfile component)

  const fullName = () => {
    if (userProfile) {
      return userProfile.name;
    }
    return '';
  }

  const menuStyle = (m: string) => {
    return m === activeMenu.path
      // ? "px-1 py-1 bg-green-200 text-center text-green-900 text-sm font-sans rounded-sm shadow-sm border-2 border-green-700"
      ? "px-1 py-1 bg-green-50 text-center text-green-800 text-sm font-sans rounded-sm shadow-sm"
      : "px-1 py-1 bg-green-50 text-center text-green-800 text-sm font-sans rounded-sm shadow-sm";
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[100dvh] bg-white">
        <div className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center shadow-lg mb-6">
          <img
            src="/lotus.png"
            alt="Lotus"
            className="w-24 h-24 object-contain"
          />
        </div>
        <div className="text-lg text-gray-600 font-semibold">Loading...</div>
      </div>
    );
  }


  return (
    <div className="flex flex-col relative h-[100dvh] min-h-0 bg-slate-50">
      <div className="mt-2">
        {
          activeMenu === menus.home ? (
            <div className="mt-36 grid grid-cols-3 gap-5 p-2 grid-rows-2">
              {
                filteredMenus.map((menu: MenuItem) => (
                  <Link key={menu.path} to={menu.path} className={menuStyle(menu.path)}>
                    <div className="flex flex-col items-center">
                      <span className="mb-1 text-green-800">{menu.icon}</span>
                      <span className="text-green-900 font-semibold">{menu.displayName}</span>
                    </div>
                  </Link>
                ))
              }
            </div>
          ) : (
            <div className="pl-2 flex items-center space-x-2">
              <button
                className="bg-green-100 text-green-900 px-2 py-1 rounded hover:bg-green-200 mr-2 border border-green-700"
                onClick={() => {
                  setActiveMenu(menus.home);
                  navigate('/home');
                }}
                type="button"
              >
                &larr; Back
              </button>
              <span className="text-2xl font-semibold text-green-900">{activeMenu.displayName}</span>
            </div>
          )
        }
      </div>
      <Routes>
        <Route path="" element={<Welcome activeMenu={() => setActiveMenu(menus.home)} />} />
        <Route path="home" element={<Welcome activeMenu={() => setActiveMenu(menus.home)} />} />
        <Route path="profit" element={<ProfitReport activeMenu={() => setActiveMenu(menus.profit)} />} />
        <Route path="invoice" element={<InvoiceManager activeMenu={() => setActiveMenu(menus.invoice)} />} />
        <Route path="invoice/:invoiceId" element={<InvoiceEditor chat={getChat()} displayName={fullName()} authorizedUserId={authorizedUserId} activeMenu={() => setActiveMenu(menus.invoice)} />} />
        <Route path="expense" element={<ExpenseManager chat={getChat()} displayName={fullName()} authorizedUserId={authorizedUserId} activeMenu={() => setActiveMenu(menus.expense)} />} />
        <Route path="reservation" element={<ReservationManager activeMenu={() => setActiveMenu(menus.reservation)} />} />
        <Route path="order" element={<OrderManager
          chat={getChat()}
          displayName={fullName()}
          authorizedUserId={authorizedUserId}
          activeMenu={() => setActiveMenu(menus.order)}
          configs={configs}
        />} />
        <Route path="order/:orderId/:staffId"
          element={<OrderEditor
            setChat={(chat: Chat) => setChat(chat)}
            activeMenu={() => setActiveMenu(menus.order)} />}
        />
        <Route path="inventory" element={<Inventory activeMenu={() => setActiveMenu(menus.inventory)} />} />
        <Route path="product-group" element={<PGroupManager activeMenu={() => setActiveMenu({ path: 'product-group', displayName: 'Group', icon: <FaBoxes size={28} /> })} />} />
        <Route path="supplier" element={<SupplierManager chat={getChat()} displayName={fullName()} authorizedUserId={authorizedUserId} activeMenu={() => setActiveMenu({ path: 'supplier', displayName: 'Supplier', icon: <FaBoxes size={28} /> })} />} />
        <Route path="tour" element={<TourManager
          chat={getChat()}
          displayName={fullName()}
          authorizedUserId={authorizedUserId}
          activeMenu={() => setActiveMenu({ path: 'tour', displayName: 'Tour', icon: <FaClipboardList size={28} /> })}
        />} />
        <Route path="tour/:tourId"
          element={<TourEditor
            chat={getChat()}
            displayName={fullName()}
            authorizedUserId={authorizedUserId}
            activeMenu={() => setActiveMenu({ path: 'tour', displayName: 'Tour', icon: <FaClipboardList size={28} /> })}
          />} />
        <Route path="settings" element={<Settings
          syncing={syncing}
          changeSyncing={(n: boolean) => setSyncing(n)}
          syncingRes={syncingRes}
          changeResSyncing={(n: boolean) => setSyncingRes(n)}
          activeMenu={() => setActiveMenu({ path: 'settings', displayName: 'Settings', icon: <IoMdSettings size={28} /> })}
        />} />
        <Route
          path="profile"
          element={
            <UserProfile
              userProfile={userProfile}
              onSignOut={handleSignOut}
            />
          }
        />
      </Routes>

      <div
        className="absolute top-0 right-0 mt-2 mr-2 bg-green-50 p-1 opacity-90 rounded-md shadow-lg cursor-pointer border border-green-700"
      >
        <div className="flex flex-col items-center space-y-1">
          {
            userProfile ? <span className="font text-[10px] font-bold text-green-900 dark:text-green-200"
              onClick={() => navigate('/profile')}>
              {fullName()}
            </span>
              : <span className="font text-[10px] font-bold text-green-900 dark:text-green-200"
                onClick={handleLogin}>
                Login
              </span>
          }
        </div>
      </div>
    </div>
  );
}
