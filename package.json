// pages/index.js — English Study Hub
// Toss App + iPhone Stopwatch 디자인 | 다이얼 애니메이션 | 관리자 모드
import { useState, useEffect, useRef, useCallback } from "react";

// ─── ADMIN PIN (배포 전 변경하세요) ─────────────────────────────────────────
const ADMIN_PIN = "1234";

// ─── API & STORAGE ────────────────────────────────────────────────────────────
const callAI = async (system, message) => {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system, message }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "서버 오류");
  return data.result || "";
};
const lsGet = (k) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const C = {
  bg: "#F2F4F6", card: "#FFFFFF",
  primary: "#3182F6", primaryDark: "#1B64DA", primaryLight: "#EBF3FE",
  text: "#191F28", textSub: "#8B95A1", textHint: "#C5CDD6",
  border: "#E5E8EB", success: "#0AC45D", warning: "#F7B731",
  danger: "#F04438", night: "#0D1117", nightMid: "#161B22", nightSurf: "#21262D",
};

// ─── GLOBAL CSS ───────────────────────────────────────────────────────────────
const G = `
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  html,body{background:${C.bg};font-family:'Pretendard',-apple-system,BlinkMacSystemFont,sans-serif;-webkit-font-smoothing:antialiased}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
  @keyframes scaleIn{from{opacity:0;transform:scale(.85)}to{opacity:1;transform:scale(1)}}
  @keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}
  @keyframes pulse{0%,100%{opacity:.9}50%{opacity:.3}}
  @keyframes wordGlow{0%,100%{text-shadow:0 0 20px rgba(120,200,255,.7),0 0 40px rgba(80,180,255,.4)}50%{text-shadow:0 0 40px rgba(120,220,255,1),0 0 80px rgba(80,200,255,.6)}}
  @keyframes qPulse{0%,100%{color:#F7B731;opacity:1}50%{color:#FFD700;opacity:.55}}
  @keyframes revealPop{0%{transform:scale(.55);opacity:0}65%{transform:scale(1.07)}100%{transform:scale(1);opacity:1}}
  @keyframes reelScroll{0%{transform:translateY(0)}100%{transform:translateY(-50%)}}
`;

// ─── SHARED PRIMITIVES ────────────────────────────────────────────────────────
const Spinner = ({ sz = 18 }) => (
  <div style={{ width: sz, height: sz, border: `2px solid ${C.border}`, borderTop: `2px solid ${C.primary}`, borderRadius: "50%", animation: "spin .7s linear infinite", display: "inline-block" }} />
);
const AISpinner = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 0", color: C.textSub }}>
    <Spinner /><span style={{ fontSize: 14, fontWeight: 500 }}>GPT-4o 분석 중...</span>
  </div>
);
const Card = ({ children, style, onClick }) => (
  <div onClick={onClick} style={{ background: C.card, borderRadius: 20, boxShadow: "0 1px 8px rgba(0,0,0,.06),0 4px 20px rgba(0,0,0,.04)", padding: "18px 20px", marginBottom: 12, cursor: onClick ? "pointer" : "default", ...style }}>
    {children}
  </div>
);
const Btn = ({ children, onClick, v = "primary", disabled, full, sz = "md", style }) => {
  const V = {
    primary:   { background: disabled ? C.border : `linear-gradient(135deg,${C.primary},${C.primaryDark})`, color: disabled ? C.textSub : "#fff", border: "none", boxShadow: disabled ? "none" : "0 4px 14px rgba(49,130,246,.35)" },
    secondary: { background: C.primaryLight, color: C.primary, border: "none" },
    ghost:     { background: "transparent", color: C.textSub, border: `1.5px solid ${C.border}` },
    danger:    { background: "#FEF2F2", color: C.danger, border: "none" },
    success:   { background: "#EDFDF4", color: C.success, border: "none" },
    dark:      { background: `linear-gradient(135deg,${C.night},${C.nightMid})`, color: "#fff", border: "none", boxShadow: "0 4px 14px rgba(0,0,0,.3)" },
    nightBtn:  { background: C.nightSurf, color: "rgba(255,255,255,.75)", border: "1px solid rgba(255,255,255,.1)" },
  };
  const P = sz === "sm" ? "7px 13px" : sz === "lg" ? "16px 28px" : "13px 20px";
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...V[v], padding: P, borderRadius: sz === "sm" ? 10 : 14, fontFamily: "inherit", fontWeight: 700, fontSize: sz === "sm" ? 13 : 15, cursor: disabled ? "not-allowed" : "pointer", width: full ? "100%" : "auto", transition: "all .15s", opacity: disabled ? .65 : 1, outline: "none", letterSpacing: "-.01em", ...style }}>
      {children}
    </button>
  );
};
const Input = ({ value, onChange, placeholder, type = "text", style, onKeyDown }) => (
  <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} type={type} onKeyDown={onKeyDown}
    style={{ width: "100%", padding: "13px 16px", border: `1.5px solid ${C.border}`, borderRadius: 12, fontFamily: "inherit", fontSize: 15, color: C.text, background: "#F8FAFC", outline: "none", transition: "border-color .2s,box-shadow .2s", ...style }}
    onFocus={e => { e.target.style.borderColor = C.primary; e.target.style.boxShadow = "0 0 0 3px rgba(49,130,246,.12)"; }}
    onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = "none"; }}
  />
);
const Textarea = ({ value, onChange, placeholder, rows = 5 }) => (
  <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
    style={{ width: "100%", padding: "13px 16px", border: `1.5px solid ${C.border}`, borderRadius: 12, fontFamily: "inherit", fontSize: 14, color: C.text, background: "#F8FAFC", outline: "none", resize: "vertical", lineHeight: 1.75, transition: "border-color .2s,box-shadow .2s" }}
    onFocus={e => { e.target.style.borderColor = C.primary; e.target.style.boxShadow = "0 0 0 3px rgba(49,130,246,.12)"; }}
    onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = "none"; }}
  />
);
const Label = ({ children, style }) => <p style={{ fontSize: 12, fontWeight: 700, color: C.textSub, marginBottom: 8, letterSpacing: ".04em", textTransform: "uppercase", ...style }}>{children}</p>;
const Badge = ({ children, color = C.primary }) => <span style={{ background: `${color}18`, color, fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>{children}</span>;
const ErrBanner = ({ msg, onClose }) => (
  <div style={{ background: "#FFF0F0", border: `1px solid #FECACA`, borderRadius: 12, padding: "12px 16px", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center", color: C.danger, fontSize: 14, fontWeight: 500, animation: "fadeUp .3s ease" }}>
    <span>⚠️ {msg}</span>
    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.danger, fontSize: 20, lineHeight: 1, padding: "0 4px" }}>×</button>
  </div>
);

// ─── RICH TEXT ────────────────────────────────────────────────────────────────
function il(text) {
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g).map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) return <strong key={i} style={{ color: C.text }}>{p.slice(2, -2)}</strong>;
    if (p.startsWith("*") && p.endsWith("*")) return <em key={i} style={{ color: C.textSub }}>{p.slice(1, -1)}</em>;
    if (p.startsWith("`") && p.endsWith("`")) return <code key={i} style={{ background: C.primaryLight, color: C.primary, padding: "1px 6px", borderRadius: 5, fontFamily: "monospace", fontSize: 13 }}>{p.slice(1, -1)}</code>;
    return p;
  });
}
function RichText({ text }) {
  if (!text) return null;
  return (
    <div style={{ lineHeight: 1.85, fontSize: 14.5, color: C.text }}>
      {text.split("\n").map((line, i) => {
        const t = line.trim();
        if (!t) return <div key={i} style={{ height: 8 }} />;
        if (t.startsWith("## ")) return <p key={i} style={{ fontWeight: 700, fontSize: 15, color: C.text, margin: "16px 0 6px", borderLeft: `3px solid ${C.primary}`, paddingLeft: 10 }}>{il(t.slice(3))}</p>;
        if (t.startsWith("# ")) return <p key={i} style={{ fontWeight: 800, fontSize: 17, color: C.text, margin: "18px 0 8px" }}>{il(t.slice(2))}</p>;
        if (t.startsWith("- ") || t.startsWith("• ")) return <div key={i} style={{ display: "flex", gap: 8, margin: "4px 0", paddingLeft: 4 }}><span style={{ color: C.primary, minWidth: 12, marginTop: 2 }}>•</span><span>{il(t.slice(2))}</span></div>;
        const nm = t.match(/^(\d+)\.\s/);
        if (nm) return <div key={i} style={{ display: "flex", gap: 8, margin: "4px 0", paddingLeft: 4 }}><span style={{ color: C.primary, minWidth: 20, fontWeight: 700, fontSize: 13 }}>{nm[1]}.</span><span>{il(t.slice(nm[0].length))}</span></div>;
        return <p key={i} style={{ margin: "4px 0" }}>{il(t)}</p>;
      })}
    </div>
  );
}

// ─── DIAL / SLOT MACHINE ──────────────────────────────────────────────────────
const POOL = [
  "achieve","believe","create","develop","explore","flourish","generate",
  "illuminate","journey","knowledge","leverage","master","navigate",
  "overcome","persevere","reflect","sustain","transform","validate",
  "wonder","inspire","dedicate","practice","improve","challenge",
  "progress","adventure","brilliant","confident","resilient","passionate",
  "discover","innovate","empower","thrive","succeed","connect","motivate",
  "liberate","expand","embrace","courage","wisdom","patience","gratitude",
];

function Reel({ words, speed, blur, opacity }) {
  const doubled = [...words, ...words];
  return (
    <div style={{ width: 105, height: 230, overflow: "hidden", position: "relative", flexShrink: 0 }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 72, background: `linear-gradient(to bottom,${C.night},transparent)`, zIndex: 3, pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 72, background: `linear-gradient(to top,${C.night},transparent)`, zIndex: 3, pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "50%", left: 6, right: 6, height: 40, marginTop: -20, border: `1px solid rgba(49,130,246,.35)`, borderRadius: 8, zIndex: 2, pointerEvents: "none", boxShadow: "0 0 10px rgba(49,130,246,.18)" }} />
      <div style={{ animation: `reelScroll ${speed}s linear infinite`, filter: `blur(${blur}px)`, opacity, transition: "filter .35s, opacity .35s" }}>
        {doubled.map((w, i) => {
          const mid = i === 3 || i === doubled.length / 2 + 3;
          return (
            <div key={i} style={{ height: 40, display: "flex", alignItems: "center", justifyContent: "center", color: mid ? "#FFF" : "rgba(255,255,255,.22)", fontSize: mid ? 16 : 12, fontWeight: mid ? 800 : 400, letterSpacing: mid ? "-.01em" : ".03em" }}>
              {w}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DialMachine({ targetWord, onReveal }) {
  const [phase, setPhase] = useState("idle");
  const [reels, setReels] = useState([[...POOL.slice(0, 8)], [...POOL.slice(8, 16)], [...POOL.slice(16, 24)]]);
  const [speeds, setSpeeds] = useState([0.09, 0.11, 0.10]);
  const [blurs, setBlurs] = useState([0, 0, 0]);
  const [opacities, setOpacities] = useState([1, 1, 1]);
  const [showQ, setShowQ] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const timers = useRef([]);

  const clearAll = () => { timers.current.forEach(t => { clearTimeout(t); clearInterval(t); }); timers.current = []; };
  const after = (fn, ms) => { const t = setTimeout(fn, ms); timers.current.push(t); };
  const interval = (fn, ms) => { const t = setInterval(fn, ms); timers.current.push(t); return t; };
  useEffect(() => () => clearAll(), []);

  const shuffle = useCallback(() => {
    setReels([0, 8, 16].map(off => {
      const s = Math.floor(Math.random() * (POOL.length - 8));
      return POOL.slice(s, s + 8);
    }));
  }, []);

  const start = () => {
    if (phase !== "idle" && phase !== "done") return;
    clearAll();
    setShowQ(false); setRevealed(false);
    setBlurs([0, 0, 0]); setOpacities([1, 1, 1]);
    setSpeeds([0.09, 0.11, 0.10]);
    setPhase("spinning");

    let int1 = interval(shuffle, 130);

    // 1.8s → slow down
    after(() => {
      clearInterval(int1);
      setSpeeds([0.25, 0.30, 0.22]);
      setPhase("slowing");
      int1 = interval(shuffle, 350);
    }, 1800);

    // 2.9s → blur
    after(() => {
      clearInterval(int1);
      setPhase("blurring");
      int1 = interval(shuffle, 600);
      let step = 0;
      const bi = interval(() => {
        step++;
        const b = Math.min(step * 1.6, 15);
        const o = Math.max(1 - step * 0.065, 0.1);
        setBlurs([b, b * 1.1, b * 0.9]);
        setOpacities([o, o * 0.9, o * 1.05]);
        if (step >= 10) clearInterval(bi);
      }, 90);
    }, 2900);

    // 3.9s → mystery
    after(() => {
      clearInterval(int1);
      setBlurs([16, 16, 16]); setOpacities([0.07, 0.07, 0.07]);
      setShowQ(true); setPhase("mystery");
    }, 3900);

    // 4.8s → reveal
    after(() => {
      setShowQ(false); setBlurs([0, 0, 0]); setOpacities([1, 1, 1]);
      setRevealed(true); setPhase("revealing");
    }, 4800);

    // 5.8s → done
    after(() => { setPhase("done"); if (onReveal) onReveal(); }, 5800);
  };

  const isRolling = ["spinning", "slowing", "blurring"].includes(phase);
  const PHASES = ["spinning", "slowing", "blurring", "mystery", "revealing", "done"];

  return (
    <div style={{ background: `linear-gradient(180deg,${C.night} 0%,${C.nightMid} 100%)`, borderRadius: 28, overflow: "hidden", marginBottom: 16, boxShadow: "0 20px 60px rgba(0,0,0,.45),inset 0 1px 0 rgba(255,255,255,.06)" }}>
      <div style={{ height: 2, background: `linear-gradient(90deg,transparent,${C.primary},transparent)` }} />
      <div style={{ padding: "26px 20px 22px" }}>
        {/* top row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <span style={{ color: "rgba(255,255,255,.35)", fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase" }}>Today&apos;s Word</span>
          <div style={{ display: "flex", gap: 5 }}>
            {PHASES.map((p, i) => (
              <div key={p} style={{ width: 6, height: 6, borderRadius: 3, background: PHASES.indexOf(phase) >= i ? C.primary : "rgba(255,255,255,.14)", transition: "background .3s" }} />
            ))}
          </div>
        </div>

        {/* stage */}
        <div style={{ position: "relative", height: 230 }}>
          {/* Reels */}
          <div style={{ display: "flex", justifyContent: "center", gap: 6, position: "absolute", inset: 0, opacity: isRolling ? 1 : 0, transition: "opacity .4s", pointerEvents: "none" }}>
            {reels.map((words, i) => <Reel key={i} words={words} speed={speeds[i]} blur={blurs[i]} opacity={opacities[i]} />)}
          </div>

          {/* Mystery ??? */}
          {showQ && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 80, fontWeight: 900, animation: "qPulse .55s ease-in-out infinite", letterSpacing: "-.04em" }}>???</span>
            </div>
          )}

          {/* Revealed word */}
          {revealed && (
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
              <div style={{ fontSize: 54, fontWeight: 900, color: "#FFF", letterSpacing: "-.03em", animation: "revealPop .55s cubic-bezier(.34,1.56,.64,1) forwards, wordGlow 2.5s ease-in-out .55s infinite" }}>
                {targetWord}
              </div>
              <div style={{ height: 2, width: 52, background: `linear-gradient(90deg,transparent,${C.primary},transparent)`, borderRadius: 1 }} />
            </div>
          )}

          {/* Idle */}
          {phase === "idle" && (
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
              <div style={{ width: 56, height: 56, borderRadius: 28, background: `rgba(49,130,246,.15)`, border: `1px solid rgba(49,130,246,.3)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>🎯</div>
              <p style={{ color: "rgba(255,255,255,.38)", fontSize: 14, textAlign: "center", fontWeight: 500 }}>버튼을 눌러<br />오늘의 단어를 확인하세요</p>
            </div>
          )}
        </div>

        {/* CTA */}
        {(phase === "idle" || phase === "done") ? (
          <button onClick={start} style={{ marginTop: 20, width: "100%", padding: "15px", background: phase === "done" ? C.nightSurf : `linear-gradient(135deg,${C.primary},${C.primaryDark})`, color: "#fff", border: phase === "done" ? "1px solid rgba(255,255,255,.1)" : "none", borderRadius: 14, fontFamily: "inherit", fontWeight: 700, fontSize: 16, cursor: "pointer", letterSpacing: "-.01em", boxShadow: phase === "done" ? "none" : "0 4px 20px rgba(49,130,246,.4)", transition: "all .2s" }}>
            {phase === "done" ? "🔄  다시 보기" : "▶  시작하기"}
          </button>
        ) : (
          <p style={{ marginTop: 20, textAlign: "center", color: "rgba(255,255,255,.28)", fontSize: 13, fontWeight: 500, animation: "pulse 1.2s ease-in-out infinite" }}>
            {phase === "mystery" ? "단어를 확인하는 중..." : phase === "revealing" ? "✨ 공개!" : "다이얼이 돌아가는 중..."}
          </p>
        )}
      </div>
      <div style={{ height: 2, background: `linear-gradient(90deg,transparent,rgba(49,130,246,.28),transparent)` }} />
    </div>
  );
}

// ─── TAB: 선택 모드 ───────────────────────────────────────────────────────────
function TabSelection() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [pin, setPin] = useState(""); const [pinErr, setPinErr] = useState("");
  const [word, setWord] = useState(null); const [custom, setCustom] = useState("");
  const [vocab, setVocab] = useState([]); const [revealed, setRevealed] = useState(false);
  const [hint, setHint] = useState(""); const [hintLoading, setHintLoading] = useState(false); const [hintErr, setHintErr] = useState("");

  useEffect(() => {
    setVocab(lsGet("vocab_book") || []);
    const saved = lsGet("current_challenge");
    if (saved) setWord(saved);
  }, []);

  const checkPin = () => {
    if (pin === ADMIN_PIN) { setIsAdmin(true); setShowPin(false); setPinErr(""); setPin(""); }
    else setPinErr("PIN이 틀렸습니다");
  };

  const setChallenge = (w) => { setWord(w); lsSet("current_challenge", w); setRevealed(false); setHint(""); };

  const genHint = async () => {
    if (!word) return;
    setHintLoading(true); setHintErr(""); setHint("");
    try {
      const sys = `영어 단어에 대해 교사가 학생에게 퀴즈를 낼 때 쓸 힌트 3가지를 제공하세요.
단어를 직접 말하지 않고 의미·용법·예시 상황만 알려주는 형태여야 합니다.
마크다운으로 간결하게 한국어로.
## 힌트 3가지
- 힌트1
- 힌트2
- 힌트3
## 교사용 팁`;
      setHint(await callAI(sys, `단어: "${word}"`));
    } catch (e) { setHintErr(e.message); }
    setHintLoading(false);
  };

  // ── ADMIN VIEW
  if (isAdmin) return (
    <div style={{ animation: "fadeUp .3s ease" }}>
      <div style={{ background: `linear-gradient(135deg,${C.night},#1a1040)`, borderRadius: 24, padding: 22, marginBottom: 14, boxShadow: "0 12px 40px rgba(0,0,0,.25)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
          <div style={{ width: 40, height: 40, borderRadius: 14, background: "rgba(49,130,246,.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>⚙️</div>
          <div style={{ flex: 1 }}>
            <p style={{ color: "#fff", fontWeight: 800, fontSize: 16 }}>관리자 모드</p>
            <p style={{ color: "rgba(255,255,255,.38)", fontSize: 12, marginTop: 2 }}>학생에게 보여줄 단어를 선택하세요</p>
          </div>
          <button onClick={() => setIsAdmin(false)} style={{ background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.12)", color: "rgba(255,255,255,.6)", borderRadius: 10, padding: "6px 12px", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 600 }}>로그아웃</button>
        </div>

        <Label style={{ color: "rgba(255,255,255,.4)", marginBottom: 8 }}>직접 입력</Label>
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <Input value={custom} onChange={setCustom} placeholder="영어 단어 또는 표현..."
            onKeyDown={e => e.key === "Enter" && custom.trim() && (setChallenge(custom.trim()), setCustom(""))}
            style={{ background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.14)", color: "#fff", flex: 1 }} />
          <Btn v="primary" onClick={() => { if (custom.trim()) { setChallenge(custom.trim()); setCustom(""); } }} disabled={!custom.trim()} style={{ minWidth: 72 }}>출제</Btn>
        </div>

        {vocab.length > 0 && (
          <>
            <Label style={{ color: "rgba(255,255,255,.4)", marginBottom: 10 }}>단어장에서 선택 ({vocab.length})</Label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, maxHeight: 150, overflowY: "auto" }}>
              {vocab.map(w => (
                <button key={w.id} onClick={() => setChallenge(w.word)} style={{ background: word === w.word ? C.primary : "rgba(255,255,255,.08)", color: "#fff", border: word === w.word ? "none" : "1px solid rgba(255,255,255,.12)", borderRadius: 10, padding: "7px 14px", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 14, transition: "all .15s" }}>
                  {w.word}
                </button>
              ))}
            </div>
          </>
        )}

        {word && (
          <div style={{ marginTop: 18, padding: "12px 16px", background: "rgba(49,130,246,.18)", borderRadius: 14, border: "1px solid rgba(49,130,246,.3)", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ color: "rgba(255,255,255,.55)", fontSize: 13 }}>현재 출제 중</span>
            <span style={{ color: "#fff", fontWeight: 900, fontSize: 20, letterSpacing: "-.02em" }}>{word}</span>
          </div>
        )}
      </div>

      {word && (
        <Card>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: hint || hintLoading ? 14 : 0 }}>
            <p style={{ fontWeight: 700, fontSize: 15, color: C.text }}>💡 교사용 AI 힌트</p>
            <Btn v="secondary" sz="sm" onClick={genHint} disabled={hintLoading}>{hintLoading ? <Spinner sz={13} /> : "힌트 생성"}</Btn>
          </div>
          {hintErr && <ErrBanner msg={hintErr} onClose={() => setHintErr("")} />}
          {hintLoading && <AISpinner />}
          {hint && <RichText text={hint} />}
        </Card>
      )}
    </div>
  );

  // ── STUDENT VIEW
  return (
    <div style={{ animation: "fadeUp .3s ease" }}>
      {word ? (
        <>
          <div style={{ textAlign: "center", marginBottom: 14 }}>
            <Badge color={C.primary}>🎯 오늘의 단어가 준비되었습니다</Badge>
          </div>
          <DialMachine targetWord={word} onReveal={() => setRevealed(true)} />
          {revealed && (
            <Card style={{ animation: "scaleIn .4s ease", borderLeft: `4px solid ${C.primary}` }}>
              <p style={{ fontWeight: 800, fontSize: 18, color: C.text, marginBottom: 6 }}>
                오늘의 단어: <span style={{ color: C.primary }}>{word}</span>
              </p>
              <p style={{ color: C.textSub, fontSize: 14 }}>이 단어로 문장을 만들어 <strong>문장 평가</strong> 탭에서 연습해보세요! ✍️</p>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <div style={{ textAlign: "center", padding: "32px 0", color: C.textSub }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>⏳</div>
            <p style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>단어가 설정되지 않았어요</p>
            <p style={{ fontSize: 14 }}>관리자가 오늘의 단어를 설정하면 여기서 확인할 수 있어요</p>
          </div>
        </Card>
      )}

      <div style={{ textAlign: "center", marginTop: 12 }}>
        {!showPin ? (
          <button onClick={() => setShowPin(true)} style={{ background: "none", border: "none", color: C.textHint, fontSize: 12, cursor: "pointer", padding: "8px 16px", fontFamily: "inherit", letterSpacing: ".02em" }}>관리자</button>
        ) : (
          <Card style={{ animation: "slideUp .3s ease", textAlign: "left" }}>
            <Label>관리자 PIN</Label>
            <div style={{ display: "flex", gap: 8, marginBottom: pinErr ? 8 : 0 }}>
              <Input value={pin} onChange={setPin} type="password" placeholder="PIN 4자리" onKeyDown={e => e.key === "Enter" && checkPin()} />
              <Btn v="primary" onClick={checkPin}>확인</Btn>
            </div>
            {pinErr && <p style={{ color: C.danger, fontSize: 13, marginTop: 6, fontWeight: 500 }}>{pinErr}</p>}
            <button onClick={() => { setShowPin(false); setPinErr(""); setPin(""); }} style={{ marginTop: 10, background: "none", border: "none", color: C.textSub, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>취소</button>
          </Card>
        )}
      </div>
    </div>
  );
}

// ─── TAB: 오늘 정리 ───────────────────────────────────────────────────────────
function TabOrganize({ addToHistory }) {
  const [raw, setRaw] = useState(""); const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false); const [saved, setSaved] = useState(false); const [error, setError] = useState("");

  const analyze = async () => {
    if (!raw.trim()) return;
    setLoading(true); setResult(null); setSaved(false); setError("");
    try {
      const sys = `당신은 영어 학습 코치입니다. 구글독스 메모를 분석하여 한국어로 정리합니다.

# 📚 오늘의 학습 정리
## 단어 & 표현
(**단어** - 뜻, 품사, 사용 상황, 예문)
## 구동사 & 연어
## 라이팅 분석
(형용사·부사 포인트 포함)
## 리스닝 포인트
## 💡 오늘의 핵심 표현 TOP 3
## 더 나은 표현 제안`;
      setResult(await callAI(sys, `오늘 구글독스 내용:\n\n${raw}`));
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const saveEntry = () => {
    const entry = { date: new Date().toLocaleDateString("ko-KR"), raw, result, id: Date.now() };
    const hist = lsGet("study_history") || [];
    hist.unshift(entry); lsSet("study_history", hist.slice(0, 30));
    addToHistory(entry); setSaved(true);
  };

  return (
    <div>
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: C.primaryLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📋</div>
          <div><p style={{ fontWeight: 700, fontSize: 16, color: C.text }}>오늘의 메모 분석</p><p style={{ fontSize: 13, color: C.textSub }}>구글독스 내용을 그대로 붙여넣으세요</p></div>
        </div>
        <Textarea value={raw} onChange={setRaw} placeholder={"예시:\nbelieve in - 믿다\nI believe in what they study...\nListening: The company has been around for 20 years\nPhrasal: give up, put off..."} rows={8} />
        <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <Btn onClick={analyze} disabled={loading || !raw.trim()}>🔍 AI로 정리</Btn>
          {result && !saved && <Btn v="success" onClick={saveEntry}>💾 복습 저장</Btn>}
          {saved && <Badge color={C.success}>✅ 저장 완료</Badge>}
          {raw && <Btn v="ghost" sz="sm" onClick={() => { setRaw(""); setResult(null); setSaved(false); }}>초기화</Btn>}
        </div>
      </Card>
      {error && <ErrBanner msg={error} onClose={() => setError("")} />}
      {loading && <Card><AISpinner /></Card>}
      {result && <Card style={{ animation: "fadeUp .3s ease" }}><RichText text={result} /></Card>}
    </div>
  );
}

// ─── TAB: 문장 평가 ───────────────────────────────────────────────────────────
function TabEvaluate() {
  const [mode, setMode] = useState("sentence");
  const [keyword, setKeyword] = useState(""); const [sentence, setSentence] = useState(""); const [context, setContext] = useState("");
  const [result, setResult] = useState(null); const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  const reset = () => { setResult(null); setSentence(""); setKeyword(""); setContext(""); setError(""); };

  const evaluate = async () => {
    if (!sentence.trim()) return;
    setLoading(true); setResult(null); setError("");
    try {
      const sys = `친절하고 꼼꼼한 영어 교사입니다.
## ⭐ 점수: X / 10
## ✅ 잘한 점
## 🔧 개선할 점
## 💫 수정된 문장
**원문:** / **수정:** / **이유:**
## 🚀 더 세련된 표현 (2~3가지)
## 📖 핵심 문법/어휘 포인트`;
      setResult(await callAI(sys, `${keyword ? `키워드:"${keyword}"\n` : ""}${context ? `상황:${context}\n` : ""}내 문장:${sentence}`));
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const lookup = async () => {
    if (!keyword.trim()) return;
    setLoading(true); setResult(null); setError("");
    try {
      const sys = `영어 어휘 전문가입니다.
# 📖 단어/표현
## 기본 의미
## 사용 상황
## 예문 5가지 (한국어 번역 포함)
## 구동사 & 파생어
## 헷갈리기 쉬운 단어
## 🎯 외우는 팁`;
      setResult(await callAI(sys, `"${keyword.trim()}" 상세 설명`));
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 14, background: C.card, borderRadius: 14, padding: 5, boxShadow: "0 1px 8px rgba(0,0,0,.06)" }}>
        {[["sentence", "✍️ 문장 평가"], ["vocab", "🔍 단어 검색"]].map(([k, lbl]) => (
          <button key={k} onClick={() => { setMode(k); reset(); }} style={{ flex: 1, padding: "10px", border: "none", borderRadius: 10, fontFamily: "inherit", fontWeight: 700, fontSize: 14, cursor: "pointer", transition: "all .18s", background: mode === k ? C.primary : "transparent", color: mode === k ? "#fff" : C.textSub, boxShadow: mode === k ? "0 2px 8px rgba(49,130,246,.3)" : "none" }}>{lbl}</button>
        ))}
      </div>

      {mode === "sentence" && (
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: C.primaryLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>✍️</div>
            <p style={{ fontWeight: 700, fontSize: 16, color: C.text }}>내 문장 평가받기</p>
          </div>
          <Label>키워드 (선택)</Label>
          <div style={{ marginBottom: 12 }}><Input value={keyword} onChange={setKeyword} placeholder="예: believe in, give up..." /></div>
          <Label>상황/주제 (선택)</Label>
          <div style={{ marginBottom: 12 }}><Input value={context} onChange={setContext} placeholder="예: 자기소개, 비즈니스..." /></div>
          <Label>내가 만든 문장 *</Label>
          <div style={{ marginBottom: 14 }}><Textarea value={sentence} onChange={setSentence} placeholder="예: I believe in what they study will lead a large amount of benefit" rows={3} /></div>
          <Btn onClick={evaluate} disabled={loading || !sentence.trim()}>🎯 평가하기</Btn>
        </Card>
      )}

      {mode === "vocab" && (
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🔍</div>
            <p style={{ fontWeight: 700, fontSize: 16, color: C.text }}>단어 깊게 파보기</p>
          </div>
          <div style={{ marginBottom: 14 }}><Input value={keyword} onChange={setKeyword} placeholder="예: give up, perseverance, look forward to..." /></div>
          <Btn onClick={lookup} disabled={loading || !keyword.trim()}>🔎 상세 분석</Btn>
        </Card>
      )}

      {error && <ErrBanner msg={error} onClose={() => setError("")} />}
      {loading && <Card><AISpinner /></Card>}
      {result && <Card style={{ animation: "fadeUp .3s ease" }}><RichText text={result} /><div style={{ marginTop: 14 }}><Btn v="ghost" sz="sm" onClick={reset}>🔄 새로 입력</Btn></div></Card>}
    </div>
  );
}

// ─── TAB: 단어장 ──────────────────────────────────────────────────────────────
function TabVocabBook() {
  const [words, setWords] = useState([]);
  const [w, setW] = useState(""); const [m, setM] = useState(""); const [ex, setEx] = useState("");
  const [loading, setLoading] = useState(false); const [tips, setTips] = useState({});
  const [editId, setEditId] = useState(null); const [search, setSearch] = useState("");
  const [tipsFor, setTipsFor] = useState(null); const [error, setError] = useState("");

  useEffect(() => { const d = lsGet("vocab_book"); if (d) setWords(d); }, []);
  const persist = (list) => { setWords(list); lsSet("vocab_book", list); };

  const add = () => {
    if (!w.trim()) return;
    const entry = { id: editId || Date.now(), word: w.trim(), meaning: m.trim(), example: ex.trim(), added: new Date().toLocaleDateString("ko-KR") };
    persist(editId ? words.map(x => x.id === editId ? entry : x) : [entry, ...words]);
    setW(""); setM(""); setEx(""); setEditId(null);
  };

  const autoFill = async () => {
    if (!w.trim()) return;
    setLoading(true); setError("");
    try {
      const res = await callAI(`영어 단어/표현의 뜻(한국어)과 예문을 JSON으로만. {"meaning":"한국어뜻(품사)","example":"English example sentence"}`, w.trim());
      const j = JSON.parse(res.replace(/```json|```/g, "").trim());
      setM(j.meaning || ""); setEx(j.example || "");
    } catch (e) { setError("자동입력 실패: " + e.message); }
    setLoading(false);
  };

  const getTip = async (x) => {
    setTipsFor(x.id); setError("");
    try {
      const tip = await callAI(`단어에 대한 임팩트 있는 학습 팁을 한국어로 2~3문장. 마크다운 없이 평문.`, `단어:${x.word}\n뜻:${x.meaning}`);
      setTips(p => ({ ...p, [x.id]: tip }));
    } catch (e) { setError(e.message); }
    setTipsFor(null);
  };

  const filtered = words.filter(x => x.word.toLowerCase().includes(search.toLowerCase()) || x.meaning.includes(search));

  return (
    <div>
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "#FFF7ED", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📖</div>
          <p style={{ fontWeight: 700, fontSize: 16, color: C.text }}>{editId ? "단어 수정" : "단어 추가"}</p>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <div style={{ flex: 1 }}><Input value={w} onChange={setW} placeholder="단어 또는 표현 (예: give up)" onKeyDown={e => e.key === "Enter" && !loading && w.trim() && autoFill()} /></div>
          <Btn v="secondary" onClick={autoFill} disabled={loading || !w.trim()} style={{ minWidth: 72 }}>{loading ? <Spinner sz={13} /> : "✨ 자동"}</Btn>
        </div>
        <div style={{ marginBottom: 10 }}><Input value={m} onChange={setM} placeholder="뜻 (한국어)" /></div>
        <div style={{ marginBottom: 14 }}><Input value={ex} onChange={setEx} placeholder="예문" /></div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn onClick={add} disabled={!w.trim()}>{editId ? "💾 저장" : "➕ 추가"}</Btn>
          {editId && <Btn v="ghost" onClick={() => { setW(""); setM(""); setEx(""); setEditId(null); }}>취소</Btn>}
        </div>
      </Card>
      {error && <ErrBanner msg={error} onClose={() => setError("")} />}
      {words.length > 0 && <div style={{ marginBottom: 12 }}><Input value={search} onChange={setSearch} placeholder="🔍 단어 검색..." /></div>}
      <p style={{ fontSize: 13, color: C.textSub, fontWeight: 600, marginBottom: 10 }}>총 {words.length}개{search && ` · 검색 ${filtered.length}개`}</p>

      {filtered.map(x => (
        <Card key={x.id} style={{ padding: "14px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                <span style={{ fontWeight: 800, fontSize: 18, color: C.text, letterSpacing: "-.02em" }}>{x.word}</span>
                <Badge color={C.textSub}>{x.added}</Badge>
              </div>
              {x.meaning && <p style={{ fontSize: 14, color: C.text, marginBottom: 4 }}><span style={{ color: C.primary }}>●</span> {x.meaning}</p>}
              {x.example && <p style={{ fontSize: 13, color: C.textSub, fontStyle: "italic" }}>"{x.example}"</p>}
              {tips[x.id] && <div style={{ marginTop: 10, padding: "10px 14px", background: C.primaryLight, borderRadius: 10, fontSize: 13, color: C.text, borderLeft: `3px solid ${C.primary}` }}>💡 {tips[x.id]}</div>}
              {tipsFor === x.id && <div style={{ fontSize: 12, color: C.textSub, marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}><Spinner sz={12} /> 분석 중...</div>}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5, flexShrink: 0 }}>
              <Btn v="ghost" sz="sm" onClick={() => { setW(x.word); setM(x.meaning); setEx(x.example); setEditId(x.id); }} style={{ padding: "6px 10px" }}>✏️</Btn>
              <Btn v="secondary" sz="sm" onClick={() => getTip(x)} disabled={tipsFor === x.id} style={{ padding: "6px 10px" }}>💡</Btn>
              <Btn v="danger" sz="sm" onClick={() => persist(words.filter(y => y.id !== x.id))} style={{ padding: "6px 10px" }}>🗑</Btn>
            </div>
          </div>
        </Card>
      ))}
      {words.length === 0 && <div style={{ textAlign: "center", padding: "44px 20px", color: C.textSub }}><div style={{ fontSize: 44, marginBottom: 12 }}>📚</div><p style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>단어장이 비어있어요</p><p style={{ fontSize: 13 }}>위에서 단어를 추가해보세요!</p></div>}
    </div>
  );
}

// ─── TAB: 복습 ────────────────────────────────────────────────────────────────
function TabReview() {
  const [history, setHistory] = useState([]);
  const [sel, setSel] = useState(null);
  const [quizMode, setQuizMode] = useState(false);
  const [qQ, setQQ] = useState(""); const [qA, setQA] = useState(""); const [qRes, setQRes] = useState(null);
  const [loading, setLoading] = useState(false); const [error, setError] = useState("");

  useEffect(() => { const d = lsGet("study_history"); if (d) setHistory(d); }, []);

  const remove = (id) => {
    const u = history.filter(h => h.id !== id);
    setHistory(u); lsSet("study_history", u);
    if (sel?.id === id) setSel(null);
  };

  const startQuiz = async (entry) => {
    setQuizMode(true); setQQ(""); setQA(""); setQRes(null); setError("");
    setLoading(true);
    try { setQQ(await callAI("학습 내용으로 퀴즈 문제 하나 만들기. 한국어 질문만. 다른 텍스트 없이.", entry.result)); }
    catch (e) { setError(e.message); }
    setLoading(false);
  };

  const checkQuiz = async () => {
    if (!qA.trim() || !sel) return;
    setLoading(true); setError("");
    try { setQRes(await callAI("퀴즈 답변 평가. 짧고 친절하게 한국어로. 마크다운 없이.", `문제:${qQ}\n답:${qA}\n원본:\n${sel.result}`)); }
    catch (e) { setError(e.message); }
    setLoading(false);
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: "#F5F0FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🔁</div>
        <div><p style={{ fontWeight: 700, fontSize: 16, color: C.text }}>학습 기록 복습</p><p style={{ fontSize: 13, color: C.textSub }}>{history.length}개의 기록</p></div>
      </div>

      {history.length === 0 && <div style={{ textAlign: "center", padding: "44px 20px", color: C.textSub }}><div style={{ fontSize: 44, marginBottom: 12 }}>📂</div><p style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>기록이 없어요</p><p style={{ fontSize: 13 }}>오늘 정리 탭에서 저장하면 여기서 복습할 수 있어요</p></div>}

      {history.map(h => (
        <Card key={h.id} onClick={() => { setSel(h); setQuizMode(false); setQQ(""); setQA(""); setQRes(null); }} style={{ padding: "14px 16px", border: sel?.id === h.id ? `2px solid ${C.primary}` : `1px solid ${C.border}`, cursor: "pointer" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ flex: 1 }}><div style={{ marginBottom: 4 }}><Badge color={C.primary}>{h.date}</Badge></div><p style={{ fontSize: 13, color: C.textSub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 220 }}>{h.raw.slice(0, 50)}...</p></div>
            <Btn v="danger" sz="sm" style={{ padding: "6px 10px" }} onClick={e => { e.stopPropagation(); remove(h.id); }}>🗑</Btn>
          </div>
        </Card>
      ))}

      {error && <ErrBanner msg={error} onClose={() => setError("")} />}

      {sel && (
        <Card style={{ animation: "fadeUp .3s ease", marginTop: 4 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
            <Btn v="secondary" sz="sm" onClick={() => startQuiz(sel)} disabled={loading}>🎓 퀴즈 만들기</Btn>
            <Btn v="ghost" sz="sm" onClick={() => setQuizMode(false)}>📖 내용 보기</Btn>
          </div>
          {!quizMode && <RichText text={sel.result} />}
          {quizMode && (
            <div>
              {loading && !qQ && <AISpinner />}
              {qQ && (
                <div>
                  <div style={{ background: "#FFFBEB", border: `1px solid #FDE68A`, borderRadius: 12, padding: 14, marginBottom: 12 }}>
                    <p style={{ fontWeight: 700, color: "#92400E", fontSize: 13, marginBottom: 6 }}>❓ 퀴즈</p>
                    <p style={{ color: C.text, fontSize: 15 }}>{qQ}</p>
                  </div>
                  <Textarea value={qA} onChange={setQA} placeholder="답을 입력해보세요..." rows={3} />
                  <div style={{ marginTop: 10 }}><Btn onClick={checkQuiz} disabled={loading || !qA.trim()}>✅ 정답 확인</Btn></div>
                  {loading && qA && <div style={{ marginTop: 8 }}><AISpinner /></div>}
                  {qRes && <div style={{ marginTop: 12, padding: 14, background: "#EDFDF4", border: `1px solid #A7F3D0`, borderRadius: 12, color: "#065F46", fontSize: 14, fontWeight: 500, animation: "fadeUp .3s ease" }}>{qRes}</div>}
                </div>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

// ─── BOTTOM TAB BAR ───────────────────────────────────────────────────────────
const TABS = [
  { icon: "📋", label: "오늘 정리",  key: "organize"  },
  { icon: "✍️", label: "문장 평가",  key: "evaluate"  },
  { icon: "🎯", label: "선택 모드",  key: "selection" },
  { icon: "📖", label: "단어장",     key: "vocab"     },
  { icon: "🔁", label: "복습",       key: "review"    },
];

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [active, setActive] = useState("organize");

  return (
    <>
      <style>{G}</style>
      <div style={{ minHeight: "100vh", background: C.bg, paddingBottom: 88 }}>

        {/* Sticky header */}
        <div style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(255,255,255,.92)", backdropFilter: "blur(16px)", borderBottom: `1px solid ${C.border}`, boxShadow: "0 2px 12px rgba(0,0,0,.04)" }}>
          <div style={{ maxWidth: 640, margin: "0 auto", padding: "13px 20px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: `linear-gradient(135deg,${C.primary},${C.primaryDark})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, boxShadow: "0 4px 12px rgba(49,130,246,.3)", flexShrink: 0 }}>🦉</div>
            <div>
              <h1 style={{ fontSize: 17, fontWeight: 800, color: C.text, letterSpacing: "-.03em" }}>English Study Hub</h1>
              <p style={{ fontSize: 11, color: C.textSub, marginTop: 1 }}>Duolingo 학습 · GPT-4o</p>
            </div>
            <div style={{ marginLeft: "auto" }}><Badge color={C.primary}>Beta</Badge></div>
          </div>
        </div>

        {/* Content */}
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "16px 16px 24px" }}>
          <div key={active} style={{ animation: "fadeUp .3s ease" }}>
            {active === "organize"  && <TabOrganize addToHistory={() => {}} />}
            {active === "evaluate"  && <TabEvaluate />}
            {active === "selection" && <TabSelection />}
            {active === "vocab"     && <TabVocabBook />}
            {active === "review"    && <TabReview />}
          </div>
        </div>
      </div>

      {/* Bottom tab bar */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(255,255,255,.95)", backdropFilter: "blur(18px)", borderTop: `1px solid ${C.border}`, display: "flex", zIndex: 100, paddingBottom: "env(safe-area-inset-bottom,0px)", boxShadow: "0 -4px 20px rgba(0,0,0,.06)" }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActive(t.key)} style={{ flex: 1, padding: "10px 4px 8px", border: "none", background: "transparent", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer", borderRadius: 0, transition: "background .15s" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(49,130,246,.05)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <span style={{ fontSize: 22, lineHeight: 1, filter: active === t.key ? "none" : "grayscale(1) opacity(.45)", transition: "filter .2s" }}>{t.icon}</span>
            <span style={{ fontSize: 10, fontFamily: "inherit", fontWeight: active === t.key ? 700 : 500, color: active === t.key ? C.primary : C.textSub, letterSpacing: "-.01em", transition: "color .2s" }}>{t.label}</span>
            {active === t.key && <div style={{ width: 18, height: 3, background: C.primary, borderRadius: 2 }} />}
          </button>
        ))}
      </div>
    </>
  );
}
