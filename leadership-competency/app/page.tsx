"use client";

import dynamic from "next/dynamic";

// This forces the dashboard to ONLY load in the browser
const LeadershipDashboard = dynamic(
  () => import("../src/components/forms/LeadershipDashboard"),
  { ssr: false },
);

export default function Page() {
  return <LeadershipDashboard />;
}
