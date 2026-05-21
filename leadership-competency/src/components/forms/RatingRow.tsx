"use client";
import React, { useState, useEffect, useRef } from "react";

const F = "'Helvetica Neue', Arial, sans-serif";

const ETH_EPOCH = 1724221;

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
const ET_DAYS = ["እሁድ", "ሰኞ", "ማክሰኞ", "ረቡዕ", "ሐሙስ", "አርብ", "ቅዳሜ"];
const ET_DAYS_SHORT = ["እሁ", "ሰኞ", "ማክ", "ረቡ", "ሐሙ", "አርብ", "ቅዳ"];

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

/** Gregorian Date → Ethiopian Date */
function toEthiopian(gDate: Date): EthDate {
  const jdn = jdnFromGregorian(
    gDate.getUTCFullYear(),
    gDate.getUTCMonth() + 1,
    gDate.getUTCDate(),
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

/** Ethiopian Date → Gregorian Date (needed only for DOW calculation) */
function toGregorian(eth: EthDate): Date {
  const { year: ey, month: em, day: ed } = eth;
  const cycle = Math.floor((ey - 1) / 4);
  const posInCyc = (ey - 1) % 4;
  const jdn =
    ETH_EPOCH + cycle * 1461 + posInCyc * 365 + (em - 1) * 30 + ed - 1;
  const a = jdn + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor((146097 * b) / 4);
  const dd = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * dd) / 4);
  const mm = Math.floor((5 * e + 2) / 153);
  return new Date(
    100 * b + dd - 4800 + Math.floor(mm / 10),
    mm + 2 - 12 * Math.floor(mm / 10),
    e - Math.floor((153 * mm + 2) / 5) + 1,
  );
}

function ethDaysInMonth(year: number, month: number): number {
  if (month < 13) return 30;
  return year % 4 === 3 ? 6 : 5;
}

function ethFirstDOW(year: number, month: number): number {
  return toGregorian({ year, month, day: 1 }).getDay();
}

function formatEth(eth: EthDate): string {
  return `${eth.day} ${ET_MONTHS[eth.month - 1]} ${eth.year} ዓ.ም`;
}

/**
 * FIX: Store dates as pure Ethiopian date strings "YYYY-MM-DD"
 * where YYYY, MM, DD are the Ethiopian year/month/day.
 * This avoids any Gregorian conversion in the stored value.
 */
function ethToStorageValue(eth: EthDate): string {
  return `${eth.year}-${String(eth.month).padStart(2, "0")}-${String(eth.day).padStart(2, "0")}`;
}

/**
 * FIX: Parse the stored Ethiopian date string directly — no Gregorian conversion.
 */
function storageValueToEth(val: string): EthDate | null {
  if (!val) return null;
  const parts = val.split("-").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  const [y, m, d] = parts;
  // Sanity-check: Ethiopian year is typically 4 digits > 2000, month 1-13, day 1-30
  if (y < 1900 || m < 1 || m > 13 || d < 1 || d > 30) return null;
  return { year: y, month: m, day: d };
}

function getCurrentEthDate(): EthDate {
  return toEthiopian(new Date());
}

interface EthPickerProps {
  value: string; // Ethiopian "YYYY-MM-DD" string
  onChange: (val: string) => void;
  placeholder?: string;
}

function NavBtn({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "rgba(255,255,255,0.12)",
        border: "none",
        color: "#fff",
        width: "26px",
        height: "26px",
        borderRadius: "4px",
        cursor: "pointer",
        fontSize: "14px",
        fontWeight: 700,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "background 0.12s",
        flexShrink: 0,
      }}
      onMouseEnter={(e) =>
        ((e.currentTarget as HTMLElement).style.background =
          "rgba(255,255,255,0.25)")
      }
      onMouseLeave={(e) =>
        ((e.currentTarget as HTMLElement).style.background =
          "rgba(255,255,255,0.12)")
      }
    >
      {children}
    </button>
  );
}

function EthiopianPicker({ value, onChange, placeholder }: EthPickerProps) {
  const today = getCurrentEthDate();
  // FIX: parse directly as Ethiopian date — no Gregorian round-trip
  const selected = value ? storageValueToEth(value) : null;

  const [open, setOpen] = useState(false);
  const [nav, setNav] = useState<EthDate>(selected ?? { ...today, day: 1 });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    if (selected)
      setNav({ year: selected.year, month: selected.month, day: 1 });
  }, [value]);

  const prevMonth = () =>
    setNav((n) =>
      n.month === 1
        ? { year: n.year - 1, month: 13, day: 1 }
        : { ...n, month: n.month - 1, day: 1 },
    );
  const nextMonth = () =>
    setNav((n) =>
      n.month === 13
        ? { year: n.year + 1, month: 1, day: 1 }
        : { ...n, month: n.month + 1, day: 1 },
    );
  const prevYear = () => setNav((n) => ({ ...n, year: n.year - 1, day: 1 }));
  const nextYear = () => setNav((n) => ({ ...n, year: n.year + 1, day: 1 }));

  const selectDay = (day: number) => {
    // FIX: store as Ethiopian date string directly
    onChange(ethToStorageValue({ year: nav.year, month: nav.month, day }));
    setOpen(false);
  };
  const clearDate = () => {
    onChange("");
    setOpen(false);
  };
  const goToday = () => {
    const t = getCurrentEthDate();
    setNav({ ...t, day: 1 });
    onChange(ethToStorageValue(t));
    setOpen(false);
  };

  const daysInMonth = ethDaysInMonth(nav.year, nav.month);
  const firstDOW = ethFirstDOW(nav.year, nav.month);
  const cells: (number | null)[] = [
    ...Array(firstDOW).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const isSel = (d: number) =>
    selected &&
    selected.year === nav.year &&
    selected.month === nav.month &&
    selected.day === d;
  const isNow = (d: number) =>
    today.year === nav.year && today.month === nav.month && today.day === d;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* Trigger */}
      <div
        onClick={() => setOpen((o) => !o)}
        style={{
          border: `1.5px solid ${open ? "#1E3A8A" : "#e2e8f0"}`,
          borderRadius: "7px",
          padding: "8px 40px 8px 11px",
          fontSize: "12px",
          color: selected ? "#1a2540" : "#9ca3af",
          fontFamily: F,
          background: "#fff",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          minHeight: "38px",
          userSelect: "none",
          transition: "all 0.15s",
          boxShadow: open ? "0 0 0 3px rgba(30,58,138,0.1)" : "none",
        }}
      >
        {selected ? formatEth(selected) : placeholder || "ቀን ምረጥ…"}
      </div>
      <span
        style={{
          position: "absolute",
          right: "11px",
          top: "50%",
          transform: "translateY(-50%)",
          pointerEvents: "none",
        }}
      >
        <svg
          width="16"
          height="16"
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
      </span>

      {/* Popup */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            zIndex: 300,
            background: "#fff",
            borderRadius: "12px",
            border: "1px solid #c7d7f9",
            boxShadow: "0 16px 48px rgba(30,58,138,0.2)",
            width: "288px",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              background: "#1E3A8A",
              padding: "12px 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <NavBtn onClick={prevYear}>«</NavBtn>
              <span
                style={{
                  color: "#fff",
                  fontSize: "12px",
                  fontWeight: 700,
                  minWidth: "42px",
                  textAlign: "center",
                }}
              >
                {nav.year}
              </span>
              <NavBtn onClick={nextYear}>»</NavBtn>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <NavBtn onClick={prevMonth}>‹</NavBtn>
              <span
                style={{
                  color: "#f0cc30",
                  fontSize: "13px",
                  fontWeight: 700,
                  minWidth: "76px",
                  textAlign: "center",
                  fontFamily: F,
                }}
              >
                {ET_MONTHS[nav.month - 1]}
              </span>
              <NavBtn onClick={nextMonth}>›</NavBtn>
            </div>
          </div>

          {/* Today info bar */}
          <div
            style={{
              background: "#EEF2FF",
              padding: "5px 14px",
              fontSize: "9.5px",
              color: "#1E3A8A",
              fontWeight: 600,
              fontFamily: F,
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>
              ዛሬ: {ET_DAYS[new Date().getDay()]} {formatEth(today)}
            </span>
          </div>

          {/* Day headers */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7,1fr)",
              background: "#f8f9ff",
              padding: "6px 8px 4px",
              borderBottom: "1px solid #EEF2FF",
            }}
          >
            {ET_DAYS_SHORT.map((d) => (
              <div
                key={d}
                style={{
                  textAlign: "center",
                  fontSize: "9px",
                  fontWeight: 700,
                  color: "#1E3A8A",
                  fontFamily: F,
                  padding: "2px 0",
                }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7,1fr)",
              gap: "1px",
              padding: "6px 8px 8px",
            }}
          >
            {cells.map((day, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {day === null ? null : (
                  <button
                    onClick={() => selectDay(day)}
                    style={{
                      width: "34px",
                      height: "34px",
                      borderRadius: "50%",
                      border: "none",
                      fontSize: "12px",
                      fontWeight: isSel(day) ? 700 : 400,
                      cursor: "pointer",
                      transition: "all 0.12s",
                      fontFamily: F,
                      background: isSel(day)
                        ? "#1E3A8A"
                        : isNow(day)
                          ? "#EEF2FF"
                          : "transparent",
                      color: isSel(day)
                        ? "#fff"
                        : isNow(day)
                          ? "#1E3A8A"
                          : "#374151",
                      outline:
                        isNow(day) && !isSel(day)
                          ? "2px solid #1E3A8A"
                          : "none",
                      outlineOffset: "1px",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSel(day))
                        (e.currentTarget as HTMLElement).style.background =
                          "#EEF2FF";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSel(day))
                        (e.currentTarget as HTMLElement).style.background =
                          isNow(day) ? "#EEF2FF" : "transparent";
                    }}
                  >
                    {day}
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div
            style={{
              borderTop: "1px solid #EEF2FF",
              padding: "8px 14px",
              display: "flex",
              justifyContent: "space-between",
              background: "#fafbff",
            }}
          >
            <button
              onClick={clearDate}
              style={{
                background: "none",
                border: "none",
                color: "#6b7280",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: F,
              }}
            >
              አጽዳ (Clear)
            </button>
            <button
              onClick={goToday}
              style={{
                background: "none",
                border: "none",
                color: "#1E3A8A",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: F,
              }}
            >
              ዛሬ (Today)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface SearchResult {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  department?: { name: string };
  position?: { title: string };
}

function EmployeeSearch({
  value,
  onSearch,
  onSelect,
}: {
  value: string;
  onSearch: (q: string) => Promise<SearchResult[]>;
  onSelect: (emp: SearchResult) => void;
}) {
  const [query, setQuery] = useState(value || "");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!value) setQuery("");
  }, [value]);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setQuery(q);
    if (debRef.current) clearTimeout(debRef.current);
    if (!q.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    debRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await onSearch(q);
        setResults(r || []);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 280);
  };

  const handleSelect = (emp: SearchResult) => {
    setQuery(emp.id);
    setResults([]);
    setOpen(false);
    onSelect(emp);
  };

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder="ID ወይም ስም ያስገቡ…"
          style={{
            border: "1.5px solid #c7d7f9",
            borderRadius: "7px",
            padding: "8px 34px 8px 11px",
            fontSize: "12.5px",
            color: "#1a2540",
            outline: "none",
            width: "100%",
            boxSizing: "border-box",
            fontFamily: F,
            background: "#fff",
            transition: "all 0.15s",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "#1E3A8A";
            e.target.style.boxShadow = "0 0 0 3px rgba(30,58,138,0.1)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "#c7d7f9";
            e.target.style.boxShadow = "none";
          }}
        />
        <span
          style={{
            position: "absolute",
            right: "10px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "#aab0c0",
            fontSize: "13px",
            pointerEvents: "none",
          }}
        >
          {loading ? "⟳" : "⌕"}
        </span>
      </div>
      {open && results.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "calc(100%+4px)",
            left: 0,
            right: 0,
            background: "#fff",
            border: "1px solid #c7d7f9",
            borderRadius: "8px",
            boxShadow: "0 8px 24px rgba(30,58,138,0.12)",
            zIndex: 300,
            maxHeight: "220px",
            overflowY: "auto",
          }}
        >
          {results.map((emp) => (
            <div
              key={emp.id}
              onMouseDown={() => handleSelect(emp)}
              style={{
                padding: "10px 14px",
                cursor: "pointer",
                borderBottom: "1px solid #f0f4ff",
                transition: "background 0.1s",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.background = "#EEF2FF")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.background = "#fff")
              }
            >
              <div
                style={{ fontSize: "12px", fontWeight: 700, color: "#1E3A8A" }}
              >
                {emp.firstName}
                {emp.middleName ? " " + emp.middleName : ""} {emp.lastName}
                <span
                  style={{
                    fontWeight: 400,
                    color: "#6b7280",
                    marginLeft: "8px",
                    fontSize: "11px",
                  }}
                >
                  {emp.id}
                </span>
              </div>
              {(emp.position?.title || emp.department?.name) && (
                <div
                  style={{
                    fontSize: "10px",
                    color: "#9ca3af",
                    marginTop: "2px",
                  }}
                >
                  {emp.position?.title}
                  {emp.department?.name ? ` · ${emp.department.name}` : ""}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {open && !loading && results.length === 0 && query.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "calc(100%+4px)",
            left: 0,
            right: 0,
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            padding: "12px 14px",
            fontSize: "12px",
            color: "#9ca3af",
            boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
            zIndex: 300,
          }}
        >
          ምንም ኃላፊ አልተገኘም — No leader found
        </div>
      )}
    </div>
  );
}

const LABEL: React.CSSProperties = {
  fontSize: "9.5px",
  fontWeight: 700,
  color: "#6b7280",
  textTransform: "uppercase",
  letterSpacing: "0.14em",
  textAlign: "right",
  paddingRight: "12px",
  alignSelf: "center",
  whiteSpace: "nowrap",
  fontFamily: F,
};
const readOnly: React.CSSProperties = {
  border: "1.5px solid #e2e8f0",
  borderRadius: "7px",
  padding: "8px 11px",
  fontSize: "12.5px",
  outline: "none",
  width: "100%",
  boxSizing: "border-box" as const,
  fontFamily: F,
  background: "#f1f5fb",
  color: "#2a4a8a",
  fontWeight: 600,
  cursor: "not-allowed",
  minHeight: "38px",
  display: "flex",
  alignItems: "center",
};

export default function FormHeader({
  formData,
  onInputChange,
  onIdSearch,
  onEmployeeSelect,
}: any) {
  const [ethToday, setEthToday] = useState<EthDate | null>(null);
  const [employeeSelected, setEmployeeSelected] = useState(false);

  useEffect(() => {
    const today = getCurrentEthDate();
    setEthToday(today);

    // FIX: Set budgetYear to Ethiopian year string on mount so it's
    // always the Ethiopian year — never derived from Gregorian date.
    onInputChange({
      target: { name: "budgetYear", value: String(today.year) },
    });
  }, []);

  const makeDateHandler = (name: string) => (val: string) => {
    // val is now a pure Ethiopian date string "YYYY-MM-DD" — pass straight through
    onInputChange({ target: { name, value: val } });
  };

  return (
    <div style={{ padding: "24px 28px 20px" }}>
      {/* Title */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "18px",
        }}
      >
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
            letterSpacing: "0.02em",
            fontFamily: "'Georgia',serif",
          }}
        >
          Leadership Competency Evaluation — የብቃት መመዘኛ
        </span>
        <div
          style={{
            flex: 1,
            height: "1px",
            background: "linear-gradient(90deg,#c7d7f9,transparent)",
            marginLeft: "8px",
          }}
        />
      </div>

      {/* Year notice */}
      {ethToday && (
        <div
          style={{
            background: "#EEF2FF",
            border: "1px solid #c7d7f9",
            borderLeft: "3px solid #1E3A8A",
            borderRadius: "7px",
            padding: "9px 14px",
            marginBottom: "18px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <svg
            width="14"
            height="14"
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
          <div
            style={{
              fontSize: "11px",
              color: "#1E3A8A",
              fontWeight: 600,
              fontFamily: F,
            }}
          >
            <span>
              ዛሬ:{" "}
              <strong>
                {ET_DAYS[new Date().getDay()]} {formatEth(ethToday)}
              </strong>
            </span>
            <span style={{ marginLeft: "16px", opacity: 0.7 }}>
              · የምዘና ቅጹ ለዚህ ዓ.ም ብቻ: <strong>{ethToday.year} ዓ.ም</strong>
            </span>
          </div>
        </div>
      )}

      {/* Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0 48px",
        }}
      >
        {/* LEFT COLUMN */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 2fr",
            rowGap: "10px",
            alignItems: "center",
          }}
        >
          <span style={LABEL}>ዓ.ም (Year):</span>
          <div
            style={{
              border: "1.5px solid #c7d7f9",
              borderRadius: "7px",
              padding: "8px 11px",
              fontSize: "12.5px",
              color: "#1E3A8A",
              fontWeight: 700,
              background: "#EEF2FF",
              fontFamily: F,
              minHeight: "38px",
              display: "flex",
              alignItems: "center",
            }}
          >
            {/* FIX: Always show Ethiopian year */}
            {ethToday ? `${ethToday.year} ዓ.ም` : "…"}
          </div>

          {/* SEARCH */}
          <span style={LABEL}>የአመራር ID:</span>
          <EmployeeSearch
            value={employeeSelected ? formData.leadershipId : ""}
            onSearch={onIdSearch}
            onSelect={(emp: SearchResult) => {
              setEmployeeSelected(true);
              onEmployeeSelect(emp);
            }}
          />

          {/* FULL NAME */}
          <span style={LABEL}>ሙሉ ስም:</span>
          <div style={readOnly}>
            {employeeSelected ? (
              formData.fullName
            ) : (
              <span style={{ color: "#9ca3af", fontWeight: 400 }}>
                Auto-filled after employee search
              </span>
            )}
          </div>

          {/* DEPARTMENT */}
          <span style={LABEL}>መምሪያ:</span>
          <div style={readOnly}>
            {employeeSelected ? (
              formData.departmentName
            ) : (
              <span style={{ color: "#9ca3af", fontWeight: 400 }}>—</span>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 2fr",
            rowGap: "10px",
            alignItems: "center",
          }}
        >
          {/* JOB TITLE */}
          <span style={LABEL}>ማዕረግ:</span>
          <div style={readOnly}>
            {employeeSelected ? (
              formData.jobTitle
            ) : (
              <span style={{ color: "#9ca3af", fontWeight: 400 }}>—</span>
            )}
          </div>

          {/* START DATE */}
          <span style={LABEL}>ከ:</span>
          <EthiopianPicker
            value={formData.startDate}
            onChange={makeDateHandler("startDate")}
            placeholder="መጀመሪያ ቀን ምረጥ…"
          />

          {/* END DATE */}
          <span style={LABEL}>እስከ:</span>
          <EthiopianPicker
            value={formData.endDate}
            onChange={makeDateHandler("endDate")}
            placeholder="መጨረሻ ቀን ምረጥ…"
          />
        </div>
      </div>
    </div>
  );
}

export function FormFooter({ formData, onInputChange, onSubmit }: any) {
  const [ethToday, setEthToday] = useState<EthDate | null>(null);
  useEffect(() => {
    setEthToday(getCurrentEthDate());
  }, []);

  const qualFields = [
    {
      name: "identityIntegrity",
      label: "ታማንነትና ቅንነት",
      options: [
        { v: "", l: "-- Select --" },
        { v: "High", l: "High / ከፍተኛ" },
        { v: "Medium", l: "Medium / መካከለኛ" },
        { v: "Low", l: "Low / ዝቅተኛ" },
      ],
    },
    {
      name: "publicService",
      label: "የህዝብ አገልጋይነት",
      options: [
        { v: "", l: "-- Select --" },
        { v: "Excellent", l: "Excellent / በጣም ጥሩ" },
        { v: "Good", l: "Good / ጥሩ" },
        { v: "Satisfactory", l: "Satisfactory / ተቀባይነት ያለው" },
      ],
    },
  ];
  const sel: React.CSSProperties = {
    border: "1.5px solid #e2e8f0",
    borderRadius: "7px",
    padding: "8px 11px",
    fontSize: "12.5px",
    color: "#1a2540",
    background: "#fff",
    outline: "none",
    cursor: "pointer",
    fontFamily: F,
    width: "100%",
    transition: "all 0.15s",
  };

  return (
    <div style={{ padding: "20px 28px 28px" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "16px",
          marginBottom: "20px",
        }}
      >
        {qualFields.map((f) => (
          <div key={f.name}>
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
              {f.label}
            </label>
            <select
              name={f.name}
              value={(formData as any)[f.name]}
              onChange={onInputChange}
              style={sel}
            >
              {f.options.map((o) => (
                <option key={o.v} value={o.v}>
                  {o.l}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: "16px",
          borderTop: "1px solid #eef2ff",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontSize: "9.5px",
              fontWeight: 700,
              color: "#6b7280",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              fontFamily: F,
            }}
          >
            Evaluator:
          </span>
          <span
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "#1E3A8A",
              background: "#EEF2FF",
              border: "1px solid #c7d7f9",
              padding: "4px 12px",
              borderRadius: "20px",
              fontFamily: F,
            }}
          >
            {formData.filledBy || "—"}
          </span>
          {ethToday && (
            <span style={{ fontSize: "10px", color: "#6b7280", fontFamily: F }}>
              · {ethToday.year} ዓ.ም
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onSubmit}
          style={{
            background: "#1E3A8A",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            padding: "10px 30px",
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            cursor: "pointer",
            fontFamily: F,
            boxShadow: "0 4px 16px rgba(30,58,138,0.35)",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "#1e40af";
            (e.currentTarget as HTMLElement).style.transform =
              "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "#1E3A8A";
            (e.currentTarget as HTMLElement).style.transform = "none";
          }}
        >
          Submit Evaluation
        </button>
      </div>
    </div>
  );
}
