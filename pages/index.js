// pages/index.js — English Study Hub v4.0
// 새 기능: 내 메모 스타일 + 선생님 설명 + 듀오링고 팁 + 오늘 요약 카드
import { useState, useEffect, useRef, useCallback } from "react";

// ─── API ─────────────────────────────────────────────────────────────────────
async function callAI(system, message) {
  const res = await fetch("/api/chat", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system, message }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "서버 오류");
  return data.result || "";
}
async function verifyPin(pin) {
  const res = await fetch("/api/pin", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pin }),
  });
  return (await res.json()).ok === true;
}

// ─── STORAGE ─────────────────────────────────────────────────────────────────
const ls = {
  get: (k) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del: (k) => { try { localStorage.removeItem(k); } catch {} },
};

// ─── CATEGORIES ──────────────────────────────────────────────────────────────
const CATS = [
  { key: "vocab",    label: "단어 & 표현",     icon: "📝", color: "#3182F6" },
  { key: "phrasal",  label: "구동사 & 연어",    icon: "🔗", color: "#7B3FE4" },
  { key: "template", label: "템플릿 & 구조",    icon: "📐", color: "#F04438" },
  { key: "photo",    label: "사진 설명 기법",   icon: "🖼️", color: "#FF6B35" },
  { key: "writing",  label: "라이팅 분석",      icon: "✏️", color: "#0AC45D" },
  { key: "grammar",  label: "Grammar Focus",   icon: "🔬", color: "#1ABCFE" },
  { key: "duolingo", label: "듀오링고 팁",      icon: "🟢", color: "#58CC02" },
  { key: "listen",   label: "리스닝 포인트",    icon: "🎧", color: "#F7B731" },
];

const HEADER_MAP = [
  { rx: /단어|표현|어휘|vocab/i,           key: "vocab"    },
  { rx: /구동사|연어|phrasal/i,             key: "phrasal"  },
  { rx: /템플릿|template|구조|structure/i, key: "template" },
  { rx: /사진|photo|이미지|image/i,        key: "photo"    },
  { rx: /라이팅|writing|문장 분석/i,       key: "writing"  },
  { rx: /grammar|문법|focus/i,             key: "grammar"  },
  { rx: /듀오링고|duolingo|시험 팁|tip/i,  key: "duolingo" },
  { rx: /리스닝|listening/i,               key: "listen"   },
];

function parseAndStore(text, date, srcId) {
  const lines = text.split("\n");
  const sections = {};
  let cur = null;
  for (const line of lines) {
    const t = line.trim();
    if (t.startsWith("##") || t.startsWith("# ")) {
      const h = t.replace(/^#+\s*/, "");
      const m = HEADER_MAP.find((x) => x.rx.test(h));
      cur = m ? m.key : null;
      if (cur && !sections[cur]) sections[cur] = [];
    } else if (cur && t && t !== "없음") {
      sections[cur].push(line);
    }
  }
  for (const [key, lns] of Object.entries(sections)) {
    if (!lns.length) continue;
    const existing = ls.get(`cat_${key}`) || [];
    existing.unshift({ id: Date.now() + Math.random(), date, srcId, text: lns.join("\n") });
    ls.set(`cat_${key}`, existing.slice(0, 200));
  }
}

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
const C = {
  bg: "#F2F4F6", card: "#FFFFFF",
  p: "#3182F6", pd: "#1B64DA", pl: "#EBF3FE",
  tx: "#191F28", sub: "#8B95A1", hint: "#C5CDD6", border: "#E5E8EB",
  ok: "#0AC45D", warn: "#F7B731", err: "#F04438",
  duo: "#58CC02", duoD: "#46A302", duoL: "#EDFFD4",
  night: "#0D1117", nightM: "#161B22", nightS: "#21262D",
};

const GCSS = `
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  html,body{background:${C.bg};font-family:'Pretendard',-apple-system,sans-serif;-webkit-font-smoothing:antialiased}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
  @keyframes scaleIn{from{opacity:0;transform:scale(.85)}to{opacity:1;transform:scale(1)}}
  @keyframes pulse{0%,100%{opacity:.9}50%{opacity:.25}}
  @keyframes wGlow{0%,100%{text-shadow:0 0 20px rgba(100,180,255,.8),0 0 40px rgba(49,130,246,.4)}50%{text-shadow:0 0 40px rgba(130,210,255,1),0 0 80px rgba(49,130,246,.7)}}
  @keyframes qPulse{0%,100%{color:#F7B731;opacity:1}50%{color:#FFD700;opacity:.45}}
  @keyframes revPop{0%{transform:scale(.45);opacity:0}65%{transform:scale(1.09)}100%{transform:scale(1);opacity:1}}
  @keyframes reel{0%{transform:translateY(0)}100%{transform:translateY(-50%)}}
  @keyframes slRight{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}}
  @keyframes duoJump{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
  ::-webkit-scrollbar{width:4px;height:4px}
  ::-webkit-scrollbar-thumb{background:${C.border};border-radius:2px}
  ::-webkit-scrollbar-track{background:transparent}
  input,textarea,button{font-family:inherit}
`;

// ─── PRIMITIVES ───────────────────────────────────────────────────────────────
const Spin = ({ sz = 18 }) => (
  <div style={{ width: sz, height: sz, border: `2px solid ${C.border}`, borderTop: `2px solid ${C.p}`, borderRadius: "50%", animation: "spin .7s linear infinite", display: "inline-block", flexShrink: 0 }} />
);
const AILoad = ({ msg = "GPT-4o 분석 중..." }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 0", color: C.sub }}>
    <Spin /><span style={{ fontSize: 14, fontWeight: 500 }}>{msg}</span>
  </div>
);
const Card = ({ children, style, onClick }) => (
  <div onClick={onClick} style={{ background: C.card, borderRadius: 20, boxShadow: "0 1px 8px rgba(0,0,0,.06),0 4px 20px rgba(0,0,0,.04)", padding: "18px 20px", marginBottom: 12, cursor: onClick ? "pointer" : "default", ...style }}>
    {children}
  </div>
);
const Btn = ({ children, onClick, v = "p", disabled, full, sz = "md", style }) => {
  const V = {
    p:   { background: disabled ? C.border : `linear-gradient(135deg,${C.p},${C.pd})`, color: disabled ? C.sub : "#fff", border: "none", boxShadow: disabled ? "none" : "0 3px 12px rgba(49,130,246,.35)" },
    s:   { background: C.pl, color: C.p, border: "none" },
    g:   { background: "transparent", color: C.sub, border: `1.5px solid ${C.border}` },
    d:   { background: "#FEF2F2", color: C.err, border: "none" },
    ok:  { background: "#EDFDF4", color: C.ok, border: "none" },
    duo: { background: `linear-gradient(135deg,${C.duo},${C.duoD})`, color: "#fff", border: "none", boxShadow: "0 3px 12px rgba(88,204,2,.35)" },
    ns:  { background: C.nightS, color: "rgba(255,255,255,.75)", border: "1px solid rgba(255,255,255,.12)" },
  };
  const P = sz === "sm" ? "7px 12px" : sz === "lg" ? "16px 28px" : "12px 20px";
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ ...V[v], padding: P, borderRadius: sz === "sm" ? 10 : 14, fontWeight: 700, fontSize: sz === "sm" ? 13 : 15, cursor: disabled ? "not-allowed" : "pointer", width: full ? "100%" : "auto", transition: "all .15s", opacity: disabled ? .6 : 1, outline: "none", letterSpacing: "-.01em", ...style }}>
      {children}
    </button>
  );
};
const Inp = ({ value, onChange, placeholder, type = "text", style, onKeyDown, autoFocus }) => (
  <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} type={type} onKeyDown={onKeyDown} autoFocus={autoFocus}
    style={{ width: "100%", padding: "13px 16px", border: `1.5px solid ${C.border}`, borderRadius: 12, fontSize: 15, color: C.tx, background: "#F8FAFC", outline: "none", transition: "border-color .2s,box-shadow .2s", ...style }}
    onFocus={e => { e.target.style.borderColor = C.p; e.target.style.boxShadow = "0 0 0 3px rgba(49,130,246,.12)"; }}
    onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = "none"; }}
  />
);
const TA = ({ value, onChange, placeholder, rows = 5 }) => (
  <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
    style={{ width: "100%", padding: "13px 16px", border: `1.5px solid ${C.border}`, borderRadius: 12, fontSize: 14, color: C.tx, background: "#F8FAFC", outline: "none", resize: "vertical", lineHeight: 1.75, transition: "border-color .2s,box-shadow .2s" }}
    onFocus={e => { e.target.style.borderColor = C.p; e.target.style.boxShadow = "0 0 0 3px rgba(49,130,246,.12)"; }}
    onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = "none"; }}
  />
);
const Lbl = ({ children, style }) => <p style={{ fontSize: 12, fontWeight: 700, color: C.sub, marginBottom: 8, letterSpacing: ".04em", textTransform: "uppercase", ...style }}>{children}</p>;
const Badge = ({ children, color = C.p }) => (
  <span style={{ background: `${color}18`, color, fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 20, whiteSpace: "nowrap" }}>{children}</span>
);
const ErrBox = ({ msg, onClose }) => (
  <div style={{ background: "#FFF0F0", border: `1px solid #FECACA`, borderRadius: 12, padding: "12px 16px", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center", color: C.err, fontSize: 14, fontWeight: 500, animation: "fadeUp .3s ease" }}>
    <span>⚠️ {msg}</span>
    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.err, fontSize: 20, lineHeight: 1, padding: "0 4px" }}>×</button>
  </div>
);

// ─── RICH TEXT ────────────────────────────────────────────────────────────────
function il(text) {
  return String(text).split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g).map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) return <strong key={i} style={{ color: C.tx }}>{p.slice(2, -2)}</strong>;
    if (p.startsWith("*") && p.endsWith("*"))   return <em key={i} style={{ color: C.sub }}>{p.slice(1, -1)}</em>;
    if (p.startsWith("`") && p.endsWith("`"))   return <code key={i} style={{ background: C.pl, color: C.p, padding: "1px 6px", borderRadius: 5, fontFamily: "monospace", fontSize: 13 }}>{p.slice(1, -1)}</code>;
    return p;
  });
}
function RT({ text }) {
  if (!text) return null;
  return (
    <div style={{ lineHeight: 1.85, fontSize: 14.5, color: C.tx }}>
      {String(text).split("\n").map((line, i) => {
        const t = line.trim();
        if (!t) return <div key={i} style={{ height: 6 }} />;
        if (t.startsWith("## ")) return <p key={i} style={{ fontWeight: 700, fontSize: 15, color: C.tx, margin: "14px 0 6px", borderLeft: `3px solid ${C.p}`, paddingLeft: 10 }}>{il(t.slice(3))}</p>;
        if (t.startsWith("# "))  return <p key={i} style={{ fontWeight: 800, fontSize: 17, color: C.tx, margin: "18px 0 8px" }}>{il(t.slice(2))}</p>;
        if (t.startsWith("- ") || t.startsWith("• ")) return <div key={i} style={{ display: "flex", gap: 8, margin: "4px 0", paddingLeft: 4 }}><span style={{ color: C.p, minWidth: 12, marginTop: 3 }}>•</span><span>{il(t.slice(2))}</span></div>;
        const nm = t.match(/^(\d+)\.\s/);
        if (nm) return <div key={i} style={{ display: "flex", gap: 8, margin: "4px 0", paddingLeft: 4 }}><span style={{ color: C.p, minWidth: 20, fontWeight: 700, fontSize: 13 }}>{nm[1]}.</span><span>{il(t.slice(nm[0].length))}</span></div>;
        return <p key={i} style={{ margin: "3px 0" }}>{il(t)}</p>;
      })}
    </div>
  );
}

// ─── TODAY SUMMARY CARD ───────────────────────────────────────────────────────
// 오늘 요약을 JSON으로 파싱해 예쁜 카드로 렌더링
function SummaryCard({ data }) {
  if (!data) return null;
  return (
    <div style={{ marginBottom: 16, animation: "scaleIn .4s ease" }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg,${C.night},#1a1040)`, borderRadius: "20px 20px 0 0", padding: "18px 20px 14px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(88,204,2,.2)", border: "1px solid rgba(88,204,2,.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, animation: "duoJump 2s ease-in-out infinite" }}>🦉</div>
        <div>
          <p style={{ color: "#fff", fontWeight: 800, fontSize: 16, letterSpacing: "-.02em" }}>오늘의 학습 요약</p>
          <p style={{ color: "rgba(255,255,255,.45)", fontSize: 12, marginTop: 2 }}>{data.date} · {data.totalItems}개 항목</p>
        </div>
        <div style={{ marginLeft: "auto", background: "rgba(88,204,2,.2)", border: "1px solid rgba(88,204,2,.4)", borderRadius: 12, padding: "4px 12px" }}>
          <span style={{ color: C.duo, fontSize: 13, fontWeight: 700 }}>Lv.{data.level || "?"}</span>
        </div>
      </div>

      {/* One-line summary */}
      <div style={{ background: `linear-gradient(135deg,${C.duo}15,${C.duo}08)`, border: `1px solid ${C.duo}30`, borderTop: "none", padding: "14px 20px" }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: C.tx, lineHeight: 1.6 }}>💬 {data.oneLiner}</p>
      </div>

      {/* Stats row */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderTop: "none", padding: "14px 20px", display: "flex", gap: 8, flexWrap: "wrap" }}>
        {[
          { icon: "📝", label: "단어", val: data.vocabCount },
          { icon: "📐", label: "템플릿", val: data.templateCount },
          { icon: "🟢", label: "듀오팁", val: data.duoTipCount },
          { icon: "✏️", label: "문법 포인트", val: data.grammarCount },
        ].map(s => (
          <div key={s.label} style={{ flex: "1 0 auto", minWidth: 70, background: C.bg, borderRadius: 12, padding: "10px 14px", textAlign: "center" }}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.tx }}>{s.val || 0}</div>
            <div style={{ fontSize: 11, color: C.sub, fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Key takeaways */}
      {data.takeaways?.length > 0 && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderTop: "none", padding: "14px 20px" }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: C.sub, letterSpacing: ".04em", textTransform: "uppercase", marginBottom: 10 }}>⭐ 핵심 기억 포인트</p>
          {data.takeaways.map((t, i) => (
            <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, padding: "10px 14px", background: i % 2 === 0 ? C.pl : `${C.duo}10`, borderRadius: 12 }}>
              <span style={{ color: i % 2 === 0 ? C.p : C.duo, fontWeight: 800, fontSize: 14, minWidth: 22 }}>{i + 1}.</span>
              <span style={{ fontSize: 14, color: C.tx, lineHeight: 1.6 }}>{t}</span>
            </div>
          ))}
        </div>
      )}

      {/* Duolingo tip box */}
      {data.duoHighlight && (
        <div style={{ background: `linear-gradient(135deg,${C.duo}12,${C.duo}06)`, border: `1px solid ${C.duo}30`, borderTop: "none", borderRadius: "0 0 20px 20px", padding: "14px 20px" }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: C.duo, letterSpacing: ".04em", textTransform: "uppercase", marginBottom: 8 }}>🟢 듀오링고 시험 BEST TIP</p>
          <p style={{ fontSize: 14, color: C.tx, lineHeight: 1.7 }}>{data.duoHighlight}</p>
        </div>
      )}
    </div>
  );
}

// ─── ANALYZE SYSTEM PROMPT ────────────────────────────────────────────────────
// 이 프롬프트가 핵심: 내 메모 스타일 + 선생님 설명 + 듀오링고 팁 + 요약 모두 추출
const ANALYZE_SYS = `당신은 듀오링고 영어 시험 전문 코치이자 영어 선생님입니다.
학생이 수업 중 손으로 빠르게 적은 메모(한국어+영어 혼합, 줄임말, 화살표, 퍼센트 등 포함)를 분석하여
아래 JSON + 마크다운 혼합 형식으로 정확히 응답하세요.

===응답 형식===

<SUMMARY_JSON>
{
  "date": "오늘 날짜",
  "oneLiner": "오늘 학습을 한 문장으로 요약 (구체적으로)",
  "totalItems": 전체 학습 항목 수(숫자),
  "level": "A2/B1/B2/C1 중 오늘 내용 수준",
  "vocabCount": 단어/표현 수(숫자),
  "templateCount": 템플릿/구조 수(숫자),
  "duoTipCount": 듀오링고 팁 수(숫자),
  "grammarCount": 문법 포인트 수(숫자),
  "takeaways": [
    "핵심 기억 포인트 1 (구체적으로)",
    "핵심 기억 포인트 2",
    "핵심 기억 포인트 3"
  ],
  "duoHighlight": "오늘 내용 중 듀오링고 시험에 가장 도움되는 팁 1가지 (구체적으로)"
}
</SUMMARY_JSON>

그 다음 아래 섹션들을 마크다운으로 작성하세요.
섹션 헤더는 반드시 아래 형식 그대로 사용하세요:

## 📝 단어 & 표현
각 항목:
**[단어/표현]** ([한국어 뜻], [품사])
- 선생님 설명: [수업에서 강조한 내용, 사용 상황, 뉘앙스를 선생님 말투로]
- 듀오링고 활용: [이 단어가 듀오링고 시험에서 어떻게 나오는지, 어떤 유형에서 쓰이는지]
- 예문: [자연스러운 예문 2개]
- 주의: [헷갈리기 쉬운 포인트]

## 🔗 구동사 & 연어
각 항목:
**[구동사/연어]** — [뜻]
- 선생님 설명: ...
- 듀오링고 활용: ...
- 예문: ...

## 📐 템플릿 & 구조
(메모에서 발견된 답변 구조, 문장 틀, 퍼센트 배분 등)
각 항목:
**[템플릿 이름]**
- 구조: [템플릿 구조를 명확하게]
- 선생님 포인트: [왜 이 구조가 효과적인지]
- 실제 예시: [템플릿을 채운 완성 예시]
- 듀오링고 활용: [어느 시험 유형에서 쓰이는지]

## 🖼️ 사진 설명 기법
(사진 묘사, 이미지 설명 관련 내용이 있을 때)
- 공식: [주인공/물체/배경/경험 비율 등 공식]
- 선생님 포인트: [왜 이 순서인지 이유]
- 예시 답변: [사진 설명 완성 예시]
- 듀오링고 팁: [사진 설명 유형 공략법]

## ✏️ 라이팅 분석
(학생이 쓴 문장이나 예시 문장 분석)
- 원문: ...
- 분석: ...
- 개선: ...

## 🔬 Grammar Focus
(메모에서 발견된 문법 포인트)
**[문법 항목]**
- 선생님 설명: ...
- 공식/패턴: ...
- 예문: ...
- 듀오링고 출제 유형: ...

## 🟢 듀오링고 시험 공략 팁
(오늘 내용을 듀오링고 시험 유형별로 연결)
**[시험 유형명]**
- 오늘 배운 내용 연결: ...
- 실전 전략: ...
- 주의사항: ...

## 🎧 리스닝 포인트
(리스닝/스피킹 관련 메모)

없는 섹션은 생략하세요. 모든 분석은 한국어로, 예문은 영어로.
학생 메모의 핵심을 정확히 파악하고, 선생님이 수업에서 강조한 포인트를 살려서 설명하세요.`;

// ─── TAB 1: 오늘 정리 (핵심 탭) ──────────────────────────────────────────────
function TabOrganize() {
  const [raw, setRaw] = useState("");
  const [summaryData, setSummaryData] = useState(null);
  const [fullText, setFullText] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [catCnt, setCatCnt] = useState(0);
  const [error, setError] = useState("");
  const [showFull, setShowFull] = useState(false);

  const analyze = async () => {
    if (!raw.trim()) return;
    setLoading(true); setFullText(null); setSummaryData(null); setSaved(false); setError("");
    try {
      const text = await callAI(ANALYZE_SYS, `학생의 오늘 수업 메모:\n\n${raw}`);

      // JSON 파싱
      const jsonMatch = text.match(/<SUMMARY_JSON>([\s\S]*?)<\/SUMMARY_JSON>/);
      if (jsonMatch) {
        try {
          const json = JSON.parse(jsonMatch[1].trim());
          json.date = new Date().toLocaleDateString("ko-KR");
          setSummaryData(json);
        } catch {}
      }

      // JSON 태그 제거한 나머지가 마크다운
      const mdText = text.replace(/<SUMMARY_JSON>[\s\S]*?<\/SUMMARY_JSON>/g, "").trim();
      setFullText(mdText);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const saveAll = () => {
    if (!fullText) return;
    const date = new Date().toLocaleDateString("ko-KR");
    const srcId = Date.now();
    const hist = ls.get("full_results") || [];
    hist.unshift({ id: srcId, date, raw, result: fullText, summary: summaryData });
    ls.set("full_results", hist.slice(0, 60));
    parseAndStore(fullText, date, srcId);
    const cnt = CATS.filter(c => (ls.get(`cat_${c.key}`) || []).some(it => it.srcId === srcId)).length;
    setCatCnt(cnt); setSaved(true);
  };

  return (
    <div>
      {/* Input card */}
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: C.duoL, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>📒</div>
          <div>
            <p style={{ fontWeight: 700, fontSize: 16, color: C.tx }}>오늘 메모 붙여넣기</p>
            <p style={{ fontSize: 13, color: C.sub }}>내 필기 스타일 그대로 — GPT가 선생님처럼 정리해줘요</p>
          </div>
        </div>

        {/* Example hint */}
        <div style={{ background: C.bg, borderRadius: 12, padding: "10px 14px", marginBottom: 12, fontSize: 12, color: C.sub, lineHeight: 1.7, borderLeft: `3px solid ${C.duo}` }}>
          <span style={{ fontWeight: 700, color: C.duo }}>예시 메모 스타일 ↓</span><br />
          a bump in the road 장애물 / tradition=전통 / prosperity=번성<br />
          사진설명: 주인공 형용사 50% + 배경 30% + 경험 20%<br />
          템플릿: 시작은 "많은 tradition이 있지만..." + when do people participate...
        </div>

        <TA value={raw} onChange={setRaw} placeholder="오늘 수업에서 적은 내용을 그대로 붙여넣으세요.\n줄임말, 화살표, 한영 혼합 다 괜찮아요!" rows={10} />
        <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <Btn v="duo" onClick={analyze} disabled={loading || !raw.trim()}>🟢 AI 분석 시작</Btn>
          {fullText && !saved && <Btn v="ok" onClick={saveAll}>💾 8카테고리 저장</Btn>}
          {saved && <><Badge color={C.ok}>✅ 저장 완료</Badge><span style={{ fontSize: 13, color: C.sub }}>{catCnt}개 분류됨</span></>}
          {raw && <Btn v="g" sz="sm" onClick={() => { setRaw(""); setFullText(null); setSummaryData(null); setSaved(false); }}>초기화</Btn>}
        </div>
      </Card>

      {error && <ErrBox msg={error} onClose={() => setError("")} />}
      {loading && (
        <Card>
          <AILoad msg="내 메모를 분석하는 중... 선생님 설명 + 듀오링고 팁 생성 중" />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
            {["📝 단어 정리", "📐 템플릿 추출", "🟢 듀오링고 팁", "💬 오늘 요약 생성"].map(s => (
              <span key={s} style={{ fontSize: 12, color: C.sub, background: C.bg, padding: "4px 10px", borderRadius: 20, animation: "pulse 1.5s ease-in-out infinite" }}>{s}</span>
            ))}
          </div>
        </Card>
      )}

      {/* Summary card */}
      {summaryData && <SummaryCard data={summaryData} />}

      {/* Full analysis */}
      {fullText && (
        <Card style={{ animation: "fadeUp .3s ease" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <p style={{ fontWeight: 700, fontSize: 15, color: C.tx }}>📖 상세 분석</p>
            <Btn v="g" sz="sm" onClick={() => setShowFull(f => !f)}>{showFull ? "▲ 접기" : "▼ 전체 보기"}</Btn>
          </div>
          {saved && <div style={{ marginBottom: 14, padding: "10px 14px", background: C.duoL, borderRadius: 10, display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 13, color: C.duoD, fontWeight: 600 }}>✅ 보관함에 저장됨! 카테고리별로 확인해보세요.</span></div>}
          {showFull && <RT text={fullText} />}
          {!showFull && (
            <div style={{ color: C.sub, fontSize: 14 }}>
              <RT text={fullText.split("\n").slice(0, 8).join("\n")} />
              <button onClick={() => setShowFull(true)} style={{ marginTop: 10, background: "none", border: "none", color: C.p, fontSize: 13, fontWeight: 700, cursor: "pointer", padding: "4px 0" }}>더 보기 →</button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

// ─── TAB 2: 문장 평가 + 단어 검색 ────────────────────────────────────────────
function TabEvaluate() {
  const [mode, setMode] = useState("sentence");
  const [kw, setKw] = useState(""); const [sent, setSent] = useState(""); const [ctx, setCtx] = useState("");
  const [result, setResult] = useState(null); const [loading, setLoading] = useState(false);
  const [error, setError] = useState(""); const [saved, setSaved] = useState(false);
  const reset = () => { setResult(null); setSent(""); setKw(""); setCtx(""); setError(""); setSaved(false); };

  const evaluate = async () => {
    if (!sent.trim()) return;
    setLoading(true); setResult(null); setError(""); setSaved(false);
    try {
      const sys = `당신은 꼼꼼하고 친절한 영어 교사이자 듀오링고 시험 코치입니다.

## ⭐ 점수: X / 10

## ✅ 잘한 점 (구체적으로 2~3가지)

## 🔧 개선할 점
(각 항목: 어떤 부분 → 왜 어색한지 → 어떻게 고치면 좋은지)

## 💫 수정된 문장
**원문:** (원래 문장)
**수정:** (자연스러운 버전)
**핵심 이유:** (가장 중요한 수정 포인트)

## 🚀 더 세련된 버전 (2~3가지, 스타일 차이 설명)

## 📖 이 문장에서 배울 문법 포인트

## 🟢 듀오링고 시험 관련 팁
(이 문장 구조/표현이 듀오링고 어느 유형에서 나오는지, 시험 전략)

## 💡 같은 의미의 다른 구조 2가지`;
      setResult(await callAI(sys, `${kw ? `키워드:"${kw}"\n` : ""}${ctx ? `상황:${ctx}\n` : ""}내가 만든 문장:${sent}`));
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const lookup = async () => {
    if (!kw.trim()) return;
    setLoading(true); setResult(null); setError(""); setSaved(false);
    try {
      const sys = `당신은 영어 어휘 전문가이자 듀오링고 시험 코치입니다.

# 📖 "${kw}"

## 기본 의미 (품사 포함)

## 선생님 설명 스타일
(수업에서 선생님이 설명해주듯 자연스럽고 기억에 남는 설명)

## 사용 상황 (격식/비격식, 말하기/글쓰기)

## 예문 6가지 (각각 한국어 번역 + 한 줄 포인트)

## 구동사 & 파생어 & 자주 쓰이는 콜로케이션

## 헷갈리기 쉬운 단어와 차이점

## 🟢 듀오링고 시험 활용
(이 단어가 어느 유형에서 나오는지, 어떻게 출제되는지, 함정 포인트)

## 🎯 기억법 & 어원`;
      setResult(await callAI(sys, `"${kw.trim()}" 완전 분석`));
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const saveResult = () => {
    if (!result) return;
    const key = mode === "sentence" ? "saved_evals" : "saved_lookups";
    const ex = ls.get(key) || [];
    ex.unshift({ id: Date.now(), date: new Date().toLocaleDateString("ko-KR"), mode, kw, sent, ctx, result });
    ls.set(key, ex.slice(0, 100)); setSaved(true);
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 14, background: C.card, borderRadius: 14, padding: 5, boxShadow: "0 1px 8px rgba(0,0,0,.06)" }}>
        {[["sentence", "✍️ 문장 평가"], ["vocab", "🔍 단어 검색"]].map(([k, lbl]) => (
          <button key={k} onClick={() => { setMode(k); reset(); }} style={{ flex: 1, padding: 10, border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer", transition: "all .18s", background: mode === k ? C.p : "transparent", color: mode === k ? "#fff" : C.sub, boxShadow: mode === k ? "0 2px 8px rgba(49,130,246,.3)" : "none" }}>{lbl}</button>
        ))}
      </div>
      {mode === "sentence" && (
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: C.pl, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>✍️</div>
            <div><p style={{ fontWeight: 700, fontSize: 16, color: C.tx }}>내 문장 평가받기</p><p style={{ fontSize: 13, color: C.sub }}>10점 채점 + 수정 + 듀오링고 팁</p></div>
          </div>
          <Lbl>사용하려는 키워드 (선택)</Lbl>
          <div style={{ marginBottom: 12 }}><Inp value={kw} onChange={setKw} placeholder="예: believe in, give up, prosperity..." /></div>
          <Lbl>상황 / 주제 (선택)</Lbl>
          <div style={{ marginBottom: 12 }}><Inp value={ctx} onChange={setCtx} placeholder="예: 전통 설명, 사진 묘사, 자기소개..." /></div>
          <Lbl>내가 만든 문장 *</Lbl>
          <div style={{ marginBottom: 14 }}><TA value={sent} onChange={setSent} placeholder="예: I believe in what they study will lead a large amount of benefit" rows={3} /></div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Btn onClick={evaluate} disabled={loading || !sent.trim()}>🎯 평가하기</Btn>
            {result && !saved && <Btn v="ok" sz="sm" onClick={saveResult}>💾 저장</Btn>}
            {saved && <Badge color={C.ok}>✅ 저장됨</Badge>}
          </div>
        </Card>
      )}
      {mode === "vocab" && (
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: C.duoL, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🔍</div>
            <div><p style={{ fontWeight: 700, fontSize: 16, color: C.tx }}>단어 깊게 파보기</p><p style={{ fontSize: 13, color: C.sub }}>선생님 설명 + 듀오링고 출제 패턴까지</p></div>
          </div>
          <div style={{ marginBottom: 14 }}><Inp value={kw} onChange={setKw} placeholder="예: prosperity, tradition, a bump in the road..." onKeyDown={e => e.key === "Enter" && lookup()} /></div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Btn onClick={lookup} disabled={loading || !kw.trim()}>🔎 완전 분석</Btn>
            {result && !saved && <Btn v="ok" sz="sm" onClick={saveResult}>💾 저장</Btn>}
            {saved && <Badge color={C.ok}>✅ 저장됨</Badge>}
          </div>
        </Card>
      )}
      {error && <ErrBox msg={error} onClose={() => setError("")} />}
      {loading && <Card><AILoad /></Card>}
      {result && (
        <Card style={{ animation: "fadeUp .3s ease" }}>
          <RT text={result} />
          <div style={{ marginTop: 14 }}><Btn v="g" sz="sm" onClick={reset}>🔄 새로 입력</Btn></div>
        </Card>
      )}
    </div>
  );
}

// ─── TAB 3: 선택 모드 ─────────────────────────────────────────────────────────
const POOL = ["achieve","believe","create","develop","explore","flourish","generate","illuminate","journey","knowledge","leverage","master","navigate","overcome","persevere","reflect","sustain","transform","validate","wonder","inspire","dedicate","practice","improve","challenge","progress","brilliant","confident","resilient","passionate","discover","innovate","empower","thrive","succeed","connect","motivate","liberate","expand","embrace","courage","wisdom","patience","gratitude","ambition","curiosity","integrity","empathy","purpose","prosperity","tradition","participate","accomplish"];

function Reel({ words, spd, blur, opacity }) {
  const doubled = [...words, ...words];
  return (
    <div style={{ width: 98, height: 220, overflow: "hidden", position: "relative", flexShrink: 0 }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 72, background: `linear-gradient(to bottom,${C.night},transparent)`, zIndex: 3, pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 72, background: `linear-gradient(to top,${C.night},transparent)`, zIndex: 3, pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "50%", left: 5, right: 5, height: 38, marginTop: -19, border: `1px solid rgba(49,130,246,.4)`, borderRadius: 8, zIndex: 2, pointerEvents: "none", boxShadow: "0 0 12px rgba(49,130,246,.2)" }} />
      <div style={{ animation: `reel ${spd}s linear infinite`, filter: `blur(${blur}px)`, opacity, transition: "filter .35s,opacity .35s" }}>
        {doubled.map((w, i) => {
          const mid = i === 3 || i === doubled.length / 2 + 3;
          return <div key={i} style={{ height: 38, display: "flex", alignItems: "center", justifyContent: "center", color: mid ? "#FFF" : "rgba(255,255,255,.2)", fontSize: mid ? 15 : 12, fontWeight: mid ? 800 : 400 }}>{w}</div>;
        })}
      </div>
    </div>
  );
}

function DialMachine({ targetWord, onReveal }) {
  const [phase, setPhase] = useState("idle");
  const [reels, setReels] = useState([POOL.slice(0, 8), POOL.slice(8, 16), POOL.slice(16, 24)]);
  const [spds, setSpds] = useState([0.09, 0.11, 0.10]);
  const [blurs, setBlurs] = useState([0, 0, 0]);
  const [ops, setOps] = useState([1, 1, 1]);
  const [showQ, setShowQ] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const tmrs = useRef([]);
  const clearAll = () => { tmrs.current.forEach(t => { clearTimeout(t); clearInterval(t); }); tmrs.current = []; };
  const af = (fn, ms) => { const t = setTimeout(fn, ms); tmrs.current.push(t); };
  const iv = (fn, ms) => { const t = setInterval(fn, ms); tmrs.current.push(t); return t; };
  useEffect(() => () => clearAll(), []);
  const shuffle = useCallback(() => { setReels([0,8,16].map(() => { const s = Math.floor(Math.random()*(POOL.length-8)); return POOL.slice(s,s+8); })); }, []);
  const start = () => {
    if (!["idle","done"].includes(phase)) return;
    clearAll(); setShowQ(false); setRevealed(false); setBlurs([0,0,0]); setOps([1,1,1]); setSpds([0.09,0.11,0.10]); setPhase("spinning");
    let t1 = iv(shuffle, 120);
    af(() => { clearInterval(t1); setSpds([0.28,0.34,0.24]); setPhase("slowing"); t1 = iv(shuffle, 400); }, 1800);
    af(() => {
      clearInterval(t1); setPhase("blurring"); t1 = iv(shuffle, 700);
      let s=0; const bi=iv(()=>{s++;const b=Math.min(s*1.7,17);const o=Math.max(1-s*0.07,.07);setBlurs([b,b*1.1,b*.9]);setOps([o,o*.9,o*1.05]);if(s>=10)clearInterval(bi);},90);
    }, 2900);
    af(() => { clearInterval(t1); setBlurs([18,18,18]); setOps([.05,.05,.05]); setShowQ(true); setPhase("mystery"); }, 3950);
    af(() => { setShowQ(false); setBlurs([0,0,0]); setOps([1,1,1]); setRevealed(true); setPhase("revealing"); }, 4950);
    af(() => { setPhase("done"); if(onReveal) onReveal(); }, 5950);
  };
  const isRolling = ["spinning","slowing","blurring"].includes(phase);
  const STEPS = ["spinning","slowing","blurring","mystery","revealing","done"];
  return (
    <div style={{ background: `linear-gradient(180deg,${C.night} 0%,${C.nightM} 100%)`, borderRadius: 28, overflow: "hidden", marginBottom: 16, boxShadow: "0 20px 60px rgba(0,0,0,.45),inset 0 1px 0 rgba(255,255,255,.06)" }}>
      <div style={{ height: 2, background: `linear-gradient(90deg,transparent,${C.p},transparent)` }} />
      <div style={{ padding: "24px 20px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <span style={{ color: "rgba(255,255,255,.35)", fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase" }}>Today&apos;s Word</span>
          <div style={{ display: "flex", gap: 5 }}>{STEPS.map((p,i) => <div key={p} style={{ width:6,height:6,borderRadius:3,background:STEPS.indexOf(phase)>=i?C.p:"rgba(255,255,255,.14)",transition:"background .3s" }} />)}</div>
        </div>
        <div style={{ position: "relative", height: 220 }}>
          <div style={{ display:"flex",justifyContent:"center",gap:6,position:"absolute",inset:0,opacity:isRolling?1:0,transition:"opacity .4s",pointerEvents:"none" }}>
            {reels.map((words,i) => <Reel key={i} words={words} spd={spds[i]} blur={blurs[i]} opacity={ops[i]} />)}
          </div>
          {showQ && <div style={{ position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center" }}><span style={{ fontSize:80,fontWeight:900,animation:"qPulse .6s ease-in-out infinite",letterSpacing:"-.04em" }}>???</span></div>}
          {revealed && (
            <div style={{ position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10 }}>
              <div style={{ fontSize:50,fontWeight:900,color:"#FFF",letterSpacing:"-.03em",animation:"revPop .55s cubic-bezier(.34,1.56,.64,1) forwards, wGlow 2.5s ease-in-out .55s infinite" }}>{targetWord}</div>
              <div style={{ height:2,width:50,background:`linear-gradient(90deg,transparent,${C.p},transparent)`,borderRadius:1 }} />
            </div>
          )}
          {phase==="idle" && (
            <div style={{ position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10 }}>
              <div style={{ width:54,height:54,borderRadius:27,background:"rgba(49,130,246,.15)",border:"1px solid rgba(49,130,246,.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26 }}>🎯</div>
              <p style={{ color:"rgba(255,255,255,.35)",fontSize:14,textAlign:"center",fontWeight:500 }}>버튼을 눌러 오늘의 단어를 확인하세요</p>
            </div>
          )}
        </div>
        {["idle","done"].includes(phase) ? (
          <button onClick={start} style={{ marginTop:18,width:"100%",padding:15,background:phase==="done"?C.nightS:`linear-gradient(135deg,${C.p},${C.pd})`,color:"#fff",border:phase==="done"?"1px solid rgba(255,255,255,.1)":"none",borderRadius:14,fontWeight:700,fontSize:16,cursor:"pointer",letterSpacing:"-.01em",boxShadow:phase==="done"?"none":"0 4px 20px rgba(49,130,246,.4)",transition:"all .2s" }}>
            {phase==="done"?"🔄 다시 보기":"▶ 시작하기"}
          </button>
        ) : (
          <p style={{ marginTop:18,textAlign:"center",color:"rgba(255,255,255,.3)",fontSize:13,fontWeight:500,animation:"pulse 1.2s ease-in-out infinite" }}>
            {phase==="mystery"?"단어를 확인하는 중...":phase==="revealing"?"✨ 공개!":"다이얼이 돌아가는 중..."}
          </p>
        )}
      </div>
      <div style={{ height:2,background:`linear-gradient(90deg,transparent,rgba(49,130,246,.28),transparent)` }} />
    </div>
  );
}

function TabSelection() {
  const [isAdmin,setIsAdmin]=useState(false);
  const [showPin,setShowPin]=useState(false);
  const [pin,setPin]=useState("");const [pinErr,setPinErr]=useState("");const [pinLoading,setPinLoading]=useState(false);
  const [word,setWord]=useState(null);const [custom,setCustom]=useState("");
  const [vocab,setVocab]=useState([]);const [revealed,setRevealed]=useState(false);
  const [hint,setHint]=useState("");const [hintLoad,setHintLoad]=useState(false);const [hintErr,setHintErr]=useState("");
  useEffect(()=>{ setVocab(ls.get("vocab_book")||[]); const s=ls.get("current_challenge"); if(s) setWord(s); },[]);
  const checkPin=async()=>{ if(!pin.trim()) return; setPinLoading(true); setPinErr(""); const ok=await verifyPin(pin); if(ok){setIsAdmin(true);setShowPin(false);setPin("");}else setPinErr("PIN이 틀렸습니다"); setPinLoading(false); };
  const setChallenge=(w)=>{ setWord(w); ls.set("current_challenge",w); setRevealed(false); setHint(""); };
  const genHint=async()=>{
    if(!word) return; setHintLoad(true); setHintErr(""); setHint("");
    try{ const sys=`영어 단어에 대한 교사용 힌트 3가지. 단어를 직접 말하지 않고 의미·용법·상황으로만.\n## 💡 힌트 3가지\n- (의미)\n- (상황)\n- (예시, 단어는 ___)\n## 🎯 교사용 질문 예시\n## 🟢 듀오링고 연결 포인트`; setHint(await callAI(sys,`단어:"${word}"`)); }
    catch(e){ setHintErr(e.message); } setHintLoad(false);
  };
  if(isAdmin) return(
    <div style={{animation:"fadeUp .3s ease"}}>
      <div style={{background:`linear-gradient(135deg,${C.night},#1a1040)`,borderRadius:24,padding:22,marginBottom:14,boxShadow:"0 12px 40px rgba(0,0,0,.25)"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
          <div style={{width:42,height:42,borderRadius:14,background:"rgba(49,130,246,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>⚙️</div>
          <div style={{flex:1}}><p style={{color:"#fff",fontWeight:800,fontSize:16}}>관리자 모드</p><p style={{color:"rgba(255,255,255,.4)",fontSize:12}}>학생에게 보여줄 단어를 선택하세요</p></div>
          <button onClick={()=>setIsAdmin(false)} style={{background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.14)",color:"rgba(255,255,255,.6)",borderRadius:10,padding:"6px 12px",cursor:"pointer",fontSize:12,fontWeight:600}}>로그아웃</button>
        </div>
        <Lbl style={{color:"rgba(255,255,255,.4)",marginBottom:8}}>직접 입력</Lbl>
        <div style={{display:"flex",gap:8,marginBottom:20}}>
          <Inp value={custom} onChange={setCustom} placeholder="영어 단어 또는 표현..." onKeyDown={e=>e.key==="Enter"&&custom.trim()&&(setChallenge(custom.trim()),setCustom(""))} style={{background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.14)",color:"#fff",flex:1}}/>
          <Btn v="p" onClick={()=>{if(custom.trim()){setChallenge(custom.trim());setCustom("");}}} disabled={!custom.trim()} style={{minWidth:68}}>출제</Btn>
        </div>
        {vocab.length>0&&(<><Lbl style={{color:"rgba(255,255,255,.4)",marginBottom:10}}>단어장에서 선택 ({vocab.length})</Lbl><div style={{display:"flex",flexWrap:"wrap",gap:7,maxHeight:148,overflowY:"auto"}}>{vocab.map(w=><button key={w.id} onClick={()=>setChallenge(w.word)} style={{background:word===w.word?C.p:"rgba(255,255,255,.08)",color:"#fff",border:word===w.word?"none":"1px solid rgba(255,255,255,.12)",borderRadius:10,padding:"7px 14px",cursor:"pointer",fontWeight:600,fontSize:14,transition:"all .15s"}}>{w.word}</button>)}</div></>)}
        {word&&<div style={{marginTop:18,padding:"12px 16px",background:"rgba(49,130,246,.18)",borderRadius:14,border:"1px solid rgba(49,130,246,.3)",display:"flex",alignItems:"center",gap:10}}><span style={{color:"rgba(255,255,255,.5)",fontSize:13}}>현재 출제 중</span><span style={{color:"#fff",fontWeight:900,fontSize:20}}>{word}</span></div>}
      </div>
      {word&&<Card><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:hint||hintLoad?14:0}}><p style={{fontWeight:700,fontSize:15,color:C.tx}}>💡 교사용 AI 힌트</p><Btn v="s" sz="sm" onClick={genHint} disabled={hintLoad}>{hintLoad?<Spin sz={13}/>:"힌트 생성"}</Btn></div>{hintErr&&<ErrBox msg={hintErr} onClose={()=>setHintErr("")}/>}{hintLoad&&<AILoad/>}{hint&&<RT text={hint}/>}</Card>}
    </div>
  );
  return(
    <div style={{animation:"fadeUp .3s ease"}}>
      {word?(<><div style={{textAlign:"center",marginBottom:14}}><Badge color={C.p}>🎯 오늘의 단어가 준비되었습니다</Badge></div><DialMachine targetWord={word} onReveal={()=>setRevealed(true)}/>{revealed&&<Card style={{animation:"scaleIn .4s ease",borderLeft:`4px solid ${C.p}`}}><p style={{fontWeight:800,fontSize:18,color:C.tx,marginBottom:6}}>오늘의 단어: <span style={{color:C.p}}>{word}</span></p><p style={{color:C.sub,fontSize:14}}>이 단어로 문장을 만들어 <strong>문장 평가</strong> 탭에서 연습해보세요! ✍️</p></Card>}</>):(
        <Card><div style={{textAlign:"center",padding:"32px 0",color:C.sub}}><div style={{fontSize:44,marginBottom:12}}>⏳</div><p style={{fontSize:16,fontWeight:700,marginBottom:6}}>단어가 설정되지 않았어요</p><p style={{fontSize:14}}>관리자가 오늘의 단어를 설정하면 확인할 수 있어요</p></div></Card>
      )}
      <div style={{textAlign:"center",marginTop:12}}>
        {!showPin?(<button onClick={()=>setShowPin(true)} style={{background:"none",border:"none",color:C.hint,fontSize:12,cursor:"pointer",padding:"8px 16px",letterSpacing:".02em"}}>관리자</button>):(
          <Card style={{animation:"fadeUp .3s ease",textAlign:"left"}}><Lbl>관리자 PIN</Lbl><div style={{display:"flex",gap:8}}><Inp value={pin} onChange={setPin} type="password" placeholder="PIN 입력" onKeyDown={e=>e.key==="Enter"&&!pinLoading&&checkPin()} autoFocus/><Btn v="p" onClick={checkPin} disabled={pinLoading}>{pinLoading?<Spin sz={14}/>:"확인"}</Btn></div>{pinErr&&<p style={{color:C.err,fontSize:13,marginTop:8,fontWeight:500}}>{pinErr}</p>}<button onClick={()=>{setShowPin(false);setPinErr("");setPin("");}} style={{marginTop:10,background:"none",border:"none",color:C.sub,fontSize:13,cursor:"pointer"}}>취소</button></Card>
        )}
      </div>
    </div>
  );
}

// ─── TAB 4: 보관함 ────────────────────────────────────────────────────────────
function CatCard({ entry, cat, onDelete }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: C.card, borderRadius: 16, padding: "14px 16px", marginBottom: 10, boxShadow: "0 1px 6px rgba(0,0,0,.05)", borderLeft: `3px solid ${cat.color}`, animation: "slRight .3s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{ flex: 1, cursor: "pointer" }} onClick={() => setOpen(o => !o)}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <Badge color={cat.color}>{entry.date}</Badge>
            <span style={{ fontSize: 12, color: C.sub }}>{open ? "▲ 접기" : "▼ 펼치기"}</span>
          </div>
          {!open && <p style={{ fontSize: 13, color: C.sub, lineHeight: 1.5 }}>{entry.text.slice(0, 90).replace(/\n/g, " ")}{entry.text.length > 90 ? "..." : ""}</p>}
        </div>
        <button onClick={onDelete} style={{ background: "none", border: "none", cursor: "pointer", color: C.hint, fontSize: 18, lineHeight: 1, padding: "0 2px", flexShrink: 0 }}>×</button>
      </div>
      {open && <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}` }}><RT text={entry.text} /></div>}
    </div>
  );
}

function TabStorage() {
  const [activeCat, setActiveCat] = useState("__vocab__");
  const [data, setData] = useState({});
  const [search, setSearch] = useState("");
  const [words, setWords] = useState([]);
  const [wIn, setWIn] = useState(""); const [mIn, setMIn] = useState(""); const [exIn, setExIn] = useState("");
  const [loadAuto, setLoadAuto] = useState(false);
  const [editId, setEditId] = useState(null);
  const [tips, setTips] = useState({}); const [tipsFor, setTipsFor] = useState(null);
  const [vErr, setVErr] = useState("");
  const reload = useCallback(() => { const d={}; CATS.forEach(c=>{d[c.key]=ls.get(`cat_${c.key}`)||[];}); setData(d); setWords(ls.get("vocab_book")||[]); }, []);
  useEffect(() => { reload(); }, [reload]);
  const cur = CATS.find(c => c.key === activeCat);
  const items = (data[activeCat]||[]).filter(it => !search||it.text.toLowerCase().includes(search.toLowerCase()));
  const del = (key,id) => { const u=(data[key]||[]).filter(it=>it.id!==id); ls.set(`cat_${key}`,u); setData(p=>({...p,[key]:u})); };
  const clearCat=(key)=>{ if(!window.confirm(`"${CATS.find(c=>c.key===key)?.label}" 전체를 삭제할까요?`)) return; ls.del(`cat_${key}`); setData(p=>({...p,[key]:[]})); };
  const persistVocab=(list)=>{ setWords(list); ls.set("vocab_book",list); };
  const addWord=()=>{ if(!wIn.trim()) return; const entry={id:editId||Date.now(),word:wIn.trim(),meaning:mIn.trim(),example:exIn.trim(),added:new Date().toLocaleDateString("ko-KR")}; persistVocab(editId?words.map(w=>w.id===editId?entry:w):[entry,...words]); setWIn("");setMIn("");setExIn("");setEditId(null); };
  const autoFill=async()=>{ if(!wIn.trim()) return; setLoadAuto(true); setVErr(""); try{ const res=await callAI(`영어 단어/표현의 뜻(한국어)과 예문을 JSON으로만.\n형식: {"meaning":"한국어 뜻 (품사)","example":"English example sentence"}`,wIn.trim()); const j=JSON.parse(res.replace(/```json|```/g,"").trim()); setMIn(j.meaning||""); setExIn(j.example||""); }catch(e){setVErr("자동입력 실패: "+e.message);} setLoadAuto(false); };
  const getTip=async(w)=>{ setTipsFor(w.id); try{ const tip=await callAI(`단어 학습 팁을 한국어로 2~3문장. 듀오링고 활용 포인트 포함. 마크다운 없이.`,`단어:${w.word}\n뜻:${w.meaning}`); setTips(p=>({...p,[w.id]:tip})); }catch(e){setVErr(e.message);} setTipsFor(null); };
  const filteredVocab=words.filter(w=>!search||w.word.toLowerCase().includes(search.toLowerCase())||w.meaning.includes(search));
  const counts={}; CATS.forEach(c=>{counts[c.key]=(data[c.key]||[]).length;});
  return(
    <div>
      <div style={{display:"flex",gap:7,overflowX:"auto",paddingBottom:4,marginBottom:14,scrollbarWidth:"none"}}>
        <button onClick={()=>{setActiveCat("__vocab__");setSearch("");}} style={{flexShrink:0,display:"flex",alignItems:"center",gap:6,padding:"8px 14px",border:"none",borderRadius:12,fontWeight:700,fontSize:13,cursor:"pointer",transition:"all .18s",background:activeCat==="__vocab__"?C.p:C.card,color:activeCat==="__vocab__"?"#fff":C.sub,boxShadow:"0 1px 6px rgba(0,0,0,.06)"}}>
          📖 단어장 <span style={{background:activeCat==="__vocab__"?"rgba(255,255,255,.25)":C.pl,color:activeCat==="__vocab__"?"#fff":C.p,borderRadius:10,padding:"1px 7px",fontSize:11}}>{words.length}</span>
        </button>
        {CATS.map(c=>(
          <button key={c.key} onClick={()=>{setActiveCat(c.key);setSearch("");}} style={{flexShrink:0,display:"flex",alignItems:"center",gap:6,padding:"8px 14px",border:"none",borderRadius:12,fontWeight:700,fontSize:12,cursor:"pointer",transition:"all .18s",background:activeCat===c.key?c.color:C.card,color:activeCat===c.key?"#fff":C.sub,boxShadow:"0 1px 6px rgba(0,0,0,.06)"}}>
            {c.icon} {c.label.split(" ")[0]} <span style={{background:activeCat===c.key?"rgba(255,255,255,.25)":`${c.color}18`,color:activeCat===c.key?"#fff":c.color,borderRadius:10,padding:"1px 7px",fontSize:11}}>{counts[c.key]}</span>
          </button>
        ))}
      </div>
      <div style={{marginBottom:12}}><Inp value={search} onChange={setSearch} placeholder={activeCat==="__vocab__"?"🔍 단어 검색...":`🔍 ${cur?.label||""} 검색...`}/></div>
      {activeCat==="__vocab__"&&(
        <div>
          <Card>
            <p style={{fontWeight:700,fontSize:15,color:C.tx,marginBottom:14}}>{editId?"✏️ 단어 수정":"➕ 단어 추가"}</p>
            <div style={{display:"flex",gap:8,marginBottom:10}}><div style={{flex:1}}><Inp value={wIn} onChange={setWIn} placeholder="단어 (예: prosperity)" onKeyDown={e=>e.key==="Enter"&&!loadAuto&&wIn.trim()&&autoFill()}/></div><Btn v="s" onClick={autoFill} disabled={loadAuto||!wIn.trim()} style={{minWidth:72}}>{loadAuto?<Spin sz={13}/>:"✨ 자동"}</Btn></div>
            <div style={{marginBottom:10}}><Inp value={mIn} onChange={setMIn} placeholder="뜻 (한국어)"/></div>
            <div style={{marginBottom:14}}><Inp value={exIn} onChange={setExIn} placeholder="예문"/></div>
            {vErr&&<ErrBox msg={vErr} onClose={()=>setVErr("")}/>}
            <div style={{display:"flex",gap:8}}><Btn onClick={addWord} disabled={!wIn.trim()}>{editId?"💾 저장":"➕ 추가"}</Btn>{editId&&<Btn v="g" onClick={()=>{setWIn("");setMIn("");setExIn("");setEditId(null);}}>취소</Btn>}</div>
          </Card>
          <p style={{fontSize:13,color:C.sub,fontWeight:600,marginBottom:10}}>총 {words.length}개{search&&` · 검색 ${filteredVocab.length}개`}</p>
          {filteredVocab.map(w=>(
            <div key={w.id} style={{background:C.card,borderRadius:16,padding:"14px 16px",marginBottom:10,boxShadow:"0 1px 6px rgba(0,0,0,.05)",borderLeft:`3px solid ${C.p}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10}}>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}><span style={{fontWeight:800,fontSize:18,color:C.tx,letterSpacing:"-.02em"}}>{w.word}</span><Badge color={C.sub}>{w.added}</Badge></div>
                  {w.meaning&&<p style={{fontSize:14,color:C.tx,marginBottom:4}}><span style={{color:C.p}}>●</span> {w.meaning}</p>}
                  {w.example&&<p style={{fontSize:13,color:C.sub,fontStyle:"italic"}}>&ldquo;{w.example}&rdquo;</p>}
                  {tips[w.id]&&<div style={{marginTop:10,padding:"10px 14px",background:C.duoL,borderRadius:10,fontSize:13,color:C.tx,borderLeft:`3px solid ${C.duo}`}}>🟢 {tips[w.id]}</div>}
                  {tipsFor===w.id&&<div style={{fontSize:12,color:C.sub,marginTop:6,display:"flex",alignItems:"center",gap:6}}><Spin sz={12}/> 분석 중...</div>}
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:5}}>
                  <Btn v="g" sz="sm" onClick={()=>{setWIn(w.word);setMIn(w.meaning);setExIn(w.example);setEditId(w.id);}} style={{padding:"6px 10px"}}>✏️</Btn>
                  <Btn v="duo" sz="sm" onClick={()=>getTip(w)} disabled={tipsFor===w.id} style={{padding:"6px 10px"}}>🟢</Btn>
                  <Btn v="d" sz="sm" onClick={()=>persistVocab(words.filter(x=>x.id!==w.id))} style={{padding:"6px 10px"}}>🗑</Btn>
                </div>
              </div>
            </div>
          ))}
          {words.length===0&&<div style={{textAlign:"center",padding:"36px 20px",color:C.sub}}><div style={{fontSize:40,marginBottom:10}}>📚</div><p style={{fontWeight:600}}>단어장이 비어있어요</p></div>}
        </div>
      )}
      {activeCat!=="__vocab__"&&cur&&(
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:20}}>{cur.icon}</span><p style={{fontWeight:700,fontSize:16,color:C.tx}}>{cur.label}</p><Badge color={cur.color}>{items.length}개</Badge></div>
            {items.length>0&&<Btn v="d" sz="sm" onClick={()=>clearCat(activeCat)}>전체 삭제</Btn>}
          </div>
          {items.length===0&&<div style={{textAlign:"center",padding:"40px 20px",color:C.sub}}><div style={{fontSize:40,marginBottom:12}}>{cur.icon}</div><p style={{fontWeight:600,marginBottom:6}}>아직 저장된 내용이 없어요</p><p style={{fontSize:13}}>오늘 정리 탭에서 저장하면 자동 분류됩니다</p></div>}
          {items.map(entry=><CatCard key={entry.id} entry={entry} cat={cur} onDelete={()=>del(activeCat,entry.id)}/>)}
        </div>
      )}
    </div>
  );
}

// ─── TAB 5: 복습 ─────────────────────────────────────────────────────────────
function TabReview() {
  const [mode, setMode] = useState("full");
  const [history, setHistory] = useState([]); const [evals, setEvals] = useState([]); const [lookups, setLookups] = useState([]);
  const [sel, setSel] = useState(null); const [quizMode, setQuizMode] = useState(false);
  const [qQ, setQQ] = useState(""); const [qA, setQA] = useState(""); const [qRes, setQRes] = useState(null);
  const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  useEffect(() => { setHistory(ls.get("full_results")||[]); setEvals(ls.get("saved_evals")||[]); setLookups(ls.get("saved_lookups")||[]); }, []);
  const removeItem=(key,id,setter)=>{ const u=(ls.get(key)||[]).filter(h=>h.id!==id); ls.set(key,u); setter(u); if(sel?.id===id) setSel(null); };
  const startQuiz=async(entry)=>{ setQuizMode(true); setQQ(""); setQA(""); setQRes(null); setError(""); setLoading(true); try{ setQQ(await callAI("학습 내용으로 퀴즈 문제 하나. 한국어 질문만. 다른 텍스트 없이.",entry.result)); }catch(e){setError(e.message);} setLoading(false); };
  const checkQuiz=async()=>{ if(!qA.trim()||!sel) return; setLoading(true); setError(""); try{ setQRes(await callAI("퀴즈 답변 평가. 짧고 친절하게 한국어. 마크다운 없이.",`문제:${qQ}\n답:${qA}\n원본:\n${sel.result}`)); }catch(e){setError(e.message);} setLoading(false); };
  const MODES=[["full","📋 전체 정리","#3182F6"],["evals","✍️ 문장 평가","#7B3FE4"],["lookups","🔍 단어 검색","#0AC45D"]];
  const activeList=mode==="full"?history:mode==="evals"?evals:lookups;
  const activeKey=mode==="full"?"full_results":mode==="evals"?"saved_evals":"saved_lookups";
  const activeSetter=mode==="full"?setHistory:mode==="evals"?setEvals:setLookups;
  return(
    <div>
      <div style={{display:"flex",gap:6,marginBottom:14,background:C.card,borderRadius:14,padding:5,boxShadow:"0 1px 8px rgba(0,0,0,.06)"}}>
        {MODES.map(([k,lbl,clr])=><button key={k} onClick={()=>{setMode(k);setSel(null);setQuizMode(false);}} style={{flex:1,padding:"9px 6px",border:"none",borderRadius:10,fontWeight:700,fontSize:12,cursor:"pointer",transition:"all .18s",background:mode===k?clr:"transparent",color:mode===k?"#fff":C.sub,boxShadow:mode===k?`0 2px 8px ${clr}55`:"none"}}>{lbl}</button>)}
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <p style={{fontSize:13,color:C.sub,fontWeight:600}}>{activeList.length}개의 기록</p>
        {activeList.length>0&&<Btn v="d" sz="sm" onClick={()=>{if(!window.confirm("전체 삭제할까요?"))return;ls.set(activeKey,[]);activeSetter([]);setSel(null);}}>전체 삭제</Btn>}
      </div>
      {activeList.length===0&&<div style={{textAlign:"center",padding:"44px 20px",color:C.sub}}><div style={{fontSize:44,marginBottom:12}}>📂</div><p style={{fontWeight:600,marginBottom:6}}>기록이 없어요</p><p style={{fontSize:13}}>저장한 내용이 여기서 복습됩니다</p></div>}
      {activeList.map(h=>(
        <Card key={h.id} onClick={()=>{setSel(h);setQuizMode(false);setQQ("");setQA("");setQRes(null);}} style={{padding:"14px 16px",border:sel?.id===h.id?`2px solid ${C.p}`:`1px solid ${C.border}`,cursor:"pointer",transition:"border .2s"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{flex:1,overflow:"hidden"}}>
              {h.summary?.oneLiner && <p style={{fontSize:13,fontWeight:700,color:C.tx,marginBottom:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{h.summary.oneLiner}</p>}
              <div style={{display:"flex",alignItems:"center",gap:8}}><Badge color={C.p}>{h.date}</Badge>{h.summary?.level&&<Badge color={C.duo}>{h.summary.level}</Badge>}</div>
            </div>
            <Btn v="d" sz="sm" style={{padding:"6px 10px",marginLeft:8,flexShrink:0}} onClick={e=>{e.stopPropagation();removeItem(activeKey,h.id,activeSetter);}}>🗑</Btn>
          </div>
        </Card>
      ))}
      {error&&<ErrBox msg={error} onClose={()=>setError("")}/>}
      {sel&&(
        <Card style={{animation:"fadeUp .3s ease",marginTop:4}}>
          {sel.summary&&<SummaryCard data={sel.summary}/>}
          <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
            <Btn v="s" sz="sm" onClick={()=>startQuiz(sel)} disabled={loading}>🎓 퀴즈 만들기</Btn>
            <Btn v="g" sz="sm" onClick={()=>{setQuizMode(false);setQRes(null);}}>📖 상세 내용 보기</Btn>
          </div>
          {!quizMode&&<RT text={sel.result}/>}
          {quizMode&&(
            <div>
              {loading&&!qQ&&<AILoad/>}
              {qQ&&(<div><div style={{background:"#FFFBEB",border:`1px solid #FDE68A`,borderRadius:12,padding:14,marginBottom:12}}><p style={{fontWeight:700,color:"#92400E",fontSize:13,marginBottom:6}}>❓ 퀴즈</p><p style={{color:C.tx,fontSize:15}}>{qQ}</p></div><TA value={qA} onChange={setQA} placeholder="답을 입력해보세요..." rows={3}/><div style={{marginTop:10}}><Btn onClick={checkQuiz} disabled={loading||!qA.trim()}>✅ 정답 확인</Btn></div>{loading&&qA&&<div style={{marginTop:8}}><AILoad/></div>}{qRes&&<div style={{marginTop:12,padding:14,background:"#EDFDF4",border:`1px solid #A7F3D0`,borderRadius:12,color:"#065F46",fontSize:14,fontWeight:500,animation:"fadeUp .3s ease"}}>{qRes}</div>}</div>)}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

// ─── STATS ────────────────────────────────────────────────────────────────────
function Stats() {
  const [counts, setCounts] = useState({});
  useEffect(() => {
    const c = {};
    CATS.forEach(cat => { c[cat.key] = (ls.get(`cat_${cat.key}`) || []).length; });
    c.vocab = (ls.get("vocab_book") || []).length;
    c.full  = (ls.get("full_results") || []).length;
    setCounts(c);
  }, []);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (total === 0) return null;
  return (
    <div style={{ background: `linear-gradient(135deg,${C.duoL},rgba(88,204,2,.06))`, borderRadius: 16, padding: "14px 18px", marginBottom: 14, border: `1px solid ${C.duo}22` }}>
      <p style={{ fontSize: 12, fontWeight: 700, color: C.duo, marginBottom: 10, letterSpacing: ".04em", textTransform: "uppercase" }}>📊 저장 현황</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        {[["📖", `단어장 ${counts.vocab||0}`], ["📋", `전체기록 ${counts.full||0}`]].map(([ic, lb]) => (
          <div key={lb} style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ fontSize: 14 }}>{ic}</span><span style={{ fontSize: 13, fontWeight: 600, color: C.tx }}>{lb}</span></div>
        ))}
        {CATS.map(c => counts[c.key] > 0 && (
          <div key={c.key} style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ fontSize: 14 }}>{c.icon}</span><span style={{ fontSize: 13, fontWeight: 600, color: C.tx }}>{counts[c.key]}</span></div>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
const TABS = [
  { key: "organize",  icon: "📒", label: "오늘 정리"  },
  { key: "evaluate",  icon: "✍️", label: "문장 평가"  },
  { key: "selection", icon: "🎯", label: "선택 모드"  },
  { key: "storage",   icon: "📂", label: "보관함"     },
  { key: "review",    icon: "🔁", label: "복습"       },
];

export default function App() {
  const [active, setActive] = useState("organize");
  return (
    <>
      <style>{GCSS}</style>
      <div style={{ minHeight: "100vh", background: C.bg, paddingBottom: 88 }}>
        <div style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(255,255,255,.93)", backdropFilter: "blur(16px)", borderBottom: `1px solid ${C.border}`, boxShadow: "0 2px 12px rgba(0,0,0,.04)" }}>
          <div style={{ maxWidth: 640, margin: "0 auto", padding: "12px 20px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: `linear-gradient(135deg,${C.duo},${C.duoD})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, boxShadow: "0 4px 12px rgba(88,204,2,.3)", flexShrink: 0, animation: "duoJump 3s ease-in-out infinite" }}>🦉</div>
            <div>
              <h1 style={{ fontSize: 16, fontWeight: 800, color: C.tx, letterSpacing: "-.03em" }}>English Study Hub</h1>
              <p style={{ fontSize: 11, color: C.sub, marginTop: 1 }}>내 메모 → 선생님 설명 + 듀오링고 팁 · GPT-4o</p>
            </div>
            <div style={{ marginLeft: "auto" }}><span style={{ background: C.duoL, color: C.duoD, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>v4.0</span></div>
          </div>
        </div>
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "16px 16px 24px" }}>
          {active === "organize" && <Stats />}
          <div key={active} style={{ animation: "fadeUp .3s ease" }}>
            {active === "organize"  && <TabOrganize />}
            {active === "evaluate"  && <TabEvaluate />}
            {active === "selection" && <TabSelection />}
            {active === "storage"   && <TabStorage />}
            {active === "review"    && <TabReview />}
          </div>
        </div>
      </div>
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(255,255,255,.95)", backdropFilter: "blur(18px)", borderTop: `1px solid ${C.border}`, display: "flex", zIndex: 100, paddingBottom: "env(safe-area-inset-bottom,0px)", boxShadow: "0 -4px 20px rgba(0,0,0,.06)" }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActive(t.key)}
            style={{ flex: 1, padding: "10px 4px 8px", border: "none", background: "transparent", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer", transition: "background .15s" }}
            onMouseEnter={e => e.currentTarget.style.background = `${C.duo}08`}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <span style={{ fontSize: 22, lineHeight: 1, filter: active === t.key ? "none" : "grayscale(1) opacity(.45)", transition: "filter .2s" }}>{t.icon}</span>
            <span style={{ fontSize: 10, fontWeight: active === t.key ? 700 : 500, color: active === t.key ? C.duo : C.sub, letterSpacing: "-.01em", transition: "color .2s" }}>{t.label}</span>
            {active === t.key && <div style={{ width: 18, height: 3, background: C.duo, borderRadius: 2 }} />}
          </button>
        ))}
      </div>
    </>
  );
}
