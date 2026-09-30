import Modal from "../ui/Modal";
import { useModal } from "../providers/ModalProvider";

const BetModal = () => {
  const { closeModal } = useModal();

  return (
    <Modal
      size="lg"
      onClose={closeModal}
      title="Bet modal"
      description="This is just a test description for the modal."
    ></Modal>
  );
};

export default BetModal;
