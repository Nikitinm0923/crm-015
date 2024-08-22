const depositsColumns = [
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
];

export default depositsColumns;
