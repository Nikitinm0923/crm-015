import { faClose, faEdit } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const dealsColumns = ({
  t = () => {},
  handleEditModal,
  handleCloseBtn,
  showColumns = {},
} = {}) => [
  {
    grow: 1.5,
    name: t("date"),
    omit: !showColumns.date,
    selector: (row) => row.createdTime && row.createdTime,
    sortable: true,
  },
  {
    name: t("symbol"),
    selector: (row) => row && row.symbol,
    sortable: true,
    omit: !showColumns.symbol,
  },
  {
    compact: true,
    name: t("type"),
    selector: (row) =>
      row ? (
        row.type === "Buy" ? (
          <span style={{ color: "var(--success-color)", fontWeight: "600" }}>
            {row.type}
          </span>
        ) : (
          <span style={{ color: "var(--danger-color)", fontWeight: "600" }}>
            {row.type}
          </span>
        )
      ) : (
        ""
      ),
    omit: !showColumns.type,
    sortable: true,
  },
  {
    name: t("volume"),
    omit: !showColumns.volume,
    selector: (row) => row && row.volume,
    sortable: true,
  },
  {
    name: t("openPrice"),
    omit: !showColumns.openPrice,
    selector: (row) => row && +row.symbolValue,
    sortable: true,
  },
  {
    name: t("slTp"),
    omit: !showColumns.sltp,
    selector: (row) => row && row.sltp,
  },
  {
    compact: true,
    grow: 2.5,
    name: t("additionalParameters"),
    omit: !showColumns.additionalParameters,
    selector: (row) =>
      row &&
      `Spread: ${+parseFloat(row.spread)?.toFixed(4)} / Swap: ${+parseFloat(
        row.swap
      )?.toFixed(4)} / Fee: ${+parseFloat(row.fee)?.toFixed(4)}`,
  },
  {
    compact: true,
    name: t("margin"),
    omit: !showColumns.margin,
    selector: (row) => row && +parseFloat(row.sum)?.toFixed(4),
    sortable: true,
  },
  {
    compact: true,
    name: t("currentPrice"),
    omit: !showColumns.currentPrice,
    selector: (row) => row && row.currentPrice,
    sortable: true,
  },
  {
    name: t("profit"),
    omit: !showColumns.profit,
    selector: (row) =>
      row && (
        <span
          style={{
            color:
              row.profit < 0
                ? "var(--danger-color)"
                : row.profit === 0
                ? ""
                : "var(--success-color)",
          }}
        >
          {row.profit}
        </span>
      ),
    sortable: true,
  },
  {
    name: t("action"),
    omit: !showColumns.action,
    selector: (row) =>
      row && (
        <div>
          <FontAwesomeIcon
            icon={faEdit}
            onClick={() => handleEditModal(row)}
            size="lg"
          />
          <FontAwesomeIcon
            className="ms-3"
            icon={faClose}
            id="closeDealIcon"
            onClick={() => handleCloseBtn(row)}
            size="lg"
          />
        </div>
      ),
  },
];

export default dealsColumns;
