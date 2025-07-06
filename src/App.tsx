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
import { Welcome } from "./Components/Welcome";

// Add a lotus image to your public folder or assets and use its path here


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
}, {
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
// const oidcConfig = {
//   authority: "https://phucsinhhcm.hopto.org/iam/realms/ps_dev",
//   client_id: "ps_assistant",
//   redirect_uri: window.location.origin + "/",
//   post_logout_redirect_uri: window.location.origin,
//   response_type: "code",
//   scope: "openid profile email organization roles",
//   userStore: new WebStorageStateStore({ store: window.localStorage }),
// };


export const App = () => {
  const [chat, setChat] = useState<Chat>(defaultChat);
  const [authorizedUserId, setAuthorizedUserId] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncingRes, setSyncingRes] = useState(false)

  const [filteredMenus, setFilteredMenus] = useState<MenuItem[]>([menus[0]]); // Default to home menu
  const [activeMenu, setActiveMenu] = useState(menus[0])
  const [configs, setConfigs] = useState<AppConfig>()
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const LOCAL_STATORAGE_SIGNED_IN = 'PS-SIGNED-IN'
  const [oidcUser, setOidcUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);

  // const userManager = new UserManager(oidcConfig);

  const fetchUserProfile = async () => {
    try {
      const rsp = await fetch("https://localhost:8443/assistant/me", { credentials: "include" });
      if (rsp.status === 200) {
        const data = await rsp.json();
        setUserProfile(data);
        setChat({
          id: data.sub,
          firstName: data.given_name || "",
          lastName: data.family_name || "",
          username: data.preferred_username || data.email || "",
          email: data.email
        });
        setAuthorizedUserId(data.sub);
        setRoles(data.roles || []);
      } else {
        setUserProfile(null);
        setChat(defaultChat);
        setAuthorizedUserId(null);
        setRoles([]);
      }
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    document.title = "PMS";
    fetchConfig();
    fetchUserProfile();
  }, []);

  // useEffect(() => {
  //   userManager.getUser().then(user => {
  //     if (user && !user.expired) {
  //       console.log("User loaded: userManager.getUser()");
  //       setOidcUser(user);
  //       setChat({
  //         id: user.profile.sub,
  //         firstName: user.profile.given_name || "",
  //         lastName: user.profile.family_name || "",
  //         username: user.profile.preferred_username || user.profile.email || "",
  //         email: user.profile.email
  //       });
  //       setAuthorizedUserId(user.profile.sub);
  //     } else {
  //       setOidcUser(null);
  //       setChat(defaultChat);
  //       setAuthorizedUserId(null);
  //       setRoles([]);
  //       // Remove access token from sessionStorage
  //       sessionStorage.removeItem('accessToken');
  //     }
  //     setLoading(false);
  //   });

  //   // Listen for user loaded/unloaded events
  //   userManager.events.addUserLoaded(user => {
  //     console.log("User loaded: userManager.events.addUserLoaded");
  //     setOidcUser(user);
  //     setChat({
  //       id: user.profile.sub,
  //       firstName: user.profile.given_name || "",
  //       lastName: user.profile.family_name || "",
  //       username: user.profile.preferred_username || user.profile.email || "",
  //       email: user.profile.email
  //     });
  //     setAuthorizedUserId(user.profile.sub);
  //   });
  //   userManager.events.addUserUnloaded(() => {
  //     setOidcUser(null);
  //     setChat(defaultChat);
  //     setAuthorizedUserId(null);
  //     console.log("User unloaded, resetting chat state");
  //   });

  //   // Handle OIDC redirect callback
  //   if (window.location.search.includes("code=")) {
  //     userManager.signinRedirectCallback().then(user => {
  //       console.log("User loaded after redirect: userManager.signinRedirectCallback");
  //       setOidcUser(user);
  //       setChat({
  //         id: user.profile.sub,
  //         firstName: user.profile.given_name || "",
  //         lastName: user.profile.family_name || "",
  //         username: user.profile.preferred_username || user.profile.email || "",
  //         email: user.profile.email
  //       });
  //       setAuthorizedUserId(user.profile.sub);
  //       navigate("home", { replace: true });
  //     });
  //   }

  //   // Cleanup
  //   return () => {
  //     userManager.events.removeUserLoaded(() => { });
  //     userManager.events.removeUserUnloaded(() => { });
  //   };
  //   // eslint-disable-next-line
  // }, []);

  // useEffect(() => {
  //   if (!oidcUser) {
  //     return;
  //   }
  //   if (oidcUser.access_token) {
  //     sessionStorage.setItem('accessToken', oidcUser.access_token);
  //     const decoded: any = jwtDecode(oidcUser.access_token);
  //     setRoles(decoded.resource_access[oidcConfig.client_id]?.roles || []);
  //   }
  // }, [oidcUser]);

  useEffect(() => {
    filterMenus();
  }, [roles]);

  const filterMenus = () => {
    setFilteredMenus(
      roles.length === 0
        ? [menus[0]] // Default to home if no roles
        : [menus[0], menus.filter(menu => {
          // Check if the menu path matches any of the roles
          return roles.some(role => role.toLowerCase() === menu.path.toLowerCase());
        })].flat()
    );
  }

  const fetchConfig = async () => {
    let cfg = await appConfigs()
    setConfigs(cfg)
  }

  const getChat = () => chat ? chat : defaultChat

    const handleLogin = () => {
    window.location.href = "https://localhost:8443/assistant/login";
  };

  const handleSignOut = () => {
    window.location.href = "https://localhost:8443/assistant/logout";
  };

  const fullName = () => {
    if (oidcUser && oidcUser.profile) {
      return (
        oidcUser.profile.name ||
        [oidcUser.profile.given_name, oidcUser.profile.family_name].filter(Boolean).join(' ') ||
        oidcUser.profile.preferred_username ||
        oidcUser.profile.email ||
        ''
      );
    }
    return '';
  }

  const menuStyle = (m: string) => {
    return m === activeMenu.path ? "px-1 py-1 bg-gray-500 text-center text-amber-900 text-sm font-sans rounded-sm shadow-sm"
      : "px-1 py-1 bg-gray-200 text-center text-amber-900 text-sm font-sans rounded-sm shadow-sm"
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  // Handler to clear chat state and sign out
  // const handleSignOut = () => {
  //   console.log("Signing out...");
  //   userManager.signoutRedirect().then(() => {
  //     setChat(defaultChat);
  //     setAuthorizedUserId(null);
  //     localStorage.removeItem(LOCAL_STATORAGE_SIGNED_IN);
  //     setOidcUser(null);
  //     // Remove access token from sessionStorage on logout
  //     sessionStorage.removeItem('accessToken');
  //     navigate("/home", { replace: true });
  //   })
  // };

  // Filter menus based on user scopes


  return (
    <div className="flex flex-col relative h-[100dvh] min-h-0 bg-slate-50">
      <div className="mt-2 ml-2 pr-1 w-full flex flex-row items-center space-x-0.5">
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
        <Route path="" element={<Welcome activeMenu={() => setActiveMenu(menus[0])} />} />
        <Route path="home" element={<Welcome activeMenu={() => setActiveMenu(menus[0])} />} />
        <Route path="profit" element={<ProfitReport activeMenu={() => setActiveMenu(menus[1])} />} />
        <Route path="invoice" element={<InvoiceManager activeMenu={() => setActiveMenu(menus[2])} />} />
        <Route path="invoice/:invoiceId" element={<InvoiceEditor chat={getChat()} displayName={fullName()} authorizedUserId={authorizedUserId} activeMenu={() => setActiveMenu(menus[2])} />} />
        <Route path="expense" element={<ExpenseManager chat={getChat()} displayName={fullName()} authorizedUserId={authorizedUserId} activeMenu={() => setActiveMenu(menus[3])} />} />
        <Route path="reservation" element={<ReservationManager activeMenu={() => setActiveMenu(menus[4])} />} />
        <Route path="order" element={<OrderManager
          chat={getChat()}
          displayName={fullName()}
          authorizedUserId={authorizedUserId}
          activeMenu={() => setActiveMenu(menus[5])}
          configs={configs}
        />} />
        <Route path="order/:orderId/:staffId"
          element={<OrderEditor
            setChat={(chat: Chat) => setChat(chat)}
            activeMenu={() => setActiveMenu(menus[5])} />}
        />
        <Route path="inventory" element={<Inventory activeMenu={() => setActiveMenu(menus[6])} />} />
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

      <div
        className="absolute top-0 right-0 flex flex-col mt-10 mr-2 bg-neutral-200 p-1 opacity-90 rounded-md shadow-lg cursor-pointer"

      >
        {
          oidcUser ? <span className="font text-[10px] font-bold text-gray-800 dark:text-white"
            onClick={() => {
              navigate('/profile');
            }}>
            {fullName()}
          </span>
            : <span className="font text-[10px] font-bold text-gray-800 dark:text-white"
              onClick={handleLogin}>
              Login
            </span>
        }

      </div>
    </div>
  );
}
