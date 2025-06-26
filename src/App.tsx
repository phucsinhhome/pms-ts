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
import { OrderManager } from "./Components/OrderManager";
import { OrderEditor } from "./Components/OrderEditor";
import { Inventory } from "./Components/Inventory";
import { PGroupManager } from "./Components/PGroupManager";
import { SupplierManager } from "./Components/SupplierManager";
import { AppConfig, appConfigs } from "./db/configs";
import { TourManager } from "./Components/TourManager";
import { TourEditor } from "./Components/TourEditor";
import { UserManager, WebStorageStateStore, User } from "oidc-client-ts";
import UserProfile from "./Components/UserProfile";
import { jwtDecode } from "jwt-decode";

// Add a lotus image to your public folder or assets and use its path here
const LOTUS_IMAGE_URL = "https://www.harpercrown.com/cdn/shop/articles/everything-you-should-know-about-the-lotus-flower-450435.jpg"; // Place lotus.png in your public folder

const WelcomePage = () => (
  <div className="flex flex-col items-center justify-center h-[100dvh] bg-white">
    <img
      src={LOTUS_IMAGE_URL}
      alt="Lotus"
      className="w-1/2 h-auto mb-6 rounded-lg shadow-lg"
      style={{ aspectRatio: "1.8/1" }}
    />
    <h1 className="text-3xl font-bold text-gray-700 mb-2">Welcome to PMS</h1>
    <p className="text-lg text-gray-500">Your hospitality management assistant</p>
  </div>
);

export const DEFAULT_PAGE_SIZE = Number(process.env.REACT_APP_DEFAULT_PAGE_SIZE)

export type Chat = {
  id: string,
  firstName: string,
  lastName: string | undefined,
  username: string | undefined,
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
  displayName: string
}

const menus: MenuItem[] = [{
  path: 'home',
  displayName: 'Home'
},{
  path: 'profit',
  displayName: 'Profit'
}, {
  path: 'invoice',
  displayName: 'Invoice'
}, {
  path: 'expense',
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

// OIDC client config for Keycloak
const oidcConfig = {
  authority: "https://phucsinhhcm.hopto.org/iam/realms/ps_dev",
  client_id: "ps_assistant",
  redirect_uri: window.location.origin + "/",
  post_logout_redirect_uri: window.location.origin,
  response_type: "code",
  scope: "openid profile email organization roles",
  userStore: new WebStorageStateStore({ store: window.localStorage }),
};

const userManager = new UserManager(oidcConfig);

export const getAccessToken = async (): Promise<string | undefined> => {
  const user = await userManager.getUser();
  return user && !user.expired ? user.access_token : undefined;
};

export const App = () => {
  const [chat, setChat] = useState<Chat>(defaultChat);
  const [authorizedUserId, setAuthorizedUserId] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncingRes, setSyncingRes] = useState(false)
  const [activeMenu, setActiveMenu] = useState(menus[0])
  const [configs, setConfigs] = useState<AppConfig>()
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const LOCAL_STATORAGE_SIGNED_IN = 'PS-SIGNED-IN'
  const [oidcUser, setOidcUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<string[]>([]);

  useEffect(() => {
    document.title = "PMS";
    fetchConfig();
  }, []);

  useEffect(() => {
    userManager.getUser().then(user => {
      if (user && !user.expired) {
        setOidcUser(user);
        setChat({
          id: user.profile.sub,
          firstName: user.profile.given_name || "",
          lastName: user.profile.family_name || "",
          username: user.profile.preferred_username || user.profile.email || "",
          email: user.profile.email
        });
        setAuthorizedUserId(user.profile.sub);

        // Store access token in sessionStorage
        if (user.access_token) {
          sessionStorage.setItem('accessToken', user.access_token);
        }

        // Decode id_token and extract scopes
        if (user.access_token) {
          const decoded: any = jwtDecode(user.access_token);
          setRoles(decoded.resource_access[oidcConfig.client_id]?.roles || []);
        }
      } else {
        setOidcUser(null);
        setChat(defaultChat);
        setAuthorizedUserId(null);
        setRoles([]);
        // Remove access token from sessionStorage
        sessionStorage.removeItem('accessToken');
      }
      setLoading(false);
    });

    // Listen for user loaded/unloaded events
    userManager.events.addUserLoaded(user => {
      setOidcUser(user);
      setChat({
        id: user.profile.sub,
        firstName: user.profile.given_name || "",
        lastName: user.profile.family_name || "",
        username: user.profile.preferred_username || user.profile.email || "",
        email: user.profile.email
      });
      setAuthorizedUserId(user.profile.sub);
    });
    userManager.events.addUserUnloaded(() => {
      setOidcUser(null);
      setChat(defaultChat);
      setAuthorizedUserId(null);
    });

    // Handle OIDC redirect callback
    if (window.location.search.includes("code=")) {
      userManager.signinRedirectCallback().then(user => {
        setOidcUser(user);
        setChat({
          id: user.profile.sub,
          firstName: user.profile.given_name || "",
          lastName: user.profile.family_name || "",
          username: user.profile.preferred_username || user.profile.email || "",
          email: user.profile.email
        });
        setAuthorizedUserId(user.profile.sub);
        navigate("/", { replace: true });
      });
    }

    // Cleanup
    return () => {
      userManager.events.removeUserLoaded(() => { });
      userManager.events.removeUserUnloaded(() => { });
    };
    // eslint-disable-next-line
  }, []);

  const fetchConfig = async () => {
    let cfg = await appConfigs()
    setConfigs(cfg)
  }

  const getChat = () => chat ? chat : defaultChat

  const fullName = () => {
    return [chat?.firstName, chat?.lastName].filter(Boolean).join(' ')
  }
  const menuStyle = (m: string) => {
    return m === activeMenu.path ? "px-1 py-1 bg-gray-500 text-center text-amber-900 text-sm font-sans rounded-sm shadow-sm"
      : "px-1 py-1 bg-gray-200 text-center text-amber-900 text-sm font-sans rounded-sm shadow-sm"
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  // If not authenticated, redirect to Keycloak login
  if (!oidcUser) {
    userManager.signinRedirect();
    return <div>Redirecting to login...</div>;
  }

  // Handler to clear chat state and sign out
  const handleSignOut = () => {
    console.log("Signing out...");
    userManager.signoutRedirect().then(() => {
      setChat(defaultChat);
      setAuthorizedUserId(null);
      localStorage.removeItem(LOCAL_STATORAGE_SIGNED_IN);
      setOidcUser(null);
      // Remove access token from sessionStorage on logout
      sessionStorage.removeItem('accessToken');
      navigate("/", { replace: true });
    })
  };

  // Filter menus based on user scopes
  const filteredMenus = roles.length === 0
    ? [menus[0]] // Default to home if no roles
    : menus.filter(menu => roles.includes(menu.path));

  return (
    <div className="flex flex-col relative h-[100dvh] min-h-0 bg-slate-50">
      <div className="mt-2 ml-2 pr-1 w-full flex flex-row items-center space-x-0.5">
        <Link to="/" className="px-1 py-1 bg-gray-200 text-center text-amber-900 text-sm font-sans rounded-sm shadow-sm">
          Home
        </Link>
        {
          filteredMenus.map((menu: MenuItem) => (
            <Link key={menu.path} to={menu.path} className={menuStyle(menu.path)}>
              {menu.displayName}
            </Link>
          ))
        }
        <Link to="settings" className="absolute right-2">
          <IoMdSettings
            className="pointer-events-auto cursor-pointer w-14 h-7"
          />
        </Link>
      </div>
      <Routes>
        <Route path="/" element={<WelcomePage/>} />
        <Route path="profit" element={<ProfitReport activeMenu={() => setActiveMenu(menus[0])} />} />
        <Route path="invoice" element={<InvoiceManager activeMenu={() => setActiveMenu(menus[1])} />} />
        <Route path="invoice/:invoiceId" element={<InvoiceEditor chat={getChat()} displayName={fullName()} authorizedUserId={authorizedUserId} activeMenu={() => setActiveMenu(menus[1])} />} />
        <Route path="expense" element={<ExpenseManager chat={getChat()} displayName={fullName()} authorizedUserId={authorizedUserId} activeMenu={() => setActiveMenu(menus[2])} />} />
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
        <Route path="settings" element={<Settings
          syncing={syncing}
          changeSyncing={(n: boolean) => setSyncing(n)}
          syncingRes={syncingRes}
          changeResSyncing={(n: boolean) => setSyncingRes(n)}
          activeMenu={() => setActiveMenu({ path: 'settings', displayName: 'Settings' })}
        />} />
        <Route
          path="profile"
          element={
            <UserProfile
              userProfile={oidcUser?.profile}
              onSignOut={handleSignOut}
            />
          }
        />
      </Routes>
      {configs?.app.showProfile ?
        <div
          className="absolute top-0 right-0 flex flex-col mt-10 mr-2 bg-neutral-200 p-1 opacity-90 rounded-md shadow-lg cursor-pointer"
          onClick={() => {
            navigate('/profile');
          }}
        >
          <span className="font text-[10px] font-bold text-gray-800 dark:text-white">
            {fullName()}
          </span>
        </div> : null}
    </div>
  );
}
