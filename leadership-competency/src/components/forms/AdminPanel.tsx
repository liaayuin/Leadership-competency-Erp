"use client";
import React, { useState, useEffect, useCallback } from "react";

const F = "'Helvetica Neue', Arial, sans-serif";
const BASE = "http://localhost:8081";

interface SystemConfig {
  configKey: string;
  configValue: number;
}
interface Category {
  id: number;
  name: string;
  weightDiv: number;
  weightDir: number;
}
interface Competency {
  id: number;
  name: string;
  weightDivision: number;
  weightDirector: number;
  catId: number;
}

const ROLE_KEYS = [
  "WEIGHT_SUPERVISOR",
  "WEIGHT_PEER",
  "WEIGHT_SUBORDINATE",
  "WEIGHT_SELF",
];
const QUAL_KEYS = ["WEIGHT_INTEGRITY", "WEIGHT_PUBLIC_SERVICE"];
const LABELS: Record<string, string> = {
  WEIGHT_SUPERVISOR: "Supervisor",
  WEIGHT_PEER: "Peer",
  WEIGHT_SUBORDINATE: "Subordinate",
  WEIGHT_SELF: "Self",
  WEIGHT_INTEGRITY: "Integrity Bonus",
  WEIGHT_PUBLIC_SERVICE: "Public Service Bonus",
};
const DESCS: Record<string, string> = {
  WEIGHT_SUPERVISOR: "Evaluations by direct supervisors",
  WEIGHT_PEER: "Evaluations by peers at the same level",
  WEIGHT_SUBORDINATE: "Evaluations by direct reports",
  WEIGHT_SELF: "Self-assessment weight",
  WEIGHT_INTEGRITY: "ታማንነትና ቅንነት (set 0 to disable)",
  WEIGHT_PUBLIC_SERVICE: "የህዝብ አገልጋይነት (set 0 to disable)",
};

/* ── Design atoms ─────────────────────────────────────── */
const card: React.CSSProperties = {
  background: "#fff",
  borderRadius: "14px",
  border: "1px solid #eaecf4",
  boxShadow: "0 2px 16px rgba(0,0,0,0.05)",
  overflow: "hidden",
  marginBottom: "22px",
};
const cardHead = (accent = "#0b1929"): React.CSSProperties => ({
  background: `linear-gradient(135deg, ${accent}, ${accent}dd)`,
  padding: "14px 22px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
});
const cardTitle: React.CSSProperties = {
  color: "#fff",
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  fontFamily: F,
};

const fieldBase: React.CSSProperties = {
  border: "1.5px solid #e8eaf0",
  borderRadius: "7px",
  padding: "8px 11px",
  fontSize: "12px",
  color: "#1a2540",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
  fontFamily: F,
  background: "#fff",
  transition: "all 0.15s",
};
const onFocus = (e: any) => {
  e.target.style.borderColor = "#0b1929";
  e.target.style.boxShadow = "0 0 0 3px rgba(11,25,41,0.07)";
};
const onBlur = (e: any) => {
  e.target.style.borderColor = "#e8eaf0";
  e.target.style.boxShadow = "none";
};

const PrimaryBtn = ({ onClick, children, small, disabled }: any) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      background: disabled
        ? "#d1d5db"
        : "linear-gradient(135deg,#0b1929,#1a3a6b)",
      color: "#fff",
      border: "none",
      borderRadius: "7px",
      padding: small ? "7px 16px" : "9px 22px",
      fontSize: "10px",
      fontWeight: 700,
      letterSpacing: "0.14em",
      textTransform: "uppercase",
      cursor: disabled ? "not-allowed" : "pointer",
      fontFamily: F,
      boxShadow: disabled ? "none" : "0 2px 10px rgba(11,25,41,0.22)",
      transition: "all 0.15s",
    }}
  >
    {children}
  </button>
);

const GhostBtn = ({ onClick, children, danger }: any) => (
  <button
    onClick={onClick}
    style={{
      background: "none",
      border: `1px solid ${danger ? "#fca5a5" : "#e8eaf0"}`,
      color: danger ? "#dc2626" : "#6b7280",
      borderRadius: "6px",
      padding: "4px 11px",
      fontSize: "10px",
      fontWeight: 700,
      letterSpacing: "0.08em",
      cursor: "pointer",
      fontFamily: F,
      transition: "all 0.15s",
    }}
  >
    {children}
  </button>
);

const SectionTitle = ({ children, action }: any) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "14px",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div
        style={{
          width: "3px",
          height: "16px",
          background: "linear-gradient(180deg,#0b1929,#c4a000)",
          borderRadius: "2px",
        }}
      />
      <span
        style={{
          fontSize: "11px",
          fontWeight: 700,
          color: "#0b1929",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          fontFamily: F,
        }}
      >
        {children}
      </span>
    </div>
    {action}
  </div>
);

/* ─────────────────────────────────────────────────────── */
export default function AdminPanel({ token }: { token: string }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [selectedCat, setSelectedCat] = useState<Category | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [showComp, setShowComp] = useState(false);
  const [showCat, setShowCat] = useState(false);
  const [editItem, setEditItem] = useState<Competency | null>(null);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [compForm, setCompForm] = useState({
    name: "",
    weightDivision: 0,
    weightDirector: 0,
  });
  const [catForm, setCatForm] = useState({
    name: "",
    weightDiv: 0,
    weightDir: 0,
  });

  const h = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  };

  const fetchConfigs = useCallback(async () => {
    try {
      const r = await fetch(`${BASE}/api/admin/config/weights`, { headers: h });
      if (r.ok) setConfigs(await r.json());
    } catch {}
  }, [token]);

  const fetchCats = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/api/admin/categories`, { headers: h });
      if (r.ok) {
        const d: Category[] = await r.json();
        setCategories(d);
        // Only set default if nothing selected yet — use functional update to read current state
        setSelectedCat((prev) => prev ?? (d.length > 0 ? d[0] : null));
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchComps = useCallback(
    async (catId: number) => {
      try {
        const r = await fetch(
          `${BASE}/api/admin/categories/${catId}/competencies`,
          { headers: h },
        );
        if (r.ok) setCompetencies(await r.json());
      } catch {}
    },
    [token],
  );

  useEffect(() => {
    fetchConfigs();
    fetchCats();
  }, []);

  useEffect(() => {
    if (selectedCat) fetchComps(selectedCat.id);
    else setCompetencies([]);
  }, [selectedCat]);

  const getConfig = (k: string) =>
    configs.find((c) => c.configKey === k)?.configValue ?? 0;
  const updateConfig = (k: string, v: string) =>
    setConfigs((p) =>
      p.map((c) => (c.configKey === k ? { ...c, configValue: Number(v) } : c)),
    );
  const roleTotal = ROLE_KEYS.reduce((s, k) => s + getConfig(k), 0);

  const saveWeights = async () => {
    if (roleTotal !== 100) {
      alert(`Role weights must sum to 100. Current: ${roleTotal}`);
      return;
    }
    try {
      const r = await fetch(`${BASE}/api/admin/config/weights`, {
        method: "PUT",
        headers: h,
        body: JSON.stringify(configs),
      });
      if (r.ok) showToast("✅ Weights saved successfully!");
    } catch {}
  };

  const handleSaveCat = async () => {
    const url = editCat
      ? `${BASE}/api/admin/categories/${editCat.id}`
      : `${BASE}/api/admin/categories`;
    try {
      const r = await fetch(url, {
        method: editCat ? "PUT" : "POST",
        headers: h,
        body: JSON.stringify(catForm),
      });
      if (r.ok) {
        setShowCat(false);
        setEditCat(null);
        setCatForm({ name: "", weightDiv: 0, weightDir: 0 });
        fetchCats();
        showToast("✅ Category saved!");
      }
    } catch {}
  };

  const handleSaveComp = async () => {
    if (!selectedCat) return;
    const url = editItem
      ? `${BASE}/api/admin/competencies/${editItem.id}`
      : `${BASE}/api/admin/categories/${selectedCat.id}/competencies`;
    try {
      const r = await fetch(url, {
        method: editItem ? "PUT" : "POST",
        headers: h,
        body: JSON.stringify({ ...compForm, catId: selectedCat.id }),
      });
      if (r.ok) {
        setShowComp(false);
        setEditItem(null);
        setCompForm({ name: "", weightDivision: 0, weightDirector: 0 });
        if (selectedCat) fetchComps(selectedCat.id);
        showToast("✅ Competency saved!");
      } else {
        const errBody = await r.json().catch(() => ({}));
        showToast("❌ Save failed: " + (errBody.message || r.statusText));
      }
    } catch (e: any) {
      showToast("❌ Network error: " + e.message);
    }
  };

  const handleDelete = async (type: "category" | "competency", id: number) => {
    if (!confirm("እርግጠኛ ነዎት?")) return;
    const url =
      type === "category"
        ? `${BASE}/api/admin/categories/${id}`
        : `${BASE}/api/admin/competencies/${id}`;
    try {
      const r = await fetch(url, { method: "DELETE", headers: h });
      if (r.ok) {
        if (type === "category") {
          fetchCats();
          setCompetencies([]);
        } else if (selectedCat) {
          fetchComps(selectedCat.id);
        }
        showToast("🗑 Deleted.");
      }
    } catch {}
  };

  const divSum = competencies.reduce((s, c) => s + c.weightDivision, 0);
  const dirSum = competencies.reduce((s, c) => s + c.weightDirector, 0);

  return (
    <div
      style={{
        fontFamily: F,
        maxWidth: "1100px",
        margin: "0 auto",
        position: "relative",
      }}
    >
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "24px",
            zIndex: 100,
            background: "#0b1929",
            color: "#fff",
            padding: "12px 20px",
            borderRadius: "10px",
            fontSize: "12px",
            fontWeight: 600,
            boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
            borderLeft: "3px solid #c4a000",
            fontFamily: F,
          }}
        >
          {toast}
        </div>
      )}

      {/* ── Role Weights ─────────────────────────────── */}
      <div style={card}>
        <div style={cardHead()}>
          <span style={cardTitle}>📊 Role Weights — የምዘና ሚዛን</span>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                padding: "3px 11px",
                borderRadius: "12px",
                background:
                  roleTotal === 100
                    ? "rgba(134,239,172,.2)"
                    : "rgba(252,165,165,.2)",
                color: roleTotal === 100 ? "#86efac" : "#fca5a5",
                border: `1px solid ${roleTotal === 100 ? "rgba(134,239,172,.3)" : "rgba(252,165,165,.3)"}`,
              }}
            >
              {roleTotal}/100
            </span>
            <PrimaryBtn
              onClick={saveWeights}
              small
              disabled={roleTotal !== 100}
            >
              አስቀምጥ
            </PrimaryBtn>
          </div>
        </div>
        <div style={{ padding: "20px 24px" }}>
          <p
            style={{
              fontSize: "11px",
              color: "#6b7280",
              lineHeight: 1.7,
              marginBottom: "18px",
            }}
          >
            These four weights control how each evaluator group contributes to
            the final score. They <strong>must sum to 100</strong>. Formula:{" "}
            <em>avg(group scores) × (weight ÷ 100)</em>.
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4,1fr)",
              gap: "16px",
            }}
          >
            {ROLE_KEYS.map((key) => (
              <div
                key={key}
                style={{
                  background: "#f8f9fc",
                  borderRadius: "10px",
                  padding: "16px",
                  border: "1px solid #f0f2f8",
                }}
              >
                <div
                  style={{
                    fontSize: "9px",
                    fontWeight: 700,
                    color: "#9ca3af",
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    marginBottom: "3px",
                  }}
                >
                  {LABELS[key]}
                </div>
                <div
                  style={{
                    fontSize: "9px",
                    color: "#c4cad6",
                    marginBottom: "10px",
                    lineHeight: 1.5,
                  }}
                >
                  {DESCS[key]}
                </div>
                <div style={{ position: "relative" }}>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={getConfig(key)}
                    onChange={(e) => updateConfig(key, e.target.value)}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    style={{
                      ...fieldBase,
                      fontWeight: 800,
                      fontSize: "24px",
                      color: "#0b1929",
                      paddingRight: "28px",
                    }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      right: "10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#9ca3af",
                      fontSize: "14px",
                      fontWeight: 700,
                    }}
                  >
                    %
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Qualitative Weights ───────────────────────── */}
      <div style={card}>
        <div style={cardHead("#7c5a00")}>
          <span style={cardTitle}>
            ⭐ Qualitative Bonus Weights — ታማንነት / አገልጋይነት
          </span>
          <PrimaryBtn onClick={saveWeights} small>
            አስቀምጥ
          </PrimaryBtn>
        </div>
        <div style={{ padding: "20px 24px" }}>
          <p
            style={{
              fontSize: "11px",
              color: "#6b7280",
              lineHeight: 1.7,
              marginBottom: "18px",
            }}
          >
            Optional bonus for <strong>ታማንነትና ቅንነት</strong> and{" "}
            <strong>የህዝብ አገልጋይነት</strong>. Set to <strong>0</strong> to disable.
            When active: High/Excellent=100, Medium/Good=70, Low/Satisfactory=40
            — multiplied by the weight fraction.
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
            }}
          >
            {QUAL_KEYS.map((key) => (
              <div
                key={key}
                style={{
                  background: "#fffbeb",
                  borderRadius: "10px",
                  padding: "16px",
                  border: "1px solid #fef3c7",
                }}
              >
                <div
                  style={{
                    fontSize: "9px",
                    fontWeight: 700,
                    color: "#92700a",
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    marginBottom: "3px",
                  }}
                >
                  {LABELS[key]}
                </div>
                <div
                  style={{
                    fontSize: "9px",
                    color: "#b45309",
                    marginBottom: "10px",
                    lineHeight: 1.5,
                  }}
                >
                  {DESCS[key]}
                </div>
                <div style={{ position: "relative" }}>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={getConfig(key)}
                    onChange={(e) => updateConfig(key, e.target.value)}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#c4a000";
                      e.target.style.boxShadow =
                        "0 0 0 3px rgba(196,160,0,0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#e8eaf0";
                      e.target.style.boxShadow = "none";
                    }}
                    style={{
                      ...fieldBase,
                      fontWeight: 800,
                      fontSize: "24px",
                      color: "#92700a",
                      paddingRight: "28px",
                      borderColor: "#fde68a",
                      background: "#fff",
                    }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      right: "10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#d97706",
                      fontSize: "14px",
                      fontWeight: 700,
                    }}
                  >
                    %
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "270px 1fr",
          gap: "20px",
        }}
      >
        {/* Categories */}
        <div>
          <SectionTitle
            action={
              <button
                onClick={() => {
                  setEditCat(null);
                  setCatForm({ name: "", weightDiv: 0, weightDir: 0 });
                  setShowCat(true);
                }}
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "#1d4ed8",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  letterSpacing: "0.05em",
                }}
              >
                + አዲስ ምድብ
              </button>
            }
          >
            የምዘና ምድቦች
          </SectionTitle>

          <div
            style={{
              background: "#fff",
              borderRadius: "12px",
              border: "1px solid #eaecf4",
              boxShadow: "0 1px 8px rgba(0,0,0,0.04)",
              overflow: "hidden",
            }}
          >
            {loading ? (
              <div
                style={{
                  padding: "28px",
                  textAlign: "center",
                  color: "#d1d5db",
                  fontSize: "12px",
                }}
              >
                Loading…
              </div>
            ) : categories.length === 0 ? (
              <div
                style={{
                  padding: "28px",
                  textAlign: "center",
                  color: "#d1d5db",
                  fontSize: "12px",
                  fontStyle: "italic",
                }}
              >
                No categories yet
              </div>
            ) : (
              categories.map((cat, i) => {
                const active = selectedCat?.id === cat.id;
                return (
                  <div
                    key={cat.id}
                    onClick={() => setSelectedCat(cat)}
                    style={{
                      padding: "12px 16px",
                      cursor: "pointer",
                      borderLeft: `3px solid ${active ? "#0b1929" : "transparent"}`,
                      background: active ? "#f0f4ff" : "#fff",
                      borderBottom:
                        i < categories.length - 1
                          ? "1px solid #f5f6fa"
                          : "none",
                      transition: "all 0.12s",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <div style={{ flex: 1, marginRight: "8px" }}>
                        <div
                          style={{
                            fontSize: "12.5px",
                            fontWeight: 700,
                            color: active ? "#0b1929" : "#374151",
                            lineHeight: 1.2,
                          }}
                        >
                          {cat.name}
                        </div>
                        <div
                          style={{
                            fontSize: "9px",
                            color: "#9ca3af",
                            marginTop: "3px",
                          }}
                        >
                          Div {cat.weightDiv}% · Dir {cat.weightDir}%
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "4px" }}>
                        <GhostBtn
                          onClick={(e: any) => {
                            e.stopPropagation();
                            setEditCat(cat);
                            setCatForm({
                              name: cat.name,
                              weightDiv: cat.weightDiv,
                              weightDir: cat.weightDir,
                            });
                            setShowCat(true);
                          }}
                        >
                          ✎
                        </GhostBtn>
                        <GhostBtn
                          danger
                          onClick={(e: any) => {
                            e.stopPropagation();
                            handleDelete("category", cat.id);
                          }}
                        >
                          ✕
                        </GhostBtn>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Competencies */}
        <div>
          <SectionTitle
            action={
              <PrimaryBtn
                small
                onClick={() => {
                  setEditItem(null);
                  setCompForm({
                    name: "",
                    weightDivision: 0,
                    weightDirector: 0,
                  });
                  setShowComp(true);
                }}
              >
                + ጨምር
              </PrimaryBtn>
            }
          >
            {selectedCat ? `${selectedCat.name} — ዝርዝር` : "ዝርዝር መመዘኛዎች"}
          </SectionTitle>

          <div
            style={{
              background: "#fff",
              borderRadius: "12px",
              border: "1px solid #eaecf4",
              boxShadow: "0 1px 8px rgba(0,0,0,0.04)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 100px 100px 110px",
                background: "linear-gradient(135deg,#0b1929,#0d2040)",
                padding: "10px 18px",
              }}
            >
              {["ስም", "Div %", "Dir %", "ድርጊት"].map((h) => (
                <span
                  key={h}
                  style={{
                    fontSize: "8.5px",
                    fontWeight: 700,
                    color: "rgba(255,255,255,0.4)",
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                  }}
                >
                  {h}
                </span>
              ))}
            </div>

            {competencies.length === 0 ? (
              <div
                style={{
                  padding: "36px",
                  textAlign: "center",
                  color: "#d1d5db",
                  fontSize: "12px",
                  fontStyle: "italic",
                }}
              >
                {selectedCat ? "No competencies yet" : "Select a category"}
              </div>
            ) : (
              <>
                {competencies.map((comp, i) => (
                  <div
                    key={comp.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 100px 100px 110px",
                      alignItems: "center",
                      padding: "11px 18px",
                      borderBottom:
                        i < competencies.length - 1
                          ? "1px solid #f5f6fa"
                          : "none",
                      background: i % 2 === 0 ? "#fff" : "#fafbff",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLElement).style.background =
                        "#f0f4ff")
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLElement).style.background =
                        i % 2 === 0 ? "#fff" : "#fafbff")
                    }
                  >
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 500,
                        color: "#374151",
                      }}
                    >
                      {comp.name}
                    </span>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#1d4ed8",
                        textAlign: "center",
                      }}
                    >
                      {comp.weightDivision}%
                    </span>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#7c3aed",
                        textAlign: "center",
                      }}
                    >
                      {comp.weightDirector}%
                    </span>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <GhostBtn
                        onClick={() => {
                          setEditItem(comp);
                          setCompForm({
                            name: comp.name,
                            weightDivision: comp.weightDivision,
                            weightDirector: comp.weightDirector,
                          });
                          setShowComp(true);
                        }}
                      >
                        Edit
                      </GhostBtn>
                      <GhostBtn
                        danger
                        onClick={() => handleDelete("competency", comp.id)}
                      >
                        Del
                      </GhostBtn>
                    </div>
                  </div>
                ))}

                {/* Totals row */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 100px 100px 110px",
                    padding: "9px 18px",
                    background: "#f8f9fc",
                    borderTop: "2px solid #eaecf4",
                  }}
                >
                  <span
                    style={{
                      fontSize: "9.5px",
                      fontWeight: 700,
                      color: "#6b7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                    }}
                  >
                    ድምር
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 800,
                      color:
                        selectedCat && divSum !== selectedCat.weightDiv
                          ? "#dc2626"
                          : "#1d4ed8",
                      textAlign: "center",
                    }}
                  >
                    {divSum}%
                    {selectedCat && divSum !== selectedCat.weightDiv
                      ? ` ≠${selectedCat.weightDiv}`
                      : ""}
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 800,
                      color:
                        selectedCat && dirSum !== selectedCat.weightDir
                          ? "#dc2626"
                          : "#7c3aed",
                      textAlign: "center",
                    }}
                  >
                    {dirSum}%
                    {selectedCat && dirSum !== selectedCat.weightDir
                      ? ` ≠${selectedCat.weightDir}`
                      : ""}
                  </span>
                  <span />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {(showCat || showComp) && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(6,13,26,0.6)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "14px",
              width: "420px",
              maxWidth: "92vw",
              boxShadow: "0 32px 80px rgba(0,0,0,0.3)",
              overflow: "hidden",
            }}
          >
            <div style={cardHead()}>
              <span style={cardTitle}>
                {showCat
                  ? editCat
                    ? "ምድብ ማስተካከያ"
                    : "አዲስ ምድብ"
                  : editItem
                    ? "መመዘኛ ማስተካከያ"
                    : "አዲስ መመዘኛ"}
              </span>
              <button
                onClick={() => {
                  setShowCat(false);
                  setShowComp(false);
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "rgba(255,255,255,0.5)",
                  fontSize: "20px",
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: "24px" }}>
              {showCat ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px",
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "9.5px",
                        fontWeight: 700,
                        color: "#8a94a6",
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        marginBottom: "6px",
                      }}
                    >
                      ስም
                    </label>
                    <input
                      type="text"
                      value={catForm.name}
                      onChange={(e) =>
                        setCatForm({ ...catForm, name: e.target.value })
                      }
                      style={fieldBase}
                      onFocus={onFocus}
                      onBlur={onBlur}
                    />
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "12px",
                    }}
                  >
                    {(
                      [
                        ["weightDiv", "Division Weight %"],
                        ["weightDir", "Director Weight %"],
                      ] as [keyof typeof catForm, string][]
                    ).map(([k, l]) => (
                      <div key={k}>
                        <label
                          style={{
                            display: "block",
                            fontSize: "9.5px",
                            fontWeight: 700,
                            color: "#8a94a6",
                            letterSpacing: "0.14em",
                            textTransform: "uppercase",
                            marginBottom: "6px",
                          }}
                        >
                          {l}
                        </label>
                        <input
                          type="number"
                          value={catForm[k] as number}
                          onChange={(e) =>
                            setCatForm({
                              ...catForm,
                              [k]: Number(e.target.value),
                            })
                          }
                          style={fieldBase}
                          onFocus={onFocus}
                          onBlur={onBlur}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px",
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "9.5px",
                        fontWeight: 700,
                        color: "#8a94a6",
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        marginBottom: "6px",
                      }}
                    >
                      ስም
                    </label>
                    <input
                      type="text"
                      value={compForm.name}
                      onChange={(e) =>
                        setCompForm({ ...compForm, name: e.target.value })
                      }
                      style={fieldBase}
                      onFocus={onFocus}
                      onBlur={onBlur}
                    />
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "12px",
                    }}
                  >
                    {(
                      [
                        ["weightDivision", "Division Weight %"],
                        ["weightDirector", "Director Weight %"],
                      ] as [keyof typeof compForm, string][]
                    ).map(([k, l]) => (
                      <div key={k}>
                        <label
                          style={{
                            display: "block",
                            fontSize: "9.5px",
                            fontWeight: 700,
                            color: "#8a94a6",
                            letterSpacing: "0.14em",
                            textTransform: "uppercase",
                            marginBottom: "6px",
                          }}
                        >
                          {l}
                        </label>
                        <input
                          type="number"
                          value={compForm[k] as number}
                          onChange={(e) =>
                            setCompForm({
                              ...compForm,
                              [k]: Number(e.target.value),
                            })
                          }
                          style={fieldBase}
                          onFocus={onFocus}
                          onBlur={onBlur}
                        />
                      </div>
                    ))}
                  </div>
                  {selectedCat && (
                    <div
                      style={{
                        fontSize: "10px",
                        color: "#9ca3af",
                        background: "#f8f9fc",
                        padding: "9px 12px",
                        borderRadius: "7px",
                        lineHeight: 1.6,
                      }}
                    >
                      Category target → Div:{" "}
                      <strong>{selectedCat.weightDiv}%</strong> · Dir:{" "}
                      <strong>{selectedCat.weightDir}%</strong>
                      <br />
                      Current totals → Div:{" "}
                      <strong
                        style={{
                          color:
                            divSum !== selectedCat.weightDiv
                              ? "#dc2626"
                              : "#16a34a",
                        }}
                      >
                        {divSum}%
                      </strong>{" "}
                      · Dir:{" "}
                      <strong
                        style={{
                          color:
                            dirSum !== selectedCat.weightDir
                              ? "#dc2626"
                              : "#16a34a",
                        }}
                      >
                        {dirSum}%
                      </strong>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div
              style={{
                borderTop: "1px solid #f3f4f6",
                padding: "14px 24px",
                display: "flex",
                justifyContent: "flex-end",
                gap: "8px",
                background: "#fafafa",
              }}
            >
              <GhostBtn
                onClick={() => {
                  setShowCat(false);
                  setShowComp(false);
                }}
              >
                አይመለስ
              </GhostBtn>
              <PrimaryBtn
                onClick={showCat ? handleSaveCat : handleSaveComp}
                small
              >
                መዝግብ
              </PrimaryBtn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
