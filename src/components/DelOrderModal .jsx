// Example: EditModal.js
import React, { useState } from "react";
import { Modal } from "react-bootstrap";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { toast } from "react-toastify";
import { addPlayerLogs, updateUserById } from "../helper/firebaseHelpers";
import { useTranslation } from "react-i18next";

const DelOrderModal = ({
  onClose,
  show,
  selectedOrder,
  userProfile,
  defaultAccount,
}) => {
  const [isPartial, setIsPartial] = useState(false);
  const [volume, setVolume] = useState(selectedOrder.volume);
  const [isLoading, setIsLoading] = useState(false);

  const { t } = useTranslation();

  const closedPrice = selectedOrder?.currentPrice;
  const potentialProfit = selectedOrder?.profit;
  const selectedOrderAccNo = selectedOrder.account_no;

  const updateOrderStatus = async (orderId, newStatus, newVolume) => {
    const orderRef = doc(db, "orders", orderId);
    const docSnapshot = await getDoc(orderRef);
    const newData = {
      status: newStatus,
      closedDate: serverTimestamp(),
      closedPrice,
    };

    if (newVolume) {
      newData.volume = newVolume;
      newData.sum = newVolume * closedPrice;
    }

    let totalMargin = parseFloat(defaultAccount?.totalMargin);
    if (newVolume) {
      totalMargin = +(defaultAccount?.totalMargin - newData.sum).toFixed(2);
    } else {
      totalMargin = +(defaultAccount?.totalMargin - selectedOrder.sum).toFixed(
        2
      );
    }

    if (
      userProfile?.settings?.allowBonus &&
      defaultAccount.totalBalance < 0 &&
      defaultAccount.bonus - Math.abs(defaultAccount.totalBalance) >= 0
    ) {
      const spentBonus = Math.abs(defaultAccount.totalBalance);
      if (defaultAccount.bonus < spentBonus)
        return toast.error("Not enough bonus to cover the loss");
      defaultAccount.totalBalance = defaultAccount.totalBalance + spentBonus;
      defaultAccount.bonus = +parseFloat(
        defaultAccount.bonus - spentBonus
      )?.toFixed(2);
      defaultAccount.bonusSpent = +parseFloat(
        defaultAccount.bonusSpent + spentBonus
      )?.toFixed(2);
    }

    const accounts = userProfile.accounts.map((ac) => {
      if (ac.account_no !== defaultAccount.account_no) return ac;
      ac = { ...defaultAccount };
      defaultAccount = {
        ...ac,
        totalBalance:
          ac.totalBalance + selectedOrder.profit - selectedOrder.swap,
        totalMargin,
        activeOrdersProfit: +parseFloat(
          ac?.activeOrdersProfit - selectedOrder.profit
        ).toFixed(2),
        activeOrdersSwap: +parseFloat(
          ac?.activeOrdersSwap - selectedOrder.swap
        )?.toFixed(2),
      };
      return defaultAccount;
    });

    newData.balance = +parseFloat(defaultAccount.totalBalance)?.toFixed(2);

    if (docSnapshot.exists()) {
      await updateDoc(orderRef, newData);
      await updateUserById(userProfile.id, { accounts });

      toast.success("Order status updated successfully");
    } else {
      toast.error("Order does not exist");
    }
  };

  const updateUserBalance = async (orderPrice) => {
    const userRef = doc(db, "users", selectedOrder.userId);
    const userSnapshot = await getDoc(userRef);
    if (userSnapshot.exists()) {
      const userData = userSnapshot
        .data()
        .find((account) => account.account_no === selectedOrderAccNo);
      await updateDoc(userRef, {
        totalBalance: userData?.totalBalance - orderPrice,
      });
    } else {
      toast.error("User not found");
    }
  };

  const createNewOrder = async () => {
    const formattedDate = new Date().toLocaleDateString("en-US");
    const newVolume = parseFloat(selectedOrder.volume) - parseFloat(volume);
    const newOrder1 = {
      ...selectedOrder,
      volume: newVolume,
      sum: newVolume * selectedOrder.symbolValue,
      profit: 0,
      createdTime: serverTimestamp(),
      createdAt: formattedDate,
      status: "Pending",
    };
    delete newOrder1.id;
    delete newOrder1.sltp;
    const orderRef = collection(db, "orders");
    await addDoc(orderRef, newOrder1);
  };

  const newOrder = async () => {
    if (isPartial) {
      if (
        parseFloat(volume) <= 0 ||
        parseFloat(volume) >= parseFloat(selectedOrder.volume)
      ) {
        toast.error(
          "Please add a volume which is less than the current volume"
        );
      } else {
        setIsLoading(true);
        try {
          await createNewOrder();
          await updateOrderStatus(selectedOrder.id, "Closed", volume);
          // const orderPrice = volume * closedPrice;
          // await updateUserBalance(orderPrice);
          onClose();
          await addPlayerLogs("Closed deal partially", userProfile?.id);
        } catch (error) {
          console.log(error);
          toast.error(error.message);
        }
        setIsLoading(false);
      }
    } else {
      setIsLoading(true);
      try {
        await updateOrderStatus(selectedOrder.id, "Closed");
        // const orderPrice = volume * closedPrice;
        // await updateUserBalance(orderPrice);
        onClose();
        await addPlayerLogs("Closed deal", userProfile?.id);
      } catch (error) {
        console.log(error);
        toast.error(error.message);
      }
      setIsLoading(false);
    }
  };

  return (
    <>
      <Modal
        show={show}
        onHide={onClose}
        className="modal-style-edit modal-style-del"
        centered
      >
        <Modal.Header
          className="bg-transparent border-0 rounded-0 text-center p-1 pb-0 align-items-center"
          closeButton
        >
          <p className="bg-transparent mb-0 w-100">
            {t("closeOrder")}: {selectedOrder?.id} - {selectedOrder?.symbol}
          </p>
        </Modal.Header>
        <Modal.Body className="bg-secondry d-flex flex-column gap-3 p-3 pt-0">
          <div className="d-flex flex-column justify-content-start align-items-start gap-2">
            <label
              className="form-check-label fs-6 mb-2 ms-2"
              for="flexRadioDefault1"
            >
              {t("closingType")}:
            </label>
            <div className="d-flex gap-4 fs-6 ">
              <div className="form-check form-check-inline">
                <input
                  class="form-check-input"
                  type="radio"
                  name="inlineRadioOptions"
                  id="inlineRadio1"
                  checked={!isPartial}
                  onChange={(e) => {
                    if (isPartial) setIsPartial(false);
                  }}
                />
                <label class="form-check-label" for="inlineRadio1">
                  {t("full")}
                </label>
              </div>
              <div class="form-check form-check-inline">
                <input
                  class="form-check-input"
                  type="radio"
                  name="inlineRadioOptions"
                  id="inlineRadio2"
                  checked={isPartial}
                  onChange={(e) => {
                    if (!isPartial) setIsPartial(true);
                  }}
                />
                <label class="form-check-label" for="inlineRadio2">
                  {t("partial")}
                </label>
              </div>
            </div>
          </div>
          {isPartial && (
            <div className="row my-2">
              <label for="staticEmail" class="col-sm-4 col-form-label">
                {t("volume")}
              </label>
              <div class="col-sm-8">
                <input
                  type="number"
                  className="form-control border-1 border-black rounded-0 input-number"
                  id="staticEmail"
                  value={volume}
                  onChange={(e) => {
                    setVolume(e.target.value);
                  }}
                />
              </div>
            </div>
          )}
          <div className="ps-3 fs-5">
            {t("currentPrice")}:{" "}
            <span className={`ms-2 text-success`}>{closedPrice}</span>
          </div>
          <div className="ps-3 fs-5">
            {t("potentialProfit")}:{" "}
            <span
              className={`ms-2 ${
                potentialProfit > 0 ? "text-success" : "text-danger"
              }`}
            >
              {potentialProfit}
            </span>
          </div>
          <div className="w-100 text-center my-2">
            <button
              className="modal-close-btn btn btn-success fs-5 rounded-4 mx-auto"
              onClick={() => {
                newOrder();
              }}
              disabled={isLoading}
            >
              {t("closePosition")}
            </button>
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default DelOrderModal;
