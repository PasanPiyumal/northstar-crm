//handles route protection for the dashboard. Only logged-in users can access dashboard.
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DashboardClient from "./dashboard-client";

// Server component for dashboard page
export default async function DashboardPage() {
  const cookieStore = await cookies();   // Get browser cookies from incoming request
  const token = cookieStore.get("crm_token")?.value;   // Read authentication token from cookies
  const userCookie = cookieStore.get("crm_user")?.value;   // Read stored user info cookie

  // If token doesn't exist, user is not authenticated
  // Redirect unauthenticated user to sign in page
  if (!token) {
    redirect("/signin");
  }

  // Default user greeting name
  let userName = "Sales rep";

  // If user cookie exists, try extracting actual user name
  if (userCookie) {
    try {
      // Decode cookie string and convert JSON string into object
      const parsedUser = JSON.parse(decodeURIComponent(userCookie)) as {
        name?: string;
      }; 
      if (parsedUser.name) { // If name exists, replace default greeting
        userName = parsedUser.name;
      }
    } catch {
      // If cookie is invalid or corrupted,
      // keep default name instead of crashing app
    }
  }
  // Render dashboard UI and pass token + username as props
  return <DashboardClient token={token} userName={userName} />;
}
