"use client";

import { useState, useTransition } from "react";
import Modal from "../ui/Modal";
import { deleteBet } from "@/actions/bets/deleteBet";
import { matchName } from "@/lib/utils/bets";
import type { Bet } from "@/types";

type DeleteBetModalProps = {
  bet: Bet;
  // Back to the bet, without deleting.
  onCancel: () => void;
  onDeleted: () => void;
};

const DeleteBetModal = ({ bet, onCancel, onDeleted }: DeleteBetModalProps) => {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () =>
    startTransition(async () => {
      setError(null);
      const { error } = await deleteBet(bet.id);
      if (error) return setError(error);
      onDeleted();
    });

  return (
    <Modal
      size="sm"
      title="Delete this bet?"
      description={
        <>
          {matchName(bet)} · attempt {bet.attempt_number} of progression #
          {bet.progression_number}. This can&apos;t be undone.
        </>
      }
      onClose={() => !isPending && onCancel()}
    >
      <div className="flex flex-col gap-4">
        {error && <p className="text-sm text-red-700">{error}</p>}
        <div className="flex justify-end gap-2">
          {/* Focused first, so Enter never deletes by accident. */}
          <button
            autoFocus
            onClick={onCancel}
            disabled={isPending}
            className="cursor-pointer rounded-md border border-gray-200 px-4 py-2 text-sm text-black transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="cursor-pointer rounded-md bg-black px-4 py-2 text-sm text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Deleting…" : "Delete bet"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteBetModal;
