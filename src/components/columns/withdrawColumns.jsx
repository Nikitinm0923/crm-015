import { deleteDocument } from "../../helper/firebaseHelpers";
import { toastify } from "../../helper/toastHelper";
import i18n from "../../i18n";

const withdrawColumns = [
  {
    name: i18n.t("ID"),
    selector: (row, i) => row && i + 1,
  },
  {
    name: i18n.t("date"),
    selector: (row) => row && row.createdAt,
  },

  { name: i18n.t("method"), selector: (row) => row.method },
  {
    name: i18n.t("sum"),
    selector: (row) => row && +parseFloat(row.sum)?.toFixed(2),
  },
  { name: i18n.t("type"), selector: (row) => row.type },
  {
    name: i18n.t("status"),
    selector: (row) => row.status,
  },
  {
    name: i18n.t("action"),
    selector: (row) =>
      row && (
        <div>
          <button
            disabled={row.status !== "Pending"}
            onClick={async () => {
              await deleteDocument("deposits", row.id);
              toastify("Withdrawal request canceled", "success");
            }}
            style={{
              backgroundColor: "transparent",
              border: "none",
              color: "var(--danger-color)",
            }}
          >
            {i18n.t("cancel")}
          </button>
        </div>
      ),
  },
];

export default withdrawColumns;
