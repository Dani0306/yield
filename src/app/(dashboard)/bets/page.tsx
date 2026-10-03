import BetsContent from "@/components/bets/BetsContent";
import { getBets } from "@/actions/bets/getBets";

export default async function BetsPage() {
  const bets = await getBets();
  return <BetsContent bets={bets} />;
}
