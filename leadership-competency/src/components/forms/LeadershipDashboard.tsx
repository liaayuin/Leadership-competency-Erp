"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useKeycloak } from "@react-keycloak/web";
import Sidebar from "../forms/Sidebar";
import FormHeader, { FormFooter } from "../forms/RatingRow";
import CompetencyTable from "../forms/CompetencyTable";
import ReportPage from "../forms/ReportPage";
import AdminPanel from "../forms/AdminPanel";

const F = "'Helvetica Neue', Arial, sans-serif";

const VIEW_META: Record<string, { amh: string; eng: string; icon: string }> = {
  FORM: { amh: "የብቃት መመዘኛ ቅጽ", eng: "Competency Evaluation Form", icon: "📋" },
  REPORT: { amh: "ሪፖርት መመልከቻ", eng: "Performance Reports", icon: "📊" },
  ADMIN: { amh: "አስተዳዳሪ ፓነል", eng: "Administration Panel", icon: "⚙️" },
};

export default function LeadershipPage() {
  const { keycloak, initialized } = useKeycloak() || {};
  const [dbUser, setDbUser] = useState<any>(null);
  const [view, setView] = useState<"FORM" | "REPORT" | "ADMIN">("FORM");
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [compRefreshKey, setCompRefreshKey] = useState(0);

  const [formData, setFormData] = useState({
    budgetYear: new Date().getFullYear().toString(), // always current year for rating
    leadershipId: "",
    fullName: "",
    departmentName: "",
    jobTitle: "",
    startDate: "",
    endDate: "",
    identityIntegrity: "",
    publicService: "",
    filledBy: "",
  });

  const getFreshToken = async () => {
    try {
      await keycloak?.updateToken(30);
      return keycloak?.token;
    } catch {
      keycloak?.login();
      return null;
    }
  };

  useEffect(() => {
    if (!initialized || !keycloak?.authenticated) return;
    getFreshToken().then((token) => {
      if (!token) return;
      fetch("http://localhost:8081/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(async (res) => {
          const ct = res.headers.get("content-type");
          if (res.ok && ct?.includes("application/json")) return res.json();
          const text = await res.text();
          console.warn("Profile response:", text);
          return null;
        })
        .then((data) => {
          if (data?.id) {
            setDbUser(data);
            setFormData((p) => ({
              ...p,
              filledBy: data.id,
              fullName: data.firstName + " " + (data.lastName || ""),
              departmentName: data.department?.name || "",
              jobTitle: data.position?.title || "",
            }));
          } else {
            const tp: any = keycloak?.tokenParsed;
            const fb = {
              id: tp?.preferred_username || tp?.sub,
              firstName: tp?.given_name || "User",
              lastName: tp?.family_name || "",
            };
            setDbUser(fb);
            setFormData((p) => ({ ...p, filledBy: fb.id }));
          }
        })
        .catch((err) => console.error("Profile error:", err))
        .finally(() => setLoadingProfile(false));
    });
  }, [initialized, keycloak]);

  // Returns search results to the EmployeeSearch dropdown component
  const handleIdSearch = useCallback(
    async (query: string): Promise<any[]> => {
      if (!query || query.length < 1) return [];
      const token = await getFreshToken();
      if (!token) return [];
      try {
        const res = await fetch(
          `http://localhost:8081/api/auth/search?q=${encodeURIComponent(query)}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!res.ok) return [];
        return await res.json();
      } catch {
        return [];
      }
    },
    [keycloak],
  );

  // Called when user clicks a result in the dropdown — populates the form
  const handleEmployeeSelect = useCallback((emp: any) => {
    setFormData((p) => ({
      ...p,
      leadershipId: emp.id,
      fullName: `${emp.firstName} ${emp.middleName ? emp.middleName + " " : ""}${emp.lastName}`,
      departmentName: emp.department?.name || "",
      jobTitle: emp.position?.title || "",
    }));
  }, []);

  const handleFormSubmit = async () => {
    if (!formData.leadershipId) {
      alert("የሚገመግሙትን ሰው ID ያስገቡ");
      return;
    }
    const token = await getFreshToken();
    const payload = {
      ...formData,
      ratings: Object.entries(ratings).map(([k, v]) => ({
        competencyKey: k,
        score: v,
      })),
      year: parseInt(formData.budgetYear),
    };
    try {
      const res = await fetch("http://localhost:8081/api/evaluations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        alert("✅ ምዘናው በተሳካ ሁኔታ ተመዝግቧል!");
        setRatings({});
      } else {
        const e = await res.json().catch(() => ({}));
        alert("❌ " + (e.message || res.statusText));
      }
    } catch {
      alert("❌ Network error. Check backend.");
    }
  };

  if (!initialized || !keycloak)
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#060d1a",
          color: "rgba(255,255,255,0.4)",
          fontFamily: F,
          fontSize: "13px",
          letterSpacing: "0.1em",
        }}
      >
        Loading…
      </div>
    );

  // With login-required in KeycloakProvider, this branch is never reached —
  // unauthenticated users are redirected to Keycloak login immediately.
  // This is a safety net only.
  if (!keycloak.authenticated) {
    keycloak.login();
    return null;
  }

  const meta = VIEW_META[view];
  const isHrAdmin = keycloak.hasRealmRole("ROLE_HR_ADMIN");

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        background: "#EEF2FF",
        fontFamily: F,
      }}
    >
      <Sidebar
        view={view}
        setView={(v) => {
          if (v === "FORM") setCompRefreshKey((k) => k + 1);
          setView(v);
        }}
        user={dbUser}
      />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* ── Header ── */}
        <header
          style={{
            background: "#78dcfa",
            height: "58px",
            minHeight: "58px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 28px",
            borderBottom: "1px solid rgba(12,36,97,0.1)",
            boxShadow: "0 2px 16px rgba(0,0,0,0.25)",
            flexShrink: 0,
          }}
        >
          {/* Left: current view title */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "3px",
                height: "26px",
                background:
                  "linear-gradient(180deg, #1E3A8A, rgba(30,58,138,0.2))",
                borderRadius: "2px",
              }}
            />
            <div>
              <div
                style={{
                  color: "#0c2461",
                  fontSize: "13.5px",
                  fontWeight: 700,
                  lineHeight: 1.2,
                  letterSpacing: "0.01em",
                }}
              >
                {meta.amh}
              </div>
              <div
                style={{
                  color: "rgba(12,36,97,0.5)",
                  fontSize: "8.5px",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  marginTop: "1px",
                }}
              >
                {meta.eng}
              </div>
            </div>
          </div>

          {/* Right: user pill + logout */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {dbUser && (
              <div
                style={{
                  background: "rgba(12,36,97,0.1)",
                  border: "1px solid rgba(12,36,97,0.15)",
                  borderRadius: "8px",
                  padding: "6px 12px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                }}
              >
                <span
                  style={{
                    color: "#0c2461",
                    fontSize: "11.5px",
                    fontWeight: 600,
                    lineHeight: 1.2,
                  }}
                >
                  {dbUser.firstName} {dbUser.lastName}
                </span>
                <span
                  style={{
                    color: "rgba(12,36,97,0.5)",
                    fontSize: "8.5px",
                    letterSpacing: "0.08em",
                  }}
                >
                  {dbUser.id}{" "}
                  {dbUser.position?.title ? `· ${dbUser.position.title}` : ""}
                  {dbUser.role ? ` · ${dbUser.role.replace("ROLE_", "")}` : ""}
                </span>
              </div>
            )}
            <button
              onClick={() => keycloak.logout()}
              style={{
                background: "rgba(196,160,0,0.1)",
                border: "1px solid rgba(196,160,0,0.25)",
                color: "#c4a000",
                fontSize: "9.5px",
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                padding: "7px 14px",
                borderRadius: "7px",
                cursor: "pointer",
                transition: "all 0.15s",
                fontFamily: F,
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.background =
                  "rgba(196,160,0,0.18)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.background =
                  "rgba(196,160,0,0.1)")
              }
            >
              Logout
            </button>
          </div>
        </header>

        {/* ── Content ── */}
        <main style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
          {view === "FORM" && (
            <div
              style={{
                maxWidth: "1020px",
                margin: "0 auto",
                background: "#ffffff",
                borderRadius: "14px",
                border: "1px solid rgba(0,0,0,0.07)",
                boxShadow: "0 2px 24px rgba(0,0,0,0.07)",
                overflow: "hidden",
              }}
            >
              <FormHeader
                formData={formData}
                onInputChange={(e: any) =>
                  setFormData((p) => ({
                    ...p,
                    [e.target.name]: e.target.value,
                  }))
                }
                onIdSearch={handleIdSearch}
                onEmployeeSelect={handleEmployeeSelect}
              />
              <div style={{ borderTop: "1px solid #f0f0f0" }}>
                <CompetencyTable
                  onRatingChange={(k, s) =>
                    setRatings((p) => ({ ...p, [k]: s }))
                  }
                  refreshKey={compRefreshKey}
                />
              </div>
              <div style={{ borderTop: "1px solid #f0f0f0" }}>
                <FormFooter
                  formData={formData}
                  onInputChange={(e: any) =>
                    setFormData((p) => ({
                      ...p,
                      [e.target.name]: e.target.value,
                    }))
                  }
                  onSubmit={handleFormSubmit}
                />
              </div>
            </div>
          )}

          {view === "REPORT" &&
            (loadingProfile ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "80px 0",
                  color: "#9ca3af",
                  fontSize: "13px",
                }}
              >
                Loading user profile…
              </div>
            ) : (
              <ReportPage
                loggedInUser={dbUser}
                token={keycloak.token || ""}
                isHrAdmin={isHrAdmin}
              />
            ))}

          {view === "ADMIN" && <AdminPanel token={keycloak.token || ""} />}
        </main>
      </div>
    </div>
  );
}
