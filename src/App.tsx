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
import { FaHome, FaChartLine, FaFileInvoiceDollar, FaMoneyCheckAlt, FaCalendarAlt, FaClipboardList, FaBoxes, FaUserCircle } from "react-icons/fa";
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
import { Button } from "flowbite-react";
import { ReservationMap } from "./Components/ReservationMap";
import { InvoiceMap } from "./Components/InvoiceMap";
import { RoomManager } from "./Components/RoomManager";
import { RatePlanManager } from "./Components/RatePlanManager";
import { getProfile } from "./db/profile";
import { FaBed, FaMoneyBill } from "react-icons/fa";

// Add a lotus image to your public folder or assets and use its path here


export const DEFAULT_PAGE_SIZE = Number(process.env.REACT_APP_DEFAULT_PAGE_SIZE)

export type Chat = {
  id: string,
  firstName: string,
  lastName: string | undefined,
  username: string,
  email?: string,
  iss: string,
  tenantId: string
}
const defaultChatId = '0000000000'
export const defaultChat: Chat = {
  id: defaultChatId,
  firstName: "Login",
  lastName: "",
  username: 'no-user',
  iss: 'https://phucsinhhcm.hopto.org/iam/realm/ps',
  tenantId: ''
}

const menuOrder = ['home', 'expense', 'invoice', 'inventory', 'reservation', 'order', 'profit', 'tour', 'supplier', 'setting', 'room','rate-plan']
const menus = {
  home: {
    path: 'home',
    displayName: 'Home',
    title: 'Welcome Home',
    icon: <FaHome size={28} />
  },
  expense: {
    path: 'expense',
    displayName: 'Expense',
    title: 'Expense Management',
    icon: <FaMoneyCheckAlt size={28} />
  },
  invoice: {
    path: 'invoice-map',
    displayName: 'Invoice',
    title: 'Invoice Management',
    icon: <FaFileInvoiceDollar size={28} />
  },
  inventory: {
    path: 'inventory',
    displayName: 'Inventory',
    title: 'Product Inventory',
    icon: <FaBoxes size={28} />
  },
  reservation: {
    path: 'reservation-map',
    displayName: 'Reservation',
    title: 'Reservation Management',
    icon: <FaCalendarAlt size={28} />
  },
  order: {
    path: 'order',
    displayName: 'Order',
    title: 'Order Management',
    icon: <FaClipboardList size={28} />
  },
  profit: {
    path: 'profit',
    displayName: 'Profit',
    title: 'Profit Report',
    icon: <FaChartLine size={28} />
  },
  tour: {
    path: 'tour',
    displayName: 'Tour',
    title: 'Tour Management',
    icon: <FaClipboardList size={28} />
  },
  supplier: {
    path: 'supplier',
    displayName: 'Tour',
    title: 'Supplier Invoices',
    icon: <FaFileInvoiceDollar size={28} /> // Use invoice icon for supplier invoice
  },
  setting: {
    path: 'setting',
    displayName: 'Setting',
    title: 'System Settings',
    icon: <IoMdSettings size={28} />
  },
  profile: {
    path: 'profile',
    displayName: 'Profile',
    title: 'User Profile',
    icon: <FaUserCircle size={28} />
  },
  productGroup: {
    path: 'product-group',
    displayName: 'Group',
    title: 'Product Groups',
    icon: <FaBoxes size={28} />
  },
  room: {
    path: 'room',
    displayName: 'Room',
    title: 'Room Management',
    icon: <FaBed size={28} />
  },
  'rate-plan': {
    path: 'rate-plan',
    displayName: 'Rate Plan',
    title: 'Rate Plan Management',
    icon: <FaMoneyBill size={28} />
  },
}

export const App = () => {
  const [chat, setChat] = useState<Chat>(defaultChat);
  const [authorizedUserId, setAuthorizedUserId] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncingRes, setSyncingRes] = useState(false)

  const [filteredMenus, setFilteredMenus] = useState([menus.home]); // Default to home menu
  const [activeMenu, setActiveMenu] = useState(menus.home)
  const [configs, setConfigs] = useState<AppConfig>()
  const navigate = useNavigate();
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [authorities, setAuthorities] = useState<string[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const AUTH_URL =`${process.env.REACT_APP_PS_BASE_URL}/oauth2login.html`;

  const fetchUserProfile = async () => {
    try {
      const rsp = await getProfile();
      if(rsp.status===200){
        // Check if the final URL differs from the requested URL
        if (rsp.request.responseURL && AUTH_URL === rsp.request.responseURL) {
          console.warn("User is not authorized, redirecting to login.");
          return;
        }
        const profile: any = rsp.data;
        console.info("User profile fetched:", profile);
        if(!profile){
          console.warn("No user profile data found");
          return;
        }
        setUserProfile(profile);
        setChat({
          id: profile.sub,
          firstName: profile.given_name || "",
          lastName: profile.family_name || "",
          username: profile.preferred_username || profile.email || "",
          email: profile.email,
          iss: profile.iss,
          tenantId: profile.organization?profile.organization[0]:""
        });
        setAuthorizedUserId(profile.sub);
        setAuthorities(profile.authorities || []);
        setRoles(profile.roles || []);
        return;
      }
      console.error("Failed to fetch user profile, status:", rsp.status);
      setUserProfile(null);
      setChat(defaultChat);
      setAuthorizedUserId(null);
      setAuthorities([]);
      setRoles([]);
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      setUserProfile(null);
      setChat(defaultChat);
      setAuthorizedUserId(null);
      setAuthorities([]);
      setRoles([]);
    }
    finally {
      setLoadingProfile(false);
    }
  };


  useEffect(() => {
    document.title = "PMS";
    fetchConfig();
    fetchUserProfile();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    filterMenus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorities]);

  const filterMenus = () => {
    let fM =authorities.length === 0
        ? [menus.home] // Default to home if no roles
        : menuOrder
          .filter(menuKey => authorities.some(role => role.toLowerCase() === menuKey.toLowerCase()))
          .map(menuKey => menus[menuKey as keyof typeof menus])
          .filter(Boolean) as any; // Type guard to remove undefined values
    setFilteredMenus(fM);
    setActiveMenu(menus.home);
    navigate('/home');
    // fM.includes(menus.invoice)? setActiveMenu(menus.invoice) : setActiveMenu(menus.home);
    // window.location.href = `${process.env.REACT_APP_PS_BASE_URL}/${activeMenu.path}`;
    // navigate(`/${activeMenu.path}`);
  }

  const hasAuthority = (auth: string): boolean => {
    return authorities.some(a => a.toLowerCase() === auth.toLowerCase());
  }

  const fetchConfig = async () => {
    try {
      setLoadingConfig(true);
      setConfigError(null);
      let cfg = await appConfigs()
      setConfigs(cfg)
    } catch (error) {
      console.error("Failed to fetch config:", error);
      setConfigError("Offline/Update Failed. Please check your connection and try again.");
    } finally {
      setLoadingConfig(false);
    }
  }

  const getChat = () => chat ? chat : defaultChat

  const handleLogin = () => {
    window.location.href = AUTH_URL;
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
      ? "px-1 py-1 bg-green-50 text-center text-green-800 text-sm font-sans rounded-sm shadow-sm transition-transform duration-150 scale-95 ring-2 ring-green-700"
      : "px-1 py-1 bg-green-50 text-center text-green-800 text-sm font-sans rounded-sm shadow-sm transition-transform duration-150";
  }

  if (loadingConfig || (loadingProfile && !userProfile)) {
    return (
      <div className="flex flex-col items-center justify-center h-[100dvh] bg-white">
        <div className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center shadow-lg mb-6">
          <img
            src="/lotus.png"
            alt="Lotus"
            className="w-24 h-24 object-contain"
          />
        </div>
        <div className="text-lg text-gray-600 font-semibold">
            {loadingConfig ? "Loading Configuration..." : "Fetching User Profile..."}
        </div>
      </div>
    );
  }

  if (configError && !configs) {
    return (
      <div className="flex flex-col items-center justify-center h-[100dvh] bg-white p-4">
        <div className="text-red-600 text-xl font-bold mb-4">Error</div>
        <div className="text-lg text-gray-600 mb-6 text-center">{configError}</div>
        <Button
          className="bg-green-700 text-white px-6 py-2 rounded hover:bg-green-800 font-bold"
          onClick={() => {
            fetchConfig();
          }}
        >
          Retry
        </Button>
      </div>
    );
  }


  return (
    <div className="flex flex-col relative h-[100dvh] mx-2">
      <div>
        {
          activeMenu === menus.home ? (
            <div className="mt-36 grid grid-cols-3 grid-rows-2 ">
              {
                filteredMenus.map((menu) => (
                  <Link
                    key={menu.path}
                    to={menu.path}
                    className={menuStyle(menu.path)}
                    style={{ outline: "none" }}
                    onClick={() => setActiveMenu(menu)}
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-green-800">{menu.icon}</span>
                      <span className="text-green-900 font-semibold">{menu.displayName}</span>
                    </div>
                  </Link>
                ))
              }
            </div>
          ) : (
            <div className="flex items-center space-x-2 ">
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
              <span className="text-sm font-semibold text-green-900">{activeMenu.title}</span>
            </div>
          )
        }
      </div>
      <Routes>
        <Route path="" element={<Welcome activeMenu={() => setActiveMenu(menus.home)} />} />
        <Route path="home" element={<Welcome activeMenu={() => setActiveMenu(menus.home)} />} />
        <Route path="profit" element={<ProfitReport activeMenu={() => setActiveMenu(menus.profit)} />} />
        <Route path="invoice" element={<InvoiceManager
          activeMenu={() => setActiveMenu(menus.invoice)}
          handleUnauthorized={() => handleLogin()}
          hasAuthority={(auth:string) => hasAuthority(auth)}
        />} />
        <Route path="invoice-map" element={<InvoiceMap
          activeMenu={() => setActiveMenu(menus.invoice)}
          handleUnauthorized={() => handleLogin()}
        />} />
        <Route path="invoice/:invoiceId" element={<InvoiceEditor
          chat={getChat()}
          displayName={fullName()}
          authorizedUserId={authorizedUserId}
          activeMenu={() => setActiveMenu(menus.invoice)}
          handleUnauthorized={() => handleLogin()}
          hasAuthority={(auth: string) => hasAuthority(auth)}
          configs={configs}
        />} />
        <Route path="expense" element={<ExpenseManager
          chat={getChat()}
          displayName={fullName()}
          authorizedUserId={authorizedUserId}
          activeMenu={() => setActiveMenu(menus.expense)}
          handleUnauthorized={() => handleLogin()}
          hasAuthority={(auth: string) => hasAuthority(auth)}
        />} />
        <Route path="reservation" element={<ReservationManager
          activeMenu={() => setActiveMenu(menus.reservation)}
          handleUnauthorized={() => handleLogin()}
        />} />
        <Route path="reservation-map" element={<ReservationMap
          activeMenu={() => setActiveMenu(menus.reservation)}
          handleUnauthorized={() => handleLogin()}
        />} />
        <Route path="room" element={<RoomManager
          chat={getChat()}
          displayName={fullName()}
          authorizedUserId={authorizedUserId}
          activeMenu={() => setActiveMenu(menus.room)}
          handleUnauthorized={() => handleLogin()}
          hasAuthority={(auth: string) => hasAuthority(auth)}
        />} />
        <Route path="rate-plan" element={<RatePlanManager
          chat={getChat()}
          displayName={fullName()}
          authorizedUserId={authorizedUserId}
          activeMenu={() => setActiveMenu(menus['rate-plan'])}
          handleUnauthorized={() => handleLogin()}
          hasAuthority={(auth: string) => hasAuthority(auth)}
        />} />
        <Route path="order" element={<OrderManager
          chat={getChat()}
          displayName={fullName()}
          authorizedUserId={authorizedUserId}
          activeMenu={() => setActiveMenu(menus.order)}
          configs={configs}
          handleUnauthorized={() => handleLogin()}
        />} />
        <Route path="order/:orderId/:staffId"
          element={<OrderEditor
            chat={getChat()}
            activeMenu={() => setActiveMenu(menus.order)} />}
        />
        <Route path="inventory" element={<Inventory
          activeMenu={() => setActiveMenu(menus.inventory)}
          handleUnauthorized={() => handleLogin()}
        />} />
        <Route path="product-group" element={<PGroupManager activeMenu={() => setActiveMenu(menus.productGroup)} />} />
        <Route path="supplier" element={<SupplierManager chat={getChat()} displayName={fullName()} authorizedUserId={authorizedUserId} activeMenu={() => setActiveMenu(menus.supplier)} />} />
        <Route path="tour" element={<TourManager
          chat={getChat()}
          displayName={fullName()}
          authorizedUserId={authorizedUserId}
          activeMenu={() => setActiveMenu(menus.tour)}
        />} />
        <Route path="tour/:tourId"
          element={<TourEditor
            chat={getChat()}
            displayName={fullName()}
            authorizedUserId={authorizedUserId}
            activeMenu={() => setActiveMenu(menus.tour)}
          />} />
        <Route path="setting" element={<Settings
          syncing={syncing}
          changeSyncing={(n: boolean) => setSyncing(n)}
          syncingRes={syncingRes}
          changeResSyncing={(n: boolean) => setSyncingRes(n)}
          activeMenu={() => setActiveMenu(menus.setting)}
          chat={getChat()}
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
        className="absolute top-0 right-0 mt-2 mr-2 items-center"
      >
        {userProfile ? (
          <div className="flex flex-col cursor-pointer" onClick={() => {
            setActiveMenu(menus.profile);
            navigate('/profile');
          }}>
            <span className="font text-sm font-bold text-green-900 dark:text-green-200">
              {fullName()}
            </span>
            <span className="text-xs text-green-700 font-medium">
              {roles.length > 0 ? roles[0] : ""}
            </span>
          </div>
        ) : (
          <Button
            className="bg-green-700 text-white px-3 py-1 rounded hover:bg-green-800 text-xs font-bold"
            onClick={handleLogin}
          >
            Login
          </Button>
        )}
      </div>
    </div>
  );
}
