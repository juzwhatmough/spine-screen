import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "@/components/onboarding/OnboardingForm";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Juz never sees this page — her library is seeded silently from the
  // /books gate. If she lands here directly (stale link, etc.), bounce her.
  const isJuz = !!process.env.JUZ_EMAIL && user.email === process.env.JUZ_EMAIL;
  if (isJuz) redirect("/books");

  const { count, error } = await supabase
    .from("list_items")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("media_type", "book");
  if (error) throw new Error(error.message);

  // already onboarded — this page is shown once, not revisitable
  if ((count ?? 0) > 0) redirect("/books");

  return (
    <>
      <header>
        <div className="spine-strip" />
        <p className="eyebrow">Personal library · Est. Aug 2026</p>
        <h1>
          The <em>Shelf</em>
        </h1>
        <p className="sub">Just a couple of questions before we build your shelf.</p>
      </header>
      <OnboardingForm />
    </>
  );
}
