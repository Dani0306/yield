"use client";

import { useRef } from "react";
import Modal from "@/components/ui/Modal";

export type ConfirmOptions = {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
};

type ConfirmModalProps = ConfirmOptions & {
  onResult: (confirmed: boolean) => void;
  onClose: () => void;
};

const ConfirmModal = ({
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onResult,
  onClose,
}: ConfirmModalProps) => {
  const answered = useRef(false);

  // Esc, backdrop and the close button all count as "cancel".
  const respond = (confirmed: boolean) => {
    if (answered.current) return;
    answered.current = true;
    onResult(confirmed);
    onClose();
  };

  return (
    <Modal title={title} description={description} onClose={() => respond(false)}>
      <div className="flex justify-end gap-2">
        {/* Focused first, so Enter never confirms by accident. */}
        <button
          autoFocus
          onClick={() => respond(false)}
          className="cursor-pointer border border-gray-200 px-4 py-2.5 text-sm font-light transition-colors hover:bg-gray-100"
        >
          {cancelText}
        </button>
        <button
          onClick={() => respond(true)}
          className="cursor-pointer bg-black px-4 py-2.5 text-sm font-light text-white transition-colors hover:bg-neutral-800"
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
