import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import {
  addNewDepsit,
  addPlayerLogs,
  addQuotesToUser,
  changeUserPassword,
  fetchAllOrdersByUserId,
  getAllSymbols,
  getAssetGroups,
  getColumnsById,
  getDepositsByUser,
  updateOnlineStatus,
  updateUserById,
} from "../helper/firebaseHelpers.js";
import {
  calculateProfit,
  fillArrayWithEmptyRows,
  getAskValue,
  getBidValue,
} from "../helper/helpers.js";
import { faClose, faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { auth, db } from "../firebase";
import { Button, ButtonGroup, Dropdown, Form } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { setAssetGroupsState } from "../redux/slicer/assetGroupsSlicer.js";
import { setDepositsState } from "../redux/slicer/transactionSlicer.js";
import { setOrdersState } from "../redux/slicer/orderSlicer.js";
import { setSymbolsState } from "../redux/slicer/symbolSlicer.js";
import { Tabs, Tab } from "react-bootstrap";
import { toast } from "react-toastify";
import { toastify } from "../helper/toastHelper";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import AccountModal from "./AccountModal.jsx";
import accPlaceholder from "../assets/images/acc-img-placeholder.png";
import AddTradingSymbolModal from "./AddTradingSymbolModal.jsx";
import CancelOrderModal from "./CancelOrderModal";
import DataTable from "react-data-table-component";
import dealsColumns from "./columns/dealsColumns.jsx";
import DelOrderModal from "./DelOrderModal ";
import depositsColumns from "./columns/depositsColumns.jsx";
import EditOrderModal from "./EditOrderModal";
import languages from "../assets/flags/index";
import MessageModal from "./MessageModal";
import moment from "moment";
import React, { useEffect, useState, useCallback } from "react";
import ReportModal from "./ReportModal";
import Select from "react-select";
import SelectColumnsModal from "./SelectColumnsModal.jsx";
import TradingView from "./TradingView.jsx";
import withdrawColumns from "./columns/withdrawColumns.jsx";

export default function HomeRu() {
  const [gameConfigs] = useState(() => {
    const obj = localStorage.getItem("GAME_CONFIGS");
    return obj
      ? JSON.parse(obj)
      : {
          showNewOrderPanel: false,
          tab: "trade",
          activeTab: "",
          tabs: [],
          isReportModalOpen: false,
          showHistoryPanel: false,
        };
  });
  const [tab, setTab] = useState(gameConfigs.tab || "trade");
  const [dealsTab, setDealsTab] = useState("activeTab");
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();
  const dbSymbols = useSelector((state) => state.symbols);
  const [orderData, setOrderData] = useState({
    symbol: null,
    symbolValue: null,
    symbolId: null,
    symbolSettings: null,
    volume: 0,
    sl: null,
    tp: null,
    fee: null,
  });
  const assetGroups = useSelector((state) => state.assetGroups);
  const orders = useSelector((state) => state.orders);
  const deposits = useSelector((state) => state.deposits);
  const [depositModal, setDepositModal] = useState(false);
  const [withdrawlModal, setWithdrawlModal] = useState(false);
  const [depositSuccessModal, setDepositSuccessModal] = useState(false);
  const [withdrawlSuccessModal, setWithdrawlSuccessModal] = useState(false);
  const [passwordShown, setPasswordShown] = useState(false);
  const [activeTab, setActiveTab] = useState(gameConfigs.activeTab || "Gold");
  const [tabs, setTabs] = useState([]);
  const [isHidden, setIsHidden] = useState(false);
  const [showNewOrderPanel, setShowNewOrderPanel] = useState(
    gameConfigs.showNewOrderPanel || false
  );
  const [showHistoryPanel, setShowHistoryPanel] = useState(
    gameConfigs.showHistoryPanel || false
  );
  const [theme, setTheme] = useState(
    () => localStorage.getItem("THEME") || "dark"
  );
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);
  const [isEditable, setIsEditable] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDelModalOpen, setIsDelModalOpen] = useState(false);
  const [showCancelOrderModal, setShowCancelOrderModal] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");
  const [selectedOrder, setSelectedOrder] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [enableOpenPrice, setEnableOpenPrice] = useState(false);
  const [openPriceValue, setOpenPriceValue] = useState(null);
  const [isTradingModal, setIsTradingModal] = useState(false);
  const [dealsRow, setDealsRow] = useState(5);

  const [accTab, setAccTab] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [dealType, setDealType] = useState("Buy");
  const [newPass, setNewPass] = useState("");
  const [pass, setPass] = useState("");
  const [personalInfoTab, setPersonalInfoTab] = useState("personal-info");
  const [showAccountInfo, setShowAccountInfo] = useState(false);
  const [transType, setTransType] = useState("Deposit");

  const [userProfile, setUserProfile] = useState({
    name: "",
    surname: "",
    email: "",
    phone: "",
    country: "",
    city: "",
    comment: "...",
    isUserEdited: false,
    allowTrading: false,
  });
  const [isReportModalOpen, setIsReportModalOpen] = useState(
    gameConfigs.isReportModalOpen || false
  );
  const [messageModal, setMessageModal] = useState({
    show: false,
    title: "",
    message: "",
  });
  const [showColumnsModal, setShowColumnsModal] = useState(false);
  const [showColumns, setShowColumns] = useState({
    id: true,
    date: true,
    symbol: true,
    type: true,
    volume: true,
    openPrice: true,
    sltp: true,
    additionalParameters: true,
    margin: true,
    currentPrice: true,
    profit: true,
    action: true,
  });
  const [showAccountModal, setShowAccountModal] = useState(false);

  const accounts = userProfile.accounts || [];
  const defaultAccount =
    accounts
      .filter((acc) => !acc?.isDeleted)
      ?.find((account) => account.isDefault) || {};

  const accountDeposits = deposits.filter(({ type }) => type !== "Withdraw");
  const accountWithdraws = deposits.filter(({ type }) => type === "Withdraw");

  const handleEditModal = (row) => {
    setSelectedOrder(row);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsDelModalOpen(false);
    setIsTradingModal(false);
    setMessageModal({
      show: false,
      title: "",
      message: "",
    });
  };
  const handleCloseReportModal = () => {
    setIsReportModalOpen(false);
  };
  const handleDelModal = () => {
    setIsDelModalOpen(true);
  };

  const handleCloseBtn = (row) => {
    setSelectedOrder(row);
    row.enableOpenPrice ? setShowCancelOrderModal(true) : handleDelModal();
  };

  const changeLanguage = (lng) => {
    setSelectedLanguage(lng);
    i18n.changeLanguage(lng);
    localStorage.setItem("lang", lng);
  };

  const checkCurrentUser = () => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUserId(user.uid);
      } else {
        signOut(auth)
          .then(() => {
            localStorage.clear();
            window.location.href = "/";
          })
          .catch((error) => {
            console.log("Signout The User Exception");
          });
      }
    });
    return () => unsubscribe();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setUserProfile({
      ...userProfile,
      [name]: value,
    });
  };

  const handleSaveClick = async () => {
    let newProfile = { ...userProfile, isUserEdited: true };
    setIsEditable(false);
    try {
      const user = auth.currentUser;
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, newProfile);
      await addPlayerLogs("Personal information updated", user.uid);
    } catch (error) {
      console.error("Error saving data to Firestore:", error);
    }
  };

  const getUserDataByUID = () => {
    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      const unsubscribe = onSnapshot(userRef, (userDoc) => {
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserProfile({ id: userDoc.id, ...userData });
          console.log(userData.accounts);
        } else {
          console.log("User document does not exist.");
        }
      });
      return unsubscribe;
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const setOrders = useCallback((data) => {
    const mappedOrders = data.map((order) => ({
      ...order,
      sltp: `${+parseFloat(order?.sl)?.toFixed(2) || ""} / ${
        +parseFloat(order?.tp)?.toFixed(2) || ""
      }`,
    }));
    dispatch(setOrdersState(mappedOrders));
  }, []);

  const setDbSymbols = useCallback((data) => {
    dispatch(setSymbolsState(data));
  }, []);

  const setDeposits = useCallback((data) => {
    dispatch(setDepositsState(data));
  }, []);

  const setGroups = useCallback((data) => {
    dispatch(setAssetGroupsState(data));
  }, []);

  useEffect(() => {
    return checkCurrentUser();
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "GAME_CONFIGS",
      JSON.stringify({
        activeTab,
        isReportModalOpen,
        showHistoryPanel,
        showNewOrderPanel,
        tab,
        tabs,
      })
    );
  }, [
    activeTab,
    isReportModalOpen,
    showHistoryPanel,
    showNewOrderPanel,
    tab,
    tabs,
  ]);

  useEffect(() => {
    if (!dbSymbols.length) return;
    if (!orderData.symbol) {
      setTabs(
        gameConfigs?.tabs?.length ? gameConfigs.tabs : [dbSymbols[0]?.symbol]
      );
      if (gameConfigs.activeTab)
        getValue({
          value: gameConfigs.activeTab,
          label: gameConfigs.activeTab,
        });
      else
        getValue({
          value: dbSymbols[0]?.symbol,
          label: dbSymbols[0]?.symbol,
        });
    } else {
      getValue(orderData.symbol);
    }
  }, [dbSymbols.length]);

  useEffect(() => {
    if (!currentUserId) return;

    const unsubUserData = getUserDataByUID();
    const unsubOrderData = fetchAllOrdersByUserId(
      auth.currentUser.uid,
      setOrders
    );

    if (!dbSymbols.length) getAllSymbols(setDbSymbols);

    const unsubDeposits = getDepositsByUser(currentUserId, setDeposits);

    getColumnsById(currentUserId, setShowColumns);

    const unSubGroup = getAssetGroups(setGroups);

    return () => {
      unsubUserData();
      if (unsubOrderData) unsubOrderData();
      unsubDeposits();
      unSubGroup();
    };
  }, [currentUserId]);

  const hanldeLogout = async () => {
    await updateOnlineStatus(currentUserId, false);
    await addPlayerLogs("Logged out", currentUserId);
    await signOut(auth)
      .then(async () => {
        localStorage.clear();
        // window.location.href = "/";
      })
      .catch((error) => {
        console.log("Error", error);
      });
  };

  const handleDeleteAsset = async (asset) => {
    const newAssets = userProfile?.quotes.filter((quote) => quote !== asset);
    const res = await addQuotesToUser(currentUserId, newAssets);
    if (!res) {
      toast.error("Failed to delete symbol");
    } else {
      toast.success("Symbol deleted successfully");
    }
  };

  const customStylesAssetsTable = {
    table: {
      style: {
        backgroundColor: "var(--main-secondary-color) !important",
      },
    },
    headCells: {
      style: {
        fontSize: "1rem",
        fontWeight: "600",
        color: "var(--main-primary-button)",
      },
    },
    rows: {
      style: {
        "*": { backgroundColor: "unset", color: "unset" },
        fontSize: "0.9rem",
        minHeight: "26px !important",
        userSelect: "none",
      },
    },
  };

  const customStylesOnDeals = {
    headCells: {
      style: { color: "inherit", fontSize: "1rem", fontWeight: "600" },
    },
    headRow: { style: { color: "var(--main-primary-button)" } },
    pagination: {
      style: {
        fontSize: "1rem",
        height: "min-content",
        minHeight: "min-content",
      },
    },
    rows: { style: { fontSize: "0.9rem", minHeight: "26px !important" } },
    table: {
      style: { backgroundColor: "var(--main-secondary-color) !important" },
    },
  };

  const conditionalRowStylesOnOrders = [
    {
      when: (row) => row && row.id === selectedOrder.id,
      style: {
        backgroundColor: "var(--main-primary-button)",
        color: "var(--main-text-color)",
      },
    },
  ];

  const handleRowDoubleClick = (row) => {
    if (!row) return;
    openNewChartTab(row.symbol);
    getValue({
      value: row.symbol,
      label: row.symbol,
    });
    if (!showNewOrderPanel) setShowNewOrderPanel(true);
  };

  const handleDoubleClickOnOrders = (row, e) => {
    if (!row) return;
    setSelectedOrder(row);
    openNewChartTab(row.symbol);
    getValue({
      value: row.symbol,
      label: row.symbol,
    });
  };

  const openNewChartTab = (newTab) => {
    const findTab = tabs.find((tab) => tab === newTab);
    if (!findTab) {
      const _tabs = [...tabs, newTab];
      setTabs(_tabs);
    }
    setActiveTab(newTab);
  };

  const [quoteSearch, setQuoteSearch] = useState("");

  const userQuotes = userProfile?.quotes || [];
  const userQuotesSymbols = userQuotes
    .map((q) => dbSymbols.find(({ id }) => id === q))
    .filter((s) => s);
  const filteredQuotesSymbols = quoteSearch
    ? userQuotesSymbols.filter(({ symbol }) =>
        symbol.toUpperCase().includes(quoteSearch.toUpperCase())
      )
    : userQuotesSymbols;

  // const crypto = [],
  //   currencies = [],
  //   stocks = [],
  //   commodities = [];
  // filteredQuotesSymbols.forEach((s) => {
  //   if (s?.settings?.group === "crypto" || !s?.settings) crypto.push(s);
  //   else if (s?.settings?.group === "currencies") currencies.push(s);
  //   else if (s?.settings?.group === "stocks") stocks.push(s);
  //   else if (s?.settings?.group === "commodities") commodities.push(s);
  // });

  const assetsColumns = [
    {
      name: t("symbol"),
      selector: (row) => (
        <div
          title={row?.settings?.description}
          onDoubleClick={() => handleRowDoubleClick(row)}
        >
          {row.symbol}
        </div>
      ),
      sortable: true,
    },
    {
      name: t("bid"),
      selector: (row) => {
        if (!row) return;
        const { settings } = row;
        const isDirectPrice = settings?.bidSpreadUnit === "$";
        const bidValue = getBidValue(
          row.price,
          settings.bidSpread,
          isDirectPrice
        );
        return (
          <div
            onDoubleClick={() => handleRowDoubleClick(row)}
            title={row?.settings?.description}
          >
            {settings?.group === "currencies"
              ? +parseFloat(bidValue)?.toFixed(6)
              : +parseFloat(bidValue)?.toFixed(2)}
          </div>
        );
      },
      sortable: true,
      compact: true,
    },
    {
      name: t("ask"),
      selector: (row) => {
        if (!row) return;
        const { settings } = row;
        const isDirectPrice = settings.askSpreadUnit === "$";
        const askValue = getAskValue(
          row.price,
          settings.askSpread,
          isDirectPrice
        );
        return (
          <div
            onDoubleClick={() => handleRowDoubleClick(row)}
            title={row?.settings?.description}
          >
            {settings?.group === "currencies"
              ? +parseFloat(askValue)?.toFixed(6)
              : +parseFloat(askValue)?.toFixed(2)}
          </div>
        );
      },
      sortable: true,
      compact: true,
    },
    {
      name: "",
      selector: (row) =>
        row && (
          <div
            onDoubleClick={() => handleRowDoubleClick(row)}
            title={row?.settings?.description}
          >
            <FontAwesomeIcon
              className="ms-1 p-2 rounded"
              icon={faClose}
              id="assetDeleteIcon"
              onClick={() => handleDeleteAsset(row.id)}
              title="Delete"
            />
          </div>
        ),
      compact: true,
      minWidth: "40px",
    },
  ];

  const conditionalRowStyles = [
    {
      when: (row) => row && row.symbol === orderData?.symbol?.value,
      style: {
        backgroundColor: "var(--main-primary-button)",
        color: "var(--main-text-color)",
      },
    },
    {
      when: (row) => !row || row.symbol !== orderData?.symbol?.value,
      style: {
        backgroundColor: "inherit",
        color: theme === "dark" ? "#fff" : "unset",
      },
    },
  ];

  const openOrderHistory = () => {
    setShowHistoryPanel((p) => !p);
    if (showNewOrderPanel) setShowNewOrderPanel(false);
  };

  const openOrderPanel = () => {
    if (showHistoryPanel) setShowHistoryPanel(false);
    setShowNewOrderPanel((p) => !p);
  };

  const getValue = (s) => {
    if (!s) return toast.error("No symbol");
    const symbol = dbSymbols?.find((el) => el.symbol === s.value);
    if (!symbol) return;
    const { fee = 0, feeUnit } = symbol.settings;
    const symbolFee = feeUnit === "$" ? fee : (symbol?.price / 100) * fee;
    setOrderData({
      ...orderData,
      symbol: s,
      symbolId: symbol.id,
      symbolValue: symbol?.price,
      symbolSettings: symbol?.settings,
      fee: symbolFee,
    });
  };

  const calculateTotalSum = () => {
    let sum = 0.0;
    const settings = orderData?.symbolSettings || {};
    const leverage = userProfile?.settings?.leverage || 1;
    const lot = settings.group === "commodities" ? +settings.lot || 1 : 1;
    if (orderData.symbol) {
      if (orderData.volume) {
        if (enableOpenPrice) {
          sum = orderData.volume * lot * openPriceValue;
        } else {
          sum = orderData.volume * lot * orderData.symbolValue;
        }
      }
    }
    const maintenanceMargin = settings.maintenanceMargin;
    if (leverage > 1 && maintenanceMargin > 0) {
      return (sum / leverage) * (maintenanceMargin / 100);
    }
    return +parseFloat(sum)?.toFixed(6);
  };
  const calculatedSum = calculateTotalSum();

  const checkClosedMarketStatus = (t) => {
    const group = assetGroups.find((g) => g.title === t);
    if (!group) return false;
    return group.closedMarket;
  };

  const placeOrder = async (e, type) => {
    e.preventDefault();
    if (!defaultAccount)
      return setMessageModal({
        show: true,
        title: "Error",
        message: "You need to create an account number to start trading",
      });

    const minDealSum = userProfile?.settings?.minDealSum;
    const maxDeals = userProfile?.settings?.maxDeals;

    if (!userProfile?.allowTrading)
      return toast.error("Trading is disabled for you.");
    if (pendingOrders.length >= maxDeals)
      return toast.error(`You can open maximum ${maxDeals} deals`);
    if (!orderData.symbol) return toast.error("Symbol is missing.");
    if (!orderData.volume || orderData.volume <= 0)
      return toast.error("Volume should be greater than 0.");
    if (calculatedSum < minDealSum)
      return toast.error(`The minimum deal sum is ${minDealSum} USDT`);
    if (calculatedSum > freeMargin) {
      return setMessageModal({
        show: true,
        title: "Error",
        message: "Not enough money to cover the Maintenance margin",
      });
    }

    const {
      bidSpread,
      bidSpreadUnit,
      askSpread,
      askSpreadUnit,
      fee,
      feeUnit,
      contractSize,
      group,
      closedMarket,
      maintenanceMargin,
      lot,
    } = orderData.symbolSettings;

    const volume =
      group === "commodities" && +lot >= 1
        ? +orderData.volume * +lot
        : +orderData.volume;

    if (
      (group === "commodities" && !closedMarket) ||
      (checkClosedMarketStatus(group) && !closedMarket)
    ) {
      const today = moment().utc();
      const weekDay = today.weekday();
      const hour = today.hour();
      if (weekDay === 0 || weekDay === 6 || hour < 9 || hour >= 23) {
        return toast.error(
          `${
            group === "commodities" ? "Commodities" : group
          } Market open on Mon-Fri: 9AM-23PM`
        );
      }
    }

    if (calculatedSum > contractSize) {
      return toast.error(
        `Cannot open deal greater than ${contractSize}$ for this symbol`
      );
    }

    let closedPrice =
      type === "Buy"
        ? getBidValue(orderData.symbolValue, bidSpread, bidSpreadUnit === "$")
        : getAskValue(orderData.symbolValue, askSpread, askSpreadUnit === "$");

    closedPrice =
      group === "currencies"
        ? +parseFloat(closedPrice)?.toFixed(6)
        : +parseFloat(closedPrice)?.toFixed(2);

    if (
      type === "Buy" &&
      ((orderData.sl && orderData.sl >= closedPrice) ||
        (orderData.tp && orderData.tp <= orderData.symbolValue))
    ) {
      return toast.error(
        "To Buy SL should be less than the bid value and TP should be greater than the current value"
      );
    } else if (
      type === "Sell" &&
      ((orderData.sl && orderData.sl <= closedPrice) ||
        (orderData.tp && orderData.tp >= orderData.symbolValue))
    ) {
      return toast.error(
        "To Sell SL should be greater than the ask value and TP should be less than the current value"
      );
    }

    let spread;
    if (type === "Buy") {
      spread =
        bidSpreadUnit === "$"
          ? volume * bidSpread
          : volume * orderData.symbolValue * (bidSpread / 100);
    } else {
      spread =
        askSpreadUnit === "$"
          ? volume * askSpread
          : volume * orderData.symbolValue * (askSpread / 100);
    }

    let feeValue =
      feeUnit === "$" ? parseFloat(fee) : (calculatedSum / 100) * fee;
    feeValue = +parseFloat(feeValue)?.toFixed(6);

    let profit =
      calculateProfit(type, closedPrice, orderData.symbolValue, volume) -
      feeValue;

    const leverage = userProfile?.settings?.leverage;
    if (leverage > 1 && maintenanceMargin > 0) {
      profit = (profit / leverage) * (maintenanceMargin / 100);
    }

    const form = document.getElementById("newOrderForm");

    const user = auth.currentUser;
    const userId = user.uid;

    const ordersCollectionRef = collection(db, "orders");

    const formattedDate = new Date().toLocaleDateString("en-US");
    const dealPayload = {
      ...orderData,
      userId,
      type,
      status: "Pending",
      profit:
        group === "currencies"
          ? +parseFloat(profit).toFixed(6)
          : +parseFloat(profit).toFixed(2),
      currentPrice: closedPrice,
      currentMarketPrice: parseFloat(orderData?.symbolValue),
      symbol: orderData?.symbol.value,
      volume,
      sum: calculatedSum,
      fee: feeValue,
      swap: 0,
      account_no: defaultAccount?.account_no,
      spread,
      enableOpenPrice,
      createdAt: formattedDate,
      createdTime: serverTimestamp(),
    };
    delete dealPayload.symbolSettings;

    if (enableOpenPrice) {
      dealPayload.symbolValue = openPriceValue;
      dealPayload.profit = 0;
    }

    const userPayload = {
      accounts: userProfile.accounts?.map((ac) => {
        if (ac.account_no !== defaultAccount?.account_no) return ac;
        return {
          ...ac,
          totalBalance: parseFloat(ac.totalBalance - feeValue - spread),
          totalMargin: +totalMargin + +calculatedSum,
          activeOrdersProfit: +activeOrdersProfit + +dealPayload.profit,
        };
      }),
    };

    if (
      allowBonus &&
      calculatedSum > freeMargin - bonus &&
      userPayload.totalBalance < 0
    ) {
      const spentBonus = Math.abs(userPayload.totalBalance);
      if (bonus < spentBonus) {
        return setMessageModal({
          show: true,
          title: "Error",
          message: "Not enough bonus to cover the deal fee",
        });
      }
      userPayload.totalBalance = userPayload.totalBalance + spentBonus;
      userPayload.bonus = +parseFloat(bonus - spentBonus)?.toFixed(2);
      userPayload.bonusSpent = +parseFloat(bonusSpent + spentBonus)?.toFixed(2);
    }

    try {
      console.log("dealPayload", dealPayload);
      await addDoc(ordersCollectionRef, dealPayload);
      await updateUserById(currentUserId, userPayload);
      toastify("Order added to Database", "success");
      await addPlayerLogs(`Opened new deal: ${type}`, currentUserId);
      form.reset();
    } catch (error) {
      console.error("Error adding order: ", error);
    }
  };

  const handleTradingModal = () => {
    setIsTradingModal(true);
  };

  const pendingOrders = orders.filter(
    (order) =>
      order.status === "Pending" &&
      order.account_no === defaultAccount?.account_no
  );

  const activeOrders = pendingOrders.filter((order) => !order.enableOpenPrice);
  const delayedOrders = pendingOrders.filter((order) => order.enableOpenPrice);

  const activeOrdersProfit =
    parseFloat(defaultAccount?.activeOrdersProfit) || 0;
  const activeOrdersSwap = parseFloat(defaultAccount?.activeOrdersSwap) || 0;

  const bonus = parseFloat(defaultAccount?.bonus);
  const bonusSpent = parseFloat(defaultAccount?.bonusSpent) || 0;
  const allowBonus = userProfile?.settings?.allowBonus;

  const calculateEquity = () => {
    let equity =
      parseFloat(defaultAccount?.totalBalance) +
      activeOrdersProfit -
      activeOrdersSwap;
    if (allowBonus) equity += bonus;
    return equity;
  };

  const equity = calculateEquity();

  const calculateFreeMargin = () => {
    const dealSum = pendingOrders.reduce((p, v) => p + +v.sum, 0);
    return equity - dealSum;
  };

  const freeMargin = calculateFreeMargin();

  const totalMargin = parseFloat(defaultAccount?.totalMargin);

  const userLevel = parseFloat(userProfile?.settings?.level) || 100;
  const level =
    totalMargin > 0 ? (equity / totalMargin) * (userLevel / 100) : 0;

  const totalBalance = freeMargin + totalMargin + bonus;

  const handleAccountChange = async (e) => {
    const updatedAccounts = userProfile?.accounts?.map((account) => ({
      ...account,
      isDefault: e.value === account.account_no,
    }));

    try {
      await updateUserById(userProfile.id, { accounts: updatedAccounts });
    } catch (error) {
      console.error("Error updating user profile:", error);
    }
  };

  // useEffect(() => {
  //   if (isHidden) return;
  //   const maxHeightPercentage = 92;
  //   const minHeightPercentage = 58.5;
  //   const ordersDiv = document.getElementById("orders");
  //   const resizeBar = document.getElementById("resize-bar");
  //   const tradeDiv = document.getElementById("trade");
  //   const handleMouseDown = (e) => {
  //     e.preventDefault();
  //     document.addEventListener("mousemove", handleMouseMove);
  //     document.addEventListener("mouseup", handleMouseUp);
  //   };
  //   const handleMouseMove = (e) => {
  //     const windowHeight = window.innerHeight;
  //     let currentHeightPercentage = (e.clientY / windowHeight) * 100;
  //     currentHeightPercentage = Math.min(
  //       currentHeightPercentage,
  //       maxHeightPercentage
  //     );
  //     currentHeightPercentage = Math.max(
  //       currentHeightPercentage,
  //       minHeightPercentage
  //     );
  //     tradeDiv.style.height = `${currentHeightPercentage}%`;
  //     ordersDiv.style.height = `${96 - currentHeightPercentage}%`;
  //     let rows = 5;
  //     if (currentHeightPercentage > 58.5) rows = 4;
  //     if (currentHeightPercentage > 60) rows = 3;
  //     if (currentHeightPercentage > 65) rows = 2;
  //     if (currentHeightPercentage > 70) rows = 1;
  //     if (currentHeightPercentage > 75) {
  //       setIsHidden(true);
  //       ordersDiv.style.height = "4%";
  //       tradeDiv.style.height = "92%";
  //       rows = 5;
  //       handleMouseUp();
  //     }
  //     setDealsRow(rows);
  //   };
  //   const handleMouseUp = () => {
  //     document.removeEventListener("mousemove", handleMouseMove);
  //     document.removeEventListener("mouseup", handleMouseUp);
  //   };
  //   resizeBar.addEventListener("mousedown", handleMouseDown);
  //   return () => {
  //     resizeBar.removeEventListener("mousedown", handleMouseDown);
  //   };
  // }, [isHidden]);

  const changeTheme = (t) => {
    const root = document.querySelector("html");
    root.classList.remove(theme);
    if (t !== "dark") root.classList.add(t);
    setTheme(t);
    localStorage.setItem("THEME", t);
  };

  useEffect(() => {
    if (tab !== "account") {
      setAccTab("");
      return;
    }
    if (accTab === "") setAccTab("acc-info");
  }, [accTab, tab]);

  const handleChangePass = async () => {
    setIsLoading(true);
    if (newPass === confirmPass) {
      changeUserPassword(pass, newPass);
      setConfirmPass("");
      setNewPass("");
      setPass("");
      setIsLoading(false);
    } else {
      toastify("Password doesn't match");
      setIsLoading(false);
    }
  };

  const [depositData, setDepositData] = useState({
    account_no: "",
    amount: "",
    method: "VISA",
  });

  const [withdrawData, setWithdrawData] = useState({
    account_no: "",
    amount: "",
    card: "",
    method: "VISA",
    phone_no: "",
  });

  const handleDepositWithdraw = async (type) => {
    setIsLoading(true);
    let data = {
      comment: "",
      desk: "",
      manager: userProfile.manager || "",
      player: userProfile.name,
      status: "Pending",
      team: "",
      type: type,
      userId: userProfile.id,
    };
    if (type === "Deposit") {
      if (depositData.account_no === "" || depositData.amount === "") {
        toastify("Fill are the required fields");
        setIsLoading(false);
        return;
      }
      data = {
        ...data,
        account_no: depositData.account_no,
        method: depositData.method,
        sum: depositData.amount,
      };
    } else {
      if (
        withdrawData.account_no === "" ||
        withdrawData.amount === "" ||
        withdrawData.card === "" ||
        withdrawData.phone_no === ""
      ) {
        toastify("Fill are the required fields");
        return;
      }
      data = {
        ...data,
        account_no: withdrawData.account_no,
        card: withdrawData.card,
        method: withdrawData.method,
        phone_no: withdrawData.phone_no,
        sum: withdrawData.amount,
      };
    }
    try {
      await addNewDepsit(data);
      if (type === "Deposit") {
        setDepositModal(false);
        setDepositSuccessModal(true);
        setDepositData({
          account_no: "",
          amount: "",
          method: "VISA",
        });
      } else {
        setWithdrawlModal(false);
        setWithdrawlSuccessModal(true);
        setWithdrawData({
          account_no: "",
          amount: "",
          card: "",
          method: "VISA",
          phone_no: "",
        });
      }
    } catch (error) {
      console.log("🚀 -> handleDepositWithdraw -> error:", error);
      toastify(`Failed ${type} request`);
    }
    setIsLoading(false);
  };

  const [showNewOrderPageMobile, setShowNewOrderPageMobile] = useState(false);
  const [showAccounManagement, setShowAccounManagement] = useState(false);

  const [isMobileUI, setIsMobileUI] = useState(false);
  window
    .matchMedia("(max-width: 768px)")
    .addEventListener("change", (event) => {
      if (event.matches) {
        setIsMobileUI(true);
      } else {
        setIsMobileUI(false);
      }
    });
  useEffect(() => {
    if (window.matchMedia("(max-width: 768px)").matches) {
      setIsMobileUI(true);
    } else {
      setIsMobileUI(false);
    }
  }, []);

  useEffect(() => {
    const tradeDiv = document.getElementById("trade");
    if (!isMobileUI) {
      tradeDiv.style.cssText = "height:60%;";
      tradeDiv.style.removeProperty("border-radius");
      tradeDiv.style.removeProperty("padding");
      return;
    }
    if (showNewOrderPanel) {
      tradeDiv.style.cssText =
        "border-radius:5px;height:65%!important;padding:20px;";
    } else if (tab === "assets") {
      tradeDiv.style.cssText =
        "border-radius:5px;height:65%!important;padding:unset;";
    } else {
      tradeDiv.style.cssText =
        "border-radius:5px 5px 0 0;height:auto!important;padding:unset;";
    }
  }, [isMobileUI, showNewOrderPanel, tab]);

  return (
    <>
      <div id="header">
        <div id="logo" className="hide-on-mobile"></div>
        <div id="header-info">
          <div id="balance">
            <div className="help-box">
              <a href="" className="">
                <svg
                  height="26"
                  style={{
                    backgroundColor: "transparent",
                    fill:
                      tab === "help"
                        ? "var(--main-primary-button)"
                        : theme === "purple"
                        ? "var(--separator-line-color)"
                        : "var(--main-text-color)",
                  }}
                  viewBox="0 0 26 26"
                  width="26"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M13 0C5.81491 0 0 5.81425 0 13C0 20.185 5.81425 26 13 26C20.1851 26 26 20.1857 26 13C26 5.81491 20.1857 0 13 0ZM12.6153 19.0846C11.8795 19.0846 11.3148 18.4685 11.3148 17.7669C11.3148 17.0482 11.8966 16.4493 12.6153 16.4493C13.3341 16.4493 13.9329 17.0482 13.9329 17.7669C13.9329 18.4685 13.3511 19.0846 12.6153 19.0846ZM14.566 12.428C13.6249 13.1638 13.6077 13.6772 13.6077 14.567C13.6077 14.8922 13.4366 15.2686 12.5982 15.2686C11.8965 15.2686 11.657 15.0119 11.657 14.1221C11.657 12.6505 12.3073 11.9489 12.8035 11.5211C13.3682 11.0419 14.3265 10.5115 14.3265 9.5875C14.3265 8.80029 13.642 8.42385 12.7864 8.42385C11.041 8.42385 11.4175 9.74152 10.4934 9.74152C10.0314 9.74152 9.46669 9.43343 9.46669 8.76611C9.46669 7.8421 10.5276 6.47309 12.8378 6.47309C15.0281 6.47309 16.4826 7.68808 16.4826 9.29657C16.4826 10.9051 15.0281 12.0687 14.566 12.428Z" />
                </svg>
              </a>
            </div>
            <div className="page-title">
              <p className="">
                {showNewOrderPageMobile ? t("portfolio") : t(tab)}
              </p>
            </div>
            <div className="balance-item hide-on-mobile">
              <h2 className="balance-title">{t("equity")}:</h2>
              <input
                className={`balance-nums ${
                  equity < 0 ? "text-danger" : equity === 0 ? "text-muted" : ""
                }`}
                readOnly={true}
                type="number"
                value={+parseFloat(equity)?.toFixed(2)}
              />
            </div>
            <div className="balance-item hide-on-mobile">
              <h2 className="balance-title">{t("profit")}:</h2>
              <input
                className={`balance-nums ${
                  activeOrdersProfit < 0
                    ? "text-danger"
                    : activeOrdersProfit === 0
                    ? "text-muted"
                    : ""
                }`}
                readOnly={true}
                type="number"
                value={+parseFloat(activeOrdersProfit)?.toFixed(2)}
              />
            </div>
            <div className="balance-item hide-on-mobile">
              <h2 className="balance-title">{t("freeMargin")}:</h2>
              <input
                className={`balance-nums ${
                  freeMargin < 0
                    ? "text-danger"
                    : freeMargin === 0
                    ? "text-muted"
                    : ""
                }`}
                readOnly={true}
                type="number"
                value={+parseFloat(freeMargin)?.toFixed(2)}
              />
            </div>
            <div className="balance-item hide-on-mobile">
              <h2 className="balance-title">{t("margin")}:</h2>
              <input
                className={`balance-nums ${
                  totalMargin < 0
                    ? "text-danger"
                    : totalMargin === 0
                    ? "text-muted"
                    : ""
                }`}
                readOnly={true}
                type="number"
                value={+parseFloat(totalMargin)?.toFixed(2)}
              />
            </div>
            <div className="balance-item hide-on-mobile">
              <h2 className="balance-title">{t("level")}:</h2>
              <input
                className={`balance-nums ${
                  level < 0 ? "text-danger" : level === 0 ? "text-muted" : ""
                }`}
                readOnly={true}
                type="text"
                value={`${+parseFloat(level)?.toFixed(2)}%`}
              />
            </div>
            <div className="balance-item" id="balance-item-lang">
              <div
                className="flag_theme hide-on-mobile"
                style={{
                  backgroundColor: "var(--main-secondary-color)",
                  margin: "0",
                }}
              >
                <Dropdown
                  style={{ backgroundColor: "var(--main-secondary-color)" }}
                >
                  <Dropdown.Toggle className="flag_toggle" variant="">
                    <img
                      alt={selectedLanguage}
                      height="auto"
                      src={languages[selectedLanguage]}
                      width={36}
                    />
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    {Object.keys(languages)
                      .filter((lng) => lng !== selectedLanguage)
                      .map((lng, i) => (
                        <Dropdown.Item
                          key={i}
                          onClick={() => changeLanguage(lng)}
                        >
                          <img
                            alt={lng}
                            height="auto"
                            src={languages[lng]}
                            width={40}
                          />
                        </Dropdown.Item>
                      ))}
                  </Dropdown.Menu>
                </Dropdown>
                <svg
                  height="36"
                  style={{ stroke: "var(--separator-line-color)" }}
                  viewBox="0 0 1 44"
                  width="1"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <line
                    opacity="0.61"
                    x1="0.5"
                    x2="0.499998"
                    y1="2.18557e-08"
                    y2="44"
                  />
                </svg>
                <Dropdown
                  style={{ backgroundColor: "var(--main-secondary-color)" }}
                >
                  <Dropdown.Toggle className="theme_toggle" variant="">
                    <svg
                      height="25"
                      style={{
                        backgroundColor: "var(--main-secondary-color)",
                        fill: "var(--main-primary-button)",
                      }}
                      viewBox="0 0 25 25"
                      width="25"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M11.7131 12.9069C12.1237 13.3002 12.6132 13.6085 13.1517 13.813C13.6902 14.0175 14.2663 14.1138 14.8447 14.096C14.495 14.6511 13.9715 15.0849 13.3498 15.3347C12.728 15.5845 12.0401 15.6375 11.385 15.4861C10.73 15.3348 10.1418 14.9868 9.70502 14.4923C9.26827 13.9978 9.00558 13.3824 8.95482 12.7347C8.89448 12.1773 8.99787 11.6147 9.25321 11.1112C9.50854 10.6077 9.90553 10.1836 10.3989 9.8872C10.3936 10.4503 10.5074 11.0084 10.7333 11.5276C10.9593 12.0468 11.2927 12.5162 11.7131 12.9069ZM20.1007 12.5001C20.1016 13.5122 19.8956 14.5145 19.4944 15.4497C19.0932 16.3848 18.5047 17.2346 17.7626 17.9502C17.0204 18.6658 16.1392 19.2333 15.1694 19.6202C14.1996 20.0071 13.1602 20.2057 12.1107 20.2048C1.51017 19.8051 1.51017 5.19512 12.1107 4.79546C13.1602 4.79455 14.1996 4.99323 15.1694 5.3801C16.1392 5.76698 17.0204 6.33447 17.7626 7.05009C18.5047 7.76572 19.0932 8.61544 19.4944 9.55062C19.8956 10.4858 20.1016 11.4881 20.1007 12.5001ZM17.2963 13.1805C17.3132 13.0305 17.289 12.879 17.2262 12.7409C17.1634 12.6028 17.0641 12.483 16.9382 12.3935C16.8123 12.304 16.6643 12.2479 16.509 12.2308C16.3536 12.2137 16.1963 12.2362 16.0527 12.2961C15.5323 12.5244 14.9514 12.5922 14.3894 12.4903C13.8275 12.3883 13.3119 12.1214 12.9132 11.7262C12.4915 11.3479 12.201 10.8535 12.0811 10.3103C11.9612 9.76707 12.0177 9.20142 12.243 8.69028C12.3023 8.54947 12.3219 8.39601 12.2997 8.24553C12.2775 8.09505 12.2143 7.95293 12.1166 7.83366C12.0189 7.71439 11.8902 7.62223 11.7435 7.56656C11.5968 7.5109 11.4375 7.49372 11.2817 7.51679C9.98028 7.70298 8.8024 8.36306 7.99038 9.36122C7.17836 10.3594 6.79396 11.6197 6.91628 12.8828C7.32902 18.6298 16.1527 19.3971 17.2963 13.1805ZM12.9926 3.00531V1.67241C12.9891 1.44904 12.8947 1.23594 12.7297 1.07915C12.5647 0.922363 12.3423 0.834473 12.1107 0.834473C11.879 0.834473 11.6566 0.922363 11.4916 1.07915C11.3266 1.23594 11.2322 1.44904 11.2288 1.67241V3.00528C11.2322 3.22865 11.3266 3.44175 11.4916 3.59854C11.6566 3.75533 11.879 3.84323 12.1106 3.84323C12.3423 3.84324 12.5647 3.75535 12.7297 3.59856C12.8947 3.44178 12.9891 3.22868 12.9926 3.00531ZM12.9926 23.3279V21.995C12.9891 21.7716 12.8947 21.5585 12.7297 21.4017C12.5647 21.2449 12.3423 21.157 12.1107 21.157C11.879 21.157 11.6566 21.2449 11.4916 21.4017C11.3266 21.5585 11.2322 21.7716 11.2288 21.995V23.3278C11.2322 23.5512 11.3266 23.7643 11.4916 23.9211C11.6566 24.0779 11.879 24.1658 12.1106 24.1658C12.3423 24.1658 12.5647 24.0779 12.7297 23.9211C12.8947 23.7643 12.9891 23.5512 12.9926 23.3279ZM19.6968 6.38701L20.6743 5.44525C20.8339 5.28465 20.9218 5.07016 20.9194 4.84777C20.9169 4.62537 20.8242 4.41275 20.6611 4.25549C20.498 4.09822 20.2775 4.00882 20.0468 4.00644C19.8162 4.00407 19.5938 4.0889 19.4272 4.24277L18.4498 5.18448C18.29 5.34505 18.2019 5.5596 18.2043 5.78209C18.2067 6.00459 18.2994 6.21732 18.4626 6.37466C18.6258 6.53199 18.8464 6.62141 19.0771 6.62372C19.3078 6.62603 19.5303 6.54105 19.6968 6.38701ZM4.79405 20.7576L5.77155 19.8158C5.93143 19.6552 6.01966 19.4407 6.01731 19.2181C6.01496 18.9955 5.92222 18.7827 5.759 18.6253C5.59577 18.4679 5.37506 18.3785 5.14425 18.3763C4.91343 18.374 4.6909 18.4591 4.52442 18.6133L3.54695 19.555C3.38703 19.7156 3.29875 19.9302 3.30107 20.1528C3.30339 20.3754 3.39612 20.5882 3.55936 20.7456C3.7226 20.903 3.94334 20.9924 4.17418 20.9947C4.40503 20.9969 4.62757 20.9118 4.79405 20.7576ZM24.2213 12.5001C24.2214 12.3885 24.1986 12.2779 24.1543 12.1747C24.11 12.0715 24.045 11.9777 23.9631 11.8987C23.8812 11.8198 23.784 11.7571 23.677 11.7144C23.5699 11.6717 23.4552 11.6497 23.3394 11.6497H21.9576C21.7237 11.6497 21.4994 11.7393 21.334 11.8988C21.1686 12.0583 21.0757 12.2746 21.0757 12.5001C21.0757 12.7257 21.1686 12.942 21.334 13.1015C21.4994 13.261 21.7237 13.3506 21.9576 13.3506H23.3394C23.4552 13.3506 23.5699 13.3286 23.677 13.2859C23.784 13.2432 23.8812 13.1805 23.9631 13.1015C24.045 13.0226 24.11 12.9288 24.1543 12.8256C24.1986 12.7224 24.2214 12.6118 24.2213 12.5001ZM3.14565 12.5001C3.14568 12.3885 3.12289 12.2779 3.07858 12.1747C3.03427 12.0715 2.96932 11.9777 2.88742 11.8987C2.80552 11.8198 2.70829 11.7571 2.60127 11.7144C2.49426 11.6717 2.37957 11.6497 2.26375 11.6497H0.881904C0.648008 11.6497 0.423693 11.7393 0.258304 11.8988C0.0929146 12.0583 0 12.2746 0 12.5001C0 12.7257 0.0929146 12.942 0.258304 13.1015C0.423693 13.261 0.648008 13.3506 0.881904 13.3506H2.26375C2.37957 13.3506 2.49426 13.3286 2.60127 13.2859C2.70829 13.2432 2.80552 13.1805 2.88742 13.1015C2.96932 13.0226 3.03427 12.9288 3.07858 12.8256C3.12289 12.7224 3.14568 12.6118 3.14565 12.5001ZM20.6748 20.7576C20.84 20.598 20.9328 20.3817 20.9328 20.1562C20.9327 19.9307 20.8397 19.7145 20.6743 19.555L19.6968 18.6133C19.615 18.5343 19.5178 18.4717 19.4108 18.4289C19.3038 18.3862 19.1891 18.3642 19.0733 18.3642C18.9575 18.3642 18.8428 18.3862 18.7359 18.4289C18.6289 18.4717 18.5317 18.5343 18.4498 18.6133C18.3679 18.6922 18.3029 18.786 18.2586 18.8891C18.2143 18.9923 18.1915 19.1029 18.1915 19.2145C18.1915 19.3262 18.2143 19.4368 18.2586 19.5399C18.3029 19.6431 18.3679 19.7368 18.4498 19.8158L19.4273 20.7576C19.5092 20.8365 19.6064 20.8992 19.7135 20.942C19.8205 20.9847 19.9352 21.0067 20.051 21.0067C20.1669 21.0067 20.2816 20.9847 20.3886 20.942C20.4956 20.8992 20.5929 20.8365 20.6748 20.7576ZM5.77198 6.38701C5.93725 6.22747 6.03005 6.01117 6.02996 5.78566C6.02988 5.56016 5.93693 5.34392 5.77155 5.18448L4.79405 4.24272C4.71217 4.16376 4.61496 4.10113 4.50798 4.0584C4.40099 4.01567 4.28632 3.99367 4.17052 3.99367C4.05472 3.99367 3.94005 4.01567 3.83307 4.0584C3.72608 4.10113 3.62887 4.16376 3.54699 4.24272C3.4651 4.32168 3.40015 4.41542 3.35584 4.51859C3.31152 4.62175 3.28871 4.73232 3.28871 4.84399C3.28871 4.95565 3.31152 5.06623 3.35584 5.16939C3.40015 5.27256 3.4651 5.36629 3.54699 5.44525L4.52449 6.38701C4.6064 6.466 4.70364 6.52866 4.81066 6.5714C4.91769 6.61415 5.03239 6.63615 5.14823 6.63615C5.26407 6.63615 5.37878 6.61415 5.4858 6.5714C5.59283 6.52866 5.69007 6.466 5.77198 6.38701Z" />
                    </svg>
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    {["Dark", "Light", "Purple"].map((theme, i) => (
                      <Dropdown.Item
                        key={i}
                        onClick={() => changeTheme(theme.toLowerCase())}
                      >
                        {t(theme.toLowerCase())}
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>
              </div>
              <svg
                className="hide-on-mobile"
                height="36"
                style={{
                  backgroundColor: "var(--separator-line-color)",
                  opacity: "0.61",
                  stroke: "var(--separator-line-color)",
                }}
                viewBox="0 0 1 44"
                width="1"
                xmlns="http://www.w3.org/2000/svg"
              >
                <line
                  opacity="0.61"
                  x1="0.5"
                  x2="0.499998"
                  y1="2.18557e-08"
                  y2="44"
                />
              </svg>
              <button
                className="acc-btn id-btn"
                onClick={() => {
                  setShowAccountInfo(!showAccountInfo);
                }}
              >
                <span>{defaultAccount?.account_type || "Type"} </span>
                {defaultAccount.account_no || "#"}
                <svg
                  className="hide-on-desktop"
                  width="13"
                  height="7"
                  viewBox="0 0 13 7"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6.14002 7C5.91993 7 5.69987 6.91597 5.53208 6.74825L0.251916 1.46804C-0.0839719 1.13215 -0.0839719 0.587565 0.251916 0.251814C0.587667 -0.0839379 1.13214 -0.0839379 1.46806 0.251814L6.14002 4.92404L10.812 0.251977C11.1479 -0.0837747 11.6923 -0.0837747 12.028 0.251977C12.3641 0.587728 12.3641 1.13231 12.028 1.4682L6.74795 6.74842C6.58007 6.91616 6.36002 7 6.14002 7Z"
                    fill="white"
                  />
                </svg>
              </button>
              {showAccountInfo && (
                <div className="acc-info">
                  <div className="acc-layout">
                    <div className="active-acc">
                      <label>{t("activeAccount")}</label>
                      <span className="acc-tile">
                        <span className="acc-tile-type">
                          {defaultAccount?.account_type || "Type"}
                        </span>
                        <span>{defaultAccount.account_no || "#"}</span>
                        <span>
                          {parseInt(defaultAccount.totalBalance) || "0"} USD
                        </span>
                      </span>
                    </div>
                    <button
                      className="deposit-acc-btn"
                      onClick={() => {
                        setAccTab("deposit");
                        setDepositModal(true);
                        setShowAccountInfo(false);
                        setTab("account");
                      }}
                    >
                      {t("depositFunds")}
                    </button>
                    <div className="other-acc">
                      <label>{t("otherAccount")}</label>
                      {accounts.map((acc) => (
                        <>
                          <span className="acc-tile">
                            <span className="acc-tile-type">
                              {acc?.account_type || "Type"}
                            </span>
                            <span>{acc.account_no || "#"}</span>
                            <span>{parseInt(acc.totalBalance) || "0"} USD</span>
                          </span>
                          <svg
                            height="1"
                            style={{
                              stroke: "var(--main-text-color)",
                              width: "100%",
                            }}
                            viewBox="0 0 178 1"
                            width="178"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <line
                              opacity="0.1"
                              y1="0.75"
                              x2="178"
                              y2="0.75"
                              stroke-width="0.5"
                            />
                          </svg>
                        </>
                      ))}
                    </div>
                    <button
                      className="open-acc-btn"
                      onClick={() => setShowAccountModal(true)}
                    >
                      {t("openAccount")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div id="main-container">
        <div id="sidebar">
          <div id="side-main-menu">
            <div
              className="side-btn"
              onClick={() => {
                setIsReportModalOpen(false);
                setShowAccounManagement(false);
                setShowAccountModal(false);
                setShowNewOrderPageMobile(false);
                setShowNewOrderPanel(false);
                setTab("trade");
              }}
              style={{
                backgroundColor:
                  tab === "trade" && "var(--main-secondary-color-40)",
              }}
            >
              <svg
                height="30"
                style={{
                  backgroundColor: "transparent",
                  fill:
                    tab === "trade"
                      ? "var(--main-primary-button)"
                      : theme === "purple"
                      ? "var(--separator-line-color)"
                      : "var(--main-text-color)",
                }}
                viewBox="0 0 30 30"
                width="30"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  clip-rule="evenodd"
                  d="M28.6633 7.18717C28.6493 7.76484 28.1707 8.22251 27.593 8.20996C27.0154 8.196 26.5577 7.7174 26.5703 7.13972L26.6275 4.61972L24.1089 4.56251C23.5312 4.54856 23.0735 4.06996 23.0861 3.49228C23.1 2.91461 23.5786 2.45693 24.1563 2.46949L27.7228 2.55182C28.3005 2.56437 28.7582 3.04298 28.7442 3.62065L28.6633 7.18717Z"
                  fill-rule="evenodd"
                />
                <path
                  clip-rule="evenodd"
                  d="M6.38651 11.2965V28.2374C6.38651 29.2114 5.59814 29.9998 4.62419 29.9998H1.76233C0.788372 29.9998 0 29.2114 0 28.2374V11.2965C0 10.3239 0.788372 9.53418 1.76233 9.53418H4.62419C5.59814 9.53418 6.38651 10.3239 6.38651 11.2965Z"
                  fill-rule="evenodd"
                />
                <path
                  clip-rule="evenodd"
                  d="M22.1288 19.8834V28.2374C22.1288 28.7048 21.9432 29.1527 21.6125 29.4834C21.2818 29.8141 20.8339 29.9997 20.3665 29.9997H17.5046C17.0372 29.9997 16.5893 29.8141 16.2586 29.4834C15.9279 29.1527 15.7423 28.7048 15.7423 28.2374V19.8834C15.7423 19.416 15.9279 18.9681 16.2586 18.6374C16.5893 18.3067 17.0372 18.1211 17.5046 18.1211H20.3665C20.8339 18.1211 21.2818 18.3067 21.6125 18.6374C21.9432 18.9681 22.1288 19.416 22.1288 19.8834Z"
                  fill-rule="evenodd"
                />
                <path
                  clip-rule="evenodd"
                  d="M14.2577 15.59V28.2374C14.2577 29.2114 13.4694 29.9997 12.4954 29.9997H9.63354C8.65959 29.9997 7.87122 29.2114 7.87122 28.2374V15.59C7.87122 15.1225 8.0568 14.6746 8.3875 14.3439C8.71819 14.0132 9.1661 13.8276 9.63354 13.8276H12.4954C13.4694 13.8276 14.2577 14.6174 14.2577 15.59Z"
                  fill-rule="evenodd"
                />
                <path
                  clip-rule="evenodd"
                  d="M30 15.59V28.2374C30 29.2114 29.2117 29.9997 28.2377 29.9997H25.3759C24.4019 29.9997 23.6135 29.2114 23.6135 28.2374V15.59C23.6135 15.1225 23.7991 14.6746 24.1298 14.3439C24.4605 14.0132 24.9084 13.8276 25.3759 13.8276H28.2377C29.2117 13.8276 30 14.6174 30 15.59Z"
                  fill-rule="evenodd"
                />
                <path
                  clip-rule="evenodd"
                  d="M1.67446 1.88331C1.2112 1.53727 1.11771 0.880058 1.46515 0.418197C1.8112 -0.0436632 2.46701 -0.137152 2.93027 0.208895L11.2368 6.43913H15.1814C15.5038 6.43913 15.8066 6.58703 16.0047 6.83959L19.1959 10.9015L26.5912 3.18378C26.9903 2.76657 27.6531 2.75262 28.0703 3.15308C28.4875 3.55215 28.5014 4.21494 28.1024 4.63215L19.8726 13.2191C19.6633 13.4382 19.3689 13.5554 19.0661 13.5401C18.7633 13.5261 18.4814 13.3796 18.2945 13.141L14.6735 8.53215H10.8879C10.6619 8.53215 10.4414 8.45959 10.26 8.32285L1.67446 1.88331Z"
                  fill-rule="evenodd"
                />
              </svg>
              <button
                className={`side-button ${tab === "trade" && " active"}`}
                id="side-button-trade"
                style={{
                  backgroundColor: "transparent",
                  color:
                    tab === "trade"
                      ? "var(--main-primary-button)"
                      : theme === "purple"
                      ? "var(--separator-line-color)"
                      : "var(--main-text-color)",
                }}
              >
                {t("trade")}
              </button>
            </div>
            <div
              className="side-btn"
              onClick={() => {
                setIsReportModalOpen(false);
                setShowAccounManagement(false);
                setShowAccountModal(false);
                setShowNewOrderPageMobile(false);
                setShowNewOrderPanel(false);
                setTab("assets");
              }}
              style={{
                backgroundColor:
                  tab === "assets" && "var(--main-secondary-color-40)",
              }}
            >
              <svg
                height="39"
                style={{
                  backgroundColor: "transparent",
                  fill:
                    tab === "assets"
                      ? "var(--main-primary-button)"
                      : theme === "purple"
                      ? "var(--separator-line-color)"
                      : "var(--main-text-color)",
                }}
                viewBox="0 0 39 39"
                width="39"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M31.9545 13.1207L37.061 11.0055C36.2721 9.38462 35.2649 7.88904 34.0785 6.55615L30.1722 10.4625C30.8622 11.2745 31.4619 12.1656 31.9545 13.1207Z" />
                <path d="M5.54393 20.6606H0.0172119C0.589386 30.5136 8.50345 38.4277 18.3564 38.9999V33.4731C11.5453 32.92 6.09712 27.4718 5.54393 20.6606Z" />
                <path d="M20.6436 33.4735V39.0002C25.1652 38.7376 29.2782 36.9288 32.4611 34.0958L28.5549 30.1895C26.3844 32.0339 23.6466 33.2295 20.6436 33.4735Z" />
                <path d="M19.4999 5.51422C22.9498 5.51422 26.1116 6.76896 28.5549 8.8451L32.4611 4.93876C29.0117 1.86854 24.4703 0 19.4999 0C9.12214 0 0.611343 8.1421 0.0172119 18.3736H5.54401C6.12777 11.1852 12.1638 5.51422 19.4999 5.51422Z" />
                <path d="M33.456 18.3737H38.9828C38.8766 16.5432 38.5169 14.7798 37.9384 13.1177L32.8318 15.2329C33.1547 16.2357 33.3677 17.2873 33.456 18.3737Z" />
                <path d="M30.1721 28.5719L34.0784 32.4782C36.9114 29.2952 38.7201 25.1823 38.9828 20.6606H33.456C33.2122 23.6637 32.0165 26.4014 30.1721 28.5719Z" />
                <path d="M31.2157 19.5171C31.2157 13.057 25.96 7.80127 19.4999 7.80127C13.0398 7.80127 7.78418 13.057 7.78418 19.5171C7.78418 25.9772 13.0399 31.2329 19.5 31.2329C25.9601 31.2329 31.2157 25.9772 31.2157 19.5171ZM15.4998 25.8044H13.2126V23.5173H15.4998V25.8044ZM15.4998 20.6607H13.2126V18.3735H15.4998V20.6607ZM15.4998 15.5169H13.2126V13.2297H15.4998V15.5169ZM25.9296 25.8044H18.214V23.5173H25.9296V25.8044ZM25.9296 20.6607H18.214V18.3735H25.9296V20.6607ZM25.9296 15.5169H18.214V13.2297H25.9296V15.5169Z" />
              </svg>
              <button
                className={`side-button ${tab === "assets" && " active"}`}
                id="side-button-assets"
                style={{
                  backgroundColor: "transparent",
                  color:
                    tab === "assets"
                      ? "var(--main-primary-button)"
                      : theme === "purple"
                      ? "var(--separator-line-color)"
                      : "var(--main-text-color)",
                }}
              >
                {t("assets")}
              </button>
            </div>
            <div
              className="side-btn"
              onClick={() => {
                if (isMobileUI) {
                  setShowNewOrderPageMobile(true);
                } else {
                  setShowNewOrderPanel(true);
                }
                setIsReportModalOpen(false);
                setShowAccounManagement(false);
                setShowAccountModal(false);
                setTab("newOrder");
              }}
              style={{
                backgroundColor:
                  tab === "newOrder" && "var(--main-secondary-color-40)",
              }}
            >
              <svg
                height="34"
                style={{
                  backgroundColor: "transparent",
                  fill:
                    tab === "newOrder"
                      ? "var(--main-primary-button)"
                      : theme === "purple"
                      ? "var(--separator-line-color)"
                      : "var(--main-text-color)",
                }}
                viewBox="0 0 45 34"
                width="45"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M22.3181 33.9999C13.9867 33.9999 6.93738 28.0412 5.55306 19.8324C5.43301 19.1198 5.9132 18.4455 6.6258 18.3255C7.33074 18.222 8.01266 18.6843 8.1327 19.3982C9.30248 26.3441 15.2689 31.3845 22.3181 31.3845C23.0409 31.3845 23.6258 31.9694 23.6258 32.6922C23.6258 33.415 23.0409 33.9999 22.3181 33.9999Z" />
                <path d="M35.8802 12.206C33.8472 6.4695 28.3968 2.61538 22.3181 2.61538C21.5953 2.61538 21.0104 2.0305 21.0104 1.30769C21.0104 0.584887 21.5953 0 22.3181 0C29.5027 0 35.9441 4.55391 38.3475 11.3325C38.5876 12.0132 38.2326 12.7602 37.5506 13.0016C36.8847 13.2394 36.1277 12.8989 35.8802 12.206Z" />
                <path d="M22.3179 5.23096C15.8179 5.23096 10.5487 10.5002 10.5487 17.0002C10.5487 23.5002 15.8179 28.7694 22.3179 28.7694C28.818 28.7694 34.0872 23.5002 34.0872 17.0002C34.0872 10.5002 28.818 5.23096 22.3179 5.23096ZM23.6256 23.2978V24.8463C23.6256 25.5691 23.0407 26.154 22.3179 26.154C21.5951 26.154 21.0102 25.5691 21.0102 24.8463V23.3011C20.4655 23.1084 19.9616 22.8088 19.5416 22.388C19.0334 21.8772 19.0334 21.0484 19.5441 20.5388C20.0549 20.0305 20.8851 20.028 21.3958 20.5413C22.1468 21.2949 23.6256 20.6883 23.6256 19.6156C23.6256 18.8941 23.0382 18.3079 22.3179 18.3079C20.1547 18.3079 18.3949 16.5481 18.3949 14.3848C18.3949 12.6822 19.4914 11.2442 21.0102 10.7026V9.15403C21.0102 8.43123 21.5951 7.84634 22.3179 7.84634C23.0407 7.84634 23.6256 8.43123 23.6256 9.15403V10.6993C24.1703 10.892 24.6742 11.1916 25.0943 11.6124C25.6025 12.1232 25.6025 12.952 25.0917 13.4616C24.5809 13.9698 23.7508 13.9724 23.24 13.459C22.4891 12.7055 21.0102 13.3121 21.0102 14.3848C21.0102 15.1063 21.5977 15.6925 22.3179 15.6925C24.4812 15.6925 26.241 17.4523 26.241 19.6156C26.241 21.3182 25.1445 22.7561 23.6256 23.2978Z" />
                <path d="M44.2529 23.9216L38.9349 18.6908C38.562 18.318 37.995 18.203 37.5097 18.4073C37.0219 18.609 36.7027 19.0867 36.7027 19.6154V20.9231H36.1449C35.2312 24.1372 33.2314 26.8934 30.562 28.7692H36.7027V30.0769C36.7027 30.6056 37.0219 31.0832 37.5098 31.2849C37.9852 31.4849 38.5545 31.3819 38.935 31.0014L44.2529 25.7707C44.7637 25.2599 44.7637 24.4324 44.2529 23.9216Z" />
                <path d="M7.93336 13.0769H8.49113C9.40486 9.86278 11.4046 7.1066 14.074 5.23076H7.93336V3.92307C7.93336 3.39441 7.6141 2.91675 7.12625 2.71502C6.64353 2.51067 6.07399 2.62305 5.70104 2.99853L0.383088 8.2293C-0.127696 8.74008 -0.127696 9.56768 0.383088 10.0785L5.70104 15.3092C6.08114 15.6893 6.65077 15.7927 7.12625 15.5927C7.6141 15.3909 7.93336 14.9133 7.93336 14.3846V13.0769Z" />
              </svg>
              <button
                className={`side-button ${tab === "newOrder" && " active"}`}
                id="side-button-assets"
                style={{
                  backgroundColor: "transparent",
                  color:
                    tab === "newOrder"
                      ? "var(--main-primary-button)"
                      : theme === "purple"
                      ? "var(--separator-line-color)"
                      : "var(--main-text-color)",
                }}
              >
                {t("newOrder")}
              </button>
            </div>
            <div
              className="side-btn"
              onClick={() => {
                setAccTab("acc-info");
                setIsReportModalOpen(false);
                setShowAccounManagement(false);
                setShowAccountModal(false);
                setShowNewOrderPageMobile(false);
                setShowNewOrderPanel(false);
                setTab("account");
              }}
              style={{
                backgroundColor:
                  tab === "account" && "var(--main-secondary-color-40)",
              }}
            >
              <svg
                height="34"
                style={{
                  backgroundColor: "transparent",
                  fill:
                    tab === "account"
                      ? "var(--main-primary-button)"
                      : theme === "purple"
                      ? "var(--separator-line-color)"
                      : "var(--main-text-color)",
                }}
                viewBox="0 0 34 34"
                width="34"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g clip-path="url(#clip0_578_493)">
                  <path d="M16.7577 16.3779C19.0078 16.3779 20.9561 15.5709 22.548 13.9787C24.14 12.3868 24.947 10.439 24.947 8.18869C24.947 5.93919 24.14 3.9911 22.5478 2.39866C20.9556 0.806988 19.0075 0 16.7577 0C14.5074 0 12.5596 0.806988 10.9677 2.39892C9.37573 3.99084 8.56848 5.93893 8.56848 8.18869C8.56848 10.439 9.37573 12.3871 10.9679 13.979C12.5601 15.5707 14.5082 16.3779 16.7577 16.3779Z" />
                  <path d="M31.0867 26.1443C31.0408 25.4818 30.9479 24.7591 30.8112 23.996C30.6732 23.2271 30.4955 22.5003 30.2828 21.8359C30.0631 21.1493 29.7643 20.4713 29.3949 19.8215C29.0115 19.147 28.5612 18.5597 28.0559 18.0765C27.5275 17.5709 26.8805 17.1644 26.1324 16.8679C25.3869 16.573 24.5607 16.4236 23.6769 16.4236C23.3299 16.4236 22.9942 16.566 22.346 16.9881C21.947 17.2482 21.4803 17.5491 20.9595 17.8819C20.5141 18.1657 19.9107 18.4316 19.1655 18.6723C18.4384 18.9076 17.7001 19.0269 16.9715 19.0269C16.2428 19.0269 15.5048 18.9076 14.7769 18.6723C14.0325 18.4319 13.4291 18.166 12.9842 17.8822C12.4683 17.5525 12.0014 17.2516 11.5965 16.9878C10.949 16.5657 10.6131 16.4233 10.266 16.4233C9.38196 16.4233 8.55603 16.573 7.81078 16.8682C7.06319 17.1642 6.41599 17.5707 5.88707 18.0767C5.38202 18.5603 4.93144 19.1473 4.54857 19.8215C4.17944 20.4713 3.88062 21.1491 3.66064 21.8362C3.4482 22.5005 3.27051 23.2271 3.13251 23.996C2.9958 24.7581 2.90294 25.481 2.85703 26.1451C2.81189 26.7956 2.78906 27.4709 2.78906 28.1528C2.78906 29.9276 3.35326 31.3644 4.46582 32.4241C5.56464 33.4697 7.01857 34.0002 8.78664 34.0002H25.1579C26.9259 34.0002 28.3793 33.47 29.4784 32.4241C30.5912 31.3652 31.1554 29.9281 31.1554 28.1526C31.1552 27.4675 31.1321 26.7918 31.0867 26.1443Z" />
                </g>
                <defs>
                  <clipPath id="clip0_578_493">
                    <rect width="34" height="34" />
                  </clipPath>
                </defs>
              </svg>
              <button
                className={`side-button ${tab === "account" && " active"}`}
                id="side-button-account"
                style={{
                  backgroundColor: "transparent",
                  color:
                    tab === "account"
                      ? "var(--main-primary-button)"
                      : theme === "purple"
                      ? "var(--separator-line-color)"
                      : "var(--main-text-color)",
                }}
              >
                {t("account")}
              </button>
            </div>
            <svg
              className="navbar-sperater"
              height="2"
              style={{
                stroke: "var(--main-secondary-color)",
                width: "100%",
                margin: "4px 0",
              }}
              viewBox="0 0 47 2"
              width="47"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M1 1H46" stroke-linecap="round" stroke-width="2" />
            </svg>
            <div
              className="side-btn-acc"
              onClick={() => {
                setTab("account");
                setAccTab("acc-info");
              }}
              style={{
                backgroundColor:
                  accTab === "acc-info" && "var(--main-secondary-color-40)",
              }}
            >
              <svg
                height="28"
                style={{
                  backgroundColor: "transparent",
                  fill:
                    accTab === "acc-info"
                      ? "var(--main-primary-button)"
                      : theme === "purple"
                      ? "var(--separator-line-color)"
                      : "var(--main-text-color)",
                }}
                viewBox="0 0 28 28"
                width="28"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M11.1855 13.1152C12.9871 13.1152 14.5484 12.4666 15.8215 11.1936C17.0946 9.92047 17.7431 8.35914 17.7431 6.5576C17.7431 4.75606 17.0946 3.19473 15.8215 1.92164C14.5484 0.648554 12.9871 0 11.1855 0C9.38399 0 7.82266 0.648554 6.54957 1.92164C5.27648 3.19473 4.62793 4.75606 4.62793 6.5576C4.62793 8.35914 5.27648 9.92047 6.54957 11.1936C7.82266 12.4666 9.38399 13.1152 11.1855 13.1152Z" />
                <path d="M12.1223 23.1957V17.1745C12.1223 16.3658 12.2905 15.6772 12.5707 15.0847C12.1704 15.1728 11.762 15.2369 11.3617 15.2369C10.7772 15.2369 10.1847 15.1408 9.6082 14.9566C9.0157 14.7645 8.52728 14.5483 8.17498 14.3241C7.75862 14.0599 7.39031 13.8196 7.06203 13.6115C6.54158 13.2752 6.27736 13.1631 5.99712 13.1631C5.29252 13.1631 4.62795 13.2832 4.02744 13.5154C3.42693 13.7556 2.91449 14.0759 2.49013 14.4842C2.08178 14.8685 1.72147 15.3409 1.41721 15.8774C1.12096 16.3978 0.880752 16.9423 0.704602 17.4868C0.536458 18.0152 0.392335 18.5997 0.280239 19.2163C0.168144 19.8248 0.096082 20.4093 0.0560478 20.9377C0.0160137 21.4582 0 22.0026 0 22.5471C0 23.9643 0.448383 25.1173 1.34515 25.966C2.2259 26.8067 3.38689 27.2311 4.8041 27.2311H15.0609C13.2113 26.7987 12.1223 25.3735 12.1223 23.2037V23.1957Z" />
                <path d="M23.7083 12.9395H17.6871C15.0689 12.9395 13.5076 14.5008 13.5076 17.119V23.1402C13.5076 25.7584 15.0689 27.3197 17.6871 27.3197H23.7083C26.3265 27.3197 27.8878 25.7584 27.8878 23.1402V17.119C27.8878 14.5008 26.3265 12.9395 23.7083 12.9395ZM19.2325 22.2114L17.6151 23.8287C17.511 23.9328 17.3669 23.9889 17.2307 23.9889C17.0946 23.9889 16.9505 23.9408 16.8464 23.8287L16.31 23.2923C16.0938 23.0841 16.0938 22.7398 16.31 22.5316C16.5181 22.3235 16.8544 22.3235 17.0706 22.5316L17.2307 22.6918L18.4638 21.4587C18.672 21.2505 19.0083 21.2505 19.2244 21.4587C19.4326 21.6669 19.4326 22.0112 19.2244 22.2194L19.2325 22.2114ZM19.2325 17.1831L17.6151 18.8005C17.511 18.9045 17.3669 18.9606 17.2307 18.9606C17.0946 18.9606 16.9505 18.9126 16.8464 18.8005L16.31 18.264C16.0938 18.0558 16.0938 17.7115 16.31 17.5033C16.5181 17.2952 16.8544 17.2952 17.0706 17.5033L17.2307 17.6635L18.4638 16.4304C18.672 16.2223 19.0083 16.2223 19.2244 16.4304C19.4326 16.6386 19.4326 16.9829 19.2244 17.1911L19.2325 17.1831ZM24.6931 23.4524H20.9219C20.6256 23.4524 20.3854 23.2042 20.3854 22.916C20.3854 22.6277 20.6337 22.3795 20.9219 22.3795H24.6931C24.9974 22.3795 25.2296 22.6277 25.2296 22.916C25.2296 23.2042 24.9894 23.4524 24.6931 23.4524ZM24.6931 18.4161H20.9219C20.6256 18.4161 20.3854 18.1679 20.3854 17.8797C20.3854 17.5914 20.6337 17.3432 20.9219 17.3432H24.6931C24.9974 17.3432 25.2296 17.5914 25.2296 17.8797C25.2296 18.1679 24.9894 18.4161 24.6931 18.4161Z" />
              </svg>
              <button
                className={`side-button ${accTab === "acc-info" && " active"}`}
                id="side-button-account"
                style={{
                  backgroundColor: "transparent",
                  color:
                    accTab === "acc-info"
                      ? "var(--main-primary-button)"
                      : theme === "purple"
                      ? "var(--separator-line-color)"
                      : "var(--main-text-color)",
                }}
              >
                {t("accountInfo")}
              </button>
            </div>
            <div
              className="side-btn-acc"
              onClick={() => {
                setTab("account");
                setAccTab("personal-info");
              }}
              style={{
                backgroundColor:
                  accTab === "personal-info" &&
                  "var(--main-secondary-color-40)",
              }}
            >
              <svg
                height="28"
                style={{
                  backgroundColor: "transparent",
                  fill:
                    accTab === "personal-info"
                      ? "var(--main-primary-button)"
                      : theme === "purple"
                      ? "var(--separator-line-color)"
                      : "var(--main-text-color)",
                }}
                viewBox="0 0 29 28"
                width="29"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g clip-path="url(#clip0_578_3277)">
                  <path d="M11.1856 13.4345C12.9871 13.4345 14.5484 12.786 15.8215 11.5129C17.0946 10.2398 17.7432 8.67847 17.7432 6.87693C17.7432 5.0754 17.0946 3.51406 15.8215 2.24098C14.5484 0.96789 12.9871 0.319336 11.1856 0.319336C9.38402 0.319336 7.82269 0.96789 6.5496 2.24098C5.27651 3.51406 4.62796 5.0754 4.62796 6.87693C4.62796 8.67847 5.27651 10.2398 6.5496 11.5129C7.82269 12.786 9.38402 13.4345 11.1856 13.4345Z" />
                  <path d="M14.3723 26.0694C12.843 24.5401 12.0663 22.6665 12.0663 20.5046C12.0663 18.3428 12.843 16.4692 14.3723 14.9399C14.6605 14.6516 14.9648 14.3954 15.277 14.1632C15.0529 14.3073 14.8126 14.4675 14.5484 14.6356C14.1881 14.8598 13.7077 15.076 13.1152 15.2681C12.5307 15.4603 11.9382 15.5484 11.3617 15.5484C10.7852 15.5484 10.1847 15.4523 9.6082 15.2681C9.0157 15.076 8.52728 14.8598 8.17498 14.6356C7.75862 14.3714 7.39031 14.1312 7.06203 13.923C6.54158 13.5867 6.27736 13.4746 5.99712 13.4746C5.29252 13.4746 4.62795 13.5947 4.02744 13.8269C3.42693 14.0671 2.91449 14.3874 2.49013 14.7957C2.08178 15.1801 1.72147 15.6525 1.41721 16.1889C1.12096 16.7094 0.880752 17.2538 0.704602 17.7983C0.536458 18.3268 0.392335 18.9113 0.280239 19.5278C0.168144 20.1363 0.096082 20.7208 0.0560478 21.2492C0.0160137 21.7697 0 22.3142 0 22.8586C0 24.2758 0.448383 25.4288 1.34515 26.2775C2.2259 27.1183 3.38689 27.5426 4.8041 27.5426H16.39C15.6694 27.1743 14.9888 26.6859 14.3723 26.0694Z" />
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M20.8738 13.1787C16.8304 13.1787 13.5396 16.4615 13.5396 20.513C13.5396 24.5644 16.8224 27.8472 20.8738 27.8472C24.9253 27.8472 28.2081 24.5644 28.2081 20.513C28.2081 16.4615 24.9253 13.1787 20.8738 13.1787ZM19.8249 20.505V23.9959C19.8249 24.5724 20.2973 25.0448 20.8738 25.0448C21.4503 25.0448 21.9227 24.5724 21.9227 23.9959V20.505C21.9227 19.9285 21.4503 19.4561 20.8738 19.4561C20.2973 19.4561 19.8249 19.9285 19.8249 20.505ZM20.8738 15.9651C21.6425 15.9651 22.267 16.5896 22.267 17.3583C22.267 18.1269 21.6425 18.7515 20.8738 18.7515C20.1052 18.7515 19.4806 18.1269 19.4806 17.3583C19.4806 16.5896 20.1052 15.9651 20.8738 15.9651Z"
                  />
                </g>
                <defs>
                  <clipPath id="clip0_578_3277">
                    <rect
                      width="28.2081"
                      height="27.5195"
                      transform="translate(0 0.319336)"
                    />
                  </clipPath>
                </defs>
              </svg>
              <button
                className={`side-button ${
                  accTab === "personal-info" && " active"
                }`}
                id="side-button-account"
                style={{
                  backgroundColor: "transparent",
                  color:
                    accTab === "personal-info"
                      ? "var(--main-primary-button)"
                      : theme === "purple"
                      ? "var(--separator-line-color)"
                      : "var(--main-text-color)",
                }}
              >
                {t("personalInfo")}
              </button>
            </div>
            <div
              className="side-btn-acc"
              onClick={() => {
                setTab("account");
                setAccTab("deposit");
              }}
              style={{
                backgroundColor:
                  accTab === "deposit" && "var(--main-secondary-color-40)",
              }}
            >
              <svg
                height="29"
                style={{
                  backgroundColor: "transparent",
                  fill:
                    accTab === "deposit"
                      ? "var(--main-primary-button)"
                      : theme === "purple"
                      ? "var(--separator-line-color)"
                      : "var(--main-text-color)",
                }}
                viewBox="0 0 25 29"
                width="25"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M19.2306 17.2158C18.1594 17.2158 17.1122 17.5335 16.2214 18.1286C15.3307 18.7238 14.6365 19.5697 14.2265 20.5594C13.8166 21.5492 13.7093 22.6382 13.9183 23.6889C14.1273 24.7396 14.6432 25.7047 15.4007 26.4622C16.1582 27.2197 17.1233 27.7355 18.1739 27.9445C19.2246 28.1535 20.3137 28.0462 21.3034 27.6363C22.2931 27.2263 23.139 26.5321 23.7342 25.6414C24.3293 24.7507 24.647 23.7035 24.647 22.6322C24.647 21.1957 24.0764 19.818 23.0606 18.8022C22.0448 17.7865 20.6671 17.2158 19.2306 17.2158ZM21.8485 23.3762H19.2312C19.0338 23.3762 18.8446 23.2978 18.7051 23.1583C18.5655 23.0188 18.4871 22.8295 18.4871 22.6322V19.4813C18.4871 19.284 18.5655 19.0948 18.7051 18.9552C18.8446 18.8157 19.0338 18.7373 19.2312 18.7373C19.4285 18.7373 19.6177 18.8157 19.7573 18.9552C19.8968 19.0948 19.9752 19.284 19.9752 19.4813V21.8882H21.8485C22.0458 21.8882 22.235 21.9666 22.3746 22.1061C22.5141 22.2456 22.5925 22.4349 22.5925 22.6322C22.5925 22.8295 22.5141 23.0188 22.3746 23.1583C22.235 23.2978 22.0458 23.3762 21.8485 23.3762Z" />
                <path d="M22.0366 10.3431C21.6827 10.3521 21.3293 10.358 20.9775 10.358C19.4833 10.3575 17.9901 10.2778 16.5044 10.1194H16.4916C15.6057 10.0168 14.7379 9.57729 14.0406 8.88217C13.3434 8.18705 12.9066 7.31709 12.8035 6.43172C12.8037 6.42748 12.8037 6.42322 12.8035 6.41897C12.6061 4.57212 12.5308 2.71426 12.5781 0.857505C9.7857 0.790199 6.99186 0.905234 4.21441 1.20187C2.35917 1.41711 0.58046 3.19635 0.364697 5.05159C-0.121566 9.60333 -0.121566 18.0553 0.364697 22.607C0.579928 24.4622 2.35917 26.2415 4.21441 26.4567C7.36412 26.7939 10.5345 26.8971 13.6995 26.7655C13.029 25.8665 12.5869 24.8182 12.411 23.7106C12.2351 22.603 12.3308 21.4693 12.6897 20.4069H5.27516C5.07783 20.4069 4.88859 20.3285 4.74906 20.189C4.60953 20.0494 4.53115 19.8602 4.53115 19.6629C4.53115 19.4655 4.60953 19.2763 4.74906 19.1368C4.88859 18.9972 5.07783 18.9188 5.27516 18.9188H13.4061C13.9971 17.9972 14.7964 17.2273 15.7396 16.6714H5.27516C5.07783 16.6714 4.88859 16.593 4.74906 16.4535C4.60953 16.314 4.53115 16.1247 4.53115 15.9274C4.53115 15.7301 4.60953 15.5408 4.74906 15.4013C4.88859 15.2618 5.07783 15.1834 5.27516 15.1834H16.8073C17.0046 15.1834 17.1939 15.2618 17.3334 15.4013C17.4729 15.5408 17.5513 15.7301 17.5513 15.9274V15.9317C19.056 15.5591 20.6419 15.6994 22.0579 16.3302C22.0988 14.3538 22.0913 12.2807 22.0366 10.3431ZM13.0894 12.9365H5.27728C5.07996 12.9365 4.89072 12.8581 4.75119 12.7186C4.61166 12.579 4.53327 12.3898 4.53327 12.1925C4.53327 11.9952 4.61166 11.8059 4.75119 11.6664C4.89072 11.5269 5.07996 11.4485 5.27728 11.4485H13.0894C13.2867 11.4485 13.4759 11.5269 13.6155 11.6664C13.755 11.8059 13.8334 11.9952 13.8334 12.1925C13.8334 12.3898 13.755 12.579 13.6155 12.7186C13.4759 12.8581 13.2867 12.9365 13.0894 12.9365Z" />
                <path d="M16.6552 8.70382C18.4256 8.89318 20.2066 8.96579 21.9866 8.92118L21.9823 8.91427C19.8802 5.74082 17.1658 3.01894 13.998 0.908203C13.9521 2.69702 14.0247 4.48691 14.2154 6.26613C14.3514 7.44166 15.4791 8.56937 16.6552 8.70382Z" />
              </svg>
              <button
                className={`side-button ${accTab === "deposit" && " active"}`}
                id="side-button-account"
                style={{
                  backgroundColor: "transparent",
                  color:
                    accTab === "deposit"
                      ? "var(--main-primary-button)"
                      : theme === "purple"
                      ? "var(--separator-line-color)"
                      : "var(--main-text-color)",
                }}
              >
                {t("deposit")}
              </button>
            </div>
            <div
              className="side-btn-acc"
              onClick={() => {
                setIsReportModalOpen(true);
              }}
              style={{
                backgroundColor:
                  accTab === "report" && "var(--main-secondary-color-40)",
              }}
            >
              <svg
                height="28"
                style={{
                  backgroundColor: "transparent",
                  fill:
                    accTab === "report"
                      ? "var(--main-primary-button)"
                      : theme === "purple"
                      ? "var(--separator-line-color)"
                      : "var(--main-text-color)",
                }}
                viewBox="0 0 28 28"
                width="28"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M6.10352e-05 5.11719C6.10352e-05 4.5649 0.447776 4.11719 1.00006 4.11719H18.7647C19.317 4.11719 19.7647 4.5649 19.7647 5.11719V5.58777C19.7647 6.14006 19.317 6.58777 18.7647 6.58777H1.00006C0.447775 6.58777 6.10352e-05 6.14006 6.10352e-05 5.58777V5.11719Z" />
                <path d="M17.2941 0H2.47059C1.45358 0 0.578119 0.617696 0.199676 1.49762C-0.0185283 2.00497 0.447715 2.47059 1 2.47059H18.7647C19.317 2.47059 19.7832 2.00497 19.565 1.49762C19.1866 0.617695 18.3111 0 17.2941 0Z" />
                <path d="M2.47065 13.1765H17.2942C18.6565 13.1765 19.7647 12.0683 19.7647 10.7059V9.23535C19.7647 8.68307 19.317 8.23535 18.7647 8.23535H1.00006C0.447775 8.23535 6.10352e-05 8.68307 6.10352e-05 9.23535V10.7059C6.10352e-05 12.0683 1.10837 13.1765 2.47065 13.1765Z" />
                <path d="M8.23712 19.9404C8.23712 19.3881 8.68484 18.9404 9.23712 18.9404H27.0018C27.5541 18.9404 28.0018 19.3881 28.0018 19.9404V20.411C28.0018 20.9633 27.5541 21.411 27.0018 21.411H9.23712C8.68484 21.411 8.23712 20.9633 8.23712 20.411V19.9404Z" />
                <path d="M25.5312 14.8232H10.7077C9.6907 14.8232 8.81524 15.4409 8.4368 16.3209C8.21859 16.8282 8.68484 17.2938 9.23712 17.2938H27.0018C27.5541 17.2938 28.0203 16.8282 27.8021 16.3209C27.4237 15.4409 26.5483 14.8232 25.5312 14.8232Z" />
                <path d="M4.11783 23.0589V20.634C4.11783 20.4391 4.35345 20.3415 4.49125 20.4793L5.02792 21.016C5.11334 21.1014 5.25184 21.1014 5.33727 21.016L6.19255 20.1607C6.27798 20.0753 6.27798 19.9367 6.19255 19.8513L3.44898 17.1078C3.36355 17.0224 3.22505 17.0224 3.13962 17.1078L0.396101 19.8514C0.310675 19.9368 0.310676 20.0753 0.396103 20.1607L1.25138 21.016C1.3368 21.1014 1.47531 21.1014 1.56074 21.016L2.09734 20.4794C2.23514 20.3416 2.47077 20.4392 2.47077 20.6341V23.0589C2.47077 24.4213 3.57908 25.5295 4.94136 25.5295H6.36966C6.49048 25.5295 6.58841 25.4316 6.58841 25.3108V24.1012C6.58841 23.9804 6.49048 23.8825 6.36966 23.8825H4.94136C4.48726 23.8825 4.11783 23.5131 4.11783 23.0589Z" />
                <path d="M8.23712 23.8821V25.5292C8.23712 26.8915 9.34543 27.9998 10.7077 27.9998H25.5312C26.8936 27.9998 28.0018 26.8915 28.0018 25.5292V24.0586C28.0018 23.5063 27.5541 23.0586 27.0018 23.0586H9.06065C8.60583 23.0586 8.23712 23.4273 8.23712 23.8821Z" />
                <path d="M24.1269 4.93152V7.35644C24.1269 7.55133 23.8913 7.64892 23.7535 7.51113L23.2168 6.97449C23.1314 6.88907 22.9929 6.88907 22.9075 6.97449L22.0522 7.82977C21.9667 7.9152 21.9667 8.05371 22.0522 8.13913L24.7957 10.8826C24.8812 10.9681 25.0197 10.9681 25.1051 10.8826L27.8486 8.13908C27.934 8.05365 27.934 7.91515 27.8486 7.82972L26.9933 6.97445C26.9079 6.88902 26.7694 6.88902 26.684 6.97445L26.1474 7.51108C26.0096 7.64889 25.774 7.55129 25.774 7.3564V4.93152C25.774 3.56924 24.6657 2.46094 23.3034 2.46094H21.8751C21.7542 2.46094 21.6563 2.55888 21.6563 2.67969V3.88924C21.6563 4.01006 21.7542 4.10799 21.8751 4.10799H23.3034C23.7575 4.10799 24.1269 4.47743 24.1269 4.93152Z" />
              </svg>
              <button
                className={`side-button ${accTab === "report" && " active"}`}
                id="side-button-account"
                style={{
                  backgroundColor: "transparent",
                  color:
                    accTab === "report"
                      ? "var(--main-primary-button)"
                      : theme === "purple"
                      ? "var(--separator-line-color)"
                      : "var(--main-text-color)",
                }}
              >
                {t("report")}
              </button>
            </div>
          </div>
          <div id="side-out-menu">
            <div
              id="side-out-extra"
              onClick={() => setTab("help")}
              style={{
                backgroundColor:
                  tab === "help" && "var(--main-secondary-color-40)",
              }}
            >
              <svg
                height="26"
                style={{
                  backgroundColor: "transparent",
                  fill:
                    tab === "help"
                      ? "var(--main-primary-button)"
                      : theme === "purple"
                      ? "var(--separator-line-color)"
                      : "var(--main-text-color)",
                }}
                viewBox="0 0 26 26"
                width="26"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M13 0C5.81491 0 0 5.81425 0 13C0 20.185 5.81425 26 13 26C20.1851 26 26 20.1857 26 13C26 5.81491 20.1857 0 13 0ZM12.6153 19.0846C11.8795 19.0846 11.3148 18.4685 11.3148 17.7669C11.3148 17.0482 11.8966 16.4493 12.6153 16.4493C13.3341 16.4493 13.9329 17.0482 13.9329 17.7669C13.9329 18.4685 13.3511 19.0846 12.6153 19.0846ZM14.566 12.428C13.6249 13.1638 13.6077 13.6772 13.6077 14.567C13.6077 14.8922 13.4366 15.2686 12.5982 15.2686C11.8965 15.2686 11.657 15.0119 11.657 14.1221C11.657 12.6505 12.3073 11.9489 12.8035 11.5211C13.3682 11.0419 14.3265 10.5115 14.3265 9.5875C14.3265 8.80029 13.642 8.42385 12.7864 8.42385C11.041 8.42385 11.4175 9.74152 10.4934 9.74152C10.0314 9.74152 9.46669 9.43343 9.46669 8.76611C9.46669 7.8421 10.5276 6.47309 12.8378 6.47309C15.0281 6.47309 16.4826 7.68808 16.4826 9.29657C16.4826 10.9051 15.0281 12.0687 14.566 12.428Z" />
              </svg>
              <button
                className={`side-out-button ${tab === "help" && " active"}`}
                id="help-button"
                style={{
                  backgroundColor: "transparent",
                  color:
                    tab === "help"
                      ? "var(--main-primary-button)"
                      : theme === "purple"
                      ? "var(--separator-line-color)"
                      : "var(--main-text-color)",
                }}
              >
                {t("help")}
              </button>
            </div>
            <div id="side-logout" onClick={hanldeLogout}>
              <svg
                height="23"
                style={{
                  backgroundColor: "transparent",
                  fill:
                    theme === "purple"
                      ? "var(--separator-line-color)"
                      : "var(--main-text-color)",
                }}
                viewBox="0 0 25 23"
                width="25"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M24.6187 12.212L16.9281 19.0481C16.5603 19.3726 15.9816 19.113 15.9816 18.6209V14.5592H7.52839C6.90103 14.5592 6.39264 14.0508 6.39264 13.4235V9.30233C6.39264 8.67496 6.90103 8.16658 7.52839 8.16658H15.9816V4.10492C15.9816 3.61276 16.5603 3.35316 16.9281 3.68307L24.6187 10.5192C25.1271 10.9681 25.1271 11.7631 24.6187 12.212ZM1.13575 22.7312H8.45322C9.08058 22.7312 9.58897 22.2228 9.58897 21.5955V19.6052C9.58897 18.9778 9.08058 18.4694 8.45322 18.4694H4.26176V4.25635H8.45322C9.08058 4.25635 9.58897 3.74797 9.58897 3.12061V1.13575C9.58897 0.508383 9.08058 0 8.45322 0H1.13575C0.508383 0 0 0.508383 0 1.13575V21.5955C0 22.2228 0.508383 22.7312 1.13575 22.7312Z" />
              </svg>
              <button
                id="logout-button"
                className="side-out-button"
                style={{
                  backgroundColor: "transparent",
                  color: theme === "purple" && "var(--separator-line-color)",
                }}
              >
                {t("exit")}
              </button>
            </div>
          </div>
        </div>
        <div id="content">
          <div
            className={`h-100 ${
              tab === "trade" || tab === "assets" || tab === "newOrder"
                ? ""
                : "d-none"
            }`}
            id="trade-div"
          >
            <div
              className={
                showHistoryPanel || showNewOrderPageMobile ? "d-none" : ""
              }
              id="trade"
              style={{
                height: isHidden ? "92%" : "60%",
              }}
            >
              <div
                className={`${tab === "assets" ? "" : "d-none"}`}
                id="assets"
              >
                <input
                  className="w-100"
                  onChange={(e) => setQuoteSearch(e.target.value)}
                  style={{ height: "32px" }}
                  type="search"
                  value={quoteSearch}
                />
                <svg
                  className="search-input-icon"
                  height="21"
                  style={{
                    backgroundColor: "transparent",
                    fill: "var(--main-primary-button)",
                    position: "relative",
                    right: "-90%",
                    top: "-7%",
                  }}
                  viewBox="0 0 21 21"
                  width="21"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M20.5027 17.9615L15.6746 13.1331C16.495 11.8271 16.9711 10.2835 16.9711 8.62696C16.9711 3.94035 13.1718 0.141602 8.48536 0.141602C3.79893 0.141602 0 3.94035 0 8.62696C0 13.3137 3.79875 17.1121 8.48536 17.1121C10.2881 17.1121 11.9579 16.5485 13.332 15.5908L18.1025 20.3618C18.434 20.6929 18.8686 20.8579 19.3026 20.8579C19.7372 20.8579 20.1712 20.6929 20.5032 20.3618C21.1657 19.6986 21.1657 18.6244 20.5027 17.9615ZM8.48536 14.363C5.31776 14.363 2.74966 11.7951 2.74966 8.62731C2.74966 5.45954 5.31776 2.89144 8.48536 2.89144C11.6531 2.89144 14.2211 5.45954 14.2211 8.62731C14.2211 11.7951 11.6531 14.363 8.48536 14.363Z" />
                </svg>
                <DataTable
                  columns={assetsColumns}
                  conditionalRowStyles={conditionalRowStyles}
                  customStyles={customStylesAssetsTable}
                  data={fillArrayWithEmptyRows(filteredQuotesSymbols, 10)}
                  dense
                  highlightOnHover
                  pointerOnHover
                  theme={theme}
                />
                <button
                  className="add-symbol-btn"
                  onClick={() => {
                    handleTradingModal();
                  }}
                >
                  + <span>{t("addSymbol")}</span>
                </button>
              </div>
              <div id="chart" className="rounded">
                <ul className="nav nav-tabs hide-on-mobile">
                  {tabs?.map((tab) => (
                    <li className="nav-item" key={tab}>
                      <a
                        className={`nav-link ${activeTab === tab && "active"}`}
                        data-bs-toggle="tab"
                        style={{
                          alignItems: "center",
                          backgroundColor: "var(--main-secondary-color-40)",
                          cursor: "pointer",
                          display: "flex",
                          fontSize: "14px",
                          fontWeight: "600",
                          justifyContent: "space-between",
                          position: "relative",
                          width: "150px",
                        }}
                        onClick={() => {
                          getValue({
                            value: tab,
                            label: tab,
                          });
                          setActiveTab(tab);
                        }}
                      >
                        {tab}
                        {activeTab === tab && (
                          <svg
                            height="19"
                            onClick={(e) => {
                              e.stopPropagation();
                              const _tabs = tabs.filter((t) => t !== tab);
                              setTabs(_tabs);
                              setActiveTab(_tabs.at(-1));
                            }}
                            style={{ backgroundColor: "transparent" }}
                            viewBox="0 0 19 19"
                            width="19"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M14.2234 4.74121L4.74115 14.2234"
                              stroke-linecap="round"
                              stroke-width="2"
                              stroke="#D5DCE8"
                            />
                            <path
                              d="M14.2234 14.2231L4.74115 4.74091"
                              stroke-linecap="round"
                              stroke-width="2"
                              stroke="#D5DCE8"
                            />
                          </svg>
                        )}
                      </a>
                    </li>
                  ))}
                  <li
                    className="nav-item"
                    style={{
                      padding: "0 8px",
                    }}
                  >
                    <svg
                      height="18"
                      onClick={() => openNewChartTab(orderData?.symbol?.value)}
                      style={{
                        backgroundColor: "transparent",
                        marginTop: "8px",
                        stroke: "var(--main-primary-button)",
                      }}
                      viewBox="0 0 24 24"
                      width="18"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 2L12 22"
                        stroke-linecap="round"
                        stroke-width="4"
                      />
                      <path
                        d="M22 12L2 12"
                        stroke-linecap="round"
                        stroke-width="4"
                      />
                    </svg>
                  </li>
                </ul>
                <div className="mobile-tabs">
                  <Dropdown>
                    <Dropdown.Toggle className="drpdwn" id="dropdown-basic">
                      {activeTab}
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      {tabs.map((tab) => (
                        <Dropdown.Item
                          onClick={() => {
                            getValue({
                              label: tab,
                              value: tab,
                            });
                            setActiveTab(tab);
                          }}
                        >
                          {tab}
                        </Dropdown.Item>
                      ))}
                    </Dropdown.Menu>
                  </Dropdown>
                </div>
                {tabs?.map((tab, i) => {
                  return (
                    <TradingView
                      hide={activeTab !== tab}
                      index={i}
                      key={tab}
                      locale="en"
                      plotLine={selectedOrder.symbolValue}
                      selectedSymbol={tab}
                      theme={theme}
                    />
                  );
                })}
              </div>
              <div id="newOrder" className={showNewOrderPanel ? "" : "d-none"}>
                <div id="newOrderData">
                  <h6>{t("newOrder")}</h6>
                  <form id="newOrderForm">
                    <Select
                      id="symbol-input"
                      options={dbSymbols.map((f) => ({
                        value: f.symbol,
                        label: f.symbol,
                      }))}
                      onChange={(e) => getValue(e)}
                      styles={{
                        container: (provided, state) => ({
                          ...provided,
                          backgroundColor: "var(--main-background-color)",
                          width: "90%",
                        }),
                        control: (provided) => ({
                          ...provided,
                          backgroundColor: "var(--main-secondary-color)",
                          borderColor: "transparent",
                          "&:hover": {
                            borderColor: "transparent",
                          },
                        }),
                        dropdownIndicator: (provided, state) => ({
                          ...provided,
                          backgroundColor: "inherit",
                        }),
                        indicatorsContainer: (provided, state) => ({
                          ...provided,
                          backgroundColor: "var(--main-secondary-color)",
                          borderColor: "transparent",
                        }),
                        indicatorSeparator: (provided, state) => ({
                          ...provided,
                          display: "none",
                        }),
                        option: (provided, state) => ({
                          ...provided,
                          cursor: "pointer",
                          backgroundColor:
                            state.isSelected && "var(--main-primary-button)",
                          "&:hover": {
                            backgroundColor:
                              !state.isSelected && "var(--main-text-color)",
                            color:
                              !state.isSelected &&
                              "var(--main-background-color)",
                          },
                        }),
                        singleValue: (provided) => ({
                          ...provided,
                          backgroundColor: "var(--main-secondary-color)",
                          color: "var(--main-text-color)",
                        }),
                        valueContainer: (provided, state) => ({
                          ...provided,
                          backgroundColor: "var(--main-secondary-color)",
                        }),
                      }}
                      theme={(theme) => {
                        return {
                          ...theme,
                          colors: {
                            ...theme.colors,
                            primary: "var(--main-primary-button)",
                          },
                        };
                      }}
                      isSearchable={false}
                      value={orderData.symbol}
                      selectedValue={orderData.symbol}
                    />
                    <ButtonGroup className="btn-group" style={{ width: "90%" }}>
                      <Button
                        onClick={() => setDealType("Buy")}
                        style={{
                          backgroundColor:
                            dealType === "Buy"
                              ? "var(--main-primary-button)"
                              : "var(--main-secondary-color)",
                        }}
                        variant=""
                      >
                        {t("buy").toUpperCase()}
                      </Button>
                      <Button
                        onClick={() => setDealType("Sell")}
                        style={{
                          backgroundColor:
                            dealType === "Sell"
                              ? "var(--main-secondary-button)"
                              : "var(--main-secondary-color)",
                        }}
                        variant=""
                      >
                        {t("sell").toUpperCase()}
                      </Button>
                    </ButtonGroup>
                    <svg
                      height="2"
                      style={{
                        margin: "8px 0",
                        stroke: "var(--main-secondary-color)",
                      }}
                      viewBox="0 0 300 2"
                      width="90%"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <line
                        stroke-width="2"
                        x1="8.74228e-08"
                        x2="300"
                        y1="1"
                        y2="1.00003"
                      />
                    </svg>
                    <div className="vol-group">
                      <div>
                        <label htmlFor="symbol-amount">{t("volume")}</label>
                        <div className="vol-input">
                          <span
                            onClick={() => {
                              setOrderData((p) => ({
                                ...p,
                                volume: Math.max(p.volume - 1, 0),
                              }));
                            }}
                            style={{
                              position: "relative",
                              right: "-8px",
                              top: "0.5px",
                            }}
                          >
                            -
                          </span>
                          <input
                            id="symbol-amount"
                            name="volume"
                            onChange={(e) => {
                              const { value } = e.target;
                              setOrderData((p) => ({
                                ...p,
                                volume: !value ? "" : parseFloat(value),
                              }));
                            }}
                            step={0.1}
                            type="number"
                            value={orderData.volume}
                          />
                          <span
                            onClick={() => {
                              setOrderData((p) => ({
                                ...p,
                                volume: parseInt(p.volume) + 1,
                              }));
                            }}
                            style={{
                              position: "relative",
                              right: "8px",
                              top: "0.5px",
                            }}
                          >
                            +
                          </span>
                        </div>
                      </div>
                      <div>
                        <label htmlFor="open-at">{t("openAt")}</label>
                        <div className="vol-input">
                          <span
                            disabled={!enableOpenPrice}
                            onClick={() => {
                              setOpenPriceValue(
                                Math.max(parseInt(openPriceValue) - 1, 0)
                              );
                            }}
                            style={{
                              position: "relative",
                              right: "-8px",
                              top: "0.5px",
                            }}
                          >
                            -
                          </span>
                          <input
                            className={enableOpenPrice ? "" : "disabled"}
                            disabled={!enableOpenPrice}
                            id="symbol-current-value"
                            name="symbolValue"
                            onChange={(e) => setOpenPriceValue(e.target.value)}
                            readOnly={!enableOpenPrice}
                            type="number"
                            value={
                              enableOpenPrice
                                ? openPriceValue
                                : +orderData?.symbolValue
                            }
                          />
                          <span
                            disabled={!enableOpenPrice}
                            onClick={() => {
                              setOpenPriceValue(parseInt(openPriceValue) + 1);
                            }}
                            style={{
                              position: "relative",
                              right: "8px",
                              top: "0.5px",
                            }}
                          >
                            +
                          </span>
                        </div>
                      </div>
                    </div>
                    <label className="margin-label">
                      {t("margin")}:{" "}
                      <span>{+calculatedSum?.toFixed(2)} USD</span>
                    </label>
                    <div className="d-flex gap-4 mt-2">
                      <div className="form-check">
                        <input
                          checked={!enableOpenPrice}
                          className="form-check-input"
                          id="market"
                          onClick={(e) => setEnableOpenPrice(false)}
                          type="radio"
                        />
                        <label
                          className="form-check-label m-0"
                          htmlFor="market"
                        >
                          {t("market")}
                        </label>
                      </div>
                      <div className="form-check">
                        <input
                          checked={enableOpenPrice}
                          className="form-check-input"
                          id="limit"
                          onClick={(e) => {
                            if (openPriceValue !== orderData.symbolValue)
                              setOpenPriceValue(
                                parseFloat(orderData.symbolValue)
                              );
                            setEnableOpenPrice(true);
                          }}
                          type="radio"
                        />
                        <label className="form-check-label m-0" htmlFor="limit">
                          {t("limit")}
                        </label>
                      </div>
                    </div>
                    <svg
                      height="2"
                      style={{
                        margin: "8px 0",
                        stroke: "var(--main-secondary-color)",
                      }}
                      viewBox="0 0 300 2"
                      width="90%"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <line
                        stroke-width="2"
                        x1="8.74228e-08"
                        x2="300"
                        y1="1"
                        y2="1.00003"
                      />
                    </svg>
                    <div className="vol-group">
                      <div>
                        <label htmlFor="take-profit">{t("takeProfit")}</label>
                        <div className="vol-input">
                          <span
                            onClick={() => {
                              setOrderData((p) => ({
                                ...p,
                                tp: Math.max(p.tp - 1, 0),
                              }));
                            }}
                            style={{
                              position: "relative",
                              right: "-8px",
                              top: "0.5px",
                            }}
                          >
                            -
                          </span>
                          <input
                            id="take-profit"
                            name="tp"
                            onChange={(e) => {
                              setOrderData({
                                ...orderData,
                                tp: e.target.value,
                              });
                            }}
                            step={0.1}
                            type="number"
                            value={orderData?.tp}
                          />
                          <span
                            onClick={() => {
                              setOrderData((p) => ({
                                ...p,
                                tp: parseInt(p.tp) + 1,
                              }));
                            }}
                            style={{
                              position: "relative",
                              right: "8px",
                              top: "0.5px",
                            }}
                          >
                            +
                          </span>
                        </div>
                      </div>
                      <div>
                        <label htmlFor="stop-loss">{t("stopLoss")}</label>
                        <div className="vol-input">
                          <span
                            onClick={() => {
                              setOrderData((p) => ({
                                ...p,
                                sl: Math.max(p.sl - 1, 0),
                              }));
                            }}
                            style={{
                              position: "relative",
                              right: "-8px",
                              top: "0.5px",
                            }}
                          >
                            -
                          </span>
                          <input
                            id="stop-loss"
                            name="sl"
                            onChange={(e) => {
                              setOrderData({
                                ...orderData,
                                sl: e.target.value,
                              });
                            }}
                            type="number"
                            value={orderData?.sl}
                          />
                          <span
                            onClick={() => {
                              setOrderData((p) => ({
                                ...p,
                                sl: parseInt(p.sl) + 1,
                              }));
                            }}
                            style={{
                              position: "relative",
                              right: "8px",
                              top: "0.5px",
                            }}
                          >
                            +
                          </span>
                        </div>
                      </div>
                    </div>
                    <svg
                      height="2"
                      style={{
                        margin: "8px 0",
                        stroke: "var(--main-secondary-color)",
                      }}
                      viewBox="0 0 300 2"
                      width="90%"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <line
                        stroke-width="2"
                        x1="8.74228e-08"
                        x2="300"
                        y1="1"
                        y2="1.00003"
                      />
                    </svg>
                    <div className="newOrderButton">
                      <button
                        onClick={(e) => {
                          placeOrder(e, dealType);
                        }}
                        style={{
                          backgroundColor:
                            dealType === "Buy"
                              ? "var(--main-primary-button)"
                              : "var(--main-secondary-button)",
                        }}
                        type="submit"
                      >
                        {dealType === "Buy"
                          ? t("buy").toUpperCase()
                          : t("sell").toUpperCase()}
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setOrderData({
                            sl: null,
                            symbol: null,
                            tp: null,
                            volume: 0,
                          });
                        }}
                        style={{
                          backgroundColor: "var(--main-secondary-color)",
                        }}
                      >
                        {t("cancel").toUpperCase()}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
            {tab === "trade" && (
              <div className="mobile-trade-box w-100 hide-on-desktop">
                <p className="title">{t("volume")}</p>
                <div className="inner-box">
                  <div className="left-box">
                    <Button
                      className="w-100"
                      onClick={() => {
                        setDealType("Buy");
                        setShowNewOrderPageMobile(false);
                        setShowNewOrderPanel(true);
                        setTab("newOrder");
                      }}
                      style={{
                        backgroundColor: "var(--main-primary-button)",
                      }}
                      variant=""
                    >
                      {t("buy").toUpperCase()}
                    </Button>
                  </div>
                  <div className="center-box">
                    <input
                      id="symbol-amount"
                      name="volume"
                      onChange={(e) => {
                        const { value } = e.target;
                        setOrderData((p) => ({
                          ...p,
                          volume: !value ? "" : parseFloat(value),
                        }));
                      }}
                      step={0.1}
                      type="number"
                      value={orderData.volume}
                    />
                  </div>
                  <div className="right-box">
                    <Button
                      className="w-100"
                      onClick={() => {
                        setDealType("Sell");
                        setShowNewOrderPageMobile(false);
                        setShowNewOrderPanel(true);
                        setTab("newOrder");
                      }}
                      style={{
                        backgroundColor: "var(--danger-color)",
                      }}
                      variant=""
                    >
                      {t("sell").toUpperCase()}
                    </Button>
                  </div>
                </div>
              </div>
            )}
            {!isMobileUI && (
              <div
                id="orders"
                style={{ height: isHidden ? "" : "38%", overflow: "auto" }}
              >
                <div className="orders-ext">
                  <div className="orders-side">
                    <button
                      onClick={() => {
                        setIsReportModalOpen(true);
                      }}
                      style={{ padding: "6px 18px" }}
                    >
                      {t("orderReport")}
                    </button>
                    <button
                      onClick={() => {
                        openOrderHistory();
                      }}
                      style={{ padding: "6px" }}
                    >
                      <svg
                        height="19"
                        style={{ fill: "var(--main-primary-button)" }}
                        viewBox="0 0 19 19"
                        width="19"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M16.6582 15.642L13.0796 12.0635L12.1199 13.0222L15.6995 16.6018L14.3478 17.9535L19 19.0001L17.9534 14.3467L16.6582 15.642Z" />
                        <path d="M4.65229 1.04663L0 0L1.04663 4.65337L2.39834 3.30166L5.97794 6.88126L6.9388 5.9204L3.35811 2.3408L4.65229 1.04663Z" />
                        <path d="M13.0502 6.9084L16.6288 3.3288L17.9533 4.65229L19 0L14.3466 1.04663L15.6712 2.37011L12.0916 5.94863L13.0502 6.9084Z" />
                        <path d="M5.94863 12.0903L2.36903 15.6699L1.04663 14.3475L0 18.9998L4.65337 17.9532L3.3288 16.6297L6.9084 13.0512L5.94863 12.0903Z" />
                      </svg>
                    </button>
                  </div>
                </div>
                {/* <div
                  style={{
                    alignItems: "center",
                    display: "flex",
                    height: isHidden ? "" : "16px",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ visibility: "hidden" }}></div>
                  {!isHidden && <div id="resize-bar"></div>}
                  <button
                    className="btn btn-secondary btn-sm px-4"
                    onClick={() => {
                      isHidden && setDealsRow(5);
                      setIsHidden(!isHidden);
                    }}
                  >
                    {isHidden ? "Show deals" : "Hide deals"}
                  </button>
                </div> */}
                {!isHidden && (
                  <Tabs
                    activeKey={dealsTab}
                    className="order-tabs"
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setShowColumnsModal(true);
                    }}
                    onSelect={(k) => setDealsTab(k)}
                  >
                    <Tab eventKey="activeTab" title={t("active")}>
                      <DataTable
                        columns={dealsColumns({
                          t,
                          handleEditModal,
                          handleCloseBtn,
                          showColumns,
                        })}
                        conditionalRowStyles={conditionalRowStylesOnOrders}
                        customStyles={customStylesOnDeals}
                        data={fillArrayWithEmptyRows(
                          activeOrders,
                          dealsRow -
                            (activeOrders.length % dealsRow) +
                            activeOrders.length
                        )}
                        dense
                        highlightOnHover
                        key={dealsRow}
                        onRowDoubleClicked={handleDoubleClickOnOrders}
                        pagination
                        paginationComponentOptions={{ noRowsPerPage: 1 }}
                        paginationPerPage={dealsRow}
                        paginationTotalRows={activeOrders.length}
                        pointerOnHover
                        responsive
                        theme={theme}
                      />
                    </Tab>
                    <Tab eventKey="delayedTab" title={t("delayed")}>
                      <DataTable
                        columns={dealsColumns({
                          t,
                          handleEditModal,
                          handleCloseBtn,
                          showColumns,
                        }).filter(({ name }) => name !== "Profit")}
                        conditionalRowStyles={conditionalRowStylesOnOrders}
                        customStyles={customStylesOnDeals}
                        data={fillArrayWithEmptyRows(
                          delayedOrders,
                          dealsRow -
                            (delayedOrders.length % dealsRow) +
                            delayedOrders.length
                        )}
                        dense
                        highlightOnHover
                        key={dealsRow}
                        pagination
                        paginationComponentOptions={{ noRowsPerPage: 1 }}
                        paginationPerPage={dealsRow}
                        paginationTotalRows={delayedOrders.length}
                        pointerOnHover
                        responsive
                        theme={theme}
                      />
                    </Tab>
                  </Tabs>
                )}
              </div>
            )}
            {/* New Order Page (Portfolio) */}
            {showNewOrderPageMobile && (
              <>
                <div className="mobile-stat-box hide-on-desktop">
                  <p className="title">{t("statistics")}</p>
                  <div className="row g-0 mobile-stat-row">
                    <div className="col-6">
                      <div className="stat-box">
                        <p className="name">{t("equity")}:</p>
                        <p
                          className={`balance-nums ${
                            equity < 0
                              ? "text-danger"
                              : equity === 0
                              ? "text-muted"
                              : ""
                          }`}
                        >
                          {+parseFloat(equity)?.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="stat-box">
                        <p className="name">{t("profit")}:</p>
                        <p
                          className={`balance-nums ${
                            activeOrdersProfit < 0
                              ? "text-danger"
                              : activeOrdersProfit === 0
                              ? "text-muted"
                              : ""
                          }`}
                        >
                          {+parseFloat(activeOrdersProfit)?.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="stat-box">
                        <p className="name">{t("freeMargin")}:</p>
                        <p
                          className={`balance-nums ${
                            freeMargin < 0
                              ? "text-danger"
                              : freeMargin === 0
                              ? "text-muted"
                              : ""
                          }`}
                        >
                          {+parseFloat(freeMargin)?.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="stat-box">
                        <p className="name">{t("margin")}:</p>
                        <p
                          className={`balance-nums ${
                            totalMargin < 0
                              ? "text-danger"
                              : totalMargin === 0
                              ? "text-muted"
                              : ""
                          }`}
                        >
                          {+parseFloat(totalMargin)?.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="stat-box">
                        <p className="name">{t("level")}:</p>
                        <p
                          className={`balance-nums ${
                            level < 0
                              ? "text-danger"
                              : level === 0
                              ? "text-muted"
                              : ""
                          }`}
                        >
                          {`${+parseFloat(level)?.toFixed(2)}%`}
                        </p>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="stat-box">
                        <p className="name">{t("balance")}:</p>
                        <p
                          className={`balance-nums ${
                            level < 0
                              ? "text-danger"
                              : level === 0
                              ? "text-muted"
                              : ""
                          }`}
                        >
                          {+parseFloat(totalBalance)?.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="orders-title hide-on-desktop">
                  {t("orderDetails")}
                </p>
                <div
                  id="orders"
                  style={{ height: isHidden ? "" : "38%", overflow: "auto" }}
                >
                  <div className="orders-ext">
                    <div className="orders-side">
                      <button
                        onClick={() => {
                          setIsReportModalOpen(true);
                        }}
                        style={{ padding: "6px 18px" }}
                      >
                        {t("orderReport")}
                      </button>
                      <button
                        onClick={() => {
                          openOrderHistory();
                        }}
                        style={{ padding: "6px" }}
                      >
                        <svg
                          height="19"
                          style={{ fill: "var(--main-primary-button)" }}
                          viewBox="0 0 19 19"
                          width="19"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M16.6582 15.642L13.0796 12.0635L12.1199 13.0222L15.6995 16.6018L14.3478 17.9535L19 19.0001L17.9534 14.3467L16.6582 15.642Z" />
                          <path d="M4.65229 1.04663L0 0L1.04663 4.65337L2.39834 3.30166L5.97794 6.88126L6.9388 5.9204L3.35811 2.3408L4.65229 1.04663Z" />
                          <path d="M13.0502 6.9084L16.6288 3.3288L17.9533 4.65229L19 0L14.3466 1.04663L15.6712 2.37011L12.0916 5.94863L13.0502 6.9084Z" />
                          <path d="M5.94863 12.0903L2.36903 15.6699L1.04663 14.3475L0 18.9998L4.65337 17.9532L3.3288 16.6297L6.9084 13.0512L5.94863 12.0903Z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  {!isHidden && (
                    <Tabs
                      activeKey={dealsTab}
                      className="order-tabs"
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setShowColumnsModal(true);
                      }}
                      onSelect={(k) => setDealsTab(k)}
                    >
                      <Tab eventKey="activeTab" title={t("active")}>
                        <DataTable
                          columns={dealsColumns({
                            t,
                            handleEditModal,
                            handleCloseBtn,
                            showColumns,
                          })}
                          conditionalRowStyles={conditionalRowStylesOnOrders}
                          customStyles={customStylesOnDeals}
                          data={fillArrayWithEmptyRows(
                            activeOrders,
                            dealsRow -
                              (activeOrders.length % dealsRow) +
                              activeOrders.length
                          )}
                          dense
                          highlightOnHover
                          key={dealsRow}
                          onRowDoubleClicked={handleDoubleClickOnOrders}
                          pagination
                          paginationComponentOptions={{ noRowsPerPage: 1 }}
                          paginationPerPage={dealsRow}
                          paginationTotalRows={activeOrders.length}
                          pointerOnHover
                          responsive
                          theme={theme}
                        />
                      </Tab>
                      <Tab eventKey="delayedTab" title={t("delayed")}>
                        <DataTable
                          columns={dealsColumns({
                            t,
                            handleEditModal,
                            handleCloseBtn,
                            showColumns,
                          }).filter(({ name }) => name !== "Profit")}
                          conditionalRowStyles={conditionalRowStylesOnOrders}
                          customStyles={customStylesOnDeals}
                          data={fillArrayWithEmptyRows(
                            delayedOrders,
                            dealsRow -
                              (delayedOrders.length % dealsRow) +
                              delayedOrders.length
                          )}
                          dense
                          highlightOnHover
                          key={dealsRow}
                          pagination
                          paginationComponentOptions={{ noRowsPerPage: 1 }}
                          paginationPerPage={dealsRow}
                          paginationTotalRows={delayedOrders.length}
                          pointerOnHover
                          responsive
                          theme={theme}
                        />
                      </Tab>
                    </Tabs>
                  )}
                </div>
                <div className="order-bnt-box hide-on-desktop">
                  <button
                    className="regular-dark-btn"
                    onClick={() => {
                      setShowNewOrderPageMobile(false);
                      setShowNewOrderPanel(true);
                    }}
                    type="button"
                  >
                    {t("newOrder")}
                  </button>
                </div>
              </>
            )}
          </div>
          {tab === "account" && (
            <div id="account" className="h-100">
              {accTab === "acc-info" && (
                <div id="account-profile">
                  <h1>{t("accountInfo")}</h1>
                  <div className="account-card">
                    {userProfile?.accounts?.length > 0 && (
                      <div className="acc-selection">
                        <label className="m-4" htmlFor="symbol-input">
                          {t("selectAccount")}
                        </label>
                        <Select
                          id="account-input"
                          onChange={handleAccountChange}
                          options={accounts
                            .filter((acc) => !acc?.isDeleted)
                            ?.map((account) => ({
                              label: `${account.account_no} ${account.account_type}`,
                              value: account.account_no,
                            }))}
                          value={{
                            label: `${defaultAccount.account_no} ${defaultAccount.account_type}`,
                            value: defaultAccount.account_no,
                          }}
                          styles={{
                            container: (provided, state) => ({ ...provided }),
                            control: (provided) => ({
                              ...provided,
                              backgroundColor: "inherit",
                            }),
                            dropdownIndicator: (provided, state) => ({
                              ...provided,
                              paddingBlock: 0,
                            }),
                            option: (provided, state) => ({
                              ...provided,
                              cursor: "pointer",
                              backgroundColor: state.isSelected
                                ? "var(--main-primary-button)"
                                : "unset",
                              color: "var(--main-text-color)",
                              "&:hover": {
                                backgroundColor: state.isSelected
                                  ? ""
                                  : "var(--main-primary-button)",
                              },
                            }),
                            singleValue: (provided) => ({
                              ...provided,
                              color: "var(--main-text-color)",
                            }),
                          }}
                          theme={(theme) => {
                            return {
                              ...theme,
                              colors: {
                                ...theme.colors,
                                primary: "var(--main-text-color)",
                              },
                            };
                          }}
                          isSearchable={false}
                        />
                      </div>
                    )}
                    <div className="acc-main-content">
                      <div className="acc-img-name">
                        <img
                          alt=""
                          height={120}
                          src={accPlaceholder}
                          width="auto"
                        />
                        <label>{userProfile.name}</label>
                        <label>{userProfile.surname}</label>
                        <label>
                          {t("status")}: <span>{t("verified")}</span>
                        </label>
                      </div>
                      <div className="account-sublink-box hide-on-desktop">
                        <ul>
                          <li>
                            <button
                              onClick={() => {
                                setShowAccounManagement(true);
                                setTab("");
                              }}
                              type="button"
                            >
                              <div className="">
                                <svg
                                  width="25"
                                  height="28"
                                  viewBox="0 0 25 28"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M19.2306 16.3768C18.1593 16.3768 17.1121 16.6945 16.2214 17.2897C15.3307 17.8848 14.6365 18.7307 14.2265 19.7205C13.8166 20.7102 13.7093 21.7992 13.9183 22.8499C14.1273 23.9006 14.6431 24.8657 15.4006 25.6232C16.1581 26.3807 17.1232 26.8965 18.1739 27.1055C19.2246 27.3145 20.3136 27.2073 21.3034 26.7973C22.2931 26.3873 23.139 25.6931 23.7342 24.8024C24.3293 23.9117 24.647 22.8645 24.647 21.7932C24.647 20.3567 24.0763 18.979 23.0606 17.9633C22.0448 16.9475 20.6671 16.3768 19.2306 16.3768ZM21.8484 22.5372H19.2311C19.0338 22.5372 18.8446 22.4588 18.705 22.3193C18.5655 22.1798 18.4871 21.9905 18.4871 21.7932V18.6423C18.4871 18.445 18.5655 18.2558 18.705 18.1162C18.8446 17.9767 19.0338 17.8983 19.2311 17.8983C19.4284 17.8983 19.6177 17.9767 19.7572 18.1162C19.8967 18.2558 19.9751 18.445 19.9751 18.6423V21.0492H21.8484C22.0458 21.0492 22.235 21.1276 22.3745 21.2671C22.5141 21.4067 22.5925 21.5959 22.5925 21.7932C22.5925 21.9905 22.5141 22.1798 22.3745 22.3193C22.235 22.4588 22.0458 22.5372 21.8484 22.5372Z"
                                    fill="white"
                                  />
                                  <path
                                    d="M22.0366 9.50422C21.6827 9.51325 21.3293 9.5191 20.9775 9.5191C19.4833 9.51863 17.9901 9.43898 16.5044 9.28048H16.4916C15.6057 9.17792 14.7379 8.73842 14.0406 8.0433C13.3434 7.34819 12.9066 6.47823 12.8035 5.59286C12.8037 5.58861 12.8037 5.58435 12.8035 5.5801C12.6061 3.73326 12.5308 1.8754 12.5781 0.0186376C9.7857 -0.0486681 6.99186 0.0663664 4.21441 0.363007C2.35917 0.578238 0.58046 2.35748 0.364697 4.21272C-0.121566 8.76446 -0.121566 17.2164 0.364697 21.7681C0.579928 23.6234 2.35917 25.4026 4.21441 25.6179C7.36412 25.955 10.5345 26.0582 13.6995 25.9266C13.029 25.0276 12.5869 23.9793 12.411 22.8717C12.2351 21.7642 12.3308 20.6304 12.6897 19.568H5.27516C5.07783 19.568 4.88859 19.4896 4.74906 19.3501C4.60953 19.2106 4.53115 19.0213 4.53115 18.824C4.53115 18.6267 4.60953 18.4374 4.74906 18.2979C4.88859 18.1584 5.07783 18.08 5.27516 18.08H13.4061C13.9971 17.1583 14.7964 16.3884 15.7396 15.8325H5.27516C5.07783 15.8325 4.88859 15.7542 4.74906 15.6146C4.60953 15.4751 4.53115 15.2859 4.53115 15.0885C4.53115 14.8912 4.60953 14.702 4.74906 14.5624C4.88859 14.4229 5.07783 14.3445 5.27516 14.3445H16.8073C17.0046 14.3445 17.1939 14.4229 17.3334 14.5624C17.4729 14.702 17.5513 14.8912 17.5513 15.0885V15.0928C19.056 14.7202 20.6419 14.8605 22.0579 15.4914C22.0988 13.515 22.0913 11.4418 22.0366 9.50422ZM13.0894 12.0976H5.27728C5.07996 12.0976 4.89072 12.0192 4.75119 11.8797C4.61166 11.7402 4.53327 11.5509 4.53327 11.3536C4.53327 11.1563 4.61166 10.967 4.75119 10.8275C4.89072 10.688 5.07996 10.6096 5.27728 10.6096H13.0894C13.2867 10.6096 13.4759 10.688 13.6155 10.8275C13.755 10.967 13.8334 11.1563 13.8334 11.3536C13.8334 11.5509 13.755 11.7402 13.6155 11.8797C13.4759 12.0192 13.2867 12.0976 13.0894 12.0976Z"
                                    fill="white"
                                  />
                                  <path
                                    d="M16.6552 7.86532C18.4256 8.05468 20.2066 8.12729 21.9866 8.08268L21.9823 8.07577C19.8802 4.90231 17.1658 2.18044 13.998 0.0697021C13.9521 1.85852 14.0247 3.64841 14.2154 5.42763C14.3514 6.60316 15.4791 7.73087 16.6552 7.86532Z"
                                    fill="white"
                                  />
                                </svg>
                                <p className="name">{t("accountManagement")}</p>
                              </div>
                              <div className="">
                                <svg
                                  width="10"
                                  height="19"
                                  viewBox="0 0 10 19"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M10 9.87471C10 10.2018 9.87995 10.5288 9.64036 10.7782L2.09719 18.6256C1.61736 19.1248 0.839379 19.1248 0.359734 18.6256C-0.119911 18.1266 -0.119911 17.3174 0.359734 16.8182L7.03435 9.87471L0.359966 2.9312C-0.119679 2.432 -0.119679 1.62289 0.359966 1.12393C0.839611 0.624495 1.61759 0.624494 2.09743 1.12393L9.6406 8.97119C9.88022 9.22069 10 9.54774 10 9.87471Z"
                                    fill="#CECECE"
                                  />
                                </svg>
                              </div>
                            </button>
                          </li>
                          <li>
                            <button
                              onClick={() => {
                                setShowNewOrderPageMobile(true);
                                setTab("newOrder");
                              }}
                              type="button"
                            >
                              <div className="">
                                <svg
                                  width="28"
                                  height="28"
                                  viewBox="0 0 28 28"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M11.1855 13.1152C12.9871 13.1152 14.5484 12.4666 15.8215 11.1936C17.0946 9.92047 17.7431 8.35914 17.7431 6.5576C17.7431 4.75606 17.0946 3.19473 15.8215 1.92164C14.5484 0.648554 12.9871 0 11.1855 0C9.38399 0 7.82266 0.648554 6.54957 1.92164C5.27648 3.19473 4.62793 4.75606 4.62793 6.5576C4.62793 8.35914 5.27648 9.92047 6.54957 11.1936C7.82266 12.4666 9.38399 13.1152 11.1855 13.1152Z"
                                    fill="white"
                                  />
                                  <path
                                    d="M12.1223 23.1958V17.1746C12.1223 16.3659 12.2905 15.6774 12.5707 15.0848C12.1704 15.1729 11.762 15.237 11.3617 15.237C10.7772 15.237 10.1847 15.1409 9.6082 14.9567C9.0157 14.7646 8.52728 14.5484 8.17498 14.3242C7.75862 14.06 7.39031 13.8198 7.06203 13.6116C6.54158 13.2753 6.27736 13.1632 5.99712 13.1632C5.29252 13.1632 4.62795 13.2833 4.02744 13.5155C3.42693 13.7557 2.91449 14.076 2.49013 14.4843C2.08178 14.8687 1.72147 15.3411 1.41721 15.8775C1.12096 16.398 0.880752 16.9424 0.704602 17.4869C0.536458 18.0153 0.392335 18.5998 0.280239 19.2164C0.168144 19.8249 0.096082 20.4094 0.0560478 20.9378C0.0160137 21.4583 0 22.0028 0 22.5472C0 23.9644 0.448383 25.1174 1.34515 25.9661C2.2259 26.8069 3.38689 27.2312 4.8041 27.2312H15.0609C13.2113 26.7988 12.1223 25.3736 12.1223 23.2038V23.1958Z"
                                    fill="white"
                                  />
                                  <path
                                    d="M23.7083 12.9391H17.6871C15.0689 12.9391 13.5076 14.5004 13.5076 17.1187V23.1398C13.5076 25.758 15.0689 27.3194 17.6871 27.3194H23.7083C26.3265 27.3194 27.8878 25.758 27.8878 23.1398V17.1187C27.8878 14.5004 26.3265 12.9391 23.7083 12.9391ZM19.2325 22.211L17.6151 23.8284C17.511 23.9325 17.3669 23.9885 17.2307 23.9885C17.0946 23.9885 16.9505 23.9405 16.8464 23.8284L16.31 23.2919C16.0938 23.0837 16.0938 22.7395 16.31 22.5313C16.5181 22.3231 16.8544 22.3231 17.0706 22.5313L17.2307 22.6914L18.4638 21.4584C18.672 21.2502 19.0083 21.2502 19.2244 21.4584C19.4326 21.6665 19.4326 22.0108 19.2244 22.219L19.2325 22.211ZM19.2325 17.1827L17.6151 18.8001C17.511 18.9042 17.3669 18.9602 17.2307 18.9602C17.0946 18.9602 16.9505 18.9122 16.8464 18.8001L16.31 18.2636C16.0938 18.0555 16.0938 17.7112 16.31 17.503C16.5181 17.2948 16.8544 17.2948 17.0706 17.503L17.2307 17.6631L18.4638 16.4301C18.672 16.2219 19.0083 16.2219 19.2244 16.4301C19.4326 16.6382 19.4326 16.9825 19.2244 17.1907L19.2325 17.1827ZM24.6931 23.4521H20.9219C20.6256 23.4521 20.3854 23.2039 20.3854 22.9156C20.3854 22.6274 20.6337 22.3791 20.9219 22.3791H24.6931C24.9974 22.3791 25.2296 22.6274 25.2296 22.9156C25.2296 23.2039 24.9894 23.4521 24.6931 23.4521ZM24.6931 18.4158H20.9219C20.6256 18.4158 20.3854 18.1676 20.3854 17.8793C20.3854 17.5911 20.6337 17.3428 20.9219 17.3428H24.6931C24.9974 17.3428 25.2296 17.5911 25.2296 17.8793C25.2296 18.1676 24.9894 18.4158 24.6931 18.4158Z"
                                    fill="white"
                                  />
                                </svg>
                                <p className="name">{t("portfolio")}</p>
                              </div>
                              <div className="">
                                <svg
                                  width="10"
                                  height="19"
                                  viewBox="0 0 10 19"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M10 9.87471C10 10.2018 9.87995 10.5288 9.64036 10.7782L2.09719 18.6256C1.61736 19.1248 0.839379 19.1248 0.359734 18.6256C-0.119911 18.1266 -0.119911 17.3174 0.359734 16.8182L7.03435 9.87471L0.359966 2.9312C-0.119679 2.432 -0.119679 1.62289 0.359966 1.12393C0.839611 0.624495 1.61759 0.624494 2.09743 1.12393L9.6406 8.97119C9.88022 9.22069 10 9.54774 10 9.87471Z"
                                    fill="#CECECE"
                                  />
                                </svg>
                              </div>
                            </button>
                          </li>
                          <li>
                            <button
                              onClick={() => {
                                setAccTab("personal-info");
                                setTab("account");
                              }}
                              type="button"
                            >
                              <div className="">
                                <svg
                                  width="29"
                                  height="28"
                                  viewBox="0 0 29 28"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <g clip-path="url(#clip0_19_2234)">
                                    <path
                                      d="M11.1855 13.1152C12.9871 13.1152 14.5484 12.4666 15.8215 11.1936C17.0946 9.92047 17.7431 8.35914 17.7431 6.5576C17.7431 4.75606 17.0946 3.19473 15.8215 1.92164C14.5484 0.648554 12.9871 0 11.1855 0C9.38399 0 7.82266 0.648554 6.54957 1.92164C5.27648 3.19473 4.62793 4.75606 4.62793 6.5576C4.62793 8.35914 5.27648 9.92047 6.54957 11.1936C7.82266 12.4666 9.38399 13.1152 11.1855 13.1152Z"
                                      fill="white"
                                    />
                                    <path
                                      d="M14.3723 25.75C12.843 24.2207 12.0663 22.3471 12.0663 20.1853C12.0663 18.0234 12.843 16.1498 14.3723 14.6205C14.6605 14.3323 14.9648 14.0761 15.277 13.8439C15.0529 13.988 14.8126 14.1481 14.5484 14.3163C14.1881 14.5405 13.7077 14.7566 13.1152 14.9488C12.5307 15.141 11.9382 15.229 11.3617 15.229C10.7852 15.229 10.1847 15.133 9.6082 14.9488C9.0157 14.7566 8.52728 14.5405 8.17498 14.3163C7.75862 14.052 7.39031 13.8118 7.06203 13.6037C6.54158 13.2674 6.27736 13.1553 5.99712 13.1553C5.29252 13.1553 4.62795 13.2754 4.02744 13.5076C3.42693 13.7478 2.91449 14.0681 2.49013 14.4764C2.08178 14.8607 1.72147 15.3331 1.41721 15.8696C1.12096 16.39 0.880752 16.9345 0.704602 17.479C0.536458 18.0074 0.392335 18.5919 0.280239 19.2084C0.168144 19.817 0.096082 20.4015 0.0560478 20.9299C0.0160137 21.4504 0 21.9948 0 22.5393C0 23.9565 0.448383 25.1095 1.34515 25.9582C2.2259 26.7989 3.38689 27.2233 4.8041 27.2233H16.39C15.6694 26.855 14.9888 26.3666 14.3723 25.75Z"
                                      fill="white"
                                    />
                                    <path
                                      fill-rule="evenodd"
                                      clip-rule="evenodd"
                                      d="M20.8738 12.859C16.8304 12.859 13.5396 16.1418 13.5396 20.1933C13.5396 24.2447 16.8224 27.5275 20.8738 27.5275C24.9253 27.5275 28.2081 24.2447 28.2081 20.1933C28.2081 16.1418 24.9253 12.859 20.8738 12.859ZM19.8249 20.1853V23.6762C19.8249 24.2527 20.2973 24.7251 20.8738 24.7251C21.4503 24.7251 21.9227 24.2527 21.9227 23.6762V20.1853C21.9227 19.6088 21.4503 19.1364 20.8738 19.1364C20.2973 19.1364 19.8249 19.6088 19.8249 20.1853ZM20.8738 15.6454C21.6425 15.6454 22.267 16.2699 22.267 17.0386C22.267 17.8072 21.6425 18.4318 20.8738 18.4318C20.1052 18.4318 19.4806 17.8072 19.4806 17.0386C19.4806 16.2699 20.1052 15.6454 20.8738 15.6454Z"
                                      fill="white"
                                    />
                                  </g>
                                  <defs>
                                    <clipPath id="clip0_19_2234">
                                      <rect
                                        width="28.2081"
                                        height="27.5195"
                                        fill="white"
                                      />
                                    </clipPath>
                                  </defs>
                                </svg>
                                <p className="name">{t("personalInfo")}</p>
                              </div>
                              <div className="">
                                <svg
                                  width="10"
                                  height="19"
                                  viewBox="0 0 10 19"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M10 9.87471C10 10.2018 9.87995 10.5288 9.64036 10.7782L2.09719 18.6256C1.61736 19.1248 0.839379 19.1248 0.359734 18.6256C-0.119911 18.1266 -0.119911 17.3174 0.359734 16.8182L7.03435 9.87471L0.359966 2.9312C-0.119679 2.432 -0.119679 1.62289 0.359966 1.12393C0.839611 0.624495 1.61759 0.624494 2.09743 1.12393L9.6406 8.97119C9.88022 9.22069 10 9.54774 10 9.87471Z"
                                    fill="#CECECE"
                                  />
                                </svg>
                              </div>
                            </button>
                          </li>
                          <li>
                            <button
                              onClick={() => {
                                setAccTab("deposit");
                                setTab("account");
                              }}
                              type="button"
                            >
                              <div className="">
                                <svg
                                  width="25"
                                  height="28"
                                  viewBox="0 0 25 28"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M19.2306 16.3768C18.1593 16.3768 17.1121 16.6945 16.2214 17.2897C15.3307 17.8848 14.6365 18.7307 14.2265 19.7205C13.8166 20.7102 13.7093 21.7992 13.9183 22.8499C14.1273 23.9006 14.6431 24.8657 15.4006 25.6232C16.1581 26.3807 17.1232 26.8965 18.1739 27.1055C19.2246 27.3145 20.3136 27.2073 21.3034 26.7973C22.2931 26.3873 23.139 25.6931 23.7342 24.8024C24.3293 23.9117 24.647 22.8645 24.647 21.7932C24.647 20.3567 24.0763 18.979 23.0606 17.9633C22.0448 16.9475 20.6671 16.3768 19.2306 16.3768ZM21.8484 22.5372H19.2311C19.0338 22.5372 18.8446 22.4588 18.705 22.3193C18.5655 22.1798 18.4871 21.9905 18.4871 21.7932V18.6423C18.4871 18.445 18.5655 18.2558 18.705 18.1162C18.8446 17.9767 19.0338 17.8983 19.2311 17.8983C19.4284 17.8983 19.6177 17.9767 19.7572 18.1162C19.8967 18.2558 19.9751 18.445 19.9751 18.6423V21.0492H21.8484C22.0458 21.0492 22.235 21.1276 22.3745 21.2671C22.5141 21.4067 22.5925 21.5959 22.5925 21.7932C22.5925 21.9905 22.5141 22.1798 22.3745 22.3193C22.235 22.4588 22.0458 22.5372 21.8484 22.5372Z"
                                    fill="white"
                                  />
                                  <path
                                    d="M22.0366 9.50422C21.6827 9.51325 21.3293 9.5191 20.9775 9.5191C19.4833 9.51863 17.9901 9.43898 16.5044 9.28048H16.4916C15.6057 9.17792 14.7379 8.73842 14.0406 8.0433C13.3434 7.34819 12.9066 6.47823 12.8035 5.59286C12.8037 5.58861 12.8037 5.58435 12.8035 5.5801C12.6061 3.73326 12.5308 1.8754 12.5781 0.0186376C9.7857 -0.0486681 6.99186 0.0663664 4.21441 0.363007C2.35917 0.578238 0.58046 2.35748 0.364697 4.21272C-0.121566 8.76446 -0.121566 17.2164 0.364697 21.7681C0.579928 23.6234 2.35917 25.4026 4.21441 25.6179C7.36412 25.955 10.5345 26.0582 13.6995 25.9266C13.029 25.0276 12.5869 23.9793 12.411 22.8717C12.2351 21.7642 12.3308 20.6304 12.6897 19.568H5.27516C5.07783 19.568 4.88859 19.4896 4.74906 19.3501C4.60953 19.2106 4.53115 19.0213 4.53115 18.824C4.53115 18.6267 4.60953 18.4374 4.74906 18.2979C4.88859 18.1584 5.07783 18.08 5.27516 18.08H13.4061C13.9971 17.1583 14.7964 16.3884 15.7396 15.8325H5.27516C5.07783 15.8325 4.88859 15.7542 4.74906 15.6146C4.60953 15.4751 4.53115 15.2859 4.53115 15.0885C4.53115 14.8912 4.60953 14.702 4.74906 14.5624C4.88859 14.4229 5.07783 14.3445 5.27516 14.3445H16.8073C17.0046 14.3445 17.1939 14.4229 17.3334 14.5624C17.4729 14.702 17.5513 14.8912 17.5513 15.0885V15.0928C19.056 14.7202 20.6419 14.8605 22.0579 15.4914C22.0988 13.515 22.0913 11.4418 22.0366 9.50422ZM13.0894 12.0976H5.27728C5.07996 12.0976 4.89072 12.0192 4.75119 11.8797C4.61166 11.7402 4.53327 11.5509 4.53327 11.3536C4.53327 11.1563 4.61166 10.967 4.75119 10.8275C4.89072 10.688 5.07996 10.6096 5.27728 10.6096H13.0894C13.2867 10.6096 13.4759 10.688 13.6155 10.8275C13.755 10.967 13.8334 11.1563 13.8334 11.3536C13.8334 11.5509 13.755 11.7402 13.6155 11.8797C13.4759 12.0192 13.2867 12.0976 13.0894 12.0976Z"
                                    fill="white"
                                  />
                                  <path
                                    d="M16.6552 7.86532C18.4256 8.05468 20.2066 8.12729 21.9866 8.08268L21.9823 8.07577C19.8802 4.90231 17.1658 2.18044 13.998 0.0697021C13.9521 1.85852 14.0247 3.64841 14.2154 5.42763C14.3514 6.60316 15.4791 7.73087 16.6552 7.86532Z"
                                    fill="white"
                                  />
                                </svg>
                                <p className="name">{t("deposit")}</p>
                              </div>
                              <div className="">
                                <svg
                                  width="10"
                                  height="19"
                                  viewBox="0 0 10 19"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M10 9.87471C10 10.2018 9.87995 10.5288 9.64036 10.7782L2.09719 18.6256C1.61736 19.1248 0.839379 19.1248 0.359734 18.6256C-0.119911 18.1266 -0.119911 17.3174 0.359734 16.8182L7.03435 9.87471L0.359966 2.9312C-0.119679 2.432 -0.119679 1.62289 0.359966 1.12393C0.839611 0.624495 1.61759 0.624494 2.09743 1.12393L9.6406 8.97119C9.88022 9.22069 10 9.54774 10 9.87471Z"
                                    fill="#CECECE"
                                  />
                                </svg>
                              </div>
                            </button>
                          </li>
                          <li>
                            <button
                              onClick={() => {
                                setAccTab("deposit");
                                setTab("account");
                              }}
                              type="button"
                            >
                              <div className="">
                                <svg
                                  width="25"
                                  height="28"
                                  viewBox="0 0 25 28"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M19.2306 16.3768C18.1593 16.3768 17.1121 16.6945 16.2214 17.2897C15.3307 17.8848 14.6365 18.7307 14.2265 19.7205C13.8166 20.7102 13.7093 21.7992 13.9183 22.8499C14.1273 23.9006 14.6431 24.8657 15.4006 25.6232C16.1581 26.3807 17.1232 26.8965 18.1739 27.1055C19.2246 27.3145 20.3136 27.2073 21.3034 26.7973C22.2931 26.3873 23.139 25.6931 23.7342 24.8024C24.3293 23.9117 24.647 22.8645 24.647 21.7932C24.647 20.3567 24.0763 18.979 23.0606 17.9633C22.0448 16.9475 20.6671 16.3768 19.2306 16.3768ZM21.8484 22.5372H19.2311C19.0338 22.5372 18.8446 22.4588 18.705 22.3193C18.5655 22.1798 18.4871 21.9905 18.4871 21.7932V18.6423C18.4871 18.445 18.5655 18.2558 18.705 18.1162C18.8446 17.9767 19.0338 17.8983 19.2311 17.8983C19.4284 17.8983 19.6177 17.9767 19.7572 18.1162C19.8967 18.2558 19.9751 18.445 19.9751 18.6423V21.0492H21.8484C22.0458 21.0492 22.235 21.1276 22.3745 21.2671C22.5141 21.4067 22.5925 21.5959 22.5925 21.7932C22.5925 21.9905 22.5141 22.1798 22.3745 22.3193C22.235 22.4588 22.0458 22.5372 21.8484 22.5372Z"
                                    fill="white"
                                  />
                                  <path
                                    d="M22.0366 9.50422C21.6827 9.51325 21.3293 9.5191 20.9775 9.5191C19.4833 9.51863 17.9901 9.43898 16.5044 9.28048H16.4916C15.6057 9.17792 14.7379 8.73842 14.0406 8.0433C13.3434 7.34819 12.9066 6.47823 12.8035 5.59286C12.8037 5.58861 12.8037 5.58435 12.8035 5.5801C12.6061 3.73326 12.5308 1.8754 12.5781 0.0186376C9.7857 -0.0486681 6.99186 0.0663664 4.21441 0.363007C2.35917 0.578238 0.58046 2.35748 0.364697 4.21272C-0.121566 8.76446 -0.121566 17.2164 0.364697 21.7681C0.579928 23.6234 2.35917 25.4026 4.21441 25.6179C7.36412 25.955 10.5345 26.0582 13.6995 25.9266C13.029 25.0276 12.5869 23.9793 12.411 22.8717C12.2351 21.7642 12.3308 20.6304 12.6897 19.568H5.27516C5.07783 19.568 4.88859 19.4896 4.74906 19.3501C4.60953 19.2106 4.53115 19.0213 4.53115 18.824C4.53115 18.6267 4.60953 18.4374 4.74906 18.2979C4.88859 18.1584 5.07783 18.08 5.27516 18.08H13.4061C13.9971 17.1583 14.7964 16.3884 15.7396 15.8325H5.27516C5.07783 15.8325 4.88859 15.7542 4.74906 15.6146C4.60953 15.4751 4.53115 15.2859 4.53115 15.0885C4.53115 14.8912 4.60953 14.702 4.74906 14.5624C4.88859 14.4229 5.07783 14.3445 5.27516 14.3445H16.8073C17.0046 14.3445 17.1939 14.4229 17.3334 14.5624C17.4729 14.702 17.5513 14.8912 17.5513 15.0885V15.0928C19.056 14.7202 20.6419 14.8605 22.0579 15.4914C22.0988 13.515 22.0913 11.4418 22.0366 9.50422ZM13.0894 12.0976H5.27728C5.07996 12.0976 4.89072 12.0192 4.75119 11.8797C4.61166 11.7402 4.53327 11.5509 4.53327 11.3536C4.53327 11.1563 4.61166 10.967 4.75119 10.8275C4.89072 10.688 5.07996 10.6096 5.27728 10.6096H13.0894C13.2867 10.6096 13.4759 10.688 13.6155 10.8275C13.755 10.967 13.8334 11.1563 13.8334 11.3536C13.8334 11.5509 13.755 11.7402 13.6155 11.8797C13.4759 12.0192 13.2867 12.0976 13.0894 12.0976Z"
                                    fill="white"
                                  />
                                  <path
                                    d="M16.6552 7.86532C18.4256 8.05468 20.2066 8.12729 21.9866 8.08268L21.9823 8.07577C19.8802 4.90231 17.1658 2.18044 13.998 0.0697021C13.9521 1.85852 14.0247 3.64841 14.2154 5.42763C14.3514 6.60316 15.4791 7.73087 16.6552 7.86532Z"
                                    fill="white"
                                  />
                                </svg>
                                <p className="name">{t("withdraw")}</p>
                              </div>
                              <div className="">
                                <svg
                                  width="10"
                                  height="19"
                                  viewBox="0 0 10 19"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M10 9.87471C10 10.2018 9.87995 10.5288 9.64036 10.7782L2.09719 18.6256C1.61736 19.1248 0.839379 19.1248 0.359734 18.6256C-0.119911 18.1266 -0.119911 17.3174 0.359734 16.8182L7.03435 9.87471L0.359966 2.9312C-0.119679 2.432 -0.119679 1.62289 0.359966 1.12393C0.839611 0.624495 1.61759 0.624494 2.09743 1.12393L9.6406 8.97119C9.88022 9.22069 10 9.54774 10 9.87471Z"
                                    fill="#CECECE"
                                  />
                                </svg>
                              </div>
                            </button>
                          </li>
                          <li>
                            <button
                              onClick={() => {
                                setIsReportModalOpen(true);
                              }}
                              type="button"
                            >
                              <div className="">
                                <svg
                                  width="25"
                                  height="28"
                                  viewBox="0 0 25 28"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M19.2306 16.3768C18.1593 16.3768 17.1121 16.6945 16.2214 17.2897C15.3307 17.8848 14.6365 18.7307 14.2265 19.7205C13.8166 20.7102 13.7093 21.7992 13.9183 22.8499C14.1273 23.9006 14.6431 24.8657 15.4006 25.6232C16.1581 26.3807 17.1232 26.8965 18.1739 27.1055C19.2246 27.3145 20.3136 27.2073 21.3034 26.7973C22.2931 26.3873 23.139 25.6931 23.7342 24.8024C24.3293 23.9117 24.647 22.8645 24.647 21.7932C24.647 20.3567 24.0763 18.979 23.0606 17.9633C22.0448 16.9475 20.6671 16.3768 19.2306 16.3768ZM21.8484 22.5372H19.2311C19.0338 22.5372 18.8446 22.4588 18.705 22.3193C18.5655 22.1798 18.4871 21.9905 18.4871 21.7932V18.6423C18.4871 18.445 18.5655 18.2558 18.705 18.1162C18.8446 17.9767 19.0338 17.8983 19.2311 17.8983C19.4284 17.8983 19.6177 17.9767 19.7572 18.1162C19.8967 18.2558 19.9751 18.445 19.9751 18.6423V21.0492H21.8484C22.0458 21.0492 22.235 21.1276 22.3745 21.2671C22.5141 21.4067 22.5925 21.5959 22.5925 21.7932C22.5925 21.9905 22.5141 22.1798 22.3745 22.3193C22.235 22.4588 22.0458 22.5372 21.8484 22.5372Z"
                                    fill="white"
                                  />
                                  <path
                                    d="M22.0366 9.50422C21.6827 9.51325 21.3293 9.5191 20.9775 9.5191C19.4833 9.51863 17.9901 9.43898 16.5044 9.28048H16.4916C15.6057 9.17792 14.7379 8.73842 14.0406 8.0433C13.3434 7.34819 12.9066 6.47823 12.8035 5.59286C12.8037 5.58861 12.8037 5.58435 12.8035 5.5801C12.6061 3.73326 12.5308 1.8754 12.5781 0.0186376C9.7857 -0.0486681 6.99186 0.0663664 4.21441 0.363007C2.35917 0.578238 0.58046 2.35748 0.364697 4.21272C-0.121566 8.76446 -0.121566 17.2164 0.364697 21.7681C0.579928 23.6234 2.35917 25.4026 4.21441 25.6179C7.36412 25.955 10.5345 26.0582 13.6995 25.9266C13.029 25.0276 12.5869 23.9793 12.411 22.8717C12.2351 21.7642 12.3308 20.6304 12.6897 19.568H5.27516C5.07783 19.568 4.88859 19.4896 4.74906 19.3501C4.60953 19.2106 4.53115 19.0213 4.53115 18.824C4.53115 18.6267 4.60953 18.4374 4.74906 18.2979C4.88859 18.1584 5.07783 18.08 5.27516 18.08H13.4061C13.9971 17.1583 14.7964 16.3884 15.7396 15.8325H5.27516C5.07783 15.8325 4.88859 15.7542 4.74906 15.6146C4.60953 15.4751 4.53115 15.2859 4.53115 15.0885C4.53115 14.8912 4.60953 14.702 4.74906 14.5624C4.88859 14.4229 5.07783 14.3445 5.27516 14.3445H16.8073C17.0046 14.3445 17.1939 14.4229 17.3334 14.5624C17.4729 14.702 17.5513 14.8912 17.5513 15.0885V15.0928C19.056 14.7202 20.6419 14.8605 22.0579 15.4914C22.0988 13.515 22.0913 11.4418 22.0366 9.50422ZM13.0894 12.0976H5.27728C5.07996 12.0976 4.89072 12.0192 4.75119 11.8797C4.61166 11.7402 4.53327 11.5509 4.53327 11.3536C4.53327 11.1563 4.61166 10.967 4.75119 10.8275C4.89072 10.688 5.07996 10.6096 5.27728 10.6096H13.0894C13.2867 10.6096 13.4759 10.688 13.6155 10.8275C13.755 10.967 13.8334 11.1563 13.8334 11.3536C13.8334 11.5509 13.755 11.7402 13.6155 11.8797C13.4759 12.0192 13.2867 12.0976 13.0894 12.0976Z"
                                    fill="white"
                                  />
                                  <path
                                    d="M16.6552 7.86532C18.4256 8.05468 20.2066 8.12729 21.9866 8.08268L21.9823 8.07577C19.8802 4.90231 17.1658 2.18044 13.998 0.0697021C13.9521 1.85852 14.0247 3.64841 14.2154 5.42763C14.3514 6.60316 15.4791 7.73087 16.6552 7.86532Z"
                                    fill="white"
                                  />
                                </svg>
                                <p className="name">{t("reports")}</p>
                              </div>
                              <div className="">
                                <svg
                                  width="10"
                                  height="19"
                                  viewBox="0 0 10 19"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M10 9.87471C10 10.2018 9.87995 10.5288 9.64036 10.7782L2.09719 18.6256C1.61736 19.1248 0.839379 19.1248 0.359734 18.6256C-0.119911 18.1266 -0.119911 17.3174 0.359734 16.8182L7.03435 9.87471L0.359966 2.9312C-0.119679 2.432 -0.119679 1.62289 0.359966 1.12393C0.839611 0.624495 1.61759 0.624494 2.09743 1.12393L9.6406 8.97119C9.88022 9.22069 10 9.54774 10 9.87471Z"
                                    fill="#CECECE"
                                  />
                                </svg>
                              </div>
                            </button>
                          </li>
                        </ul>
                      </div>
                      <div id="acc-profile-main">
                        <div className="acc-profile-main-item">
                          <h6>{t("balance")} (USD):</h6>
                          <h6>{+parseFloat(totalBalance)?.toFixed(2)}</h6>
                        </div>
                        <hr />
                        <div className="acc-profile-main-item">
                          <h6>{t("free")} (USD):</h6>
                          <h6>{+parseFloat(freeMargin - bonus)?.toFixed(2)}</h6>
                        </div>
                        <hr />
                        <div className="acc-profile-main-item">
                          <h6>{t("bonus")} (USD):</h6>
                          <h6>{+parseFloat(bonus)?.toFixed(2)}</h6>
                        </div>
                        <hr />
                        <div className="acc-profile-main-item">
                          <h6>{t("deposited")} (USD):</h6>
                          <h6>
                            {accountDeposits
                              .filter(({ type }) => type === "Deposit")
                              .reduce((p, { sum }) => p + +sum, 0)}
                          </h6>
                        </div>
                        <hr />
                        <div className="acc-profile-main-item">
                          <h6>{t("withdrawn")} (USD):</h6>
                          <h6>
                            {accountDeposits
                              .filter(({ type }) => type === "Withdraw")
                              .reduce((p, { sum }) => p + +sum, 0)}
                          </h6>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="hide-on-desktop mb-5">
                    <button type="button" className="logout-btn">
                      <svg
                        width="19"
                        height="18"
                        viewBox="0 0 19 18"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M18.7102 9.28113L12.8653 14.4766C12.5858 14.7232 12.146 14.5259 12.146 14.1519V11.065H5.72158C5.24478 11.065 4.85841 10.6786 4.85841 10.2018V7.06977C4.85841 6.59297 5.24478 6.2066 5.72158 6.2066H12.146V3.11974C12.146 2.7457 12.5858 2.5484 12.8653 2.79913L18.7102 7.99459C19.0966 8.33575 19.0966 8.93997 18.7102 9.28113ZM0.863169 17.2757H6.42445C6.90124 17.2757 7.28762 16.8893 7.28762 16.4125V14.8999C7.28762 14.4231 6.90124 14.0368 6.42445 14.0368H3.23894V3.23483H6.42445C6.90124 3.23483 7.28762 2.84846 7.28762 2.37166V0.863169C7.28762 0.386371 6.90124 0 6.42445 0H0.863169C0.386371 0 0 0.386371 0 0.863169V16.4125C0 16.8893 0.386371 17.2757 0.863169 17.2757Z"
                          fill="white"
                        />
                      </svg>
                      {t("logOut")}
                    </button>
                  </div>
                  <button
                    className="hide-on-mobile"
                    id="create-account-button"
                    onClick={() => setShowAccountModal(true)}
                  >
                    {t("createNewAccount")}
                  </button>
                </div>
              )}
              {accTab === "personal-info" && (
                <div id="personal-info">
                  <div className="personal-info-options">
                    <ButtonGroup className="btn-group">
                      <Button
                        onClick={() => {
                          setPersonalInfoTab("personal-info");
                        }}
                        style={{
                          backgroundColor:
                            personalInfoTab === "personal-info"
                              ? "var(--main-primary-button)"
                              : "var(--main-secondary-color)",
                        }}
                        variant=""
                      >
                        {t("personalInfo")}
                      </Button>
                      <Button
                        onClick={() => {
                          setPersonalInfoTab("verification");
                        }}
                        style={{
                          backgroundColor:
                            personalInfoTab === "verification"
                              ? "var(--main-primary-button)"
                              : "var(--main-secondary-color)",
                        }}
                        variant=""
                      >
                        {t("verification")}
                      </Button>
                      <Button
                        onClick={() => {
                          setPersonalInfoTab("change-pass");
                        }}
                        style={{
                          backgroundColor:
                            personalInfoTab === "change-pass"
                              ? "var(--main-primary-button)"
                              : "var(--main-secondary-color)",
                        }}
                        variant=""
                      >
                        {t("changePassword")}
                      </Button>
                    </ButtonGroup>
                  </div>
                  {personalInfoTab === "personal-info" && (
                    <div id="acc-info-personal">
                      <div className="acc-info-personal-item">
                        <h6>{t("name")}:</h6>
                        <input
                          name="name"
                          onChange={(e) => handleChange(e)}
                          readOnly={!isEditable}
                          type="text"
                          value={userProfile?.name}
                        />
                      </div>
                      <div className="acc-info-personal-item">
                        <h6>{t("surname")}:</h6>
                        <input
                          name="surname"
                          onChange={(e) => handleChange(e)}
                          placeholder="Surname"
                          readOnly={!isEditable}
                          type="text"
                          value={userProfile?.surname}
                        />
                      </div>
                      <div className="acc-info-personal-item">
                        <h6>{t("email")}:</h6>
                        <input
                          id="userEmail"
                          name="email"
                          placeholder=""
                          readOnly
                          type="text"
                          value={userProfile?.email}
                        />
                      </div>
                      <div className="acc-info-personal-item">
                        <h6>{t("phone")}:</h6>
                        <input
                          name="phone"
                          onChange={(e) => handleChange(e)}
                          placeholder="+7777038475"
                          readOnly={!isEditable}
                          type="number"
                          value={userProfile?.phone}
                        />
                      </div>
                      <div className="acc-info-personal-item">
                        <h6>{t("password")}:</h6>
                        <div
                          className="position-relative"
                          style={{ backgroundColor: "inherit" }}
                        >
                          <input
                            name="password"
                            onChange={(e) => handleChange(e)}
                            placeholder="Password"
                            readOnly={!isEditable}
                            type={passwordShown ? "text" : "password"}
                            value={userProfile?.password}
                          />
                          <FontAwesomeIcon
                            className="position-absolute ms-1 eye-icon"
                            cursor="pointer"
                            icon={passwordShown ? faEyeSlash : faEye}
                            onClick={() => setPasswordShown(!passwordShown)}
                            style={{ backgroundColor: "inherit", top: 10 }}
                          />
                        </div>
                      </div>
                      <div className="acc-info-personal-item">
                        <h6>{t("country")}:</h6>
                        <input
                          name="country"
                          onChange={(e) => handleChange(e)}
                          placeholder="Country"
                          readOnly={!isEditable}
                          type="text"
                          value={userProfile?.country}
                        />
                      </div>
                      <div className="acc-info-personal-item">
                        <h6>{t("city")}:</h6>
                        <input
                          name="city"
                          onChange={(e) => handleChange(e)}
                          placeholder="City"
                          readOnly={!isEditable}
                          type="text"
                          value={userProfile?.city}
                        />
                      </div>
                      <div className="acc-info-personal-item">
                        <h6>{t("dateRegister")}:</h6>
                        <input
                          name="dateRegister"
                          placeholder=""
                          readOnly={true}
                          type="text"
                          value={moment(
                            userProfile?.createdAt?.seconds * 1000
                          )?.format("DD/MM/YYYY")}
                        />
                      </div>
                      <div className="acc-info-personal-item">
                        <h6>{t("comment")}:</h6>
                        <input
                          id="comment"
                          name="comment"
                          onChange={(e) => handleChange(e)}
                          placeholder="Comment"
                          readOnly={!isEditable}
                          type="text"
                          value={userProfile?.comment}
                        />
                      </div>
                      <button
                        id="acc-save-button"
                        onClick={() =>
                          isEditable ? handleSaveClick() : setIsEditable(true)
                        }
                      >
                        {isEditable ? t("save") : t("edit")}
                      </button>
                    </div>
                  )}
                  {personalInfoTab === "verification" && (
                    <div id="verification-docs">
                      <h3>{t("uploadDocuments")}</h3>
                      <h6>{t("chooseFile")}</h6>
                      <p>{t("fileSizeLimit")}</p>
                      <form encType="multipart/form-data">
                        <div>
                          <label htmlFor="idFront">{t("frontSideId")}</label>
                          <input
                            accept=".pdf, .doc, .docx"
                            id="idFront"
                            name="idFront"
                            type="file"
                          />
                        </div>
                        <div>
                          <label tmlFor="idBack">{t("backSideId")}</label>
                          <input
                            accept=".pdf, .doc, .docx"
                            id="idBack"
                            name="idBack"
                            type="file"
                          />
                        </div>
                        <div>
                          <label htmlFor="resAddress">
                            {t("addressConfirmation")}
                          </label>
                          <input
                            accept=".pdf, .doc, .docx"
                            id="resAddress"
                            name="resAddress"
                            type="file"
                          />
                        </div>
                        <div>
                          <label htmlFor="creditCardFront">
                            {t("creditCardFront")}
                          </label>
                          <input
                            accept=".pdf, .doc, .docx"
                            id="creditCardFront"
                            name="creditCardFront"
                            type="file"
                          />
                        </div>
                        <div>
                          <label htmlFor="creditCardBack">
                            {t("creditCardBack")}
                          </label>
                          <input
                            accept=".pdf, .doc, .docx"
                            id="creditCardBack"
                            name="creditCardBack"
                            type="file"
                          />
                        </div>
                        <button type="submit">{t("submit")}</button>
                      </form>
                    </div>
                  )}
                  {personalInfoTab === "change-pass" && (
                    <div id="acc-change-pass">
                      <h2>{t("changePassword")}</h2>
                      <div className="acc-change-pass-item">
                        <h6>{t("currentPassword")}:</h6>
                        <input
                          id="pass"
                          name="pass"
                          onChange={(e) => {
                            setPass(e.target.value);
                          }}
                          type="password"
                          value={pass}
                        />
                      </div>
                      <div className="acc-change-pass-item">
                        <h6>{t("newPassword")}:</h6>
                        <input
                          id="pass"
                          name="pass"
                          onChange={(e) => {
                            setNewPass(e.target.value);
                          }}
                          type="password"
                          value={newPass}
                        />
                      </div>
                      <div className="acc-change-pass-item">
                        <h6>{t("confirmPassword")}:</h6>
                        <input
                          id="confirm-pass"
                          name="confirm-pass"
                          onChange={(e) => {
                            setConfirmPass(e.target.value);
                          }}
                          type="password"
                          value={confirmPass}
                        />
                      </div>
                      <div className="acc-change-pass-btn">
                        <button
                          disabled={isLoading}
                          style={{
                            backgroundColor: "var(--main-primary-button)",
                          }}
                          onClick={() => {
                            handleChangePass();
                          }}
                        >
                          {t("submit")}
                        </button>
                        <button
                          onClick={() => {
                            setConfirmPass("");
                            setNewPass("");
                            setPass("");
                          }}
                        >
                          {t("cancel")}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {accTab === "deposit" && (
                <div id="account-transactions">
                  <div className="transactions-btn">
                    <ButtonGroup className="btn-group">
                      <Button
                        onClick={() => {
                          setTransType("Deposit");
                        }}
                        style={{
                          backgroundColor:
                            transType === "Deposit"
                              ? "var(--main-primary-button)"
                              : "var(--main-secondary-color)",
                        }}
                        variant=""
                      >
                        {t("deposit")}
                      </Button>
                      <Button
                        onClick={() => {
                          setTransType("Withdraw");
                        }}
                        style={{
                          backgroundColor:
                            transType === "Withdraw"
                              ? "var(--main-primary-button)"
                              : "var(--main-secondary-color)",
                        }}
                        variant=""
                      >
                        {t("withdraw")}
                      </Button>
                    </ButtonGroup>
                  </div>
                  <div className="transactions-table">
                    <DataTable
                      columns={
                        transType === "Deposit"
                          ? depositsColumns
                          : withdrawColumns
                      }
                      customStyles={{
                        cells: {
                          style: {
                            backgroundColor: "var(--main-secondary-color)",
                          },
                        },
                        headCells: {
                          style: {
                            backgroundColor: "var(--main-secondary-color)",
                          },
                        },
                        rows: {
                          style: {
                            backgroundColor:
                              "var(--main-secondary-color) !important",
                          },
                        },
                        table: {
                          style: {
                            backgroundColor:
                              "var(--main-secondary-color) !important",
                            minHeight: "50vh",
                          },
                        },
                      }}
                      data={fillArrayWithEmptyRows(
                        transType === "Deposit"
                          ? accountDeposits
                          : accountWithdraws,
                        10
                      )}
                      dense
                      key={transType}
                      pagination
                      paginationRowsPerPageOptions={[5, 10, 15, 20, 50]}
                      theme={theme}
                    />
                  </div>
                  <div id="transaction-request">
                    {transType === "Deposit" ? (
                      <button
                        className="btn"
                        onClick={() => setDepositModal(true)}
                      >
                        {t("depositFunds")}
                      </button>
                    ) : (
                      <button
                        className="btn"
                        onClick={() => setWithdrawlModal(true)}
                      >
                        {t("withdrawFunds")}
                      </button>
                    )}
                    {depositModal && (
                      <div
                        className="modal show fade"
                        id="deposit-modal"
                        style={{
                          alignItems: "center",
                          display: "flex",
                          justifyContent: "center",
                        }}
                      >
                        <div className="modal-dialog modal-lg">
                          <div className="modal-content">
                            <div
                              className="modal-header"
                              style={{ backgroundColor: "inherit" }}
                            >
                              <h4
                                className="modal-title"
                                style={{ backgroundColor: "inherit" }}
                              >
                                {t("depositFunds")}
                              </h4>
                              <button
                                className="btn-close"
                                data-bs-dismiss="modal"
                                onClick={() => {
                                  setDepositModal(false);
                                }}
                                type="button"
                              />
                            </div>
                            <div
                              className="modal-body"
                              style={{ backgroundColor: "inherit" }}
                            >
                              <div
                                id="modal-contents"
                                style={{ backgroundColor: "inherit" }}
                              >
                                <div className="deposit-modal-item">
                                  <label htmlFor="method">
                                    {t("chooseMethod")}:
                                  </label>
                                  <Form.Select
                                    id="method"
                                    onChange={(e) => {
                                      setDepositData({
                                        ...depositData,
                                        method: e.target.value,
                                      });
                                    }}
                                    style={{ height: "32px", width: "60%" }}
                                    value={depositData.method}
                                  >
                                    <option disabled>
                                      {t("chooseMethod")}
                                    </option>
                                    <option value="VISA">
                                      VISA/MasterCard
                                    </option>
                                    <option value="Crypto">Crypto</option>
                                    <option value="Other">Other</option>
                                  </Form.Select>
                                </div>
                                <div className="deposit-modal-item">
                                  <label htmlFor="acc-num">
                                    {t("accountNumber")}:
                                  </label>
                                  <Form.Select
                                    id="acc-num"
                                    onChange={(e) => {
                                      setDepositData({
                                        ...depositData,
                                        account_no: e.target.value,
                                      });
                                    }}
                                    style={{ height: "32px", width: "60%" }}
                                    value={depositData.account_no}
                                  >
                                    <option>{t("selectAccount")}</option>
                                    {accounts
                                      .filter((acc) => !acc?.isDeleted)
                                      ?.map((a) => (
                                        <option value={a.account_no}>
                                          {a.account_no}
                                        </option>
                                      ))}
                                  </Form.Select>
                                </div>
                                <div className="deposit-modal-item">
                                  <label htmlFor="amount">{t("amount")}:</label>
                                  <input
                                    className="text-center"
                                    id="amount"
                                    onChange={(e) => {
                                      setDepositData({
                                        ...depositData,
                                        amount: e.target.value,
                                      });
                                    }}
                                    required
                                    type="number"
                                    value={depositData.amount}
                                  />
                                </div>
                                <div className="btn-grp">
                                  <button
                                    className="btn-i"
                                    disabled={isLoading}
                                    id="accept-deposit"
                                    onClick={() => {
                                      handleDepositWithdraw(transType);
                                    }}
                                    style={{
                                      backgroundColor:
                                        "var(--main-primary-button)",
                                    }}
                                    type="button"
                                  >
                                    {t("deposit")}
                                  </button>
                                  <button
                                    className="btn-i"
                                    onClick={() => {
                                      setDepositModal(false);
                                    }}
                                  >
                                    {t("cancel")}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {depositSuccessModal && (
                      <div
                        className="modal show fade"
                        id="dep-successModal"
                        style={{ display: "flex" }}
                      >
                        <div className="modal-dialog">
                          <div
                            className="modal-content"
                            style={{ backgroundColor: "inherit" }}
                          >
                            <div
                              className="modal-header"
                              style={{ backgroundColor: "inherit" }}
                            >
                              <button
                                className="btn-close"
                                data-bs-dismiss="modal"
                                onClick={() => setDepositSuccessModal(false)}
                                type="button"
                              />
                            </div>
                            <div
                              className="modal-body"
                              style={{ backgroundColor: "inherit" }}
                            >
                              <p>{t("fundsDepositedSuccess")}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {withdrawlModal && (
                      <div
                        className="modal show fade"
                        id="deposit-modal"
                        style={{
                          alignItems: "center",
                          display: "flex",
                          justifyContent: "center",
                        }}
                      >
                        <div className="modal-dialog modal-lg">
                          <div className="modal-content">
                            <div
                              className="modal-header"
                              style={{ backgroundColor: "inherit" }}
                            >
                              <h4
                                className="modal-title"
                                style={{ backgroundColor: "inherit" }}
                              >
                                {t("withdrawFunds")}
                              </h4>
                              <button
                                className="btn-close"
                                data-bs-dismiss="modal"
                                onClick={() => {
                                  setWithdrawlModal(false);
                                }}
                                type="button"
                              />
                            </div>
                            <div
                              className="modal-body"
                              style={{ backgroundColor: "inherit" }}
                            >
                              <div
                                id="modal-contents"
                                style={{ backgroundColor: "inherit" }}
                              >
                                <div className="deposit-modal-item">
                                  <label htmlFor="acc-num">
                                    {t("account")}:
                                  </label>
                                  <Form.Select
                                    id="acc-num"
                                    onChange={(e) => {
                                      setWithdrawData({
                                        ...withdrawData,
                                        account_no: e.target.value,
                                      });
                                    }}
                                    style={{ height: "32px", width: "60%" }}
                                    value={withdrawData.account_no}
                                  >
                                    <option>{t("selectAccount")}</option>
                                    {accounts
                                      .filter((acc) => !acc?.isDeleted)
                                      ?.map((a) => (
                                        <option value={a.account_no}>
                                          {a.account_no}
                                        </option>
                                      ))}
                                  </Form.Select>
                                </div>
                                <div className="deposit-modal-item">
                                  <label htmlFor="amount">{t("amount")}:</label>
                                  <input
                                    className="text-center"
                                    id="amount"
                                    onChange={(e) => {
                                      setWithdrawData({
                                        ...withdrawData,
                                        amount: e.target.value,
                                      });
                                    }}
                                    type="number"
                                    value={withdrawData.amount}
                                  />
                                </div>
                                <div className="deposit-modal-item">
                                  <label htmlFor="method">
                                    {t("paymentMethod")}:
                                  </label>
                                  <Form.Select
                                    id="method"
                                    onChange={(e) => {
                                      setWithdrawData({
                                        ...depositData,
                                        method: e.target.value,
                                      });
                                    }}
                                    style={{ height: "32px", width: "60%" }}
                                    value={withdrawData.method}
                                  >
                                    <option disabled>
                                      {t("chooseMethod")}
                                    </option>
                                    <option value="VISA">
                                      VISA/MasterCard
                                    </option>
                                    <option value="Crypto">Crypto</option>
                                    <option value="Other">Other</option>
                                  </Form.Select>
                                </div>
                                <div className="deposit-modal-item">
                                  <label htmlFor="card-num">
                                    {t("cardWalletNumber")}:
                                  </label>
                                  <input
                                    className="text-center"
                                    id="card-num"
                                    onChange={(e) => {
                                      setWithdrawData({
                                        ...withdrawData,
                                        card: e.target.value,
                                      });
                                    }}
                                    type="text"
                                    value={withdrawData.card}
                                  />
                                </div>
                                <div className="deposit-modal-item">
                                  <label htmlFor="phone-num">
                                    {t("phoneNumber")}:
                                  </label>
                                  <input
                                    className="text-center"
                                    id="phone-num"
                                    onChange={(e) => {
                                      setWithdrawData({
                                        ...withdrawData,
                                        phone_no: e.target.value,
                                      });
                                    }}
                                    type="text"
                                    value={withdrawData.phone_no}
                                  />
                                </div>
                                <div className="btn-grp">
                                  <button
                                    className="btn-i"
                                    disabled={isLoading}
                                    id="accept-deposit"
                                    onClick={() => {
                                      handleDepositWithdraw(transType);
                                    }}
                                    style={{
                                      backgroundColor:
                                        "var(--main-primary-button)",
                                    }}
                                    type="button"
                                  >
                                    {t("submit")}
                                  </button>
                                  <button
                                    className="btn-i"
                                    onClick={() => {
                                      setWithdrawlModal(false);
                                    }}
                                  >
                                    {t("cancel")}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {withdrawlSuccessModal && (
                      <div
                        className="modal show fade"
                        id="dep-successModal"
                        style={{ display: "flex" }}
                      >
                        <div className="modal-dialog">
                          <div
                            className="modal-content"
                            style={{ backgroundColor: "inherit" }}
                          >
                            <div
                              className="modal-header"
                              style={{ backgroundColor: "inherit" }}
                            >
                              <button
                                className="btn-close"
                                data-bs-dismiss="modal"
                                onClick={() => setWithdrawlSuccessModal(false)}
                                type="button"
                              />
                            </div>
                            <div
                              className="modal-body"
                              style={{ backgroundColor: "inherit" }}
                            >
                              <p>{t("applicationSubmittedSuccess")}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          {showAccounManagement && (
            <div className="account-management hide-on-desktop">
              <div className="swith-button-box">
                <button
                  className={`${showAccountModal ? "active" : ""}`}
                  onClick={() => {
                    setShowAccountModal(true);
                  }}
                  type="button"
                >
                  New account
                </button>
                <button
                  className={`${showAccountModal ? "" : "active"}`}
                  onClick={() => {
                    setShowAccountModal(false);
                  }}
                  type="button"
                >
                  My account
                </button>
              </div>
              <div className="select-account-box">
                {userProfile?.accounts?.length > 0 && (
                  <div className="acc-selection">
                    <label className="m-4" htmlFor="symbol-input">
                      {t("selectAccount")}:
                    </label>
                    <Select
                      id="account-input"
                      onChange={handleAccountChange}
                      options={accounts
                        .filter((acc) => !acc?.isDeleted)
                        ?.map((account) => ({
                          label: `${account.account_no} ${account.account_type}`,
                          value: account.account_no,
                        }))}
                      value={{
                        label: `${defaultAccount.account_no} ${defaultAccount.account_type}`,
                        value: defaultAccount.account_no,
                      }}
                      styles={{
                        container: (provided, state) => ({ ...provided }),
                        control: (provided) => ({
                          ...provided,
                          backgroundColor: "inherit",
                        }),
                        dropdownIndicator: (provided, state) => ({
                          ...provided,
                          paddingBlock: 0,
                        }),
                        option: (provided, state) => ({
                          ...provided,
                          cursor: "pointer",
                          backgroundColor: state.isSelected
                            ? "var(--main-primary-button)"
                            : "unset",
                          color: "var(--main-text-color)",
                          "&:hover": {
                            backgroundColor: state.isSelected
                              ? ""
                              : "var(--main-primary-button)",
                          },
                        }),
                        singleValue: (provided) => ({
                          ...provided,
                          color: "var(--main-text-color)",
                        }),
                      }}
                      theme={(theme) => {
                        return {
                          ...theme,
                          colors: {
                            ...theme.colors,
                            primary: "var(--main-text-color)",
                          },
                        };
                      }}
                      isSearchable={false}
                    />
                  </div>
                )}
              </div>
              <div className="account-stat-box">
                <ul>
                  <li>
                    <div className="">
                      <p className="name">{t("balance")} (USD):</p>
                      <p className="number">
                        {+parseFloat(totalBalance)?.toFixed(2)}
                      </p>
                    </div>
                  </li>
                  <li>
                    <div className="">
                      <p className="name">{t("free")} (USD):</p>
                      <p className="number">
                        {+parseFloat(freeMargin - bonus)?.toFixed(2)}
                      </p>
                    </div>
                  </li>
                  <li>
                    <div className="">
                      <p className="name">{t("bonus")} (USD):</p>
                      <p className="number">{+parseFloat(bonus)?.toFixed(2)}</p>
                    </div>
                  </li>
                  <li>
                    <div className="">
                      <p className="name">{t("deposited")} (USD):</p>
                      <p className="number">
                        {accountDeposits
                          .filter(({ type }) => type === "Deposit")
                          .reduce((p, { sum }) => p + +sum, 0)}
                      </p>
                    </div>
                  </li>
                  <li className="border-0">
                    <div className="">
                      <p className="name">{t("withdrawn")} (USD):</p>
                      <p className="number">
                        {accountDeposits
                          .filter(({ type }) => type === "Withdraw")
                          .reduce((p, { sum }) => p + +sum, 0)}
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          )}
          {tab === "help" && (
            <div id="faq">
              <h1>{t("FAQ")}</h1>
              <h2>{t("GQ")}</h2>
              <dl>
                <dt>{t("Q1")}</dt>
                <dd>{t("ANS1")}</dd>
                <dt>{t("Q2")}</dt>
                <dd>{t("ANS2")}</dd>
              </dl>
              <h2>{t("accountManagement")}</h2>
              <dl>
                <dt>{t("Q3")}</dt>
                <dd>{t("ANS3")}</dd>
                <dt>{t("Q4")}</dt>
                <dd>{t("ANS4")}</dd>
              </dl>
              <h2>{t("tradingInvestment")}</h2>
              <dl>
                <dt>{t("Q5")}</dt>
                <dd>{t("ANS5")}</dd>
                <dt>{t("Q6")}</dt>
                <dd>{t("ANS6")}</dd>
              </dl>
            </div>
          )}
        </div>
      </div>
      {isModalOpen && (
        <EditOrderModal
          onClose={handleCloseModal}
          selectedOrder={selectedOrder}
          theme={theme}
        />
      )}
      {isDelModalOpen && (
        <DelOrderModal
          defaultAccount={defaultAccount}
          onClose={handleCloseModal}
          selectedOrder={selectedOrder}
          show={isDelModalOpen}
          symbols={dbSymbols}
          userProfile={userProfile}
        />
      )}
      {showCancelOrderModal && (
        <CancelOrderModal
          defaultAccount={defaultAccount}
          selectedOrder={selectedOrder}
          setShow={setShowCancelOrderModal}
          userProfile={userProfile}
        />
      )}
      {isReportModalOpen && (
        <ReportModal
          balance={totalBalance}
          bonus={bonus}
          bonusSpent={bonusSpent}
          onClose={handleCloseReportModal}
          theme={theme}
          userId={currentUserId}
        />
      )}
      {messageModal?.show && (
        <MessageModal
          message={messageModal?.message}
          onClose={handleCloseModal}
          show={messageModal?.show}
          title={messageModal?.title}
        />
      )}
      {isTradingModal && (
        <AddTradingSymbolModal
          handleCloseModal={handleCloseModal}
          show={isTradingModal}
          symbols={dbSymbols}
          userId={currentUserId}
          userQuotes={userQuotes}
        />
      )}
      {showColumnsModal && (
        <SelectColumnsModal
          columns={showColumns}
          setColumns={setShowColumns}
          setModal={setShowColumnsModal}
          userId={currentUserId}
        />
      )}
      {showAccountModal && (
        <AccountModal
          currentUserId={currentUserId}
          onClose={() => setShowAccountModal(false)}
          userProfile={userProfile}
        />
      )}
    </>
  );
}
