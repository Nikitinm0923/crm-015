import { deleteDocument } from "../../helper/firebaseHelpers";
import { toastify } from "../../helper/toastHelper";

const withdrawColumns = [
  {
    name: "ID",
    selector: (row, i) => row && i + 1,
  },
  {
    name: "Date",
    selector: (row) => row && row.createdAt,
  },

  { name: "Method", selector: (row) => row.method },
  {
    name: "Sum",
    selector: (row) => row && +parseFloat(row.sum)?.toFixed(2),
  },
  { name: "Type", selector: (row) => row.type },
  {
    name: "Status",
    selector: (row) => row.status,
  },
  {
    name: "Action",
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
            Cancel
          </button>
        </div>
      ),
  },
];

export default withdrawColumns;
