export default async function BetPage({ params }: PageProps<"/bets/[id]">) {
  const { id } = await params;
  return <h1 className="text-2xl font-medium">Bet {id}</h1>;
}
