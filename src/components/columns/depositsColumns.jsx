import i18n from "../../i18n";

const depositsColumns = [
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
];

export default depositsColumns;
