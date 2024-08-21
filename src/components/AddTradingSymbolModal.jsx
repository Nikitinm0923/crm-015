import { addQuotesToUser } from "../helper/firebaseHelpers";
import { Modal } from "react-bootstrap";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import React, { useEffect, useState } from "react";

let groups = [
  { key: "Commodities", value: "commodities" },
  { key: "Crypto", value: "crypto" },
  { key: "Currencies", value: "currencies" },
  { key: "Stocks", value: "stocks" },
];

const AddTradingSymbol = ({
  show,
  symbols,
  handleCloseModal,
  userQuotes,
  userId,
}) => {
  const [formData, setFormData] = useState({ symbol: "" });
  const [group, setGroup] = useState("crypto");
  const { symbol } = formData;
  const assetGroups = useSelector((state) => state.assetGroups);

  useEffect(() => {
    setFormData({
      symbol: symbols.find((s) => s?.settings?.group === group)?.id,
    });
  }, [group]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!symbol) {
      toast.error("Please select symbol!");
    } else {
      let isExists = false;
      if (userQuotes?.length > 0) {
        isExists = userQuotes?.includes(symbol);
      }
      if (isExists) {
        toast.error("Symbol already exists in your quotes");
      } else {
        let newQuotes = [];
        if (!userQuotes) {
          newQuotes = [symbol];
        } else {
          newQuotes = [...userQuotes, symbol];
        }
        await addQuotesToUser(userId, newQuotes);
        toast.success("Added Successfully");
        handleCloseModal();
      }
    }
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const filteredSymbols = symbols.filter((s) => s?.settings?.group === group);

  useEffect(() => {
    if (assetGroups.length > 0) {
      assetGroups.forEach((g) => {
        groups.push({ key: g.title, value: g.title });
      });
    }
  }, []);

  return (
    <div>
      <Modal
        centered
        className="asset-modal"
        onHide={handleCloseModal}
        show={show}
      >
        <Modal.Header
          closeButton={handleCloseModal}
          style={{
            backgroundColor: "var(--main-secondary-color)",
            fontWeight: "600",
          }}
        >
          Add Symbol
        </Modal.Header>
        <Modal.Body
          style={{
            backgroundColor: "var(--main-secondary-color)",
            borderRadius: "5px",
          }}
        >
          <form style={{ backgroundColor: "inherit" }} onSubmit={handleSubmit}>
            <div className="form-item">
              <label htmlFor="group">Group:</label>
              <select
                id="group"
                name="group"
                onChange={(e) => setGroup(e.target.value)}
              >
                {groups?.map((el, idx) => (
                  <option key={idx} value={el.value}>
                    {el.key}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-item">
              <label htmlFor="symbol">Select Symbol:</label>
              <select id="symbol" name="symbol" onChange={handleChange}>
                <option value="" disabled>
                  Select Symbol
                </option>
                {filteredSymbols?.map((el, idx) => (
                  <option key={idx} value={el?.id}>
                    {el?.symbol}
                  </option>
                ))}
              </select>
            </div>
            <div className="asset-btn-group">
              <button
                style={{ backgroundColor: "var(--main-primary-button)" }}
                type="submit"
              >
                Submit
              </button>
              <button onClick={handleCloseModal}>Cancel</button>
            </div>
          </form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default AddTradingSymbol;
