import { Form, Modal } from "react-bootstrap";
import { updateShowColumnsById } from "../helper/firebaseHelpers";
import { useEffect } from "react";

const SelectColumnsModal = ({ userId, setModal, columns, setColumns }) => {
  const closeModal = () => setModal(false);

  useEffect(
    () => () => updateShowColumnsById(userId, { dealsColumns: columns }),
    [columns, userId]
  );

  return (
    <Modal
      animation
      backdropClassName="opacity-0"
      dialogClassName="position-absolute columns-modal"
      keyboard
      onHide={closeModal}
      show
      size="sm"
    >
      <Modal.Header className="py-1 ">Show/Hide Columns</Modal.Header>
      <Modal.Body className="py-1">
        {Object.keys(columns).map((column) => {
          return (
            <Form.Check
              checked={columns[column]}
              label={column.toUpperCase()}
              onChange={(e) =>
                setColumns((p) => ({ ...p, [column]: e.target.checked }))
              }
            />
          );
        })}
      </Modal.Body>
    </Modal>
  );
};

export default SelectColumnsModal;
