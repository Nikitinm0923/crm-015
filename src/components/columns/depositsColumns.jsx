const depositsColumns = [
  {
    name: "ID",
    selector: (row, i) => row && i + 1,
    sortable: true,
    grow: 0.5,
  },
  {
    name: "Date",
    selector: (row) => row && row.createdAt,
    grow: 1.5,
  },
  {
    name: "Sum",
    selector: (row) => row && +parseFloat(row.sum)?.toFixed(2),
    grow: 0.5,
  },
  { name: "Type", selector: (row) => row.type },
  {
    name: "Comment",
    selector: (row) => row.comment,
  },
];

export default depositsColumns;
