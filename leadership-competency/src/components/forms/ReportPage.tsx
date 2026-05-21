"use client";
import React, { useState, useEffect } from "react";

const F = "'Helvetica Neue', Arial, sans-serif";

interface ReportPageProps {
  loggedInUser: { id: string; firstName: string };
  token: string;
  isHrAdmin: boolean;
}

/* ═══════════════════════════════════════════════════════════════
   ETHIOPIAN CALENDAR ENGINE (same verified algorithm as RatingRow)
   Epoch 1724586 — verified: May 18 2026 = ሰኞ ግንቦት 10 2017 ✓
   ═══════════════════════════════════════════════════════════════ */
const ETH_EPOCH = 1724221; // Verified: Sep 11 2025 = 1 Meskerem 2018 EC ✓
const ET_MONTHS = [
  "መስከረም",
  "ጥቅምት",
  "ህዳር",
  "ታህሳስ",
  "ጥር",
  "የካቲት",
  "መጋቢት",
  "ሚያዚያ",
  "ግንቦት",
  "ሰኔ",
  "ሐምሌ",
  "ነሐሴ",
  "ጳጉሜ",
];

interface EthDate {
  year: number;
  month: number;
  day: number;
}

function jdnFromGregorian(gy: number, gm: number, gd: number): number {
  const a = Math.floor((14 - gm) / 12);
  const y = gy + 4800 - a;
  const m = gm + 12 * a - 3;
  return (
    gd +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}

function toEthiopian(gDate: Date): EthDate {
  const jdn = jdnFromGregorian(
    gDate.getFullYear(),
    gDate.getMonth() + 1,
    gDate.getDate(),
  );
  const d = jdn - ETH_EPOCH;
  const cycles4 = Math.floor(d / 1461);
  const rem = d % 1461;
  const yInCycle = Math.min(Math.floor(rem / 365), 3);
  const year = cycles4 * 4 + yInCycle + 1;
  const dayOfYear = rem - yInCycle * 365;
  const month = Math.floor(dayOfYear / 30) + 1;
  const day = (dayOfYear % 30) + 1;
  return { year, month, day };
}

function getCurrentEthDate(): EthDate {
  return toEthiopian(new Date());
}

/**
 * YEAR LOGIC — Report Page
 * -------------------------
 * The year dropdown shows Ethiopian years dynamically:
 *   current Ethiopian year down to 2012 (≈ 2020 Gregorian)
 *
 * The year value sent to the backend is the ETHIOPIAN year number
 * (e.g. "2017") — the backend stores evaluations with budgetYear
 * set to the Ethiopian year from the evaluation form.
 *
 * Rating is locked to current Ethiopian year (in RatingRow.tsx).
 * Report viewing allows any past year.
 */
const ETH_START_YEAR = 2012; // earliest Ethiopian year with data (≈ 2020 Gregorian)

/* ═══════════════════════════════════════════════════════════════
   COLORS
   ═══════════════════════════════════════════════════════════════ */
const GROUP_COLORS: Record<
  string,
  { bg: string; border: string; text: string; badge: string }
> = {
  SUPERVISOR: {
    bg: "#f0f4ff",
    border: "#c7d7f9",
    text: "#1e40af",
    badge: "#1e40af",
  },
  PEER: { bg: "#f0fdf4", border: "#bbf7d0", text: "#166534", badge: "#16a34a" },
  SUBORDINATE: {
    bg: "#fef9ef",
    border: "#fde68a",
    text: "#92400e",
    badge: "#d97706",
  },
  SELF: { bg: "#fdf4ff", border: "#e9d5ff", text: "#6b21a8", badge: "#7c3aed" },
};

/* ═══════════════════════════════════════════════════════════════
   DETAIL MODAL
   ═══════════════════════════════════════════════════════════════ */
function DetailModal({ isOpen, onClose, record }: any) {
  if (!isOpen || !record) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(6,13,26,0.65)",
        backdropFilter: "blur(8px)",
        fontFamily: F,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "14px",
          width: "420px",
          maxWidth: "92vw",
          boxShadow: "0 32px 80px rgba(0,0,0,0.35)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg,#1E3A8A,#0d2040)",
            padding: "16px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              color: "#fff",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            የምዘና ዝርዝር
          </span>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.5)",
              fontSize: "20px",
              cursor: "pointer",
              lineHeight: 1,
              padding: "0 4px",
            }}
          >
            ×
          </button>
        </div>
        <div style={{ padding: "20px" }}>
          {[
            { l: "Evaluator ID", v: record.filledBy },
            { l: "Total Score", v: `${record.totalScore?.toFixed(2)}%` },
          ].map(({ l, v }) => (
            <div
              key={l}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "9px 0",
                borderBottom: "1px solid #f3f4f6",
              }}
            >
              <span
                style={{
                  fontSize: "10px",
                  color: "#6b7280",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                {l}
              </span>
              <span
                style={{ fontSize: "13px", fontWeight: 700, color: "#0b1929" }}
              >
                {v}
              </span>
            </div>
          ))}
          <div style={{ marginTop: "14px" }}>
            <div
              style={{
                fontSize: "9.5px",
                color: "#9ca3af",
                fontWeight: 700,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                marginBottom: "8px",
              }}
            >
              ዝርዝር ውጤቶች
            </div>
            <div
              style={{
                maxHeight: "180px",
                overflowY: "auto",
                border: "1px solid #f3f4f6",
                borderRadius: "8px",
              }}
            >
              {record.ratings?.map((r: any, i: number) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 12px",
                    borderBottom: "1px solid #f9fafb",
                    background: i % 2 === 0 ? "#fff" : "#fafafa",
                  }}
                >
                  <span
                    style={{
                      fontSize: "10px",
                      color: "#6b7280",
                      fontStyle: "italic",
                    }}
                  >
                    {r.competencyKey}
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#0b1929",
                      background: "#f0f4ff",
                      padding: "2px 9px",
                      borderRadius: "10px",
                    }}
                  >
                    {r.score}/5
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div
          style={{
            padding: "12px 20px",
            borderTop: "1px solid #f3f4f6",
            textAlign: "right",
            background: "#fafafa",
          }}
        >
          <button
            onClick={onClose}
            style={{
              background: "#f3f4f6",
              border: "none",
              color: "#374151",
              fontSize: "11px",
              fontWeight: 700,
              padding: "8px 20px",
              borderRadius: "7px",
              cursor: "pointer",
            }}
          >
            ዝጋ
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   REPORT CARD
   ═══════════════════════════════════════════════════════════════ */
function ReportCard({ title, data, weight, weightedScore, colorKey }: any) {
  const [idx, setIdx] = useState(0);
  const [modalOpen, setModal] = useState(false);
  const records = data || [];
  const total = records.length;
  const colors = GROUP_COLORS[colorKey] || GROUP_COLORS.SUPERVISOR;
  const avg =
    total > 0
      ? (
          records.reduce((s: number, r: any) => s + (r.totalScore || 0), 0) /
          total
        ).toFixed(2)
      : "0.00";
  const filledPct =
    total > 0 && records[idx]?.totalScore
      ? ((records[idx].totalScore / 100) * 100).toFixed(0)
      : "0";

  return (
    <>
      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          border: `1px solid ${colors.border}`,
          boxShadow: "0 1px 8px rgba(0,0,0,0.04)",
          overflow: "hidden",
          marginBottom: "14px",
          fontFamily: F,
        }}
      >
        {/* Header */}
        <div
          style={{
            background: colors.bg,
            borderBottom: `1.5px solid ${colors.border}`,
            padding: "12px 18px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: colors.text,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            {title}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "9.5px", color: "#9ca3af" }}>
              {total} {total === 1 ? "record" : "records"}
            </span>
            <span
              style={{
                background: colors.badge,
                color: "#fff",
                fontSize: "9px",
                fontWeight: 700,
                padding: "2px 10px",
                borderRadius: "12px",
              }}
            >
              {weight}% weight
            </span>
          </div>
        </div>

        {total === 0 ? (
          <div
            style={{
              padding: "28px",
              textAlign: "center",
              color: "#d1d5db",
              fontSize: "12px",
              fontStyle: "italic",
            }}
          >
            ምንም ምዘና አልተገኘም
          </div>
        ) : (
          <div style={{ padding: "16px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              {/* Circle progress */}
              <div
                style={{
                  position: "relative",
                  width: "60px",
                  height: "60px",
                  flexShrink: 0,
                }}
              >
                <svg
                  width="60"
                  height="60"
                  style={{ transform: "rotate(-90deg)" }}
                >
                  <circle
                    cx="30"
                    cy="30"
                    r="24"
                    fill="none"
                    stroke="#f0f2f8"
                    strokeWidth="5"
                  />
                  <circle
                    cx="30"
                    cy="30"
                    r="24"
                    fill="none"
                    stroke={colors.badge}
                    strokeWidth="5"
                    strokeDasharray={`${2 * Math.PI * 24}`}
                    strokeDashoffset={`${2 * Math.PI * 24 * (1 - Number(filledPct) / 100)}`}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dashoffset 0.4s ease" }}
                  />
                </svg>
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 800,
                      color: colors.text,
                    }}
                  >
                    {records[idx]?.totalScore?.toFixed(0)}%
                  </span>
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: "9.5px",
                    color: "#9ca3af",
                    marginBottom: "2px",
                    letterSpacing: "0.08em",
                  }}
                >
                  EVALUATOR
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "#0b1929",
                  }}
                >
                  {records[idx]?.filledBy || "—"}
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "#6b7280",
                    marginTop: "2px",
                  }}
                >
                  Score: {records[idx]?.totalScore?.toFixed(2)}%
                </div>
              </div>

              <button
                onClick={() => setModal(true)}
                style={{
                  background: colors.bg,
                  border: `1px solid ${colors.border}`,
                  color: colors.text,
                  fontSize: "10px",
                  fontWeight: 700,
                  padding: "7px 13px",
                  borderRadius: "7px",
                  cursor: "pointer",
                  letterSpacing: "0.08em",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.opacity = "0.8")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.opacity = "1")
                }
              >
                ዝርዝር ›
              </button>
            </div>

            {total > 1 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "10px",
                  marginTop: "14px",
                }}
              >
                <button
                  onClick={() => setIdx(Math.max(0, idx - 1))}
                  disabled={idx === 0}
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    border: "1px solid #e5e7eb",
                    background: "#fff",
                    fontSize: "11px",
                    cursor: "pointer",
                    opacity: idx === 0 ? 0.35 : 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ◀
                </button>
                <span
                  style={{
                    fontSize: "10px",
                    color: "#9ca3af",
                    fontWeight: 600,
                    minWidth: "50px",
                    textAlign: "center",
                  }}
                >
                  {idx + 1} / {total}
                </span>
                <button
                  onClick={() => setIdx(Math.min(total - 1, idx + 1))}
                  disabled={idx >= total - 1}
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    border: "1px solid #e5e7eb",
                    background: "#fff",
                    fontSize: "11px",
                    cursor: "pointer",
                    opacity: idx >= total - 1 ? 0.35 : 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ▶
                </button>
              </div>
            )}
          </div>
        )}

        <div
          style={{
            borderTop: "1px solid #f3f4f6",
            padding: "9px 18px",
            display: "flex",
            justifyContent: "space-between",
            background: "#fafafa",
          }}
        >
          <span style={{ fontSize: "10px", color: "#6b7280" }}>
            አማካይ: <strong style={{ color: "#0b1929" }}>{avg}%</strong>
          </span>
          <span style={{ fontSize: "10px", color: "#6b7280" }}>
            ክብደት ድርሻ:{" "}
            <strong style={{ color: colors.badge }}>
              {weightedScore?.toFixed(2)}
            </strong>
          </span>
        </div>
      </div>
      <DetailModal
        isOpen={modalOpen}
        onClose={() => setModal(false)}
        record={records[idx]}
      />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN REPORT PAGE
   ═══════════════════════════════════════════════════════════════ */
export default function ReportPage({
  loggedInUser,
  token,
  isHrAdmin,
}: ReportPageProps) {
  const [targetId, setTargetId] = useState("");
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ethiopian year — computed client-side only to avoid hydration mismatch
  const [ethToday, setEthToday] = useState<EthDate | null>(null);
  const [ethYear, setEthYear] = useState<string>("");
  const [availYears, setAvailYears] = useState<number[]>([]);

  useEffect(() => {
    const today = getCurrentEthDate();
    setEthToday(today);
    setEthYear(today.year.toString());
    // Build list from current Ethiopian year down to ETH_START_YEAR
    const years: number[] = [];
    for (let y = today.year; y >= ETH_START_YEAR; y--) years.push(y);
    setAvailYears(years);
  }, []);

  const handleSearch = async () => {
    if (!targetId.trim()) {
      alert("እባክዎ መለያ ያስገቡ");
      return;
    }
    if (!ethYear) {
      alert("ዓ.ም አልተለቀቀም — Ethiopian year not loaded yet");
      return;
    }
    setLoading(true);
    setError(null);
    setReportData(null);
    try {
      const params = new URLSearchParams({
        id: targetId.trim(),
        year: ethYear,
      });
      const res = await fetch(
        `http://localhost:8081/api/reports/summary?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      if (res.status === 401) {
        setError("ሴሽኑ አልፎበታል። እንደገና ይግቡ።");
        return;
      }
      if (res.status === 403) {
        setError(
          "ይህንን ሪፖርት ለማየት ፈቃድ የለዎትም። ቀጥተኛ ኃላፊዎች ብቻ የበታቾቻቸውን ሪፖርት ማየት ይችላሉ።",
        );
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Error fetching report.");
        return;
      }
      setReportData(data);
    } catch (e: any) {
      setError("Connection error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const totalScore = reportData?.totalFinalScore ?? 0;
  const outOf60 = ((totalScore * 60) / 100).toFixed(2);

  const groups = reportData
    ? [
        {
          title: `የቅርብ ኃላፊ ምዘና (${reportData.weightSupervisor}%)`,
          data: reportData.supervisorRecords,
          weight: reportData.weightSupervisor,
          score: reportData.supervisorWeightedScore,
          key: "SUPERVISOR",
        },
        {
          title: `የሥራ ባልደረቦች ምዘና (${reportData.weightPeer}%)`,
          data: reportData.peerRecords,
          weight: reportData.weightPeer,
          score: reportData.peerWeightedScore,
          key: "PEER",
        },
        {
          title: `የበታች ሠ/ተኞች (${reportData.weightSubordinate}%)`,
          data: reportData.subordinateRecords,
          weight: reportData.weightSubordinate,
          score: reportData.subordinateWeightedScore,
          key: "SUBORDINATE",
        },
        {
          title: `የግል ምዘና (${reportData.weightSelf}%)`,
          data: reportData.selfRecords,
          weight: reportData.weightSelf,
          score: reportData.selfWeightedScore,
          key: "SELF",
        },
      ]
    : [];

  return (
    <div style={{ fontFamily: F, maxWidth: "900px", margin: "0 auto" }}>
      {/* ── Search card ── */}
      <div
        style={{
          background: "#fff",
          borderRadius: "14px",
          border: "1px solid #eaecf4",
          boxShadow: "0 2px 16px rgba(0,0,0,0.05)",
          padding: "24px 28px",
          marginBottom: "22px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "18px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "3px",
                height: "18px",
                background: "linear-gradient(180deg,#1E3A8A,#f0cc30)",
                borderRadius: "2px",
              }}
            />
            <span
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "#1E3A8A",
                fontFamily: "'Georgia',serif",
              }}
            >
              የፍለጋ መመዘኛ
            </span>
          </div>
          {isHrAdmin && (
            <span
              style={{
                background: "rgba(30,58,138,0.08)",
                border: "1px solid rgba(30,58,138,0.2)",
                color: "#1E3A8A",
                fontSize: "9px",
                fontWeight: 700,
                letterSpacing: "0.15em",
                padding: "4px 12px",
                borderRadius: "12px",
                textTransform: "uppercase",
              }}
            >
              ⭐ Admin Mode
            </span>
          )}
        </div>

        {/* Today info */}
        {ethToday && (
          <div
            style={{
              background: "#EEF2FF",
              border: "1px solid #c7d7f9",
              borderLeft: "3px solid #1E3A8A",
              borderRadius: "7px",
              padding: "8px 14px",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#1E3A8A"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span
              style={{
                fontSize: "11px",
                color: "#1E3A8A",
                fontWeight: 600,
                fontFamily: F,
              }}
            >
              የዛሬ ቀን:{" "}
              <strong>
                {ethToday.day} {ET_MONTHS[ethToday.month - 1]} {ethToday.year}{" "}
                ዓ.ም
              </strong>
              &nbsp;·&nbsp; ሪፖርቶችን ለማንኛውም ዓ.ም ማየት ይቻላል
            </span>
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: "14px",
            alignItems: "flex-end",
            flexWrap: "wrap",
          }}
        >
          {/* Employee ID input */}
          <div style={{ flex: 2, minWidth: "180px" }}>
            <label
              style={{
                display: "block",
                fontSize: "9.5px",
                fontWeight: 700,
                color: "#6b7280",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                marginBottom: "6px",
                fontFamily: F,
              }}
            >
              Employee ID / የአመራር መለያ
            </label>
            <input
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="e.g. MGMT-100"
              style={{
                width: "100%",
                boxSizing: "border-box",
                border: "1.5px solid #e2e8f0",
                borderRadius: "8px",
                padding: "10px 14px",
                fontSize: "13px",
                color: "#1a2540",
                outline: "none",
                fontFamily: F,
                transition: "all 0.15s",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#1E3A8A";
                e.target.style.boxShadow = "0 0 0 3px rgba(30,58,138,0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e2e8f0";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Ethiopian year selector */}
          <div style={{ flex: 1, minWidth: "130px" }}>
            <label
              style={{
                display: "block",
                fontSize: "9.5px",
                fontWeight: 700,
                color: "#6b7280",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                marginBottom: "6px",
                fontFamily: F,
              }}
            >
              ዓ.ም (Ethiopian Year)
            </label>
            <select
              value={ethYear}
              onChange={(e) => setEthYear(e.target.value)}
              disabled={availYears.length === 0}
              style={{
                width: "100%",
                border: "1.5px solid #e2e8f0",
                borderRadius: "8px",
                padding: "10px 14px",
                fontSize: "13px",
                color: "#1a2540",
                background: "#fff",
                outline: "none",
                cursor: "pointer",
                fontFamily: F,
              }}
            >
              {availYears.length === 0 ? (
                <option>Loading…</option>
              ) : (
                availYears.map((y) => (
                  <option key={y} value={y.toString()}>
                    {y} ዓ.ም{ethToday && y === ethToday.year ? " (ዘንድሮ)" : ""}
                  </option>
                ))
              )}
            </select>
          </div>

          <button
            onClick={handleSearch}
            disabled={loading || availYears.length === 0}
            style={{
              background: loading ? "#9ca3af" : "#1E3A8A",
              color: "#fff",
              border: "none",
              borderRadius: "9px",
              padding: "11px 26px",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              cursor: loading ? "not-allowed" : "pointer",
              whiteSpace: "nowrap",
              boxShadow: loading ? "none" : "0 4px 16px rgba(30,58,138,0.3)",
              fontFamily: F,
              transition: "all 0.15s",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              if (!loading)
                (e.currentTarget as HTMLElement).style.background = "#1e40af";
            }}
            onMouseLeave={(e) => {
              if (!loading)
                (e.currentTarget as HTMLElement).style.background = "#1E3A8A";
            }}
          >
            {loading ? "በመፈለግ…" : "ሪፖርት አምጣ"}
          </button>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div
          style={{
            background: "#fff5f5",
            border: "1px solid #fecaca",
            borderLeft: "4px solid #dc2626",
            borderRadius: "9px",
            padding: "14px 18px",
            marginBottom: "20px",
            display: "flex",
            gap: "10px",
            alignItems: "flex-start",
          }}
        >
          <span
            style={{
              color: "#dc2626",
              fontSize: "18px",
              flexShrink: 0,
              lineHeight: 1,
            }}
          >
            ⚠
          </span>
          <p
            style={{
              color: "#991b1b",
              fontSize: "12px",
              fontWeight: 600,
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            {error}
          </p>
        </div>
      )}

      {/* ── Report ── */}
      {reportData && (
        <div>
          {/* Employee identity banner */}
          <div
            style={{
              background: "linear-gradient(135deg,#1E3A8A,#0d2040)",
              borderRadius: "12px",
              padding: "18px 24px",
              marginBottom: "18px",
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <div
              style={{
                width: "46px",
                height: "46px",
                borderRadius: "50%",
                background: "rgba(120,220,250,0.15)",
                border: "2px solid rgba(120,220,250,0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <span
                style={{ color: "#78dcfa", fontSize: "16px", fontWeight: 800 }}
              >
                {reportData.fullName?.charAt(0)}
              </span>
            </div>
            <div>
              <div
                style={{
                  color: "#ffffff",
                  fontSize: "16px",
                  fontWeight: 700,
                  lineHeight: 1.2,
                }}
              >
                {reportData.fullName}
              </div>
              <div
                style={{
                  color: "rgba(255,255,255,0.4)",
                  fontSize: "10px",
                  marginTop: "3px",
                  letterSpacing: "0.05em",
                }}
              >
                {targetId} · {reportData.departmentName} · {reportData.jobTitle}
              </div>
            </div>
            {/* Ethiopian year display */}
            <div style={{ marginLeft: "auto", textAlign: "right" }}>
              <div
                style={{
                  fontSize: "9px",
                  color: "rgba(255,255,255,0.35)",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                የምዘና ዓ.ም
              </div>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: 800,
                  color: "#78dcfa",
                  lineHeight: 1.2,
                }}
              >
                {ethYear} ዓ.ም
              </div>
              {ethToday && (
                <div
                  style={{
                    fontSize: "9px",
                    color: "rgba(255,255,255,0.3)",
                    marginTop: "2px",
                  }}
                >
                  {ET_MONTHS[ethToday.month - 1]} {ethToday.day}
                </div>
              )}
            </div>
          </div>

          {/* 4 group report cards */}
          {groups.map((g) => (
            <ReportCard
              key={g.key}
              title={g.title}
              data={g.data}
              weight={g.weight}
              weightedScore={g.score}
              colorKey={g.key}
            />
          ))}

          {/* Final scorecard */}
          <div
            style={{
              background: "#fff",
              borderRadius: "14px",
              border: "1px solid #eaecf4",
              boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
              overflow: "hidden",
              marginTop: "6px",
            }}
          >
            {/* Total / 100 */}
            <div
              style={{
                padding: "22px 24px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#6b7280",
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    marginBottom: "3px",
                  }}
                >
                  ጠቅላላ የምዘና ውጤት
                </div>
                <div style={{ fontSize: "9.5px", color: "#d1d5db" }}>
                  ከ 100% ውስጥ
                </div>
              </div>
              <div
                style={{ display: "flex", alignItems: "baseline", gap: "4px" }}
              >
                <span
                  style={{
                    fontSize: "42px",
                    fontWeight: 900,
                    color: "#1E3A8A",
                    fontFamily: "'Georgia',serif",
                    lineHeight: 1,
                  }}
                >
                  {totalScore.toFixed(2)}
                </span>
                <span
                  style={{
                    fontSize: "20px",
                    fontWeight: 700,
                    color: "#9ca3af",
                  }}
                >
                  %
                </span>
              </div>
            </div>

            {/* Breakdown */}
            {[
              {
                l: "Supervisor",
                s: reportData.supervisorWeightedScore,
                w: reportData.weightSupervisor,
              },
              {
                l: "Peer",
                s: reportData.peerWeightedScore,
                w: reportData.weightPeer,
              },
              {
                l: "Subordinate",
                s: reportData.subordinateWeightedScore,
                w: reportData.weightSubordinate,
              },
              {
                l: "Self",
                s: reportData.selfWeightedScore,
                w: reportData.weightSelf,
              },
              ...(reportData.weightIntegrity > 0
                ? [
                    {
                      l: "Integrity Bonus",
                      s: reportData.integrityScore,
                      w: reportData.weightIntegrity,
                    },
                  ]
                : []),
              ...(reportData.weightPublicService > 0
                ? [
                    {
                      l: "Public Service Bonus",
                      s: reportData.publicServiceScore,
                      w: reportData.weightPublicService,
                    },
                  ]
                : []),
            ].map(({ l, s, w }) => (
              <div
                key={l}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 24px",
                  borderTop: "1px solid #f5f6fa",
                  background: "#fafbff",
                }}
              >
                <span style={{ fontSize: "11px", color: "#6b7280" }}>
                  {l}{" "}
                  <span style={{ color: "#d1d5db", fontSize: "10px" }}>
                    ({w}%)
                  </span>
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#1E3A8A",
                  }}
                >
                  {(s ?? 0).toFixed(2)}
                </span>
              </div>
            ))}

            {/* Out of 60 */}
            <div
              style={{
                borderTop: "2px solid #f0f2f8",
                padding: "18px 24px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "linear-gradient(135deg,#f8f9ff,#EEF2FF)",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#6b7280",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    marginBottom: "2px",
                  }}
                >
                  ከ 60 ነጥብ ውስጥ
                </div>
                <div style={{ fontSize: "9px", color: "#9ca3af" }}>
                  ጠቅላላ × 60 ÷ 100
                </div>
              </div>
              <div
                style={{ display: "flex", alignItems: "baseline", gap: "5px" }}
              >
                <span
                  style={{
                    fontSize: "34px",
                    fontWeight: 900,
                    color: "#1E3A8A",
                    fontFamily: "'Georgia',serif",
                    lineHeight: 1,
                  }}
                >
                  {outOf60}
                </span>
                <span
                  style={{
                    fontSize: "16px",
                    fontWeight: 600,
                    color: "#9ca3af",
                  }}
                >
                  / 60
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ textAlign: "center", marginTop: "14px" }}>
            <p
              style={{
                fontSize: "9px",
                color: "#d1d5db",
                fontStyle: "italic",
                letterSpacing: "0.08em",
                margin: 0,
              }}
            >
              ሪፖርት ጠያቂ: {loggedInUser?.firstName} ({loggedInUser?.id})
              {isHrAdmin ? " · ADMIN MODE" : ""}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
