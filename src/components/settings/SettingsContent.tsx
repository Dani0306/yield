"use client";

import { useState, useTransition } from "react";
import PageContainer from "../layout/PageContainer";
import Input from "../ui/Input";
import PageButton from "../ui/PageButton";
import Avatar from "../ui/Avatar";
import { updateProfile, type ProfileInput } from "@/actions/user/updateProfile";
import { useSignOut } from "@/hooks/auth/useSignOut";
import {
  formatDate,
  formatMoney,
  formatUnits,
  getFullName,
  getInitials,
} from "@/lib/utils/fn";
import {
  STAKE_MULTIPLIER,
  UNITS_PER_BANKROLL,
  stakeAfterLosses,
  unitValue,
} from "@/lib/utils/staking";
import type { User } from "@/types";

// Stakes shown in the bankroll preview: the first bet plus five losses.
const LADDER_STEPS = 6;
// Stop counting covered losses here; the figure only matters when low.
const MAX_COVERED = 50;

// One settings block: what it is on the left, its fields on the right.
const SettingsSection = ({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) => (
  <section className="grid gap-6 border-t border-gray-200 py-10 first:border-t-0 first:pt-0 lg:grid-cols-[1fr_2fr] lg:gap-12">
    <div className="flex flex-col gap-1.5">
      <h2 className="text-sm font-medium text-black">{title}</h2>
      <p className="text-sm font-light text-gray-500">{description}</p>
    </div>
    <div className="flex min-w-0 flex-col gap-6">{children}</div>
  </section>
);

// Saves a section's changes and reports how it went.
const useSave = () => {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<{ error: string | null } | null>(null);

  const save = (input: ProfileInput, onSaved?: () => void) =>
    startTransition(async () => {
      setStatus(null);
      const result = await updateProfile(input);
      setStatus(result);
      if (!result.error) onSaved?.();
    });

  return { isPending, status, save, clearStatus: () => setStatus(null) };
};

const SaveRow = ({
  dirty,
  isPending,
  status,
  onSave,
}: {
  dirty: boolean;
  isPending: boolean;
  status: { error: string | null } | null;
  onSave: () => void;
}) => (
  <div className="flex items-center gap-4">
    <PageButton
      type="button"
      text={isPending ? "Saving…" : "Save changes"}
      onClick={onSave}
      disabled={!dirty || isPending}
      className="rounded-md px-5"
    />
    {status?.error && (
      <p role="alert" className="text-sm text-red-700">
        {status.error}
      </p>
    )}
    {status && !status.error && !dirty && (
      <p role="status" className="text-sm text-gray-500">
        Saved
      </p>
    )}
  </div>
);

const BankrollSection = ({ user }: { user: User }) => {
  const [saved, setSaved] = useState(user.total_budget);
  const [budget, setBudget] = useState(String(user.total_budget));
  const { isPending, status, save, clearStatus } = useSave();

  const value = Number(budget);
  const valid = budget.trim() !== "" && Number.isFinite(value) && value > 0;
  const dirty = valid && value !== saved;

  // The stakes this bankroll gives, and how many losses in a row it covers.
  const ladder = valid
    ? Array.from({ length: LADDER_STEPS }, (_, losses) =>
        stakeAfterLosses(losses, value),
      )
    : [];
  let covered = 0;
  if (valid) {
    let spent = 0;
    while (covered < MAX_COVERED) {
      spent += stakeAfterLosses(covered, value).amount;
      if (spent > value) break;
      covered++;
    }
  }

  return (
    <SettingsSection
      title="Bankroll"
      description={`The money set aside for the strategy. One unit is 1/${UNITS_PER_BANKROLL} of it, and every stake is worked out from the unit. Changing it changes the stake of your next bets, including in the current progression.`}
    >
      <div className="max-w-sm">
        <Input
          label="Bankroll (COP)"
          name="total_budget"
          type="number"
          value={budget}
          setValue={(next) => {
            clearStatus();
            setBudget(next);
          }}
        />
      </div>

      {valid ? (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-6 border-y border-gray-200 py-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-gray-500">1 unit</span>
              <span className="font-mono text-2xl tracking-tight text-black">
                {formatMoney(unitValue(value))}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-gray-500">Covers</span>
              <span className="font-mono text-2xl tracking-tight text-black">
                {covered >= MAX_COVERED ? `${MAX_COVERED}+` : covered}
              </span>
              <span className="text-xs text-gray-500">losses in a row</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs text-gray-500">
              Stake ladder · ×{STAKE_MULTIPLIER} after each loss
            </span>
            <table className="w-full text-sm">
              <thead className="sr-only">
                <tr>
                  <th scope="col">Attempt</th>
                  <th scope="col">Units</th>
                  <th scope="col">Amount</th>
                </tr>
              </thead>
              <tbody>
                {ladder.map((stake, losses) => (
                  <tr
                    key={losses}
                    className="border-b border-gray-100 last:border-b-0"
                  >
                    <td className="py-2 text-gray-500">
                      {losses === 0
                        ? "First bet"
                        : `After ${losses} loss${losses === 1 ? "" : "es"}`}
                    </td>
                    <td className="py-2 text-right font-mono text-gray-500">
                      {formatUnits(stake.units)}
                    </td>
                    <td className="py-2 pl-6 text-right font-mono text-black">
                      {formatMoney(stake.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500">
          Enter an amount above 0 to see your unit and stakes.
        </p>
      )}

      <SaveRow
        dirty={dirty}
        isPending={isPending}
        status={status}
        onSave={() => save({ total_budget: value }, () => setSaved(value))}
      />
    </SettingsSection>
  );
};

const ProfileSection = ({ user }: { user: User }) => {
  const initial = {
    first_name: user.first_name ?? "",
    last_name: user.last_name ?? "",
    username: user.username ?? "",
  };
  const [saved, setSaved] = useState(initial);
  const [firstName, setFirstName] = useState(initial.first_name);
  const [lastName, setLastName] = useState(initial.last_name);
  const [username, setUsername] = useState(initial.username);
  const { isPending, status, save, clearStatus } = useSave();

  const current = {
    first_name: firstName,
    last_name: lastName,
    username,
  };
  const dirty =
    current.first_name.trim() !== saved.first_name ||
    current.last_name.trim() !== saved.last_name ||
    current.username.trim().toLowerCase() !== saved.username;

  // Live preview of how the name shows in the sidebar.
  const preview = { ...user, first_name: firstName, last_name: lastName };
  const edit =
    (set: (value: string) => void) => (value: React.SetStateAction<string>) => {
      clearStatus();
      set(value as string);
    };

  return (
    <SettingsSection
      title="Profile"
      description="How you appear in the app. Your name shows in the sidebar menu."
    >
      <div className="flex items-center gap-4">
        <Avatar initials={getInitials(preview)} size={44} />
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm text-black">
            {getFullName(preview) || "No name yet"}
          </span>
          <span className="truncate text-xs text-gray-500">
            {username.trim() ? `@${username.trim().toLowerCase()}` : user.email}
          </span>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label="First name"
          name="first_name"
          type="text"
          value={firstName}
          setValue={edit(setFirstName)}
        />
        <Input
          label="Last name"
          name="last_name"
          type="text"
          value={lastName}
          setValue={edit(setLastName)}
        />
      </div>
      <div className="max-w-sm">
        <Input
          label="Username"
          name="username"
          type="text"
          value={username}
          setValue={edit(setUsername)}
        />
      </div>

      <SaveRow
        dirty={dirty}
        isPending={isPending}
        status={status}
        onSave={() =>
          save(current, () =>
            setSaved({
              first_name: current.first_name.trim(),
              last_name: current.last_name.trim(),
              username: current.username.trim().toLowerCase(),
            }),
          )
        }
      />
    </SettingsSection>
  );
};

// Saves as soon as the box is ticked: there is nothing else to batch it with.
const NotificationsSection = ({ user }: { user: User }) => {
  const [enabled, setEnabled] = useState(user.email_reminders);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const toggle = (next: boolean) => {
    setEnabled(next);
    setError(null);
    startTransition(async () => {
      const result = await updateProfile({ email_reminders: next });
      // Put the switch back if saving failed.
      if (result.error) {
        setEnabled(!next);
        setError(result.error);
      }
    });
  };

  return (
    <SettingsSection
      title="Notifications"
      description="A reminder email 10 minutes before a selected match kicks off, with the stake and the best odds collected. Matches you've already bet on are skipped."
    >
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={enabled}
          disabled={isPending}
          onChange={(e) => toggle(e.target.checked)}
          className="mt-0.5 size-4 shrink-0 cursor-pointer accent-black disabled:cursor-not-allowed"
        />
        <span className="flex flex-col gap-1">
          <span className="text-sm text-black">Email me before kick-off</span>
          <span className="text-xs text-gray-500">Sent to {user.email}</span>
        </span>
      </label>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
    </SettingsSection>
  );
};

const AccountSection = ({ user }: { user: User }) => {
  const { isPending, signOutFn } = useSignOut();

  return (
    <SettingsSection title="Account" description="Your sign-in details.">
      <dl className="flex flex-col">
        <div className="flex items-baseline gap-4 border-y border-gray-200 py-3">
          <dt className="w-28 shrink-0 text-xs text-gray-500">Email</dt>
          <dd className="min-w-0 truncate text-sm text-black">{user.email}</dd>
        </div>
        <div className="flex items-baseline gap-4 border-b border-gray-200 py-3">
          <dt className="w-28 shrink-0 text-xs text-gray-500">Member since</dt>
          <dd className="text-sm text-black">{formatDate(user.created_at)}</dd>
        </div>
      </dl>
      <div>
        <button
          type="button"
          onClick={signOutFn}
          disabled={isPending}
          className="cursor-pointer rounded-md border border-gray-300 px-5 py-2.5 text-sm text-black transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </SettingsSection>
  );
};

// The settings page: bankroll (drives every stake), profile, notifications
// and account.
const SettingsContent = ({ user }: { user: User }) => (
  <PageContainer
    title="Settings"
    description="Your bankroll, profile, notifications and account."
  >
    <div className="flex flex-col">
      <BankrollSection user={user} />
      <ProfileSection user={user} />
      <NotificationsSection user={user} />
      <AccountSection user={user} />
    </div>
  </PageContainer>
);

export default SettingsContent;
