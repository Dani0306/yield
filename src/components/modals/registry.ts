import BetModal from "../bets/BetModal";
import CreateBet from "../bets/CreateBet";
import ResultDetails from "../draw-odds/ResultDetails";
import ConfirmModal from "./ConfirmModal";

// Every modal the app can open by name. To add one:
// 1. Create the component in this folder. It receives `onClose` from the provider.
// 2. Add it here. openModal("yourModal", props) is then typed automatically.
export const modals = {
  confirm: ConfirmModal,
  bet: BetModal,
  createBet: CreateBet,
  result: ResultDetails,
};
