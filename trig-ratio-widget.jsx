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

const RUN_MS = 60000;
const PRACTICE_COUNT = 12;
const DEG = Math.PI / 180;

const RUN_TYPES = [
  "angle_sin",
  "angle_cos",
  "angle_tan",
  "side_sin_top",
  "side_sin_bottom",
  "side_cos_top",
  "side_cos_bottom",
  "side_tan_top",
  "side_tan_bottom",
  "angle_sin",
  "angle_cos",
  "angle_tan",
];

function randInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function round1(n) {
  return Math.round((n + Number.EPSILON) * 10) / 10;
}

function fmt1(n) {
  return round1(n).toFixed(1);
}

function trigValue(trig, angle) {
  const radians = angle * DEG;
  if (trig === "sin") return Math.sin(radians);
  if (trig === "cos") return Math.cos(radians);
  return Math.tan(radians);
}

function inverseTrig(trig, ratio) {
  if (trig === "sin") return Math.asin(ratio) / DEG;
  if (trig === "cos") return Math.acos(ratio) / DEG;
  return Math.atan(ratio) / DEG;
}

function makeAngleQuestion(type) {
  const trig = type.replace("angle_", "");

  for (let i = 0; i < 80; i++) {
    const denominator = randInt(5, 24);
    const numerator =
      trig === "tan" ? randInt(2, 22) : randInt(2, denominator - 1);
    const angle = inverseTrig(trig, numerator / denominator);
    if (angle >= 10 && angle <= 80) {
      return {
        id: `${type}-${numerator}-${denominator}-${Math.random().toString(36).slice(2)}`,
        kind: "angle",
        trig,
        numerator,
        denominator,
        answer: round1(angle),
        tag: `${trig} angle`,
      };
    }
  }

  return {
    id: `${type}-fallback-${Math.random().toString(36).slice(2)}`,
    kind: "angle",
    trig,
    numerator: trig === "tan" ? 7 : 5,
    denominator: trig === "tan" ? 6 : 13,
    answer: round1(inverseTrig(trig, (trig === "tan" ? 7 : 5) / (trig === "tan" ? 6 : 13))),
    tag: `${trig} angle`,
  };
}

function makeSideQuestion(type) {
  const [, trig, position] = type.split("_");
  const angle = randInt(18, 72);
  const known = randInt(5, 22);
  const ratio = trigValue(trig, angle);
  const answer = position === "top" ? known * ratio : known / ratio;

  return {
    id: `${type}-${angle}-${known}-${Math.random().toString(36).slice(2)}`,
    kind: "side",
    trig,
    angle,
    numerator: position === "top" ? "x" : known,
    denominator: position === "bottom" ? "x" : known,
    answer: round1(answer),
    tag: `${trig} side`,
  };
}

function genQuestion(type) {
  if (type.startsWith("angle_")) return makeAngleQuestion(type);
  return makeSideQuestion(type);
}

function genRun() {
  return shuffle(RUN_TYPES).map(genQuestion);
}

function drawQuestion(queue) {
  const nextQueue = queue.length ? queue.slice() : genRun();
  const [question, ...rest] = nextQueue;
  return { question, queue: rest };
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

function cleanDecimalAnswer(raw) {
  const filtered = raw.replace(/[^\d.]/g, "");
  const [wholeRaw, ...decimalParts] = filtered.split(".");
  const whole = wholeRaw.slice(0, 3);
  if (!decimalParts.length) return whole;
  return `${whole}.${decimalParts.join("").slice(0, 1)}`;
}

function parseDecimal(raw) {
  const trimmed = raw.trim();
  if (!/^\d+(\.\d?)?$/.test(trimmed)) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function answerUnit(q) {
  return q.kind === "angle" ? "\u00B0" : "";
}

function answerLabel(q) {
  return `${fmt1(q.answer)}${answerUnit(q)}`;
}

function questionText(q) {
  const left = `${q.trig} ${q.kind === "angle" ? "x" : `${q.angle}\u00B0`}`;
  return `${left} = ${q.numerator}/${q.denominator}`;
}

function isCorrect(raw, q) {
  const parsed = parseDecimal(raw);
  return parsed != null && round1(parsed) === q.answer;
}

function Fraction({ top, bottom }) {
  return (
    <span className="trig-frac">
      <span className="trig-frac-top">{top}</span>
      <span className="trig-frac-line" />
      <span className="trig-frac-bottom">{bottom}</span>
    </span>
  );
}

function RatioPart({ value }) {
  return value === "x" ? <span className="trig-variable">x</span> : <span>{value}</span>;
}

function QuestionMath({ q }) {
  return (
    <div className="trig-question" aria-label={`Solve ${questionText(q)}`}>
      <span className="trig-fn">{q.trig}</span>
      <span className="trig-angle">
        {q.kind === "angle" ? (
          <span className="trig-variable">x</span>
        ) : (
          <>
            {q.angle}
            <sup>{"\u00B0"}</sup>
          </>
        )}
      </span>
      <span className="trig-sign"> = </span>
      <Fraction top={<RatioPart value={q.numerator} />} bottom={<RatioPart value={q.denominator} />} />
    </div>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div className="trig-stat" style={{ "--accent": accent }}>
      <div className="trig-stat-value">{value}</div>
      <div className="trig-stat-label">{label}</div>
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
      className="trig-key"
      style={{
        background: bg,
        color,
        gridColumn: span ? `span ${span}` : undefined,
      }}
      onPointerDown={(event) => fire(event, onPress)}
    >
      {children}
    </button>
  );

  return (
    <div className="trig-keypad">
      <div className="trig-keypad-head">
        <span>Answer</span>
        <strong>1 decimal place</strong>
      </div>
      <div className="trig-keys">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <Btn key={n} onPress={() => onInsert(String(n))}>
            {n}
          </Btn>
        ))}
        <Btn onPress={() => onInsert(".")}>.</Btn>
        <Btn onPress={() => onInsert("0")}>0</Btn>
        <Btn onPress={onBackspace} bg={C.goldTint}>
          Del
        </Btn>
        <Btn onPress={onClear} bg={C.redTint} color={C.redDeep} span={3}>
          Clear
        </Btn>
      </div>
    </div>
  );
}

function ReviewRow({ item, index }) {
  return (
    <div className={`trig-review-row ${item.correct ? "is-correct" : "is-miss"}`}>
      <div className="trig-review-number">{index + 1}</div>
      <div className="trig-review-main">
        <div className="trig-review-question">{item.question}</div>
        <div className="trig-review-kind">{item.kind}</div>
      </div>
      <div className="trig-review-values">
        <span>
          Your answer <strong>{item.student}</strong>
        </span>
        <span>
          Correct answer <strong>{item.expected}</strong>
        </span>
      </div>
    </div>
  );
}

function WidgetStyle() {
  return (
    <style>{`
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;1,9..144,500&family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,700&family=JetBrains+Mono:wght@400;600;700;800&display=swap');

.trig-root, .trig-root * {
  box-sizing: border-box;
}

.trig-root {
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

.trig-bg {
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

.trig-card {
  width: 100%;
  max-width: 580px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
  background: var(--card);
  border: 2px solid var(--ink);
  border-radius: 6px;
  box-shadow: 7px 8px 0 var(--ink);
  padding: 22px 24px 28px;
  transition: max-width .25s ease;
  animation: trig-riseIn 450ms cubic-bezier(.2,.8,.2,1);
}

.trig-card.is-running,
.trig-card.is-review {
  max-width: 940px;
}

.trig-title {
  margin: 0;
  font-family: "Fraunces", Georgia, serif;
  font-size: 30px;
  line-height: 1.1;
  font-weight: 600;
  color: var(--ink);
}

.trig-title span {
  color: var(--teal);
  font-style: italic;
  font-weight: 500;
}

.trig-subtitle {
  margin: 7px 0 0;
  color: var(--ink-soft);
  font-size: 13px;
  font-weight: 500;
}

.trig-home {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding-top: 24px;
  text-align: center;
}

.trig-button {
  min-height: 48px;
  border: 2px solid var(--ink);
  border-radius: 6px;
  padding: 13px 22px;
  font: 700 15px/1 "Bricolage Grotesque", system-ui, sans-serif;
  color: var(--ink);
  cursor: pointer;
  transition: background-color 150ms ease, color 150ms ease, box-shadow 150ms ease;
}

.trig-button:focus-visible,
.trig-key:focus-visible,
.trig-answer input:focus-visible {
  outline: 3px solid var(--gold);
  outline-offset: 3px;
}

.trig-button.primary {
  min-width: 210px;
  background: var(--red);
  box-shadow: 4px 4px 0 var(--ink);
}

.trig-button.submit {
  width: 100%;
  margin-top: 14px;
  background: var(--ink);
  color: var(--card);
  box-shadow: 4px 4px 0 var(--gold);
}

.trig-button.secondary {
  background: var(--paper2);
  box-shadow: 3px 3px 0 var(--ink);
}

.trig-button.link {
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

.trig-timer-toggle {
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

.trig-timer-toggle input {
  width: 20px;
  height: 20px;
  margin: 0;
  accent-color: var(--teal);
  cursor: pointer;
}

.trig-timer-toggle span {
  flex: 1 1 auto;
  text-align: left;
  font-size: 14px;
  font-weight: 700;
}

.trig-timer-toggle strong {
  color: var(--teal);
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 13px;
  font-weight: 800;
}

.trig-stats {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
}

.trig-stat {
  min-width: 118px;
  flex: 1 1 118px;
  max-width: 154px;
  padding: 12px 14px 13px;
  border: 2px solid var(--ink);
  border-radius: 6px;
  background: var(--paper);
  box-shadow: 3px 3px 0 var(--accent);
  text-align: left;
  animation: trig-popIn 500ms cubic-bezier(.2,.8,.2,1);
}

.trig-stat-value {
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 23px;
  line-height: 1;
  font-weight: 800;
  color: var(--accent);
  font-variant-numeric: tabular-nums;
}

.trig-stat-label {
  margin-top: 7px;
  color: var(--ink-soft);
  font-size: 12px;
  font-weight: 700;
}

.trig-tagline {
  max-width: 430px;
  margin: 0;
  color: var(--ink-soft);
  font-size: 13px;
  line-height: 1.45;
  font-weight: 500;
}

.trig-topbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  margin-top: 20px;
  padding-top: 18px;
  border-top: 2px solid var(--line);
}

.trig-time,
.trig-practice-label {
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: clamp(28px, 7vw, 40px);
  line-height: 1;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.trig-practice-label {
  color: var(--teal);
  font-family: "Fraunces", Georgia, serif;
  font-style: italic;
  font-weight: 600;
}

.trig-time-label {
  margin-top: 6px;
  color: var(--ink-soft);
  font-size: 13px;
  font-weight: 700;
}

.trig-progress {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 9px;
  min-width: 132px;
}

.trig-progress-label {
  color: var(--ink-soft);
  font-size: 13px;
  font-weight: 700;
}

.trig-run-counts {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.trig-run-counts span {
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

.trig-stage {
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin-top: 18px;
}

.trig-left {
  flex: 1 1 0;
  min-width: 0;
}

.trig-right {
  flex: none;
}

.trig-type {
  margin: 0 0 8px;
  color: var(--gold);
  font-size: 13px;
  font-weight: 700;
}

.trig-question-wrap {
  animation: trig-qIn 300ms cubic-bezier(.2,.9,.3,1);
}

.trig-question {
  min-height: 88px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 14px 8px 16px;
  color: var(--ink);
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: clamp(29px, 7vw, 42px);
  line-height: 1.15;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  text-align: center;
}

.trig-fn {
  color: var(--red);
}

.trig-variable {
  color: var(--teal);
}

.trig-angle {
  color: var(--ink);
}

.trig-angle sup {
  color: var(--gold);
  font-size: .55em;
}

.trig-sign {
  color: var(--ink-soft);
}

.trig-frac {
  display: inline-flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: center;
  min-width: 2.2ch;
  margin: 0 4px;
  line-height: 1;
}

.trig-frac-top,
.trig-frac-bottom {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 1.05em;
  padding: 0 8px;
}

.trig-frac-line {
  width: 100%;
  border-top: 3px solid var(--ink);
  margin: 4px 0;
}

.trig-answer {
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
  font-size: clamp(25px, 6.5vw, 36px);
  font-weight: 800;
}

.trig-answer input {
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

.trig-answer input.is-shaking {
  animation: trig-shake 400ms;
}

.trig-unit {
  min-width: 1.1ch;
  color: var(--ink-soft);
}

.trig-feedback {
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
  animation: trig-popIn 300ms cubic-bezier(.2,.8,.2,1);
}

.trig-feedback span {
  color: var(--ink-soft);
  font-size: 13px;
  font-weight: 700;
}

.trig-feedback strong {
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 16px;
  font-weight: 800;
}

.trig-keypad {
  padding: 14px;
  border: 2px solid var(--ink);
  border-radius: 6px;
  background: var(--card);
  box-shadow: 4px 4px 0 var(--teal);
}

.trig-keypad-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
  color: var(--ink-soft);
  font-size: 12px;
  font-weight: 700;
}

.trig-keypad-head strong {
  color: var(--teal);
}

.trig-keys {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.trig-key {
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

.trig-review {
  padding-top: 22px;
}

.trig-review-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 14px;
  padding-top: 18px;
  border-top: 2px solid var(--line);
}

.trig-stamp {
  display: inline-block;
  padding: 7px 18px 10px;
  border: 3px solid var(--red-deep);
  border-radius: 6px;
  color: var(--red-deep);
  font-family: "Fraunces", Georgia, serif;
  font-size: clamp(32px, 8vw, 48px);
  line-height: 1;
  font-style: italic;
  font-weight: 600;
  transform: rotate(-2deg);
  animation: trig-stampIn 550ms cubic-bezier(.2,.9,.3,1.2);
}

.trig-review-note {
  margin: 8px 0 0;
  color: var(--ink-soft);
  font-size: 14px;
  font-weight: 700;
}

.trig-review-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
}

.trig-review-list {
  display: grid;
  gap: 10px;
  margin-top: 18px;
}

.trig-review-row {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) minmax(190px, 260px);
  gap: 12px;
  align-items: center;
  padding: 12px;
  border: 2px solid var(--ink);
  border-radius: 6px;
  background: var(--paper);
  box-shadow: 3px 3px 0 var(--row-accent);
}

.trig-review-row.is-correct {
  --row-accent: var(--green);
}

.trig-review-row.is-miss {
  --row-accent: var(--red);
}

.trig-review-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: 2px solid var(--ink);
  border-radius: 6px;
  background: var(--gold-tint);
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-weight: 800;
}

.trig-review-question {
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 18px;
  font-weight: 800;
  overflow-wrap: anywhere;
}

.trig-review-kind {
  margin-top: 4px;
  color: var(--ink-soft);
  font-size: 12px;
  font-weight: 700;
}

.trig-review-values {
  display: grid;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
}

.trig-review-values span {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  color: var(--ink-soft);
}

.trig-review-values strong {
  color: var(--ink);
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 15px;
}

.trig-empty-review {
  margin: 18px 0 0;
  padding: 18px;
  border: 2px solid var(--ink);
  border-radius: 6px;
  background: var(--paper);
  color: var(--ink-soft);
  font-weight: 700;
}

@media (min-width: 760px) {
  .trig-stage {
    flex-direction: row;
    align-items: flex-start;
    gap: 28px;
  }

  .trig-right {
    flex: 0 0 318px;
    position: sticky;
    top: 14px;
  }
}

@media (max-width: 640px) {
  .trig-root {
    align-items: flex-start;
    padding: 14px 10px;
  }

  .trig-card {
    padding: 18px 16px 22px;
  }

  .trig-topbar {
    flex-direction: column;
    align-items: stretch;
  }

  .trig-progress {
    align-items: flex-start;
  }

  .trig-stat {
    max-width: none;
  }

  .trig-review-row {
    grid-template-columns: 38px minmax(0, 1fr);
  }

  .trig-review-values {
    grid-column: 1 / -1;
  }
}

@keyframes trig-riseIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes trig-qIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes trig-popIn {
  from { opacity: 0; transform: scale(.97); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes trig-shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-7px); }
  40% { transform: translateX(7px); }
  60% { transform: translateX(-5px); }
  80% { transform: translateX(5px); }
}

@keyframes trig-stampIn {
  from { opacity: 0; transform: rotate(-7deg) scale(.8); }
  to { opacity: 1; transform: rotate(-2deg) scale(1); }
}
`}</style>
  );
}

export function TrigRatioWidget() {
  const [phase, setPhase] = useState("home");
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [runTimed, setRunTimed] = useState(false);
  const [queue, setQueue] = useState([]);
  const [question, setQuestion] = useState(null);
  const [answer, setAnswer] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [history, setHistory] = useState([]);
  const [review, setReview] = useState([]);
  const [bestTimed, setBestTimed] = useState(null);
  const [recentResult, setRecentResult] = useState(null);
  const [currentCorrect, setCurrentCorrect] = useState(0);
  const [currentMisses, setCurrentMisses] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [lastWasBest, setLastWasBest] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [shakeAnswer, setShakeAnswer] = useState(false);
  const startRef = useRef(0);
  const answerRef = useRef(null);

  const q = question;
  const isRunning = phase === "running";
  const isReview = phase === "review";
  const remainingMs = runTimed ? Math.max(0, RUN_MS - elapsed) : null;
  const answered = currentCorrect + currentMisses;

  const finishRun = (score = currentCorrect, entries = history) => {
    const summary = runTimed ? `${score} in 1:00` : `${score}/${entries.length}`;
    const isNewBest = runTimed && (bestTimed == null || score > bestTimed);
    if (isNewBest) setBestTimed(score);
    setRecentResult(summary);
    setLastWasBest(isNewBest);
    setReview(entries);
    setElapsed(runTimed ? RUN_MS : elapsed);
    setFeedback(null);
    setAnswer("");
    setPhase("review");
  };

  useEffect(() => {
    if (phase !== "running" || !runTimed) return undefined;
    let raf;
    const tick = () => {
      const nextElapsed = performance.now() - startRef.current;
      if (nextElapsed >= RUN_MS) {
        finishRun(currentCorrect, history);
        return;
      }
      setElapsed(nextElapsed);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, runTimed, currentCorrect, history, bestTimed]);

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
    setHistory([]);
    setReview([]);
    setCurrentCorrect(0);
    setCurrentMisses(0);
    setFeedback(null);
    setShakeAnswer(false);
    setLastWasBest(false);
    setTotalAttempts((count) => count + 1);
    startRef.current = performance.now();
    setPhase("running");
  };

  const goHome = () => {
    setPhase("home");
    setRunTimed(false);
    setQuestion(null);
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
    setAnswer((current) => cleanDecimalAnswer(current + ch));
  };

  const submit = () => {
    if (!q || !answer.trim()) return;
    if (runTimed && performance.now() - startRef.current >= RUN_MS) {
      finishRun(currentCorrect, history);
      return;
    }

    const parsed = parseDecimal(answer);
    if (parsed == null) return;

    const correct = isCorrect(answer, q);
    const studentAnswer = `${answer}${answerUnit(q)}`;
    const entry = {
      id: q.id,
      question: questionText(q),
      kind: q.kind === "angle" ? "angle" : "side",
      student: studentAnswer,
      expected: answerLabel(q),
      correct,
    };
    const nextHistory = [...history, entry];
    const nextCorrect = currentCorrect + (correct ? 1 : 0);
    const nextMisses = currentMisses + (correct ? 0 : 1);

    setHistory(nextHistory);
    setCurrentCorrect(nextCorrect);
    setCurrentMisses(nextMisses);
    if (correct) {
      setTotalCorrect((count) => count + 1);
      setFeedback(null);
    } else {
      setFeedback(true);
      setShakeAnswer(true);
      window.setTimeout(() => setShakeAnswer(false), 400);
    }

    if (!runTimed && nextHistory.length >= PRACTICE_COUNT) {
      finishRun(nextCorrect, nextHistory);
      return;
    }

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
    <div className="trig-root" style={vars}>
      <WidgetStyle />
      <div className="trig-bg" />
      <main className={`trig-card ${isRunning ? "is-running" : ""} ${isReview ? "is-review" : ""}`}>
        <header>
          <h1 className="trig-title">
            Trig Ratios <span>{"\u00B7"} 1 Decimal</span>
          </h1>
          <p className="trig-subtitle">
            sin, cos, tan {"\u00B7"} unknown side or angle {"\u00B7"} review at the end
          </p>
        </header>

        {phase === "home" && (
          <section className="trig-home">
            <label className="trig-timer-toggle">
              <input
                type="checkbox"
                checked={timerEnabled}
                onChange={(event) => setTimerEnabled(event.target.checked)}
              />
              <span>Timer</span>
              <strong>{timerEnabled ? "1 minute" : "off"}</strong>
            </label>

            <button type="button" className="trig-button primary" onClick={start}>
              {timerEnabled ? "Start 1 minute" : `Start ${PRACTICE_COUNT}`}
            </button>

            <div className="trig-stats" aria-label="session stats">
              <StatCard label="Best minute" value={statScore(bestTimed)} accent={C.teal} />
              <StatCard label="Last review" value={statScore(recentResult)} accent={C.gold} />
              <StatCard label="Correct so far" value={totalCorrect} accent={C.green} />
              <StatCard label="Attempts" value={totalAttempts} accent={C.redDeep} />
            </div>

            <p className="trig-tagline">
              Equations use ratios such as sin x = a/b and tan 42{"\u00B0"} = x/b. Answers are
              marked to one decimal place, with the full comparison shown after the run.
            </p>
          </section>
        )}

        {phase === "running" && q && (
          <section>
            <div className="trig-topbar">
              <div>
                {runTimed ? (
                  <>
                    <div className="trig-time">{fmt(remainingMs)}</div>
                    <div className="trig-time-label">time left</div>
                  </>
                ) : (
                  <>
                    <div className="trig-practice-label">
                      {Math.min(answered + 1, PRACTICE_COUNT)}/{PRACTICE_COUNT}
                    </div>
                    <div className="trig-time-label">question</div>
                  </>
                )}
              </div>
              <div className="trig-progress">
                <div className="trig-progress-label">Correct {currentCorrect}</div>
                <div className="trig-run-counts">
                  <span>Misses {currentMisses}</span>
                  <span>Answered {answered}</span>
                </div>
              </div>
            </div>

            <div className="trig-stage">
              <div className="trig-left">
                <div className="trig-question-wrap" key={q.id}>
                  <p className="trig-type">{q.tag}</p>
                  <QuestionMath q={q} />
                </div>

                <div className="trig-answer">
                  <span>x =</span>
                  <input
                    ref={answerRef}
                    className={shakeAnswer ? "is-shaking" : ""}
                    value={answer}
                    onChange={(event) => setAnswer(cleanDecimalAnswer(event.target.value))}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") submit();
                    }}
                    inputMode="none"
                    aria-label="x value"
                  />
                  <span className="trig-unit">{answerUnit(q)}</span>
                </div>

                <button type="button" className="trig-button submit" onClick={submit}>
                  Submit
                </button>

                {feedback && (
                  <div className="trig-feedback">
                    <span>Answer marked</span>
                    <strong>Incorrect</strong>
                  </div>
                )}
              </div>

              <div className="trig-right">
                <Keypad
                  onInsert={insertAnswer}
                  onBackspace={() => setAnswer((current) => current.slice(0, -1))}
                  onClear={() => setAnswer("")}
                />
                <button
                  type="button"
                  className="trig-button link"
                  onClick={() => finishRun(currentCorrect, history)}
                >
                  End and review
                </button>
              </div>
            </div>
          </section>
        )}

        {phase === "review" && (
          <section className="trig-review">
            <div className="trig-review-head">
              <div>
                <div className="trig-stamp">{currentCorrect} correct</div>
                <p className="trig-review-note">
                  {runTimed ? "One-minute run" : `${review.length} question set`}
                  {lastWasBest ? " - new best minute" : ""}
                </p>
              </div>
              <div className="trig-review-actions">
                <button type="button" className="trig-button primary" onClick={start}>
                  Try again
                </button>
                <button type="button" className="trig-button secondary" onClick={goHome}>
                  Home
                </button>
              </div>
            </div>

            {review.length > 0 ? (
              <div className="trig-review-list">
                {review.map((item, index) => (
                  <ReviewRow key={item.id} item={item} index={index} />
                ))}
              </div>
            ) : (
              <p className="trig-empty-review">No submitted answers in this run.</p>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export default TrigRatioWidget;
