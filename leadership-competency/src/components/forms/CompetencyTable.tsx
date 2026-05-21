"use client";
import React, { useState, useEffect } from "react";
import { useKeycloak } from "@react-keycloak/web";

const F = "'Helvetica Neue', Arial, sans-serif";
interface Category {
  id: number;
  name: string;
}
interface Competency {
  id: number;
  name: string;
  lookupKey: string;
  catId: number;
}

const SCORE_COLOR = ["", "#ef4444", "#f97316", "#eab308", "#22c55e", "#0b1929"];
const SCORE_LABEL = ["", "ደካማ", "አነስተኛ", "መካከለኛ", "ጥሩ", "በጣም ጥሩ"];
const SCORE_BG = ["", "#fff1f1", "#fff7ed", "#fefce8", "#f0fdf4", "#f0f4ff"];

export default function CompetencyTable({
  onRatingChange,
  refreshKey,
}: {
  onRatingChange: (key: string, score: number) => void;
  refreshKey?: number;
}) {
  const { keycloak } = useKeycloak();
  const [categories, setCategories] = useState<Category[]>([]);
  const [allCompetencies, setAllCompetencies] = useState<Competency[]>([]);
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!keycloak?.authenticated || !keycloak.token) return;
    const headers = {
      Authorization: `Bearer ${keycloak.token}`,
      "Content-Type": "application/json",
    };
    (async () => {
      try {
        const catRes = await fetch(
          "http://localhost:8081/api/admin/categories",
          { headers },
        );
        if (!catRes.ok) throw new Error("Failed to fetch categories");
        const cats: Category[] = await catRes.json();
        setCategories(cats);
        const results = await Promise.all(
          cats.map((cat) =>
            fetch(
              `http://localhost:8081/api/admin/categories/${cat.id}/competencies`,
              { headers },
            ).then((r) => (r.ok ? r.json() : [])),
          ),
        );
        setAllCompetencies(results.flat());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [keycloak, refreshKey]);

  const pick = (lookupKey: string, num: number) => {
    setSelected((p) => ({ ...p, [lookupKey]: num }));
    onRatingChange(lookupKey, num);
  };

  if (loading)
    return (
      <div style={{ padding: "48px", textAlign: "center", fontFamily: F }}>
        <div
          style={{
            width: "32px",
            height: "32px",
            border: "3px solid #e8eaf0",
            borderTop: "3px solid #0b1929",
            borderRadius: "50%",
            margin: "0 auto 12px",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <p
          style={{ color: "#9ca3af", fontSize: "12px", letterSpacing: "0.1em" }}
        >
          Loading framework…
        </p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );

  const totalCompetencies = allCompetencies.length;
  const ratedCount = Object.keys(selected).length;
  const progress =
    totalCompetencies > 0
      ? Math.round((ratedCount / totalCompetencies) * 100)
      : 0;

  return (
    <div style={{ fontFamily: F }}>
      {/* Progress bar */}
      <div
        style={{
          padding: "12px 20px 10px",
          background: "#fafbff",
          borderBottom: "1px solid #f0f2f8",
          display: "flex",
          alignItems: "center",
          gap: "14px",
        }}
      >
        <div
          style={{
            flex: 1,
            height: "5px",
            background: "#e8eaf0",
            borderRadius: "10px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background:
                progress === 100
                  ? "#22c55e"
                  : "linear-gradient(90deg, #0b1929, #1a3a6b)",
              borderRadius: "10px",
              transition: "width 0.3s ease",
            }}
          />
        </div>
        <span
          style={{
            fontSize: "9.5px",
            fontWeight: 700,
            color: progress === 100 ? "#16a34a" : "#6b7280",
            letterSpacing: "0.1em",
            whiteSpace: "nowrap",
          }}
        >
          {ratedCount}/{totalCompetencies} RATED · {progress}%
        </span>
      </div>

      {/* Table header */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "172px 1fr 280px",
          background: "linear-gradient(135deg, #0b1929, #0d2040)",
          padding: "10px 20px",
        }}
      >
        {["Category / ምድብ", "Competency / መመዘኛ", "Score 1 – 5"].map((h) => (
          <span
            key={h}
            style={{
              color: "rgba(255,255,255,0.45)",
              fontSize: "8.5px",
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
            }}
          >
            {h}
          </span>
        ))}
      </div>

      {/* Rows */}
      {categories.map((cat, catIdx) => {
        const items = allCompetencies.filter((c) => c.catId === cat.id);
        if (items.length === 0) return null;
        const catRated = items.filter((i) => selected[i.lookupKey]).length;
        const catDone = catRated === items.length;

        return (
          <div
            key={cat.id}
            style={{
              borderBottom:
                catIdx < categories.length - 1 ? "2px solid #f0f2f8" : "none",
            }}
          >
            {items.map((item, idx) => {
              const score = selected[item.lookupKey] || 0;
              const rowBg = idx % 2 === 0 ? "#ffffff" : "#fafbff";
              return (
                <div
                  key={item.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "172px 1fr 280px",
                    alignItems: "center",
                    minHeight: "48px",
                    borderBottom: "1px solid #f5f6fa",
                    background: score > 0 ? SCORE_BG[score] : rowBg,
                    transition: "background 0.15s",
                  }}
                >
                  {/* Category cell — only first row */}
                  {idx === 0 ? (
                    <div
                      style={{
                        padding: "10px 14px",
                        borderRight: "1px solid #f0f2f8",
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                        height: "100%",
                        justifyContent: "flex-start",
                        paddingTop: "14px",
                      }}
                    >
                      <div
                        style={{
                          background: catDone
                            ? "#f0fdf4"
                            : "linear-gradient(135deg, #0b1929, #1a3a6b)",
                          color: catDone ? "#16a34a" : "#ffffff",
                          fontSize: "9px",
                          fontWeight: 700,
                          letterSpacing: "0.08em",
                          padding: "4px 9px",
                          borderRadius: "5px",
                          display: "inline-block",
                          border: catDone ? "1px solid #bbf7d0" : "none",
                        }}
                      >
                        {cat.name}
                      </div>
                      <div
                        style={{
                          fontSize: "8.5px",
                          color: "#9ca3af",
                          marginTop: "2px",
                        }}
                      >
                        {catRated}/{items.length} rated
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        borderRight: "1px solid #f0f2f8",
                        height: "100%",
                      }}
                    />
                  )}

                  {/* Competency name */}
                  <div
                    style={{
                      padding: "12px 16px",
                      borderRight: "1px solid #f0f2f8",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#2d3748",
                        fontWeight: 500,
                        lineHeight: 1.4,
                      }}
                    >
                      {item.name}
                    </span>
                    {score > 0 && (
                      <span
                        style={{
                          marginLeft: "8px",
                          fontSize: "9px",
                          fontWeight: 700,
                          color: SCORE_COLOR[score],
                          background: SCORE_BG[score],
                          border: `1px solid ${SCORE_COLOR[score]}30`,
                          padding: "1px 7px",
                          borderRadius: "10px",
                        }}
                      >
                        {SCORE_LABEL[score]}
                      </span>
                    )}
                  </div>

                  {/* Score buttons */}
                  <div
                    style={{
                      padding: "8px 16px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      justifyContent: "center",
                    }}
                  >
                    {[1, 2, 3, 4, 5].map((num) => {
                      const active = score === num;
                      return (
                        <button
                          key={num}
                          type="button"
                          onClick={() => pick(item.lookupKey, num)}
                          style={{
                            width: "34px",
                            height: "34px",
                            borderRadius: "50%",
                            border: active
                              ? `2px solid ${SCORE_COLOR[num]}`
                              : "2px solid #e8eaf0",
                            background: active ? SCORE_COLOR[num] : "#fff",
                            color: active ? "#fff" : "#9ca3af",
                            fontSize: "11px",
                            fontWeight: 700,
                            cursor: "pointer",
                            transition: "all 0.15s",
                            boxShadow: active
                              ? `0 2px 10px ${SCORE_COLOR[num]}50`
                              : "none",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                          onMouseEnter={(e) => {
                            if (!active) {
                              (
                                e.currentTarget as HTMLElement
                              ).style.borderColor = SCORE_COLOR[num];
                              (e.currentTarget as HTMLElement).style.color =
                                SCORE_COLOR[num];
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!active) {
                              (
                                e.currentTarget as HTMLElement
                              ).style.borderColor = "#e8eaf0";
                              (e.currentTarget as HTMLElement).style.color =
                                "#9ca3af";
                            }
                          }}
                        >
                          {num}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      {/* Legend */}
      <div
        style={{
          padding: "10px 20px",
          background: "#f8f9fc",
          borderTop: "1px solid #f0f2f8",
          display: "flex",
          gap: "20px",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontSize: "8.5px",
            fontWeight: 700,
            color: "#9ca3af",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          Scale:
        </span>
        {[1, 2, 3, 4, 5].map((n) => (
          <div
            key={n}
            style={{ display: "flex", alignItems: "center", gap: "5px" }}
          >
            <div
              style={{
                width: "9px",
                height: "9px",
                borderRadius: "50%",
                background: SCORE_COLOR[n],
              }}
            />
            <span
              style={{ fontSize: "9px", color: "#6b7280", fontWeight: 600 }}
            >
              {n} — {SCORE_LABEL[n]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
