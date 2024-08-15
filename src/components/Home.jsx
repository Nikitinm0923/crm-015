import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import {
  addPlayerLogs,
  addQuotesToUser,
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
  const [uploadModal, setUploadModal] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
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
  const [activeAccountNo, setActiveAccountNo] = useState(null);
  const [dealsRow, setDealsRow] = useState(5);

  const [dealType, setDealType] = useState("Buy");
  const [showAccountInfo, setShowAccountInfo] = useState(false);

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

  const accountDeposits = deposits.filter(
    ({ account_no }) => account_no === defaultAccount?.account_no
  );

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
  const [selectedKey, setSelectedKey] = useState(null);

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
        showNewOrderPanel,
        tab,
        activeTab,
        tabs,
        showNewOrderPanel,
        showHistoryPanel,
        isReportModalOpen,
      })
    );
  }, [
    showNewOrderPanel,
    tab,
    activeTab,
    tabs,
    showNewOrderPanel,
    showHistoryPanel,
    isReportModalOpen,
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
    headCells: {
      style: {
        fontSize: "0.9rem",
      },
    },
    rows: {
      style: {
        userSelect: "none",
        "*": {
          backgroundColor: "unset",
          color: "unset",
        },
        fontSize: "0.9rem",
        minHeight: "26px !important",
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
      name: "Bid",
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
      name: "Ask",
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
      if (weekDay == 0 || weekDay == 6 || hour < 9 || hour >= 23) {
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
      type == "Buy" &&
      ((orderData.sl && orderData.sl >= closedPrice) ||
        (orderData.tp && orderData.tp <= orderData.symbolValue))
    ) {
      return toast.error(
        "To Buy SL should be less than the bid value and TP should be greater than the current value"
      );
    } else if (
      type == "Sell" &&
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

  return (
    <>
      <div id="header">
        <div id="logo"></div>
        <div id="header-info">
          <div id="balance">
            <div className="balance-item">
              <h2 className="balance-title">{t("Equity")}:</h2>
              <input
                className={`balance-nums ${
                  equity < 0 ? "text-danger" : equity === 0 ? "text-muted" : ""
                }`}
                readOnly={true}
                type="number"
                value={+parseFloat(equity)?.toFixed(2)}
              />
            </div>
            <div className="balance-item">
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
            <div className="balance-item">
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
            <div className="balance-item">
              <h2 className="balance-title">Margin:</h2>
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
            <div className="balance-item">
              <h2 className="balance-title">Level:</h2>
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
                className="flag_theme"
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
                    {["Dark", "Light", "Purple"].map((t, i) => (
                      <Dropdown.Item
                        key={i}
                        onClick={() => changeTheme(t.toLowerCase())}
                      >
                        {t}
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>
              </div>
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
              <button
                className="acc-btn"
                onClick={() => {
                  setShowAccountInfo(!showAccountInfo);
                }}
              >
                {defaultAccount?.type || "Type"}{" "}
                {defaultAccount.account_no || "#"}
              </button>
              {showAccountInfo && (
                <div className="acc-info">
                  <div className="acc-layout">
                    <div className="active-acc">
                      <label>Active Account</label>
                      <span className="acc-tile">
                        <span className="acc-tile-type">
                          {defaultAccount?.type || "Type"}
                        </span>
                        <span>{defaultAccount.account_no || "#"}</span>
                        <span>
                          {parseInt(defaultAccount.totalBalance) || "0"} USD
                        </span>
                      </span>
                    </div>
                    <button className="deposit-acc-btn" onClick={() => {}}>
                      Deposit Funds
                    </button>
                    <div className="other-acc">
                      <label>Other Account</label>
                      {accounts.map((acc) => (
                        <>
                          <span className="acc-tile">
                            <span className="acc-tile-type">
                              {acc?.type || "Type"}
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
                      Open an account
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
              onClick={() => setTab("trade")}
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
                setTab(tab === "assets" ? "trade" : "assets");
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
                openOrderPanel();
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
              onClick={() => setTab("account")}
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
              className={showHistoryPanel ? "d-none" : ""}
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
                  customStyles={{
                    table: {
                      style: {
                        backgroundColor:
                          "var(--main-secondary-color) !important",
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
                  }}
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
                  + Add Symbol
                </button>
              </div>
              <div id="chart" className="rounded">
                <ul className="nav nav-tabs">
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
                  <h6>New Order</h6>
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
                          width: "80%",
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
                    <ButtonGroup className="btn-group">
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
                        BUY
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
                        SELL
                      </Button>
                    </ButtonGroup>
                    <svg
                      height="2"
                      style={{
                        margin: "8px 0",
                        stroke: "var(--main-secondary-color)",
                      }}
                      viewBox="0 0 300 2"
                      width="80%"
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
                        <label htmlFor="symbol-amount">Volume</label>
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
                        <label htmlFor="open-at">Open at</label>
                        <div className="vol-input">
                          <span
                            onClick={() => {}}
                            style={{
                              position: "relative",
                              right: "-8px",
                              top: "0.5px",
                            }}
                          >
                            -
                          </span>
                          <input
                            id="open-at"
                            name="volume"
                            onChange={() => {}}
                            step={0.1}
                            type="number"
                            value=""
                          />
                          <span
                            onClick={() => {}}
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
                      Margin: <span>{+calculatedSum?.toFixed(2)} USD</span>
                    </label>
                    <label className="margin-label">
                      Pip Value: <span>- USD</span>
                    </label>
                    <svg
                      height="2"
                      style={{
                        margin: "8px 0",
                        stroke: "var(--main-secondary-color)",
                      }}
                      viewBox="0 0 300 2"
                      width="80%"
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
                    {/* <label className="mt-1">
                      Total: {+calculatedSum?.toFixed(2)} USDT
                    </label> */}
                    {/* <div className="d-flex gap-3 mt-2">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          id="market"
                          checked={!enableOpenPrice}
                          onClick={(e) => setEnableOpenPrice(false)}
                        />
                        <label
                          className="form-check-label m-0"
                          htmlFor="market"
                        >
                          Market
                        </label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          id="limit"
                          checked={enableOpenPrice}
                          onClick={(e) => {
                            if (openPriceValue !== orderData.symbolValue)
                              setOpenPriceValue(
                                parseFloat(orderData.symbolValue)
                              );
                            setEnableOpenPrice(true);
                          }}
                        />
                        <label className="form-check-label m-0" htmlFor="limit">
                          Limit
                        </label>
                      </div>
                    </div> */}
                    <div className="vol-group">
                      <div>
                        <label htmlFor="take-profit">Take Profit</label>
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
                        <label htmlFor="stop-loss">Stop Loss</label>
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
                      width="80%"
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
                          backgroundColor: "var(--main-primary-button)",
                        }}
                        type="submit"
                      >
                        BUY
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
                        CANCEL
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
            <div
              id="orders"
              style={{ height: isHidden ? "" : "37%", overflow: "auto" }}
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
                  <Tab eventKey="activeTab" title="Active">
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
                  <Tab eventKey="delayedTab" title="Delayed">
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
          </div>
          {tab === "account" && (
            <div id="account" className="h-100">
              <div id="account-profile">
                <img
                  id="acc-img-placeholder"
                  src={accPlaceholder}
                  alt="avatar"
                />
                <h4 style={{ margin: "0", "margin-bottom": "15px" }}>
                  {defaultAccount?.account_no || "Test Lead #0001"}
                </h4>
                <p
                  style={{ margin: "0", "margin-bottom": "15px", color: "red" }}
                >
                  {t("referralCode")} : {userProfile?.refCode}
                </p>
                <button
                  id="create-account-button"
                  className="btn btn-secondary"
                  onClick={() => setShowAccountModal(true)}
                >
                  Create Account
                </button>
                {userProfile?.accounts?.length > 0 && (
                  <div>
                    <label className="m-4" htmlFor="symbol-input">
                      Select Account
                    </label>
                    <Select
                      id="account-input"
                      options={accounts
                        .filter((acc) => !acc?.isDeleted)
                        ?.map((account) => ({
                          value: account.account_no,
                          label: account.account_no,
                        }))}
                      onChange={handleAccountChange}
                      value={{
                        value: defaultAccount?.account_no,
                        label: defaultAccount?.account_no,
                      }}
                      styles={{
                        container: (provided, state) => ({
                          ...provided,
                          minWidth: 130,
                        }),
                        dropdownIndicator: (provided, state) => ({
                          ...provided,
                          paddingBlock: 0,
                        }),
                        option: (provided, state) => ({
                          ...provided,
                          cursor: "pointer",
                          backgroundColor: state.isSelected
                            ? "var(--main-numbersc)"
                            : "unset",
                          color: state.isSelected
                            ? "black"
                            : "var(--main-input-textc)",
                          "&:hover": {
                            backgroundColor: state.isSelected
                              ? ""
                              : "var(--bs-body-bg)",
                          },
                        }),
                        singleValue: (provided) => ({
                          ...provided,
                          color: "var(--main-input-textc)",
                        }),
                        control: (provided) => ({
                          ...provided,
                          backgroundColor: "inherit",
                          minHeight: 24,
                        }),
                      }}
                      theme={(theme) => {
                        return {
                          ...theme,
                          colors: {
                            ...theme.colors,
                            primary: "var(--main-input-textc)",
                          },
                        };
                      }}
                      isSearchable={false}
                    />
                    <div className="d-flex align-items-center justify-content-center gap-3 mt-2">
                      <h6>Type: </h6>
                      <h6>{defaultAccount?.account_type}</h6>
                    </div>
                  </div>
                )}
                <div id="acc-profile-main">
                  <div className="acc-profile-main-item">
                    <h6>{t("balance")} (USD):</h6>
                    <h6>{+parseFloat(totalBalance)?.toFixed(2)}</h6>
                  </div>
                  <div className="acc-profile-main-item">
                    <h6>{t("Free")} (USD):</h6>
                    <h6>{+parseFloat(freeMargin - bonus)?.toFixed(2)}</h6>
                  </div>
                  <div className="acc-profile-main-item">
                    <h6>{t("Bonus")} (USD):</h6>
                    <h6>{+parseFloat(bonus)?.toFixed(2)}</h6>
                  </div>
                  <div className="acc-profile-main-item">
                    <h6>{t("deposited")} (USD):</h6>
                    <h6>
                      {accountDeposits
                        .filter(({ type }) => type === "Deposit")
                        .reduce((p, { sum }) => p + +sum, 0)}
                    </h6>
                  </div>
                  <div className="acc-profile-main-item">
                    <h6>{t("withdrawn")} (USD):</h6>
                    <h6>
                      {accountDeposits
                        .filter(({ type }) => type === "Withdraw")
                        .reduce((p, { sum }) => p + +sum, 0)}
                    </h6>
                  </div>
                </div>
                <div id="verif-buttons">
                  <button
                    id="documents-button"
                    // data-bs-toggle="modal"
                    // data-bs-target="#verification-docs"
                    onClick={() => setUploadModal(true)}
                  >
                    {t("verification")}
                  </button>
                </div>
                {/* The Upload Modal */}
                {uploadModal && (
                  <div
                    className="modal fade show"
                    id="verification-docs"
                    style={{
                      display: "flex",
                    }}
                  >
                    <div
                      className="modal-dialog modal-lg"
                      style={{ display: "flex" }}
                    >
                      <div
                        className="modal-content"
                        style={{ "border-radius": "0px", height: "50vh" }}
                      >
                        {/* Modal Header */}
                        <div className="modal-header">
                          <h4 className="modal-title">{t("uploadDocs")}</h4>
                          <button
                            type="button"
                            className="btn-close"
                            data-bs-dismiss="modal"
                            onClick={() => setUploadModal(false)}
                          />
                        </div>
                        {/* Modal body */}
                        <div className="modal-body">
                          <form encType="multipart/form-data">
                            <div className="mb-3">
                              <label
                                htmlFor="verificationFile"
                                className="form-label"
                              >
                                {t("chooseFile")}
                              </label>
                              <input
                                type="file"
                                className="form-control"
                                id="verificationFile"
                                name="verificationFile"
                                accept=".pdf, .doc, .docx"
                                style={{ height: "100%" }}
                              />
                            </div>
                            <button
                              type="submit"
                              className="btn btn-primary"
                              id="uploadButton"
                              style={{ color: "rgb(0, 255, 110)" }}
                            >
                              {t("upload")}
                            </button>
                          </form>
                        </div>
                        {/* Modal footer */}
                        <div className="modal-footer">
                          <button
                            type="button"
                            className="btn btn-danger"
                            data-bs-dismiss="modal"
                            onClick={() => setUploadModal(false)}
                          >
                            {t("close")}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {/* The Success Modal */}
                {successModal && (
                  <div className="modal" id="successModal">
                    <div className="modal-dialog">
                      <div className="modal-content">
                        {/* Modal Header */}
                        <div className="modal-header">
                          <h4 className="modal-title">{t("success")}</h4>
                          <button
                            type="button"
                            className="btn-close"
                            data-bs-dismiss="modal"
                          />
                        </div>
                        {/* Modal body */}
                        <div className="modal-body">{t("thankyou")}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div id="account-info">
                <h3
                  style={{
                    "margin-top": "40px",
                    "margin-bottom": "20px",
                    width: "80%",
                    "font-size": "25px",
                  }}
                >
                  {t("personalInfo")}
                </h3>
                <div id="acc-info-personal">
                  <div className="acc-info-personal-item">
                    <h6>{t("name")}</h6>
                    <input
                      type="text"
                      name="name"
                      value={userProfile?.name}
                      onChange={(e) => handleChange(e)}
                      readOnly={!isEditable}
                    />
                  </div>
                  <div className="acc-info-personal-item">
                    <h6>{t("surname")}</h6>
                    <input
                      type="text"
                      name="surname"
                      value={userProfile?.surname}
                      placeholder="Surname"
                      onChange={(e) => handleChange(e)}
                      readOnly={!isEditable}
                    />
                  </div>
                  <div className="acc-info-personal-item">
                    <h6>{t("email")}</h6>
                    <input
                      type="text"
                      name="email"
                      id="userEmail"
                      value={userProfile?.email}
                      placeholder=""
                      readOnly
                    />
                  </div>
                  <div className="acc-info-personal-item">
                    <h6>{t("phone")}</h6>
                    <input
                      type="number"
                      name="phone"
                      value={userProfile?.phone}
                      placeholder="+7777038475"
                      onChange={(e) => handleChange(e)}
                      readOnly={!isEditable}
                    />
                  </div>
                  <div className="acc-info-personal-item">
                    <h6>{t("Password")}</h6>
                    <div className="position-relative">
                      <input
                        type={passwordShown ? "text" : "password"}
                        name="password"
                        value={userProfile?.password}
                        placeholder="Password"
                        onChange={(e) => handleChange(e)}
                        readOnly={!isEditable}
                      />
                      <FontAwesomeIcon
                        cursor="pointer"
                        className="position-absolute ms-1"
                        style={{ top: 4 }}
                        icon={passwordShown ? faEyeSlash : faEye}
                        onClick={() => setPasswordShown(!passwordShown)}
                      />
                    </div>
                  </div>
                  <div className="acc-info-personal-item">
                    <h6>{t("country")}</h6>
                    <input
                      type="text"
                      value={userProfile?.country}
                      name="country"
                      placeholder="Country"
                      onChange={(e) => handleChange(e)}
                      readOnly={!isEditable}
                    />
                  </div>
                  <div className="acc-info-personal-item">
                    <h6>{t("city")}</h6>
                    <input
                      type="text"
                      value={userProfile?.city}
                      name="city"
                      placeholder="City"
                      onChange={(e) => handleChange(e)}
                      readOnly={!isEditable}
                    />
                  </div>
                  <div className="acc-info-personal-item">
                    <h6>{t("dateRegister")}</h6>
                    <input
                      type="text"
                      value={moment(
                        userProfile?.createdAt?.seconds * 1000
                      )?.format("DD/MM/YYYY")}
                      name="dateRegister"
                      placeholder=""
                      // onChange={e=> handleChange(e)}
                      readOnly={true}
                    />
                  </div>
                  <div className="acc-info-personal-item">
                    <h6>{t("comment")}:</h6>
                    <input
                      type="text"
                      value={userProfile?.comment}
                      name="comment"
                      id="comment"
                      placeholder="Comment"
                      onChange={(e) => handleChange(e)}
                      readOnly={!isEditable}
                    />
                  </div>
                </div>
                <div id="acc-info-buttons">
                  <button
                    id="acc-save-button"
                    onClick={() =>
                      isEditable ? handleSaveClick() : setIsEditable(true)
                    }
                  >
                    {isEditable ? "Save" : "Edit"}
                  </button>
                </div>
              </div>
              <div id="account-transactions">
                <h3
                  style={{
                    "border-bottom": "1px solid var(--main-bgc)",
                    "font-size": "25px",
                    "padding-bottom": "25px",
                    "padding-top": "0",
                    "margin-top": "40px",
                    "margin-bottom": "30px",
                    width: "80%",
                  }}
                >
                  {t("transactions")}
                </h3>
                <div className="transactions-table">
                  <DataTable
                    columns={depositsColumns}
                    data={fillArrayWithEmptyRows(accountDeposits, 5)}
                    customStyles={{
                      table: {
                        style: {
                          minHeight: "50vh",
                        },
                      },
                    }}
                    pagination
                    theme={theme}
                    paginationRowsPerPageOptions={[5, 10, 15, 20, 50]}
                    dense
                  />
                </div>
                <div id="transaction-request">
                  <button
                    id="deposit-button"
                    onClick={() => setDepositModal(true)}
                  >
                    {t("deposit")}
                  </button>
                  {/* The Modal */}
                  {depositModal && (
                    <div
                      className="modal show fade"
                      id="deposit-modal"
                      style={{
                        display: "flex",
                      }}
                    >
                      <div
                        className="modal-dialog modal-lg"
                        style={{ "margin-top": "10%" }}
                      >
                        <div className="modal-content">
                          {/* Modal Header */}
                          <div className="modal-header">
                            <h4 className="modal-title">{t("deposit")}</h4>
                            <button
                              type="button"
                              className="btn-close"
                              data-bs-dismiss="modal"
                              onClick={() => {
                                setDepositModal(false);
                              }}
                            />
                          </div>
                          {/* Modal body */}
                          <div
                            className="modal-body"
                            style={{ display: "contents", height: "500px" }}
                          >
                            <div
                              id="modal-contents"
                              style={{
                                height: "500px",
                                display: "inherit",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "center",
                                }}
                              >
                                <Form.Select style={{ width: 200 }}>
                                  <option>Choose method</option>
                                  <option value="1">VISA/MasterCard</option>
                                  <option value="2">Crypto</option>
                                  <option value="3">Other</option>
                                </Form.Select>
                              </div>
                              <label>{t("accountNumber")}</label>
                              <input type="text" className="text-center" />
                              <label>{t("amount")}</label>
                              <input type="text" className="text-center" />
                            </div>
                          </div>
                          {/* Modal footer */}
                          <div
                            className="modal-footer"
                            style={{
                              display: "flex",
                              "-webkit-align-items": "center",
                              "-webkit-box-align": "center",
                              "-ms-flex-align": "center",
                              "align-items": "center",
                              "-webkit-box-pack": "center",
                              "-webkit-justify-content": "center",
                              "-ms-flex-pack": "center",
                              "justify-content": "center",
                            }}
                          >
                            <button
                              id="accept-deposit"
                              type="button"
                              className="btn btn-primary"
                              data-bs-dismiss="modal"
                              style={{ color: "aquamarine" }}
                              onClick={() => {
                                setDepositModal(false);
                                setDepositSuccessModal(true);
                              }}
                            >
                              {t("confirm")}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* The Success Modal */}
                  {depositSuccessModal && (
                    <div
                      className="modal show fade"
                      id="dep-successModal"
                      style={{
                        display: "flex",
                      }}
                    >
                      <div className="modal-dialog">
                        <div className="modal-content">
                          {/* Modal Header */}
                          <div className="modal-header">
                            <h4 className="modal-title">{t("success")}</h4>
                            <button
                              type="button"
                              className="btn-close"
                              data-bs-dismiss="modal"
                              onClick={() => setDepositSuccessModal(false)}
                            />
                          </div>
                          {/* Modal body */}
                          <div className="modal-body">
                            {t("depositSubmit")} <br />
                            {t("wait")}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <button
                    id="withdraw-request-button"
                    onClick={() => setWithdrawlModal(true)}
                  >
                    {t("withdraw")}
                  </button>
                  {/* The Modal */}
                  {withdrawlModal && (
                    <div
                      className="modal show fade"
                      id="withdraw-modal"
                      style={{
                        display: "flex",
                      }}
                    >
                      <div
                        className="modal-dialog modal-lg"
                        style={{ "margin-top": "10%" }}
                      >
                        <div className="modal-content">
                          {/* Modal Header */}
                          <div className="modal-header">
                            <h4 className="modal-title">
                              {t("fundsWithdrawal")}
                            </h4>
                            <button
                              type="button"
                              className="btn-close"
                              data-bs-dismiss="modal"
                              onClick={() => {
                                setWithdrawlModal(false);
                              }}
                            />
                          </div>
                          {/* Modal body */}
                          <div
                            className="modal-body"
                            style={{ display: "contents", height: "500px" }}
                          >
                            <div
                              id="modal-contents"
                              style={{ height: "500px", display: "inherit" }}
                            >
                              <label htmlFor>{t("accountNumber")}</label>
                              <input type="text" name id />
                              <label htmlFor>{t("amount")}</label>
                              <input type="text" name id />
                            </div>
                          </div>
                          {/* Modal footer */}
                          <div
                            className="modal-footer"
                            style={{
                              display: "flex",
                              "-webkit-align-items": "center",
                              "-webkit-box-align": "center",
                              "-ms-flex-align": "center",
                              "align-items": "center",
                              "-webkit-box-pack": "center",
                              "-webkit-justify-content": "center",
                              "-ms-flex-pack": "center",
                              "justify-content": "center",
                            }}
                          >
                            <button
                              id="accept-withdraw"
                              type="button"
                              className="btn btn-primary"
                              data-bs-dismiss="modal"
                              style={{ color: "aquamarine" }}
                              onClick={() => {
                                setWithdrawlModal(false);
                                setWithdrawlSuccessModal(true);
                              }}
                            >
                              {t("confirm")}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* The Success Modal */}
                  {withdrawlSuccessModal && (
                    <div
                      className="modal fade show"
                      id="wd-successModal"
                      style={{
                        display: "flex",
                      }}
                    >
                      <div className="modal-dialog">
                        <div className="modal-content">
                          {/* Modal Header */}
                          <div className="modal-header">
                            <h4 className="modal-title">{t("success")}</h4>
                            <button
                              type="button"
                              className="btn-close"
                              data-bs-dismiss="modal"
                              onClick={() => setWithdrawlSuccessModal(false)}
                            />
                          </div>
                          {/* Modal body */}
                          <div className="modal-body">
                            {t("requestSuccess")} <br />
                            {t("furtherInstructions")}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div id="account-mobile-buttons" className="hidden">
                <button>{t("personalInfo")}</button>
                <button>{t("transactions")}</button>
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
                {/* Add more general questions and answers here */}
              </dl>
              <h2>{t("accountManagement")}</h2>
              <dl>
                <dt>{t("Q3")}</dt>
                <dd>{t("ANS3")}</dd>
                <dt>{t("Q4")}</dt>
                <dd>{t("ANS4")}</dd>
                {/* Add more account management questions and answers here */}
              </dl>
              <h2>{t("tradingInvestment")}</h2>
              <dl>
                <dt>{t("Q5")}</dt>
                <dd>{t("ANS5")}</dd>
                <dt>{t("Q6")}</dt>
                <dd>{t("ANS6")}</dd>
                {/* Add more trading and investment questions and answers here */}
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
          show={isDelModalOpen}
          onClose={handleCloseModal}
          selectedOrder={selectedOrder}
          symbols={dbSymbols}
          userProfile={userProfile}
          defaultAccount={defaultAccount}
        />
      )}
      {showCancelOrderModal && (
        <CancelOrderModal
          selectedOrder={selectedOrder}
          setShow={setShowCancelOrderModal}
          userProfile={userProfile}
          defaultAccount={defaultAccount}
        />
      )}
      {isReportModalOpen && (
        <ReportModal
          onClose={handleCloseReportModal}
          userId={currentUserId}
          theme={theme}
          balance={totalBalance}
          bonus={bonus}
          bonusSpent={bonusSpent}
        />
      )}
      {messageModal?.show && (
        <MessageModal
          show={messageModal?.show}
          onClose={handleCloseModal}
          title={messageModal?.title}
          message={messageModal?.message}
        />
      )}

      {isTradingModal && (
        <AddTradingSymbolModal
          show={isTradingModal}
          symbols={dbSymbols}
          handleCloseModal={handleCloseModal}
          userQuotes={userQuotes}
          userId={currentUserId}
        />
      )}

      {showColumnsModal && (
        <SelectColumnsModal
          userId={currentUserId}
          setModal={setShowColumnsModal}
          columns={showColumns}
          setColumns={setShowColumns}
        />
      )}
      {showAccountModal && (
        <AccountModal
          onClose={() => setShowAccountModal(false)}
          currentUserId={currentUserId}
          userProfile={userProfile}
        />
      )}
    </>
  );
}
