import React, { useEffect, useRef, useState } from "react";

const C = {
  paper: "#F3EAD8",
  paper2: "#ECE0C9",
  card: "#FBF5E9",
  ink: "#241509",
  inkSoft: "#7A6A55",
  line: "#D8C8AA",

  red: "#C9401C",
  redDeep: "#A8330F",
  redTint: "#FBE2DA",
  teal: "#0E6B66",
  gold: "#E0A12B",
  goldTint: "#FBE9C2",
  green: "#2E7D32",
  greenTint: "#E1F0DC",
};

const RUN_TYPES = [
  "bracket_pos",
  "fraction_num_pos",
  "fraction_den_pos",
  "power_square_pos",
  "power_cube_x_pos",
  "power_cube_bracket_pos",
  "bracket_neg",
  "fraction_num_neg",
  "fraction_den_neg",
  "power_square_neg",
  "power_cube_x_neg",
  "power_cube_bracket_neg",
];

const RUN_MS = 60000;
const POSITIVE_SOLUTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const NEGATIVE_SOLUTIONS = [-1, -2, -3, -4, -5, -6, -7, -8, -9, -10, -11, -12];
const SMALL_NONZERO = [-9, -8, -7, -6, -5, -4, -3, -2, 2, 3, 4, 5, 6, 7, 8, 9];
const POWER_ROOTS = [-4, -3, -2, -1, 1, 2, 3, 4];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pow(base, exponent) {
  return Math.pow(base, exponent);
}

function niceLinearOffset(x, makeQuestion) {
  let fallback = makeQuestion();
  if (fallback.b === 0) fallback = makeQuestion();

  for (let i = 0; i < 80; i++) {
    const q = makeQuestion();
    if (q.b !== 0 && Math.abs(q.b) <= 16) return q;
    if (q.b !== 0) fallback = q;
  }
  return fallback;
}

function genQuestion(type) {
  const wantsNegative = type.endsWith("_neg");
  const family = type.replace(/_(pos|neg)$/, "");
  const x = pick(wantsNegative ? NEGATIVE_SOLUTIONS : POSITIVE_SOLUTIONS);

  if (family === "bracket") {
    const a = randInt(2, 8);
    const b = pick(SMALL_NONZERO);
    const c = a * (x + b);
    return {
      id: `${type}-${a}-${b}-${c}-${x}-${Math.random().toString(36).slice(2)}`,
      kind: "bracket",
      tag: "single bracket",
      a,
      b,
      c,
      x,
    };
  }

  if (family === "fraction_num") {
    return niceLinearOffset(x, () => {
      const denominator = randInt(2, 7);
      const value = pick([-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6]);
      const b = denominator * value - x;
      return {
        id: `${type}-num-${denominator}-${value}-${b}-${x}-${Math.random()
          .toString(36)
          .slice(2)}`,
        kind: "fractionNum",
        tag: "x in numerator",
        denominator,
        value,
        b,
        x,
      };
    });
  }

  if (family === "fraction_den") {
    return niceLinearOffset(x, () => {
      const denominatorValue = pick(SMALL_NONZERO);
      const value = randInt(2, 8);
      const numerator = value * denominatorValue;
      const b = denominatorValue - x;
      return {
        id: `${type}-den-${numerator}-${value}-${b}-${x}-${Math.random()
          .toString(36)
          .slice(2)}`,
        kind: "fractionDen",
        tag: "x in denominator",
        numerator,
        value,
        b,
        x,
      };
    });
  }

  if (family === "power_square") {
    const b = -x;
    return {
      id: `${type}-square-bracket-${b}-${x}-${Math.random().toString(36).slice(2)}`,
      kind: "powerBracket",
      tag: "squared bracket",
      exponent: 2,
      b,
      c: 0,
      x,
    };
  }

  if (family === "power_cube_x") {
    const exponent = 3;
    const d = pick([-18, -16, -14, -12, -10, -8, -6, -4, 4, 6, 8, 10, 12, 14, 16, 18]);
    const c = pow(x, exponent) + d;
    return {
      id: `${type}-x-cubed-${d}-${c}-${x}-${Math.random().toString(36).slice(2)}`,
      kind: "powerPronumeral",
      tag: "x cubed",
      exponent,
      d,
      c,
      x,
    };
  }

  if (family === "power_cube_bracket") {
    return niceLinearOffset(x, () => {
      const exponent = 3;
      const root = pick(POWER_ROOTS);
      const b = root - x;
      const c = pow(root, exponent);
      return {
        id: `${type}-cube-bracket-${b}-${c}-${x}-${Math.random().toString(36).slice(2)}`,
        kind: "powerBracket",
        tag: "cubed bracket",
        exponent,
        b,
        c,
        x,
      };
    });
  }

  throw new Error(`Unknown question type: ${type}`);
}

function genRun() {
  return shuffle(RUN_TYPES).map(genQuestion);
}

function drawQuestion(queue) {
  const nextQueue = queue.length ? queue.slice() : genRun();
  const [next, ...rest] = nextQueue;
  return { question: next, queue: rest };
}

function fmt(ms) {
  const totalCs = Math.max(0, Math.floor(ms / 10));
  const cs = totalCs % 100;
  const totalSec = Math.floor(totalCs / 100);
  const s = totalSec % 60;
  const m = Math.floor(totalSec / 60);
  const sec = m > 0 ? String(s).padStart(2, "0") : String(s);
  return `${m > 0 ? `${m}:` : ""}${sec}.${String(cs).padStart(2, "0")}`;
}

function statScore(score) {
  return score == null ? "-" : score;
}

function minusNumber(n) {
  return n < 0 ? `\u2212${Math.abs(n)}` : String(n);
}

function parseSignedInt(raw) {
  const t = raw.trim().replace(/[\u2212\u2013\u2014]/g, "-");
  const m = t.match(/^([+-]?)(\d+)$/);
  if (!m) return null;
  const n = parseInt(m[2], 10);
  return m[1] === "-" ? -n : n;
}

function cleanTypedAnswer(raw) {
  return raw.replace(/[^\d+\-\u2212\u2013\u2014]/g, "");
}

function equationString(q) {
  if (q.kind === "bracket") {
    return `${q.a}(x ${q.b < 0 ? "-" : "+"} ${Math.abs(q.b)}) = ${q.c}`;
  }
  if (q.kind === "fractionNum") {
    return `(x ${q.b < 0 ? "-" : "+"} ${Math.abs(q.b)}) / ${q.denominator} = ${q.value}`;
  }
  if (q.kind === "fractionDen") {
    return `${q.numerator} / (x ${q.b < 0 ? "-" : "+"} ${Math.abs(q.b)}) = ${q.value}`;
  }
  if (q.kind === "powerBracket") {
    return `(x ${q.b < 0 ? "-" : "+"} ${Math.abs(q.b)})^${q.exponent} = ${q.c}`;
  }
  if (q.kind === "powerPronumeral") {
    return `x^${q.exponent} ${q.d < 0 ? "-" : "+"} ${Math.abs(q.d)} = ${q.c}`;
  }
  return "";
}

function SignedOffset({ value }) {
  if (value === 0) return null;
  return (
    <>
      <span className="teq-sign">{value < 0 ? " \u2212 " : " + "}</span>
      <span className="teq-constant">{Math.abs(value)}</span>
    </>
  );
}

function LinearX({ b }) {
  return (
    <>
      <span className="teq-variable">x</span>
      <SignedOffset value={b} />
    </>
  );
}

function Fraction({ top, bottom }) {
  return (
    <span className="teq-frac">
      <span className="teq-frac-top">{top}</span>
      <span className="teq-frac-line" />
      <span className="teq-frac-bottom">{bottom}</span>
    </span>
  );
}

function QuestionExpression({ q }) {
  if (q.kind === "bracket") {
    return (
      <>
        <span className="teq-constant">{q.a}</span>
        <span className="teq-sign">(</span>
        <LinearX b={q.b} />
        <span className="teq-sign">)</span>
      </>
    );
  }

  if (q.kind === "fractionNum") {
    return (
      <Fraction
        top={
          <>
            <LinearX b={q.b} />
          </>
        }
        bottom={<span className="teq-constant">{q.denominator}</span>}
      />
    );
  }

  if (q.kind === "fractionDen") {
    return (
      <Fraction
        top={<span className="teq-constant">{minusNumber(q.numerator)}</span>}
        bottom={
          <>
            <span className="teq-sign">(</span>
            <LinearX b={q.b} />
            <span className="teq-sign">)</span>
          </>
        }
      />
    );
  }

  if (q.kind === "powerBracket") {
    return (
      <>
        <span className="teq-sign">(</span>
        <LinearX b={q.b} />
        <span className="teq-sign">)</span>
        <sup>{q.exponent}</sup>
      </>
    );
  }

  if (q.kind === "powerPronumeral") {
    return (
      <>
        <span className="teq-variable">x</span>
        <sup>{q.exponent}</sup>
        <SignedOffset value={q.d} />
      </>
    );
  }

  return null;
}

function QuestionMath({ q }) {
  if (!q) return null;
  return (
    <div className="teq-question" aria-label={`Solve ${equationString(q)}`}>
      <QuestionExpression q={q} />
      <span className="teq-sign"> = </span>
      <span>{minusNumber(q.kind === "fractionNum" || q.kind === "fractionDen" ? q.value : q.c)}</span>
    </div>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div className="teq-stat" style={{ "--accent": accent }}>
      <div className="teq-stat-value">{value}</div>
      <div className="teq-stat-label">{label}</div>
    </div>
  );
}

function Keypad({ onInsert, onBackspace, onClear }) {
  const fire = (event, onPress) => {
    event.preventDefault();
    onPress();
  };

  const Btn = ({ children, onPress, bg = C.paper2, color = C.ink, span }) => (
    <button
      type="button"
      className="teq-key"
      onPointerDown={(event) => fire(event, onPress)}
      style={{
        background: bg,
        color,
        gridColumn: span ? `span ${span}` : undefined,
      }}
    >
      {children}
    </button>
  );

  return (
    <div className="teq-keypad">
      <div className="teq-keypad-head">
        <span>keypad</span>
        <span>into: answer</span>
      </div>
      <div className="teq-keys">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
          <Btn key={digit} onPress={() => onInsert(digit)}>
            {digit}
          </Btn>
        ))}
        <Btn bg={C.paper} onPress={() => onInsert("\u2212")}>
          {"\u2212"}
        </Btn>
        <Btn onPress={() => onInsert("0")}>0</Btn>
        <Btn bg={C.paper} onPress={() => onInsert("+")}>
          +
        </Btn>
        <Btn bg={C.goldTint} onPress={onClear} span={3}>
          clear
        </Btn>
        <Btn bg={C.redTint} color={C.redDeep} onPress={onBackspace} span={3}>
          {"\u232B"}
        </Btn>
      </div>
    </div>
  );
}

function WidgetStyle() {
  return (
    <style>{`
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;1,9..144,500&family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,700&family=JetBrains+Mono:wght@400;600;700;800&display=swap');

.teq-root, .teq-root * {
  box-sizing: border-box;
}

.teq-root {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 12px;
  background: var(--paper);
  color: var(--ink);
  font-family: "Bricolage Grotesque", system-ui, sans-serif;
}

.teq-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: .5;
  background-image:
    linear-gradient(var(--line) 1px, transparent 1px),
    linear-gradient(90deg, var(--line) 1px, transparent 1px);
  background-size: 26px 26px;
  mask-image: radial-gradient(circle at 50% 22%, #000 0%, transparent 78%);
  -webkit-mask-image: radial-gradient(circle at 50% 22%, #000 0%, transparent 78%);
}

.teq-card {
  width: 100%;
  max-width: 560px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
  background: var(--card);
  border: 2px solid var(--ink);
  border-radius: 6px;
  box-shadow: 7px 8px 0 var(--ink);
  padding: 22px 24px 28px;
  transition: max-width .25s ease;
  animation: teq-riseIn 450ms cubic-bezier(.2,.8,.2,1);
}

.teq-card.is-running {
  max-width: 900px;
}

.teq-title {
  margin: 0;
  font-family: "Fraunces", Georgia, serif;
  font-size: 28px;
  line-height: 1.1;
  font-weight: 600;
  color: var(--ink);
}

.teq-title span {
  color: var(--teal);
  font-style: italic;
  font-weight: 500;
}

.teq-subtitle {
  margin: 7px 0 0;
  color: var(--ink-soft);
  font-size: 13px;
  font-weight: 500;
}

.teq-home {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding-top: 24px;
  text-align: center;
}

.teq-finish {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 14px 16px;
  border: 2px solid var(--green);
  border-radius: 6px;
  background: var(--green-tint);
  color: var(--green);
  font-weight: 700;
  animation: teq-popIn 500ms cubic-bezier(.2,.8,.2,1);
}

.teq-finish strong {
  font-family: "Fraunces", Georgia, serif;
  font-size: 24px;
}

.teq-best-tag {
  display: inline-block;
  padding: 3px 8px 4px;
  border: 2px solid var(--red-deep);
  border-radius: 6px;
  background: var(--red-tint);
  color: var(--red-deep);
  font-size: 12px;
  font-weight: 700;
}

.teq-button {
  min-height: 48px;
  border: 2px solid var(--ink);
  border-radius: 6px;
  padding: 13px 22px;
  font: 700 15px/1 "Bricolage Grotesque", system-ui, sans-serif;
  color: var(--ink);
  cursor: pointer;
  transition: background-color 150ms ease, color 150ms ease, box-shadow 150ms ease;
}

.teq-button:focus-visible,
.teq-key:focus-visible,
.teq-answer input:focus-visible {
  outline: 3px solid var(--gold);
  outline-offset: 3px;
}

.teq-button.primary {
  min-width: 210px;
  background: var(--red);
  box-shadow: 4px 4px 0 var(--ink);
}

.teq-button.submit {
  width: 100%;
  margin-top: 14px;
  background: var(--ink);
  color: var(--card);
  box-shadow: 4px 4px 0 var(--gold);
}

.teq-button.secondary {
  background: var(--paper2);
  box-shadow: 3px 3px 0 var(--ink);
}

.teq-button.link {
  min-height: 0;
  width: 100%;
  margin-top: 12px;
  padding: 8px 10px;
  border: 0;
  background: transparent;
  box-shadow: none;
  color: var(--ink-soft);
  text-decoration: underline;
}

.teq-timer-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  width: min(100%, 330px);
  padding: 12px 14px;
  border: 2px solid var(--ink);
  border-radius: 6px;
  background: var(--paper);
  box-shadow: 3px 3px 0 var(--gold);
  color: var(--ink);
  cursor: pointer;
}

.teq-timer-toggle input {
  width: 20px;
  height: 20px;
  margin: 0;
  accent-color: var(--teal);
  cursor: pointer;
}

.teq-timer-toggle span {
  flex: 1 1 auto;
  text-align: left;
  font-size: 14px;
  font-weight: 700;
}

.teq-timer-toggle strong {
  color: var(--teal);
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 13px;
  font-weight: 800;
}

.teq-stats {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
}

.teq-stat {
  min-width: 118px;
  flex: 1 1 118px;
  max-width: 154px;
  padding: 12px 14px 13px;
  border: 2px solid var(--ink);
  border-radius: 6px;
  background: var(--paper);
  box-shadow: 3px 3px 0 var(--accent);
  text-align: left;
  animation: teq-popIn 500ms cubic-bezier(.2,.8,.2,1);
}

.teq-stat-value {
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 23px;
  line-height: 1;
  font-weight: 800;
  color: var(--accent);
  font-variant-numeric: tabular-nums;
}

.teq-stat-label {
  margin-top: 7px;
  color: var(--ink-soft);
  font-size: 12px;
  font-weight: 700;
}

.teq-tagline {
  max-width: 410px;
  margin: 0;
  color: var(--ink-soft);
  font-size: 13px;
  line-height: 1.45;
  font-weight: 500;
}

.teq-topbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  margin-top: 20px;
  padding-top: 18px;
  border-top: 2px solid var(--line);
}

.teq-time {
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: clamp(30px, 7vw, 40px);
  line-height: 1;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.teq-practice-label {
  color: var(--teal);
  font-family: "Fraunces", Georgia, serif;
  font-size: clamp(30px, 7vw, 40px);
  line-height: 1;
  font-style: italic;
  font-weight: 600;
}

.teq-time-label {
  margin-top: 6px;
  color: var(--ink-soft);
  font-size: 13px;
  font-weight: 700;
}

.teq-progress {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 9px;
  min-width: 122px;
}

.teq-progress-label {
  color: var(--ink-soft);
  font-size: 13px;
  font-weight: 700;
}

.teq-run-counts {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.teq-run-counts span {
  padding: 5px 8px;
  border: 2px solid var(--ink);
  background: var(--gold-tint);
  box-shadow: 2px 2px 0 var(--gold);
  border-radius: 6px;
  color: var(--ink);
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 12px;
  font-weight: 800;
}

.teq-stage {
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin-top: 18px;
}

.teq-left {
  flex: 1 1 0;
  min-width: 0;
}

.teq-right {
  flex: none;
}

.teq-type {
  margin: 0 0 8px;
  color: var(--gold);
  font-size: 13px;
  font-weight: 700;
}

.teq-question-wrap {
  animation: teq-qIn 300ms cubic-bezier(.2,.9,.3,1);
}

.teq-question {
  min-height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 2px;
  padding: 16px 8px 14px;
  color: var(--ink);
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: clamp(28px, 7vw, 42px);
  line-height: 1.15;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  text-align: center;
}

.teq-variable {
  color: var(--teal);
}

.teq-constant {
  color: var(--red);
}

.teq-sign {
  color: var(--ink-soft);
}

.teq-question sup {
  align-self: flex-start;
  margin: .06em 2px 0 1px;
  color: var(--gold);
  font-size: .55em;
  line-height: 1;
}

.teq-frac {
  display: inline-flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: center;
  min-width: 2.2ch;
  margin: 0 8px;
  line-height: 1;
}

.teq-frac-top,
.teq-frac-bottom {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 1.05em;
  padding: 0 8px;
}

.teq-frac-line {
  width: 100%;
  border-top: 3px solid var(--ink);
  margin: 4px 0;
}

.teq-answer {
  min-height: 76px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  padding: 13px 12px;
  border: 2px solid var(--ink);
  border-radius: 6px;
  background: var(--paper);
  box-shadow: 4px 4px 0 var(--gold);
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: clamp(27px, 6.5vw, 38px);
  font-weight: 800;
}

.teq-answer input {
  width: 5.2ch;
  height: 52px;
  border: 2.5px solid var(--gold);
  border-radius: 6px;
  background: var(--gold-tint);
  color: var(--ink);
  font: inherit;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.teq-answer input.is-shaking {
  animation: teq-shake 400ms;
}

.teq-feedback {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 12px;
  padding: 10px 12px;
  border: 2px solid var(--red-deep);
  border-radius: 6px;
  background: var(--red-tint);
  color: var(--red-deep);
  animation: teq-popIn 300ms cubic-bezier(.2,.8,.2,1);
}

.teq-feedback span {
  color: var(--ink-soft);
  font-size: 13px;
  font-weight: 700;
}

.teq-feedback strong {
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 16px;
  font-weight: 800;
}

.teq-keypad {
  padding: 14px;
  border: 2px solid var(--ink);
  border-radius: 6px;
  background: var(--card);
  box-shadow: 4px 4px 0 var(--teal);
}

.teq-keypad-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
  color: var(--ink-soft);
  font-size: 12px;
  font-weight: 700;
}

.teq-keys {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.teq-key {
  height: 52px;
  border: 2px solid var(--ink);
  border-radius: 6px;
  box-shadow: 3px 3px 0 var(--ink);
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 20px;
  font-weight: 800;
  cursor: pointer;
  touch-action: manipulation;
}

.teq-failed {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding-top: 24px;
  text-align: center;
}

.teq-stamp {
  display: inline-block;
  padding: 7px 18px 10px;
  border: 3px solid var(--red-deep);
  border-radius: 6px;
  color: var(--red-deep);
  font-family: "Fraunces", Georgia, serif;
  font-size: clamp(33px, 8vw, 50px);
  line-height: 1;
  font-style: italic;
  font-weight: 600;
  transform: rotate(-2deg);
  animation: teq-stampIn 550ms cubic-bezier(.2,.9,.3,1.2);
}

.teq-fail-note {
  margin: 0;
  color: var(--ink-soft);
  font-size: 14px;
  font-weight: 700;
}

.teq-review-question {
  width: 100%;
  padding: 8px 0;
}

.teq-answer-pills {
  width: 100%;
  display: grid;
  gap: 10px;
}

.teq-pill {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 12px 14px;
  border: 2px solid var(--pill-border);
  border-radius: 6px;
  background: var(--pill-bg);
  text-align: left;
}

.teq-pill span:first-child {
  color: var(--ink-soft);
  font-size: 13px;
  font-weight: 700;
}

.teq-pill strong {
  color: var(--pill-border);
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 17px;
  font-weight: 800;
  overflow-wrap: anywhere;
}

.teq-fail-buttons {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  width: 100%;
}

@media (min-width: 760px) {
  .teq-stage {
    flex-direction: row;
    align-items: flex-start;
    gap: 28px;
  }

  .teq-right {
    flex: 0 0 318px;
    position: sticky;
    top: 14px;
  }
}

@media (max-width: 520px) {
  .teq-root {
    align-items: flex-start;
    padding: 14px 10px;
  }

  .teq-card {
    padding: 18px 16px 22px;
  }

  .teq-topbar {
    flex-direction: column;
    align-items: stretch;
  }

  .teq-progress {
    align-items: flex-start;
  }

  .teq-stat {
    max-width: none;
  }

  .teq-pill {
    align-items: flex-start;
    flex-direction: column;
  }
}

@keyframes teq-riseIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes teq-qIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes teq-popIn {
  from { opacity: 0; transform: scale(.97); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes teq-shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-7px); }
  40% { transform: translateX(7px); }
  60% { transform: translateX(-5px); }
  80% { transform: translateX(5px); }
}

@keyframes teq-stampIn {
  from { opacity: 0; transform: rotate(-7deg) scale(.8); }
  to { opacity: 1; transform: rotate(-2deg) scale(1); }
}
`}</style>
  );
}

export function EquationMinuteLevelTwoWidget() {
  const [phase, setPhase] = useState("home");
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [runTimed, setRunTimed] = useState(false);
  const [queue, setQueue] = useState([]);
  const [question, setQuestion] = useState(null);
  const [answer, setAnswer] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [bestScore, setBestScore] = useState(null);
  const [recentScore, setRecentScore] = useState(null);
  const [currentCorrect, setCurrentCorrect] = useState(0);
  const [currentMisses, setCurrentMisses] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [justFinished, setJustFinished] = useState(false);
  const [lastWasBest, setLastWasBest] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [shakeAnswer, setShakeAnswer] = useState(false);
  const startRef = useRef(0);
  const answerRef = useRef(null);

  const q = question;
  const isRunning = phase === "running";
  const remainingMs = runTimed ? Math.max(0, RUN_MS - elapsed) : null;

  const finishRun = (score = currentCorrect) => {
    if (!runTimed) {
      setJustFinished(false);
      setLastWasBest(false);
      setPhase("home");
      return;
    }

    const isNewBest = bestScore == null || score > bestScore;
    setRecentScore(score);
    if (isNewBest) setBestScore(score);
    setLastWasBest(isNewBest);
    setJustFinished(true);
    setElapsed(RUN_MS);
    setPhase("home");
  };

  useEffect(() => {
    if (phase !== "running" || !runTimed) return undefined;
    let raf;
    const tick = () => {
      const nextElapsed = performance.now() - startRef.current;
      if (nextElapsed >= RUN_MS) {
        finishRun(currentCorrect);
        return;
      }
      setElapsed(nextElapsed);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, currentCorrect, bestScore, runTimed]);

  useEffect(() => {
    if (phase === "running" && answerRef.current) {
      answerRef.current.focus();
    }
  }, [phase, question]);

  const start = () => {
    const timed = timerEnabled;
    const next = drawQuestion([]);
    setRunTimed(timed);
    setQuestion(next.question);
    setQueue(next.queue);
    setAnswer("");
    setElapsed(0);
    setCurrentCorrect(0);
    setCurrentMisses(0);
    setFeedback(null);
    setShakeAnswer(false);
    setJustFinished(false);
    setLastWasBest(false);
    setTotalAttempts((count) => count + 1);
    startRef.current = performance.now();
    setPhase("running");
  };

  const goHome = () => {
    setPhase("home");
    setRunTimed(false);
    setJustFinished(false);
    setAnswer("");
    setFeedback(null);
  };

  const moveToNextQuestion = (sourceQueue = queue) => {
    const next = drawQuestion(sourceQueue);
    setQuestion(next.question);
    setQueue(next.queue);
    setAnswer("");
  };

  const insertAnswer = (ch) => {
    setAnswer((current) => {
      if (ch === "\u2212" || ch === "+") {
        const body = current.replace(/^[+\-\u2212\u2013\u2014]/, "");
        if (ch === "\u2212" && /^[\u2212-]/.test(current)) return body;
        return ch + body;
      }
      return cleanTypedAnswer(current + ch);
    });
  };

  const submit = () => {
    if (!q || !answer.trim()) return;
    if (runTimed && performance.now() - startRef.current >= RUN_MS) {
      finishRun(currentCorrect);
      return;
    }

    const parsed = parseSignedInt(answer);

    if (parsed === q.x) {
      const nextScore = currentCorrect + 1;
      setCurrentCorrect(nextScore);
      setTotalCorrect((count) => count + 1);
      setFeedback(null);
      moveToNextQuestion();
      return;
    }

    setCurrentMisses((count) => count + 1);
    setFeedback(true);
    setShakeAnswer(true);
    window.setTimeout(() => setShakeAnswer(false), 400);
    moveToNextQuestion();
  };

  const vars = {
    "--paper": C.paper,
    "--paper2": C.paper2,
    "--card": C.card,
    "--ink": C.ink,
    "--ink-soft": C.inkSoft,
    "--line": C.line,
    "--red": C.red,
    "--red-deep": C.redDeep,
    "--red-tint": C.redTint,
    "--teal": C.teal,
    "--gold": C.gold,
    "--gold-tint": C.goldTint,
    "--green": C.green,
    "--green-tint": C.greenTint,
  };

  return (
    <div className="teq-root" style={vars}>
      <WidgetStyle />
      <div className="teq-bg" />
      <main className={`teq-card ${isRunning ? "is-running" : ""}`}>
        <header>
          <h1 className="teq-title">
            Equation Minute <span>{"\u00B7"} Level Two</span>
          </h1>
          <p className="teq-subtitle">
            Timer optional {"\u00B7"} brackets, fractions, powers {"\u00B7"} integer answers
          </p>
        </header>

        {phase === "home" && (
          <section className="teq-home">
            {justFinished && (
              <div className="teq-finish">
                <strong>{recentScore} solved in one minute!</strong>
                {lastWasBest && <span className="teq-best-tag">new best</span>}
              </div>
            )}

            <label className="teq-timer-toggle">
              <input
                type="checkbox"
                checked={timerEnabled}
                onChange={(event) => setTimerEnabled(event.target.checked)}
              />
              <span>Timer</span>
              <strong>{timerEnabled ? "1 minute" : "off"}</strong>
            </label>

            <button type="button" className="teq-button primary" onClick={start}>
              {timerEnabled ? "Start 1 minute" : "Start practice"}
            </button>

            <div className="teq-stats" aria-label="session stats">
              <StatCard label="Best minute" value={statScore(bestScore)} accent={C.teal} />
              <StatCard label="Recent minute" value={statScore(recentScore)} accent={C.gold} />
              <StatCard label="Correct so far" value={totalCorrect} accent={C.green} />
              <StatCard label="Attempts" value={totalAttempts} accent={C.redDeep} />
            </div>

            <p className="teq-tagline">
              Every question is two-step: brackets, fractions with x in the numerator or
              denominator, and powers on x or brackets up to 3. Timer off for practice, timer on
              for a one-minute score.
            </p>
          </section>
        )}

        {phase === "running" && q && (
          <section>
            <div className="teq-topbar">
              <div>
                {runTimed ? (
                  <>
                    <div className="teq-time">{fmt(remainingMs)}</div>
                    <div className="teq-time-label">time left</div>
                  </>
                ) : (
                  <>
                    <div className="teq-practice-label">practice</div>
                    <div className="teq-time-label">timer off</div>
                  </>
                )}
              </div>
              <div className="teq-progress">
                <div className="teq-progress-label">Solved {currentCorrect}</div>
                <div className="teq-run-counts">
                  <span>Misses {currentMisses}</span>
                  <span>Answered {currentCorrect + currentMisses}</span>
                </div>
              </div>
            </div>

            <div className="teq-stage">
              <div className="teq-left">
                <div className="teq-question-wrap" key={q.id}>
                  <p className="teq-type">{q.tag}</p>
                  <QuestionMath q={q} />
                </div>

                <div className="teq-answer">
                  <span>x =</span>
                  <input
                    ref={answerRef}
                    className={shakeAnswer ? "is-shaking" : ""}
                    value={answer}
                    onChange={(event) => setAnswer(cleanTypedAnswer(event.target.value))}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") submit();
                    }}
                    inputMode="none"
                    aria-label="x value"
                  />
                </div>

                <button type="button" className="teq-button submit" onClick={submit}>
                  Submit
                </button>

                {feedback && (
                  <div className="teq-feedback">
                    <span>Answer marked</span>
                    <strong>Incorrect</strong>
                  </div>
                )}
              </div>

              <div className="teq-right">
                <Keypad
                  onInsert={insertAnswer}
                  onBackspace={() => setAnswer((current) => current.slice(0, -1))}
                  onClear={() => setAnswer("")}
                />
                <button type="button" className="teq-button link" onClick={goHome}>
                  Home
                </button>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default EquationMinuteLevelTwoWidget;
