"use client";

import { createContext, use, useCallback, useMemo, useState } from "react";
import type { ComponentProps, ComponentType } from "react";
import { modals } from "@/components/modals/registry";
import type { ConfirmOptions } from "@/components/modals/ConfirmModal";

type ModalName = keyof typeof modals;

// A modal's props, minus onClose (the provider passes that in).
type ModalProps<N extends ModalName> = Omit<
  ComponentProps<(typeof modals)[N]>,
  "onClose"
>;

type ModalContextValue = {
  openModal: <N extends ModalName>(name: N, props: ModalProps<N>) => void;
  closeModal: () => void;
  // Resolves true on confirm, false on cancel, Esc or backdrop click.
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const ModalContext = createContext<ModalContextValue | null>(null);

type ActiveModal = { name: ModalName; props: object };

export const ModalProvider = ({ children }: { children: React.ReactNode }) => {
  // One modal at a time: opening another replaces the current one.
  const [active, setActive] = useState<ActiveModal | null>(null);

  const openModal = useCallback(
    <N extends ModalName>(name: N, props: ModalProps<N>) =>
      setActive({ name, props }),
    [],
  );

  const closeModal = useCallback(() => setActive(null), []);

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) =>
        openModal("confirm", { ...options, onResult: resolve }),
      ),
    [openModal],
  );

  const value = useMemo(
    () => ({ openModal, closeModal, confirm }),
    [openModal, closeModal, confirm],
  );

  const ActiveComponent = active
    ? (modals[active.name] as ComponentType<Record<string, unknown>>)
    : null;

  return (
    <ModalContext value={value}>
      {children}
      {active && ActiveComponent && (
        // The key remounts the modal when a different one replaces it.
        <ActiveComponent key={active.name} {...active.props} onClose={closeModal} />
      )}
    </ModalContext>
  );
};

export const useModal = () => {
  const context = use(ModalContext);
  if (!context) throw new Error("useModal must be used inside <ModalProvider>");
  return context;
};
