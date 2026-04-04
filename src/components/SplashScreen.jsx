const LINEAGE = [
  { era: "ANCIENT", names: "Socrates \u00b7 Epicurus \u00b7 Hypatia \u00b7 Lucretius \u00b7 Zhuangzi \u00b7 Charvaka" },
  { era: "MEDIEVAL", names: "Averroes \u00b7 Al-Razi \u00b7 Al-Ma\u2019arri \u00b7 Ibn Sina" },
  { era: "EARLY MOD", names: "Montaigne \u00b7 Spinoza \u00b7 de Gouges \u00b7 Wollstonecraft" },
  { era: "ENLIGHTEN", names: "Hume \u00b7 Voltaire \u00b7 Paine \u00b7 Diderot" },
  { era: "19TH C", names: "Mill \u00b7 Douglass \u00b7 Truth \u00b7 Ambedkar \u00b7 Marx \u00b7 Wilde" },
  { era: "20TH C", names: "Orwell \u00b7 Russell \u00b7 Baldwin \u00b7 de Beauvoir \u00b7 Lu Xun \u00b7 Goldman" },
  { era: "CONTEMP", names: "Hitchens \u00b7 Rushdie \u00b7 Chomsky \u00b7 Fanon \u00b7 Lorde \u00b7 Havel \u00b7 Ai Weiwei" },
];

const font = "'EB Garamond', 'Garamond', 'Georgia', serif";
const fontDisplay = "'Cormorant Garamond', 'Garamond', serif";
const fontMono = "'JetBrains Mono', 'Menlo', monospace";
const gold = "#C9A96E";
const goldDim = "rgba(201,169,110,";
const bg = "#0A0908";

export default function SplashScreen({ onBegin }) {
  return (
    <div style={{ minHeight: "100vh", background: bg, color: "#DAD0C2", fontFamily: font, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", textAlign: "center", position: "relative", overflow: "hidden" }}>
      <style>{`
        @keyframes ember { 0%,100% { opacity:.4; transform:scale(1); } 50% { opacity:1; transform:scale(1.6); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes breathe { 0%,100% { opacity:.5; } 50% { opacity:.8; } }
      `}</style>

      {/* Background texture */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: `radial-gradient(ellipse at 50% 30%, ${goldDim}0.03) 0%, transparent 70%)`, pointerEvents: "none" }} />

      {/* Ember */}
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: gold, boxShadow: `0 0 16px 4px ${goldDim}0.4)`, animation: "ember 4s ease-in-out infinite", marginBottom: 40 }} />

      {/* Title */}
      <h1 style={{ fontFamily: fontDisplay, fontSize: 38, fontWeight: 300, letterSpacing: "0.5px", lineHeight: 1.15, color: "#E8E0D4", margin: "0 0 4px" }}>
        The <span style={{ fontWeight: 700, fontStyle: "italic", color: gold }}>Contrarian</span> Mind
      </h1>

      <p style={{ fontSize: 14, color: "#6B5F50", fontStyle: "italic", margin: "0 0 36px", letterSpacing: "0.3px" }}>
        2,400 years of thinking dangerously
      </p>

      {/* Lineage rows */}
      <div style={{ maxWidth: 360, margin: "0 auto 40px", textAlign: "center" }}>
        {LINEAGE.map((row, i) => (
          <div key={i} style={{ marginBottom: 10, animation: `fadeUp 0.5s ease ${0.1 + i * 0.08}s both` }}>
            <div style={{ fontFamily: fontMono, fontSize: 9, letterSpacing: 2, color: `${goldDim}0.4)`, marginBottom: 2 }}>{row.era}</div>
            <div style={{ fontSize: 12, color: "#5A5040", lineHeight: 1.5, fontFamily: fontMono, letterSpacing: "0.3px" }}>{row.names}</div>
          </div>
        ))}
      </div>

      {/* Enter */}
      <button
        onClick={onBegin}
        style={{ background: "none", border: `1px solid ${goldDim}0.25)`, color: gold, padding: "14px 48px", fontSize: 11, letterSpacing: 4, textTransform: "uppercase", cursor: "pointer", fontFamily: fontMono, fontWeight: 300, transition: "all 0.3s", borderRadius: 2 }}
        onMouseEnter={e => { e.target.style.background = `${goldDim}0.06)`; e.target.style.borderColor = gold; }}
        onMouseLeave={e => { e.target.style.background = "none"; e.target.style.borderColor = `${goldDim}0.25)`; }}
      >
        Begin
      </button>

      <p style={{ fontSize: 11, color: "#3D362C", marginTop: 32, maxWidth: 280, lineHeight: 1.6, fontStyle: "italic" }}>
        One consciousness. Every tradition of dissent — and the strongest arguments against them.
      </p>
    </div>
  );
}
