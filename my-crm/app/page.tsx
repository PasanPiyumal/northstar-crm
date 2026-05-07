import Link from "next/link";
import { cookies } from "next/headers";
import AppNav from "./components/app-nav";
import HomeDashboard from "./components/home-dashboard";

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get("crm_token")?.value;
  const userCookie = cookieStore.get("crm_user")?.value;

  let userName = "Customer";

  if (userCookie) {
    try {
      const parsedUser = JSON.parse(decodeURIComponent(userCookie)) as {
        name?: string;
      };

      if (parsedUser.name) {
        userName = parsedUser.name;
      }
    } catch {
      // Fall back to the generic greeting if the cookie cannot be parsed.
    }
  }

  return (
    <main className="relative overflow-hidden px-6 py-6 text-slate-900 sm:px-8 lg:px-12">
      <div className="absolute inset-0 -z-10 grid-fade opacity-10" />

      <header className="mx-auto flex w-full max-w-7xl items-center justify-between rounded-lg border border-slate-200 bg-white px-5 py-4 backdrop-blur-sm shadow-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-teal-600">
            Northstar CRM
          </p>
          <p className="text-xs text-slate-600">
            Pipeline clarity for modern sales teams.
          </p>
        </div>
        {token ? (
          <AppNav active="home" userName={userName} />
        ) : (
          <div className="flex items-center gap-3">
            <Link
              href="/signin"
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-teal-700"
            >
              Start free
            </Link>
          </div>
        )}
      </header>

      <section className="mx-auto grid w-full max-w-7xl gap-10 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-20">
        <div className="animate-fade-up">
          <span className="inline-flex items-center rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs text-teal-700 font-medium">
            Built to feel like HubSpot meets Pipedrive
          </span>
          <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            Manage every lead with a CRM that feels fast, focused, and ready for
            real sales work.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600">
            Track leads, update pipeline stages, add notes after every call, and
            monitor the numbers that matter most from a clean dashboard that
            stays in sync with MongoDB.
          </p>

          {token ? (
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/dashboard"
                className="rounded-lg bg-teal-600 px-6 py-2 text-xs font-semibold text-white transition hover:bg-teal-700"
              >
                Open dashboard
              </Link>
            </div>
          ) : (
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/signup"
                className="rounded-lg bg-teal-600 px-6 py-2 text-xs font-semibold text-white transition hover:bg-teal-700"
              >
                Create account
              </Link>
              <Link
                href="/signin"
                className="rounded-lg border border-slate-300 px-6 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Open dashboard
              </Link>
            </div>
          )}

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              ["52%", "faster follow-up cycles"],
              ["100%", "persistent CRM records"],
              ["6", "core pipeline stages"],
            ].map(([value, label]) => (
              <div
                key={label}
                className="glass-panel rounded-lg p-5 border border-slate-200"
              >
                <p className="text-2xl font-semibold text-slate-900">{value}</p>
                <p className="mt-2 text-xs text-slate-600">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative animate-fade-up lg:justify-self-end">
          <HomeDashboard token={token || ""} />
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-4 pb-20 lg:grid-cols-3">
        {[
          {
            title: "Lead management",
            description:
              "Create, update, filter, and search leads from one workspace.",
          },
          {
            title: "Notes and follow-up history",
            description:
              "Capture call notes and handoffs so every deal has context.",
          },
          {
            title: "Dashboard analytics",
            description:
              "See total leads, won value, and pipeline health at a glance.",
          },
        ].map((item, index) => (
          <div
            key={item.title}
            className="glass-panel rounded-lg p-6 border border-slate-200 transition duration-300 hover:-translate-y-1 hover:border-teal-300"
            style={{ animationDelay: `${index * 0.12}s` }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-600">
              Feature {index + 1}
            </p>
            <h3 className="mt-3 text-lg font-semibold text-slate-900">
              {item.title}
            </h3>
            <p className="mt-2 text-xs leading-6 text-slate-600">
              {item.description}
            </p>
          </div>
        ))}
      </section>

      <footer className="mx-auto mt-20 w-full max-w-7xl border-t border-slate-200 pt-12 pb-8">
        <div className="grid gap-8 sm:grid-cols-4 mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-teal-600">
              Northstar CRM
            </p>
            <p className="mt-2 text-xs text-slate-600">
              Pipeline clarity for modern sales teams.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-900 mb-3">Product</p>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                <Link href="#" className="hover:text-teal-600 transition">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-teal-600 transition">
                  Lead Management
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-teal-600 transition">
                  Analytics
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-900 mb-3">Company</p>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                <Link href="#" className="hover:text-teal-600 transition">
                  About
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-teal-600 transition">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-teal-600 transition">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-900 mb-3">Legal</p>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                <Link href="#" className="hover:text-teal-600 transition">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-teal-600 transition">
                  Terms
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-teal-600 transition">
                  Security
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-200 pt-8 flex items-center justify-between">
          <p className="text-xs text-slate-600">
            © 2024 Northstar CRM. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link
              href="#"
              className="text-xs text-slate-600 hover:text-teal-600 transition"
            >
              Twitter
            </Link>
            <Link
              href="#"
              className="text-xs text-slate-600 hover:text-teal-600 transition"
            >
              LinkedIn
            </Link>
            <Link
              href="#"
              className="text-xs text-slate-600 hover:text-teal-600 transition"
            >
              GitHub
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
