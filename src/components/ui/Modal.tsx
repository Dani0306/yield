"use client";

import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { useScrollLock } from "usehooks-ts";

const sizes = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-2xl",
};

type ModalProps = {
  title?: string;
  description?: string;
  // Called on Esc, backdrop click or the close button.
  onClose: () => void;
  // Width from the sm breakpoint up. Below it the modal is always full screen.
  size?: keyof typeof sizes;
  className?: string;
  children?: React.ReactNode;
};

// Shared modal shell built on the native <dialog>: the browser handles Esc,
// focus trapping, returning focus, stacking above everything and the backdrop.
const Modal = ({
  title,
  description,
  onClose,
  size = "md",
  className = "",
  children,
}: ModalProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useScrollLock();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={description ? descriptionId : undefined}
      // Fires after Esc (the browser has already closed the dialog).
      onClose={onClose}
      // A click on the <dialog> itself (not its content) is a backdrop click.
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className={`m-0 h-dvh max-h-none w-full max-w-none overflow-y-auto border-0 bg-white p-0 text-gray-900 backdrop:bg-black/60 sm:m-auto sm:h-auto sm:max-h-[calc(100dvh-4rem)] sm:w-[calc(100%-2rem)] sm:rounded-md sm:border sm:border-gray-200 ${sizes[size]} ${className}`}
    >
      <div className="flex flex-col gap-5 p-6">
        {/* Always rendered: full screen on phones has no backdrop to tap. */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            {title && (
              <h2 id={titleId} className="text-base font-medium text-black">
                {title}
              </h2>
            )}
            {description && (
              <p
                id={descriptionId}
                className="text-sm font-light text-gray-500"
              >
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="-m-1.5 cursor-pointer p-1.5 text-gray-500 transition-colors hover:text-black"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
};

export default Modal;
