import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import SettingsContent from "@/components/settings/SettingsContent";
import ErrorScreen from "@/components/layout/error/ErrorScreen";
import { tryCatch } from "@/lib/utils/tryCatch";

const page = async () => {
  const [user, error] = await tryCatch(getCurrentUser());

  if (error) return <ErrorScreen error={error} />;
  if (!user) redirect("/login");

  return <SettingsContent user={user} />;
};

export default page;
