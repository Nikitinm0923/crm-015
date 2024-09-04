import { fillArrayWithEmptyRows } from "../helper/helpers";
import { generalColumns } from "../helper/Tablecolumns";
import { getDepositsByUser } from "../helper/firebaseHelpers";
import { Modal } from "react-bootstrap";
import { setDepositsState } from "../redux/slicer/transactionSlicer";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import DataTable from "react-data-table-component";
import depositsColumns from "./columns/depositsColumns";
import moment from "moment";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";

const ReportModal = ({
  onClose,
  userId,
  theme,
  balance,
  bonus,
  bonusSpent,
}) => {
  const [key, setKey] = useState("tradeOperations");
  const [showRecord, setShowRecord] = useState("all");
  const { t } = useTranslation();
  const deposits = useSelector((state) => state.deposits);
  const dispatch = useDispatch();
  const orders = useSelector((state) =>
    state.orders.filter(({ status }) => status !== "Pending")
  );

  const totalProfit = orders.reduce((p, v) => p + +v.profit, 0);

  const customStyle = {
    pagination: {
      style: { backgroundColor: "var(--main-secondary-color)" },
    },
    table: {
      style: {
        backgroundColor: "var(--main-background-color)",
        height: "65vh",
      },
    },
  };

  const setDeposits = useCallback((data) => {
    dispatch(setDepositsState(data));
  }, []);

  useEffect(() => {
    if (!deposits.length) getDepositsByUser(userId, setDeposits);
  }, []);

  let deposited = 0,
    withdrawn = 0;

  deposits.forEach(({ type, sum }) => {
    if (type === "Deposit") deposited += sum;
    else if (type === "Withdraw") withdrawn += sum;
  });

  const today = moment();

  let filteredOrders;

  if (showRecord === "all") {
    filteredOrders = orders;
  } else if (showRecord === "today") {
    const todayStart = today.startOf("day");
    const dataCreatedToday = orders.filter((order) => {
      return moment(order.createdAt).isSame(todayStart, "day");
    });
    filteredOrders = dataCreatedToday;
  } else if (showRecord === "lastWeek") {
    const sevenDaysAgo = today.subtract(7, "days");
    const dataCreatedToday = orders.filter((order) => {
      return moment(order.createdAt).isSameOrAfter(sevenDaysAgo);
    });
    filteredOrders = dataCreatedToday;
  } else if (showRecord === "lastMonth") {
    const lastMonth = today.subtract(30, "days");
    const dataCreatedToday = orders.filter((order) => {
      return moment(order.createdAt).isSameOrAfter(lastMonth);
    });
    filteredOrders = dataCreatedToday;
  } else if (showRecord === "last3Month") {
    const last90Days = today.subtract(90, "days");
    const dataCreatedToday = orders.filter((order) => {
      return moment(order.createdAt).isSameOrAfter(last90Days);
    });
    filteredOrders = dataCreatedToday;
  }

  let filteredDeposits;

  if (showRecord === "all") {
    filteredDeposits = deposits;
  } else if (showRecord === "today") {
    const todayStart = today.startOf("day");
    const dataCreatedToday = deposits.filter((dep) => {
      return moment(dep.createdAt).isSame(todayStart, "day");
    });
    filteredDeposits = dataCreatedToday;
  } else if (showRecord === "lastWeek") {
    const sevenDaysAgo = moment().subtract(7, "days");
    const dataCreatedToday = deposits.filter((dep) => {
      return moment(dep.createdAt).isSameOrAfter(sevenDaysAgo);
    });
    filteredDeposits = dataCreatedToday;
  } else if (showRecord === "lastMonth") {
    const lastMonth = moment().subtract(30, "days");
    const dataCreatedToday = deposits.filter((dep) => {
      return moment(dep.createdAt).isSameOrAfter(lastMonth);
    });
    filteredDeposits = dataCreatedToday;
  } else if (showRecord === "last3Month") {
    const last90Days = moment().subtract(90, "days");
    const dataCreatedToday = deposits.filter((dep) => {
      return moment(dep.createdAt).isSameOrAfter(last90Days);
    });
    filteredDeposits = dataCreatedToday;
  }

  return (
    <>
      <Modal
        centered
        className="reports-modal"
        fullscreen
        onHide={onClose}
        show
        size="lg"
        backdrop={false}
      >
        <Modal.Header style={{ backgroundColor: "inherit" }} closeButton>
          <h2
            className="mb-0 text-center w-100"
            style={{ backgroundColor: "inherit" }}
          >
            {t("reports")}
          </h2>
        </Modal.Header>
        <Modal.Body style={{ backgroundColor: "inherit" }}>
          <div className="reports-overview-box hide-on-desktop">
            <p className="title">{t("overview")}</p>
            <ul>
              <li>
                <div className="">
                  <p className="name">{t("balance")}:</p>
                  <p className="number">{+parseFloat(balance)?.toFixed(2)}</p>
                </div>
              </li>
              <li>
                <div className="">
                  <p className="name">{t("bonus")}:</p>
                  <p className="number">{+parseFloat(bonus)?.toFixed(2)}</p>
                </div>
              </li>
              <li>
                <div className="">
                  <p className="name">{t("totalProfit")}:</p>
                  <p className="number">
                    {+parseFloat(totalProfit)?.toFixed(2)}
                  </p>
                </div>
              </li>
              <li>
                <div className="">
                  <p className="name">{t("bonusSpent")}:</p>
                  <p className="number">{+bonusSpent?.toFixed(2)}</p>
                </div>
              </li>
              <li>
                <div className="">
                  <p className="name">{t("deposited")}:</p>
                  <p className="number">{deposited}</p>
                </div>
              </li>
              <li>
                <div className="">
                  <p className="name">{t("withdrawn")}:</p>
                  <p className="number">{withdrawn}</p>
                </div>
              </li>
              <li className="border-0">
                <div className="">
                  <p className="name">{t("totalDeals")}:</p>
                  <p className="number">{orders.length}</p>
                </div>
              </li>
            </ul>
          </div>
          <div className="report-tabs">
            <Tabs activeKey={key} onSelect={(k) => setKey(k)}>
              <Tab eventKey="tradeOperations" title={t("tradeOperations")}>
                <DataTable
                  columns={generalColumns}
                  customStyles={customStyle}
                  data={fillArrayWithEmptyRows(filteredOrders, 5)}
                  defaultSortAsc={false}
                  defaultSortFieldId="close-date"
                  pagination
                  paginationRowsPerPageOptions={[5, 10, 15, 20, 50]}
                  theme={theme}
                />
              </Tab>
              <Tab eventKey="balanceOperations" title={t("balanceOperations")}>
                <DataTable
                  columns={depositsColumns}
                  customStyles={customStyle}
                  data={fillArrayWithEmptyRows(filteredDeposits, 5)}
                  pagination
                  paginationRowsPerPageOptions={[5, 10, 15, 20, 50]}
                  theme={theme}
                />
              </Tab>
            </Tabs>
            <select
              className="hide-on-desktop"
              onChange={(e) => {
                setShowRecord(e.target.value);
              }}
            >
              <option label={t("allOperations")} value="all"></option>
              <option label={t("today")} value="today"></option>
              <option label={t("lastWeek")} value="lastWeek"></option>
              <option label={t("lastMonth")} value="lastMonth"></option>
              <option label={t("last3Months")} value="last3Month"></option>
            </select>
          </div>
          <div className="report-footer hide-on-mobile">
            <select
              onChange={(e) => {
                setShowRecord(e.target.value);
              }}
            >
              <option label={t("allOperations")} value="all"></option>
              <option label={t("today")} value="today"></option>
              <option label={t("lastWeek")} value="lastWeek"></option>
              <option label={t("lastMonth")} value="lastMonth"></option>
              <option label={t("last3Months")} value="last3Month"></option>
            </select>
            <span>
              {t("balance")}: {+parseFloat(balance)?.toFixed(2)}
            </span>
            <span>
              {t("bonus")}: {+parseFloat(bonus)?.toFixed(2)}
            </span>
            <span>
              {t("totalProfit")}: {+parseFloat(totalProfit)?.toFixed(2)}
            </span>
            <span>
              {t("bonusSpent")}: {+bonusSpent?.toFixed(2)}
            </span>
            <span>
              {t("deposited")}: {deposited}
            </span>
            <span>
              {t("withdrawn")}: {withdrawn}
            </span>
            <span>
              {t("totalDeals")}: {orders.length}
            </span>
            <button className="hide-on-mobile" onClick={onClose}>
              {t("close")}
            </button>
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default ReportModal;
