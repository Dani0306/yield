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
  STAKE_PERCENT_MAX,
  UNITS_PER_BANKROLL,
  flatStake,
  unitValue,
} from "@/lib/utils/staking";
import type { User } from "@/types";

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

  const stake = valid ? flatStake(value, user.stake_percent) : null;

  return (
    <SettingsSection
      title="Bankroll"
      description={`The money set aside for the strategy. Every stake is a share of it (see Stake), and one unit is 1/${UNITS_PER_BANKROLL} of it. Changing it changes the stake of your next bets.`}
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

      {stake ? (
        <div className="grid grid-cols-2 gap-6 border-y border-gray-200 py-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-gray-500">1 unit</span>
            <span className="font-mono text-2xl tracking-tight text-black">
              {formatMoney(unitValue(value))}
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-gray-500">Stake per bet</span>
            <span className="font-mono text-2xl tracking-tight text-black">
              {formatMoney(stake.amount)}
            </span>
            <span className="text-xs text-gray-500">
              {user.stake_percent}% · {formatUnits(stake.units)}
            </span>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500">
          Enter an amount above 0 to see your unit and stake.
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

// The flat stake: the share of the bankroll every bet takes.
const StakeSection = ({ user }: { user: User }) => {
  const [saved, setSaved] = useState(user.stake_percent);
  const [percent, setPercent] = useState(String(user.stake_percent));
  const { isPending, status, save, clearStatus } = useSave();

  const value = Number(percent);
  const valid =
    percent.trim() !== "" &&
    Number.isFinite(value) &&
    value > 0 &&
    value <= STAKE_PERCENT_MAX &&
    Math.round(value * 100) === value * 100;
  const dirty = valid && value !== saved;

  const stake = valid ? flatStake(user.total_budget, value) : null;
  // Losing bets in a row the bankroll can pay for at this stake.
  const covered =
    stake && stake.amount > 0
      ? Math.floor(user.total_budget / stake.amount)
      : 0;

  return (
    <SettingsSection
      title="Stake"
      description="Flat stakes: every bet stakes this share of the bankroll, win or lose, so no single bad run can wipe it out. A change applies to the bets you add from then on."
    >
      <div className="max-w-sm">
        <Input
          label={`Stake (% of bankroll, up to ${STAKE_PERCENT_MAX})`}
          name="stake_percent"
          type="number"
          value={percent}
          setValue={(next) => {
            clearStatus();
            setPercent(next);
          }}
        />
      </div>

      {stake ? (
        <div className="grid grid-cols-2 gap-6 border-y border-gray-200 py-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-gray-500">Stake per bet</span>
            <span className="font-mono text-2xl tracking-tight text-black">
              {formatMoney(stake.amount)}
            </span>
            <span className="text-xs text-gray-500">
              {formatUnits(stake.units)}
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-gray-500">Bankroll covers</span>
            <span className="font-mono text-2xl tracking-tight text-black">
              {covered}
            </span>
            <span className="text-xs text-gray-500">losing bets</span>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500">
          Enter a % above 0 and up to {STAKE_PERCENT_MAX}, with at most 2
          decimals.
        </p>
      )}

      <SaveRow
        dirty={dirty}
        isPending={isPending}
        status={status}
        onSave={() => save({ stake_percent: value }, () => setSaved(value))}
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

// The settings page: bankroll and stake (together they set every bet's
// stake), profile, notifications and account.
const SettingsContent = ({ user }: { user: User }) => (
  <PageContainer
    title="Settings"
    description="Your bankroll, stake, profile, notifications and account."
  >
    <div className="flex flex-col">
      <BankrollSection user={user} />
      <StakeSection user={user} />
      <ProfileSection user={user} />
      <NotificationsSection user={user} />
      <AccountSection user={user} />
    </div>
  </PageContainer>
);

export default SettingsContent;
