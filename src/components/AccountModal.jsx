import React, { useState, useEffect } from "react";
import { Button, ButtonGroup, Modal } from "react-bootstrap";
import {
  updateUserById,
  incrementLastAccountNo,
  getDocument,
} from "../helper/firebaseHelpers";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

const AccountModal = ({ onClose, userProfile }) => {
  const [accountNo, setAccountNo] = useState("");
  const [accountType, setAccountType] = useState("Standard");
  const [isLoading, setIsLoading] = useState(true);
  const [showAccountSuccessModal, setShowAccountSuccessModal] = useState(false);
  const [type, setType] = useState("Demo");
  const { t } = useTranslation();

  useEffect(() => {
    const fetchLastAccount = async () => {
      const { lastAccountNo } = await getDocument(
        "configs",
        "8VaY8WzBNUl6Ca8KbpWD"
      );
      if (!lastAccountNo)
        return toast.error("Error fetching last account number");
      setAccountNo(+lastAccountNo + 1);
      setIsLoading(false);
    };
    fetchLastAccount();
  }, []);

  const createNewAccount = async () => {
    if (
      userProfile?.accounts?.length === 2 &&
      userProfile?.accounts?.find((a) => !a?.isDeleted)
    )
      return toast.error("You have reached max account limit");
    try {
      setIsLoading(true);
      const accounts =
        userProfile?.accounts?.map((account) => ({
          ...account,
          isDefault: false,
        })) || [];
      accounts.push({
        account_no: accountNo,
        account_type: accountType,
        activeOrdersProfit: 0,
        activeOrdersSwap: 0,
        bonus: 0,
        bonusSpent: 0,
        isDefault: true,
        isDeleted: false,
        totalBalance: 0,
        totalMargin: 0,
        type: type,
      });
      await updateUserById(userProfile.id, { accounts });
      await incrementLastAccountNo();
      setShowAccountSuccessModal(true);
      onClose();
    } catch (error) {
      toast.error("Error in creating account number");
      console.log("Error", error);
      setIsLoading(false);
    }
  };

  return (
    <>
      <Modal
        centered
        className="modal-style-edit modal-style-del acc-modal-ne"
        onHide={onClose}
        backdrop={false}
        show
      >
        <Modal.Header
          className="py-2"
          closeButton
          style={{ borderBottom: "1px solid var(--main-secondary-color)" }}
        >
          <h3 className="mb-0">{t("openAccount")}</h3>
        </Modal.Header>
        <Modal.Body className="d-flex flex-column align-items-center gap-3">
          <ButtonGroup className="btn-group">
            <Button
              onClick={() => {
                setType("Live");
              }}
              style={{
                backgroundColor:
                  type === "Live"
                    ? "var(--main-primary-button)"
                    : "var(--main-secondary-color)",
              }}
              variant=""
            >
              Live
            </Button>
            <Button
              onClick={() => {
                setType("Demo");
              }}
              style={{
                backgroundColor:
                  type === "Demo"
                    ? "var(--main-primary-button)"
                    : "var(--main-secondary-color)",
              }}
              variant=""
            >
              Demo
            </Button>
          </ButtonGroup>
          <div className="d-flex gap-4 fs-6">
            <div className="form-check form-check-inline">
              <input
                checked={accountType === "Standard"}
                className="form-check-input"
                id="inlineRadio1"
                name="inlineRadioOptions"
                onChange={() => setAccountType("Standard")}
                type="radio"
              />
              <label className="form-check-label" htmlFor="inlineRadio1">
                Standard
              </label>
            </div>
            <div className="form-check form-check-inline">
              <input
                checked={accountType === "Islamic"}
                className="form-check-input"
                id="inlineRadio2"
                name="inlineRadioOptions"
                onChange={() => setAccountType("Islamic")}
                type="radio"
              />
              <label className="form-check-label" htmlFor="inlineRadio2">
                Islamic
              </label>
            </div>
          </div>
          <div className="fs-5">
            {t("accountNumber")}:
            <span className="ms-2" style={{ color: "var(--success-color)" }}>
              {accountNo || "Loading..."}
            </span>
          </div>
          <button
            className="deposit-acc-btn"
            disabled={isLoading}
            onClick={createNewAccount}
            style={{ width: "50%" }}
          >
            {t("create")}
          </button>
        </Modal.Body>
      </Modal>
      {showAccountSuccessModal && (
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
                  onClick={() => setShowAccountSuccessModal(false)}
                  type="button"
                />
              </div>
              <div
                className="modal-body"
                style={{ backgroundColor: "inherit" }}
              >
                <p>Account created Successfully!</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AccountModal;
