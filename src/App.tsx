import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
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
import { Organization, resolveTenant, setTenant } from "./db/tenant";
import { tenantSwitchable } from "./db/apis";
import { FaBed, FaMoneyBill } from "react-icons/fa";
import { TaxableInvoiceManager } from "./Components/TaxableInvoiceManager";
import { TaxPolicyManager } from "./Components/TaxPolicyManager";
import { ImmigrationRegistrationManager } from "./Components/ImmigrationRegistrationManager";



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

const menuOrder = ['home', 'expense', 'invoice', 'tax', 'tax-policy', 'immigration-registration', 'inventory', 'reservation', 'order', 'profit', 'tour', 'supplier', 'setting', 'room','rate-plan']
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
  tax: {
    path: 'tax',
    displayName: 'Taxable Transaction',
    title: 'Taxable Transaction',
    icon: <FaMoneyBill size={28} />
  },
  'tax-policy': {
    path: 'tax-policy',
    displayName: 'Tax Policy',
    title: 'Tax Policy Management',
    icon: <FaMoneyBill size={28} />
  },
  'immigration-registration': {
    path: 'immigration-registration',
    displayName: 'Immigration',
    title: 'Immigration Registration',
    icon: <FaUserCircle size={28} />
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

type SessionState = 'authenticated' | 'unauthenticated' | 'unknown'

// sessionStorage keys that survive the round trip to the login page within the same tab
const AUTO_LOGIN_AT_KEY = 'pms.autoLoginAt'
const SIGNED_OUT_KEY = 'pms.signedOut'
// Don't auto-redirect to login again within this window, so a failing login can't loop forever
const AUTO_LOGIN_COOLDOWN_MS = 60 * 1000
// Minimum gap between session re-checks when the tab becomes visible again
const SESSION_RECHECK_INTERVAL_MS = 30 * 1000

const readSession = (key: string): string | null => {
  try {
    return sessionStorage.getItem(key)
  } catch {
    return null
  }
}

const writeSession = (key: string, value: string | null) => {
  try {
    value === null ? sessionStorage.removeItem(key) : sessionStorage.setItem(key, value)
  } catch {
    // storage unavailable (private mode, blocked site data) - auto-login simply stays unguarded
  }
}

export const App = () => {
  const [chat, setChat] = useState<Chat>(defaultChat);
  const [authorizedUserId, setAuthorizedUserId] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncingRes, setSyncingRes] = useState(false)

  const [filteredMenus, setFilteredMenus] = useState([menus.home]); // Default to home menu
  const [activeMenu, setActiveMenu] = useState(menus.home)
  const [configs, setConfigs] = useState<AppConfig>()
  const [workDate, setWorkDate] = useState(new Date());
  const navigate = useNavigate();
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [authorities, setAuthorities] = useState<string[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [redirectingToLogin, setRedirectingToLogin] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentTenant, setCurrentTenant] = useState('');
  const lastSessionCheckRef = useRef(0);
  // Backend page that unauthenticated API calls get redirected to
  const AUTH_URL_BASE = `${process.env.REACT_APP_PS_BASE_URL}/oauth2login.html`;
  // Starts the Keycloak login directly, skipping the "Click to Login" page
  const LOGIN_URL = `${process.env.REACT_APP_PS_BASE_URL}/oauth2/authorization/keycloak`;

  const clearUserState = () => {
    setUserProfile(null);
    setChat(defaultChat);
    setAuthorizedUserId(null);
    setAuthorities([]);
    setRoles([]);
  }

  const fetchUserProfile = async (): Promise<SessionState> => {
    lastSessionCheckRef.current = Date.now();
    try {
      const rsp = await getProfile();
      if(rsp.status===200){
        // Check if the request was redirected to the login page
        if (rsp.request.responseURL && rsp.request.responseURL.startsWith(AUTH_URL_BASE)) {
          console.warn("User is not authorized, redirecting to login.");
          clearUserState();
          return 'unauthenticated';
        }
        const profile: any = rsp.data;
        console.info("User profile fetched:", profile);
        if(!profile || typeof profile !== "object"){
          console.warn("No user profile data found");
          return 'unknown';
        }
        writeSession(SIGNED_OUT_KEY, null);
        writeSession(AUTO_LOGIN_AT_KEY, null);
        const memberships: string[] = Array.isArray(profile.organization) ? profile.organization : [];
        const tenant = resolveTenant(memberships);
        setUserProfile(profile);
        setOrganizations(Array.isArray(profile.organizations)
          ? profile.organizations
          : memberships.map(alias => ({ alias, name: alias })));
        setCurrentTenant(tenant);
        setChat({
          id: profile.sub,
          firstName: profile.given_name || "",
          lastName: profile.family_name || "",
          username: profile.preferred_username || profile.email || "",
          email: profile.email,
          iss: profile.iss,
          tenantId: tenant
        });
        setAuthorizedUserId(profile.sub);
        setAuthorities(profile.authorities || []);
        setRoles(profile.roles || []);
        return 'authenticated';
      }
      console.error("Failed to fetch user profile, status:", rsp.status);
      return 'unknown';
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      if (status === 401 || status === 403) {
        clearUserState();
        return 'unauthenticated';
      }
      // Network/offline errors: keep whatever state we have rather than logging the user out
      return 'unknown';
    }
    finally {
      setLoadingProfile(false);
    }
  };

  const redirectToLogin = () => {
    setRedirectingToLogin(true);
    // Return to the current page (not just the origin) once login completes
    window.location.href = `${LOGIN_URL}?redirect_uri=${encodeURIComponent(window.location.href)}`;
  };

  // Silently re-login when the session is gone. Keycloak skips the credential form while its SSO
  // session is alive. Skipped right after an explicit sign-out and throttled to prevent loops.
  const autoLogin = () => {
    if (readSession(SIGNED_OUT_KEY)) {
      return;
    }
    const lastAttempt = Number(readSession(AUTO_LOGIN_AT_KEY) || 0);
    if (Date.now() - lastAttempt < AUTO_LOGIN_COOLDOWN_MS) {
      console.warn("Auto login attempted recently, falling back to the Login button.");
      return;
    }
    writeSession(AUTO_LOGIN_AT_KEY, String(Date.now()));
    redirectToLogin();
  };

  const checkSession = async () => {
    if (await fetchUserProfile() === 'unauthenticated') {
      autoLogin();
    }
  };

  const organizationName = organizations.find(o => o.alias === currentTenant)?.name || currentTenant;
  // Only users in several organizations get somewhere to switch to
  const canSwitchOrganization = tenantSwitchable && organizations.length > 1;

  useEffect(() => {
    document.title = organizationName ? `${organizationName} · PMS` : "PMS";
  }, [organizationName]);

  useEffect(() => {
    fetchConfig();
    checkSession();

    // Mobile browsers freeze background tabs; re-validate the session when the user comes back
    const onVisibilityChange = () => {
      if (document.visibilityState !== 'visible') {
        return;
      }
      if (Date.now() - lastSessionCheckRef.current < SESSION_RECHECK_INTERVAL_MS) {
        return;
      }
      checkSession();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);

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
    // Keep the current route; each page sets its own active menu when it mounts
    setFilteredMenus(fM);
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
    writeSession(SIGNED_OUT_KEY, null);
    redirectToLogin();
  };

  const handleSwitchTenant = (tenant: string) => {
    if (tenant === currentTenant) {
      return;
    }
    setTenant(tenant);
    // Full reload so no page keeps data loaded for the previous organization
    window.location.assign('/home');
  };

  const handleSignOut = () => {
    // Stop the landing page from bouncing straight back into login after sign-out
    writeSession(SIGNED_OUT_KEY, 'true');
    window.location.href = `${process.env.REACT_APP_PS_BASE_URL}/logout?redirect_uri=${encodeURIComponent(window.location.origin)}`;
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

  if (redirectingToLogin || loadingConfig || (loadingProfile && !userProfile)) {
    return (
      <div className="flex flex-col items-center justify-center h-[100dvh] bg-white" role="status" aria-live="polite">
        <div
          className="w-14 h-14 mb-6 rounded-full border-4 border-green-100 border-t-green-700 animate-spin motion-reduce:animate-none"
          aria-hidden="true"
        />
        <div className="text-lg text-gray-600 font-semibold">
            {redirectingToLogin ? "Redirecting to Login..." : loadingConfig ? "Loading Configuration..." : "Fetching User Profile..."}
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
            <>
            {/* Fixed height keeps the menu grid in place whether or not there is a name */}
            <div className="h-7 pt-2 max-w-[55%]">
              {organizationName && (canSwitchOrganization ? (
                <button
                  type="button"
                  className="block max-w-full truncate text-sm font-semibold text-green-900 underline decoration-dotted"
                  title="Switch organization"
                  onClick={() => {
                    setActiveMenu(menus.profile);
                    navigate('/profile');
                  }}
                >
                  {organizationName}
                </button>
              ) : (
                <div className="truncate text-sm font-semibold text-green-900">{organizationName}</div>
              ))}
            </div>
            <div className="mt-28 grid grid-cols-3 grid-rows-2 ">
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
            </>
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
              <div className="flex flex-col min-w-0 max-w-[55%]">
                <span className="text-sm font-semibold text-green-900">{activeMenu.title}</span>
                {organizationName && (
                  <span className="truncate text-xs text-green-700">{organizationName}</span>
                )}
              </div>
            </div>
          )
        }
      </div>
      <Routes>
        <Route path="" element={<Welcome organizationName={organizationName} activeMenu={() => setActiveMenu(menus.home)} />} />
        <Route path="home" element={<Welcome organizationName={organizationName} activeMenu={() => setActiveMenu(menus.home)} />} />
        <Route path="profit" element={<ProfitReport activeMenu={() => setActiveMenu(menus.profit)} />} />
        <Route path="invoice" element={<InvoiceManager
          activeMenu={() => setActiveMenu(menus.invoice)}
          handleUnauthorized={() => handleLogin()}
          hasAuthority={(auth:string) => hasAuthority(auth)}
          workDate={workDate}
          setWorkDate={setWorkDate}
        />} />
        <Route path="invoice-map" element={<InvoiceMap
          activeMenu={() => setActiveMenu(menus.invoice)}
          handleUnauthorized={() => handleLogin()}
          workDate={workDate}
          setWorkDate={setWorkDate}
        />} />
        <Route path="tax" element={<TaxableInvoiceManager
          activeMenu={() => setActiveMenu(menus.tax)}
          handleUnauthorized={() => handleLogin()}
        />} />
        <Route path="tax-policy" element={<TaxPolicyManager
          activeMenu={() => setActiveMenu(menus['tax-policy'])}
          handleUnauthorized={() => handleLogin()}
          hasAuthority={(auth: string) => hasAuthority(auth)}
        />} />
        <Route path="immigration-registration" element={<ImmigrationRegistrationManager
          activeMenu={() => setActiveMenu(menus['immigration-registration'])}
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
              organizations={organizations}
              currentTenant={currentTenant}
              canSwitchTenant={tenantSwitchable}
              onSwitchTenant={handleSwitchTenant}
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
