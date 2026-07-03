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
  tealTint: "#DDF0EC",
  gold: "#E0A12B",
  goldTint: "#FBE9C2",
  green: "#2E7D32",
  greenTint: "#E1F0DC",
};

const RUN_MS = 60000;
const PRACTICE_COUNT = 12;
const GRID_MIN = -6;
const GRID_MAX = 6;
const EPS = 1e-9;
const ANSWER_TOLERANCE = 0.006;

const RUN_TYPES = [
  "gradient",
  "y_intercept",
  "equation",
  "point",
  "x_intercept",
  "gradient",
  "equation",
  "point",
  "y_intercept",
  "x_intercept",
  "gradient",
  "equation",
];

function gcd(a, b) {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

function ratio(n, d = 1) {
  if (d === 0) throw new Error("Ratio denominator cannot be 0.");
  const sign = d < 0 ? -1 : 1;
  const divisor = gcd(n, d);
  return {
    n: (sign * n) / divisor,
    d: Math.abs(d) / divisor,
  };
}

const SLOPES = [
  ratio(-3),
  ratio(-2),
  ratio(-3, 2),
  ratio(-1),
  ratio(-2, 3),
  ratio(-1, 2),
  ratio(1, 2),
  ratio(2, 3),
  ratio(1),
  ratio(3, 2),
  ratio(2),
  ratio(3),
];

const INTEGER_SLOPES = [ratio(-3), ratio(-2), ratio(-1), ratio(1), ratio(2), ratio(3)];

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

function ratioValue(r) {
  return r.n / r.d;
}

function yForX(m, b, x) {
  return ratioValue(m) * x + b;
}

function inGrid(n) {
  return n >= GRID_MIN - EPS && n <= GRID_MAX + EPS;
}

function isIntegerish(n) {
  return Math.abs(n - Math.round(n)) < EPS;
}

function minusNumber(n) {
  return n < 0 ? `\u2212${Math.abs(n)}` : String(n);
}

function formatRatio(r) {
  if (r.d === 1) return minusNumber(r.n);
  const sign = r.n < 0 ? "\u2212" : "";
  return `${sign}${Math.abs(r.n)}/${r.d}`;
}

function formatSlopeTerm(m) {
  if (m.d === 1 && m.n === 1) return "x";
  if (m.d === 1 && m.n === -1) return "\u2212x";
  return `${formatRatio(m)}x`;
}

function formatEquation(m, b) {
  const base = `y = ${formatSlopeTerm(m)}`;
  if (b === 0) return base;
  return b < 0 ? `${base} \u2212 ${Math.abs(b)}` : `${base} + ${b}`;
}

function pointKey(p) {
  return `${p.x},${p.y}`;
}

function formatPoint(p) {
  return `(${minusNumber(p.x)}, ${minusNumber(p.y)})`;
}

function pointEquals(a, b) {
  return a.x === b.x && a.y === b.y;
}

function isPointOnLine(line, point) {
  return Math.abs(yForX(line.m, line.b, point.x) - point.y) < EPS;
}

function latticePoints(m, b) {
  const pts = [];
  for (let x = GRID_MIN; x <= GRID_MAX; x++) {
    const y = yForX(m, b, x);
    if (inGrid(y) && isIntegerish(y)) pts.push({ x, y: Math.round(y) });
  }
  return pts;
}

function clippedSegment(m, b) {
  const slope = ratioValue(m);
  const candidates = [];
  const add = (x, y) => {
    if (!Number.isFinite(x) || !Number.isFinite(y) || !inGrid(x) || !inGrid(y)) return;
    if (candidates.some((p) => Math.abs(p.x - x) < EPS && Math.abs(p.y - y) < EPS)) return;
    candidates.push({ x, y });
  };

  add(GRID_MIN, yForX(m, b, GRID_MIN));
  add(GRID_MAX, yForX(m, b, GRID_MAX));

  if (Math.abs(slope) > EPS) {
    add((GRID_MIN - b) / slope, GRID_MIN);
    add((GRID_MAX - b) / slope, GRID_MAX);
  }

  return candidates.slice(0, 2);
}

function makeLineWithSlope(slopes = SLOPES) {
  for (let i = 0; i < 120; i++) {
    const m = pick(slopes);
    const b = randInt(-5, 5);
    const pts = latticePoints(m, b);
    if (pts.length >= 2 && clippedSegment(m, b).length === 2) {
      return { m, b, markedPoints: pickMarkedPoints(pts) };
    }
  }
  return { m: ratio(1), b: 0, markedPoints: [{ x: -4, y: -4 }, { x: 4, y: 4 }] };
}

function makeLineWithIntegerXIntercept() {
  const xInts = [-5, -4, -3, -2, -1, 1, 2, 3, 4, 5];

  for (let i = 0; i < 120; i++) {
    const m = pick(INTEGER_SLOPES);
    const xIntercept = pick(xInts);
    const b = -ratioValue(m) * xIntercept;
    const pts = latticePoints(m, b);
    if (Number.isInteger(b) && inGrid(b) && pts.length >= 2 && clippedSegment(m, b).length === 2) {
      return {
        m,
        b,
        xIntercept,
        markedPoints: pickMarkedPoints(pts),
      };
    }
  }

  return {
    m: ratio(1),
    b: -2,
    xIntercept: 2,
    markedPoints: [{ x: -2, y: -4 }, { x: 4, y: 2 }],
  };
}

function pickMarkedPoints(points) {
  if (points.length <= 2) return points;
  return [points[0], points[points.length - 1]];
}

function uniquePoints(points) {
  const seen = new Set();
  return points.filter((point) => {
    const key = pointKey(point);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function boundedPoint(x, y) {
  return {
    x: Math.max(GRID_MIN, Math.min(GRID_MAX, x)),
    y: Math.max(GRID_MIN, Math.min(GRID_MAX, y)),
  };
}

function makeChoiceList(correct, extras) {
  const points = uniquePoints([correct, ...extras]).filter((point) => inGrid(point.x) && inGrid(point.y));

  while (points.length < 4) {
    const point = { x: randInt(GRID_MIN, GRID_MAX), y: randInt(GRID_MIN, GRID_MAX) };
    if (!points.some((item) => pointEquals(item, point))) points.push(point);
  }

  return shuffle(points.slice(0, 4)).map((point) => ({
    key: pointKey(point),
    label: formatPoint(point),
    point,
  }));
}

function makePointChoices(line, correct) {
  const wrongs = [
    boundedPoint(correct.x, correct.y + 1),
    boundedPoint(correct.x + 1, correct.y),
    boundedPoint(correct.x - 1, correct.y + 2),
    boundedPoint(correct.x + 2, correct.y - 1),
  ].filter((point) => !pointEquals(point, correct) && !isPointOnLine(line, point));

  while (wrongs.length < 3) {
    const point = { x: randInt(GRID_MIN, GRID_MAX), y: randInt(GRID_MIN, GRID_MAX) };
    if (!isPointOnLine(line, point) && !wrongs.some((item) => pointEquals(item, point))) {
      wrongs.push(point);
    }
  }

  return makeChoiceList(correct, wrongs);
}

function makeGradientQuestion() {
  const line = makeLineWithSlope();
  return {
    id: `gradient-${line.m.n}-${line.m.d}-${line.b}-${Math.random().toString(36).slice(2)}`,
    type: "gradient",
    mode: "number",
    tag: "gradient",
    prompt: "Calculate the gradient of the line.",
    m: line.m,
    b: line.b,
    markedPoints: line.markedPoints,
    answer: line.m,
  };
}

function makeYInterceptQuestion() {
  const line = makeLineWithSlope();
  const correct = { x: 0, y: line.b };
  const maybeXIntercept = -line.b / ratioValue(line.m);
  const extras = [
    { x: 0, y: Math.max(GRID_MIN, line.b - 2) },
    { x: 0, y: Math.min(GRID_MAX, line.b + 2) },
    isIntegerish(maybeXIntercept) && inGrid(maybeXIntercept) ? { x: Math.round(maybeXIntercept), y: 0 } : null,
    { x: line.b, y: 0 },
    { x: 1, y: line.b },
  ].filter(Boolean);

  return {
    id: `y-intercept-${line.m.n}-${line.m.d}-${line.b}-${Math.random().toString(36).slice(2)}`,
    type: "yIntercept",
    mode: "choice",
    tag: "y-intercept",
    prompt: "Select the y-intercept.",
    m: line.m,
    b: line.b,
    markedPoints: [],
    answer: correct,
    choices: makeChoiceList(correct, extras),
  };
}

function makeXInterceptQuestion() {
  const line = makeLineWithIntegerXIntercept();
  const correct = { x: line.xIntercept, y: 0 };
  const extras = [
    { x: 0, y: line.b },
    boundedPoint(line.xIntercept + 1, 0),
    boundedPoint(line.xIntercept - 2, 0),
    { x: 0, y: line.xIntercept },
    { x: line.b, y: 0 },
  ];

  return {
    id: `x-intercept-${line.m.n}-${line.b}-${line.xIntercept}-${Math.random()
      .toString(36)
      .slice(2)}`,
    type: "xIntercept",
    mode: "choice",
    tag: "x-intercept",
    prompt: "Select the x-intercept.",
    m: line.m,
    b: line.b,
    markedPoints: [],
    answer: correct,
    choices: makeChoiceList(correct, extras),
  };
}

function makeEquationQuestion() {
  const line = makeLineWithSlope();
  return {
    id: `equation-${line.m.n}-${line.m.d}-${line.b}-${Math.random().toString(36).slice(2)}`,
    type: "equation",
    mode: "equation",
    tag: "equation",
    prompt: "Complete y = mx + c for the line.",
    m: line.m,
    b: line.b,
    markedPoints: line.markedPoints,
    answer: { m: line.m, c: line.b },
  };
}

function makePointQuestion() {
  const line = makeLineWithSlope();
  const points = latticePoints(line.m, line.b);
  const nonIntercepts = points.filter((point) => point.x !== 0 && point.y !== 0);
  const correct = pick(nonIntercepts.length ? nonIntercepts : points);

  return {
    id: `point-${line.m.n}-${line.m.d}-${line.b}-${correct.x}-${correct.y}-${Math.random()
      .toString(36)
      .slice(2)}`,
    type: "point",
    mode: "choice",
    tag: "point on the graph",
    prompt: "Select one point the line would go through.",
    m: line.m,
    b: line.b,
    markedPoints: [],
    answer: correct,
    choices: makePointChoices(line, correct),
  };
}

function genQuestion(type) {
  if (type === "gradient") return makeGradientQuestion();
  if (type === "y_intercept") return makeYInterceptQuestion();
  if (type === "x_intercept") return makeXInterceptQuestion();
  if (type === "equation") return makeEquationQuestion();
  if (type === "point") return makePointQuestion();
  throw new Error(`Unknown question type: ${type}`);
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

function cleanMathAnswer(raw) {
  return raw.replace(/[^\d+\-./\u2212\u2013\u2014]/g, "").slice(0, 10);
}

function parseMathAnswer(raw) {
  const t = raw.trim().replace(/[\u2212\u2013\u2014]/g, "-").replace(/\s+/g, "");
  if (!t) return null;

  const parts = t.split("/");
  if (parts.length === 2) {
    if (!/^[+-]?\d+$/.test(parts[0]) || !/^[+-]?\d+$/.test(parts[1])) return null;
    const denominator = Number(parts[1]);
    if (denominator === 0) return null;
    return Number(parts[0]) / denominator;
  }

  if (/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(t)) return Number(t);
  return null;
}

function numberCorrect(raw, expected) {
  const parsed = parseMathAnswer(raw);
  return parsed != null && Math.abs(parsed - expected) <= ANSWER_TOLERANCE;
}

function blankAnswer() {
  return { single: "", m: "", c: "", choice: null };
}

function isCorrect(answer, q) {
  if (q.mode === "choice") return answer.choice === pointKey(q.answer);
  if (q.mode === "number") return numberCorrect(answer.single, ratioValue(q.answer));
  return numberCorrect(answer.m, ratioValue(q.answer.m)) && numberCorrect(answer.c, q.answer.c);
}

function canSubmit(answer, q) {
  if (!q) return false;
  if (q.mode === "choice") return answer.choice != null;
  if (q.mode === "number") return parseMathAnswer(answer.single) != null;
  return parseMathAnswer(answer.m) != null && parseMathAnswer(answer.c) != null;
}

function answerLabel(q) {
  if (q.type === "gradient") return `m = ${formatRatio(q.answer)}`;
  if (q.type === "equation") return formatEquation(q.answer.m, q.answer.c);
  return formatPoint(q.answer);
}

function studentLabel(q, answer) {
  if (q.mode === "choice") {
    const selected = q.choices.find((choice) => choice.key === answer.choice);
    return selected ? selected.label : "No point selected";
  }
  if (q.mode === "number") return `m = ${answer.single}`;
  return `m = ${answer.m}, c = ${answer.c}`;
}

function questionText(q) {
  if (q.type === "gradient") return "gradient of the graphed line";
  if (q.type === "equation") return "equation of the graphed line";
  if (q.type === "point") return "point on the graphed line";
  if (q.type === "xIntercept") return "x-intercept of the graphed line";
  return "y-intercept of the graphed line";
}

function StatCard({ label, value, accent }) {
  return (
    <div className="lin-stat" style={{ "--accent": accent }}>
      <div className="lin-stat-value">{value}</div>
      <div className="lin-stat-label">{label}</div>
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
      className="lin-key"
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
    <div className="lin-keypad">
      <div className="lin-keypad-head">
        <span>Answer</span>
        <strong>fractions allowed</strong>
      </div>
      <div className="lin-keys">
        {[1, 2, 3].map((n) => (
          <Btn key={n} onPress={() => onInsert(String(n))}>
            {n}
          </Btn>
        ))}
        <Btn onPress={onBackspace} bg={C.goldTint}>
          Del
        </Btn>
        {[4, 5, 6].map((n) => (
          <Btn key={n} onPress={() => onInsert(String(n))}>
            {n}
          </Btn>
        ))}
        <Btn onPress={() => onInsert("/")}>/</Btn>
        {[7, 8, 9].map((n) => (
          <Btn key={n} onPress={() => onInsert(String(n))}>
            {n}
          </Btn>
        ))}
        <Btn onPress={() => onInsert("-")}>-</Btn>
        <Btn onPress={() => onInsert(".")}>.</Btn>
        <Btn onPress={() => onInsert("0")}>0</Btn>
        <Btn onPress={onClear} bg={C.redTint} color={C.redDeep} span={2}>
          Clear
        </Btn>
      </div>
    </div>
  );
}

function ChoicePanel({ q, answer, setAnswer }) {
  return (
    <div className="lin-options" role="listbox" aria-label="answer options">
      {q.choices.map((choice) => (
        <button
          key={choice.key}
          type="button"
          className={`lin-choice ${answer.choice === choice.key ? "is-selected" : ""}`}
          onClick={() => setAnswer((current) => ({ ...current, choice: choice.key }))}
        >
          {choice.label}
        </button>
      ))}
    </div>
  );
}

function AnswerEntry({ q, answer, setAnswer, setActiveSlot, inputRef, mRef, cRef, shakeAnswer }) {
  if (q.mode === "choice") {
    return (
      <div className="lin-choice-prompt">
        <span>Choose a coordinate</span>
      </div>
    );
  }

  if (q.mode === "equation") {
    return (
      <div className={`lin-equation-answer ${shakeAnswer ? "is-shaking" : ""}`}>
        <span className="lin-equation-label">y = mx + c</span>
        <label>
          <span>m</span>
          <input
            ref={mRef}
            value={answer.m}
            onFocus={() => setActiveSlot("m")}
            onChange={(event) =>
              setAnswer((current) => ({ ...current, m: cleanMathAnswer(event.target.value) }))
            }
            inputMode="text"
            aria-label="gradient m"
          />
        </label>
        <label>
          <span>c</span>
          <input
            ref={cRef}
            value={answer.c}
            onFocus={() => setActiveSlot("c")}
            onChange={(event) =>
              setAnswer((current) => ({ ...current, c: cleanMathAnswer(event.target.value) }))
            }
            inputMode="text"
            aria-label="intercept c"
          />
        </label>
      </div>
    );
  }

  return (
    <div className="lin-number-answer">
      <span>m =</span>
      <input
        ref={inputRef}
        className={shakeAnswer ? "is-shaking" : ""}
        value={answer.single}
        onFocus={() => setActiveSlot("single")}
        onChange={(event) =>
          setAnswer((current) => ({ ...current, single: cleanMathAnswer(event.target.value) }))
        }
        inputMode="text"
        aria-label="gradient value"
      />
    </div>
  );
}

function CoordinateGraph({ q }) {
  const size = 420;
  const pad = 34;
  const plot = size - pad * 2;
  const span = GRID_MAX - GRID_MIN;
  const toX = (x) => pad + ((x - GRID_MIN) / span) * plot;
  const toY = (y) => pad + ((GRID_MAX - y) / span) * plot;
  const segment = clippedSegment(q.m, q.b);
  const ticks = [];
  for (let n = GRID_MIN; n <= GRID_MAX; n++) ticks.push(n);

  return (
    <svg className="lin-graph" viewBox={`0 0 ${size} ${size}`} role="img" aria-label="coordinate graph">
      <rect className="lin-graph-paper" x="0" y="0" width={size} height={size} rx="6" />

      {ticks.map((n) => (
        <g key={`grid-${n}`}>
          <line className="lin-grid-line" x1={toX(n)} y1={pad} x2={toX(n)} y2={size - pad} />
          <line className="lin-grid-line" x1={pad} y1={toY(n)} x2={size - pad} y2={toY(n)} />
        </g>
      ))}

      <line className="lin-axis" x1={toX(0)} y1={pad} x2={toX(0)} y2={size - pad} />
      <line className="lin-axis" x1={pad} y1={toY(0)} x2={size - pad} y2={toY(0)} />

      {ticks
        .filter((n) => n !== 0)
        .map((n) => (
          <g key={`tick-${n}`}>
            <text className="lin-axis-label" x={toX(n)} y={toY(0) + 18} textAnchor="middle">
              {n}
            </text>
            <text className="lin-axis-label" x={toX(0) - 10} y={toY(n) + 4} textAnchor="end">
              {n}
            </text>
          </g>
        ))}

      <text className="lin-axis-name" x={size - pad + 14} y={toY(0) + 5}>
        x
      </text>
      <text className="lin-axis-name" x={toX(0) - 5} y={pad - 13} textAnchor="end">
        y
      </text>

      {segment.length === 2 && (
        <line
          className="lin-line"
          x1={toX(segment[0].x)}
          y1={toY(segment[0].y)}
          x2={toX(segment[1].x)}
          y2={toY(segment[1].y)}
        />
      )}

      {q.markedPoints.map((point) => (
        <g key={pointKey(point)}>
          <circle className="lin-point-halo" cx={toX(point.x)} cy={toY(point.y)} r="10" />
          <circle className="lin-point" cx={toX(point.x)} cy={toY(point.y)} r="5" />
        </g>
      ))}
    </svg>
  );
}

function ReviewRow({ item, index }) {
  return (
    <div className={`lin-review-row ${item.correct ? "is-correct" : "is-miss"}`}>
      <div className="lin-review-number">{index + 1}</div>
      <div className="lin-review-main">
        <div className="lin-review-question">{item.question}</div>
        <div className="lin-review-kind">{item.kind}</div>
      </div>
      <div className="lin-review-values">
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

.lin-root, .lin-root * {
  box-sizing: border-box;
}

.lin-root {
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

.lin-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: .52;
  background-image:
    linear-gradient(var(--line) 1px, transparent 1px),
    linear-gradient(90deg, var(--line) 1px, transparent 1px);
  background-size: 26px 26px;
  mask-image: radial-gradient(circle at 50% 22%, #000 0%, transparent 78%);
  -webkit-mask-image: radial-gradient(circle at 50% 22%, #000 0%, transparent 78%);
}

.lin-card {
  width: 100%;
  max-width: 610px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
  background: var(--card);
  border: 2px solid var(--ink);
  border-radius: 6px;
  box-shadow: 7px 8px 0 var(--ink);
  padding: 22px 24px 28px;
  transition: max-width .25s ease;
  animation: lin-riseIn 450ms cubic-bezier(.2,.8,.2,1);
}

.lin-card.is-running,
.lin-card.is-review {
  max-width: 1040px;
}

.lin-title {
  margin: 0;
  font-family: "Fraunces", Georgia, serif;
  font-size: 30px;
  line-height: 1.1;
  font-weight: 600;
  color: var(--ink);
}

.lin-title span {
  color: var(--teal);
  font-style: italic;
  font-weight: 500;
}

.lin-subtitle {
  margin: 7px 0 0;
  color: var(--ink-soft);
  font-size: 13px;
  font-weight: 500;
}

.lin-home {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding-top: 24px;
  text-align: center;
}

.lin-button {
  min-height: 48px;
  border: 2px solid var(--ink);
  border-radius: 6px;
  padding: 13px 22px;
  font: 700 15px/1 "Bricolage Grotesque", system-ui, sans-serif;
  color: var(--ink);
  cursor: pointer;
  transition: background-color 150ms ease, color 150ms ease, box-shadow 150ms ease;
}

.lin-button:disabled {
  cursor: not-allowed;
  opacity: .45;
}

.lin-button:focus-visible,
.lin-key:focus-visible,
.lin-choice:focus-visible,
.lin-number-answer input:focus-visible,
.lin-equation-answer input:focus-visible {
  outline: 3px solid var(--gold);
  outline-offset: 3px;
}

.lin-button.primary {
  min-width: 210px;
  background: var(--red);
  box-shadow: 4px 4px 0 var(--ink);
}

.lin-button.submit {
  width: 100%;
  margin-top: 14px;
  background: var(--ink);
  color: var(--card);
  box-shadow: 4px 4px 0 var(--gold);
}

.lin-button.secondary {
  background: var(--paper2);
  box-shadow: 3px 3px 0 var(--ink);
}

.lin-button.link {
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

.lin-timer-toggle {
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

.lin-timer-toggle input {
  width: 20px;
  height: 20px;
  margin: 0;
  accent-color: var(--teal);
  cursor: pointer;
}

.lin-timer-toggle span {
  flex: 1 1 auto;
  text-align: left;
  font-size: 14px;
  font-weight: 700;
}

.lin-timer-toggle strong {
  color: var(--teal);
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 13px;
  font-weight: 800;
}

.lin-stats {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
}

.lin-stat {
  min-width: 118px;
  flex: 1 1 118px;
  max-width: 154px;
  padding: 12px 14px 13px;
  border: 2px solid var(--ink);
  border-radius: 6px;
  background: var(--paper);
  box-shadow: 3px 3px 0 var(--accent);
  text-align: left;
  animation: lin-popIn 500ms cubic-bezier(.2,.8,.2,1);
}

.lin-stat-value {
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 23px;
  line-height: 1;
  font-weight: 800;
  color: var(--accent);
  font-variant-numeric: tabular-nums;
}

.lin-stat-label {
  margin-top: 7px;
  color: var(--ink-soft);
  font-size: 12px;
  font-weight: 700;
}

.lin-tagline {
  max-width: 450px;
  margin: 0;
  color: var(--ink-soft);
  font-size: 13px;
  line-height: 1.45;
  font-weight: 500;
}

.lin-topbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  margin-top: 20px;
  padding-top: 18px;
  border-top: 2px solid var(--line);
}

.lin-time,
.lin-practice-label {
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: clamp(28px, 7vw, 40px);
  line-height: 1;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.lin-practice-label {
  color: var(--teal);
  font-family: "Fraunces", Georgia, serif;
  font-style: italic;
  font-weight: 600;
}

.lin-time-label {
  margin-top: 6px;
  color: var(--ink-soft);
  font-size: 13px;
  font-weight: 700;
}

.lin-progress {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 9px;
  min-width: 132px;
}

.lin-progress-label {
  color: var(--ink-soft);
  font-size: 13px;
  font-weight: 700;
}

.lin-run-counts {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.lin-run-counts span {
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

.lin-stage {
  display: grid;
  grid-template-columns: minmax(0, 1.12fr) minmax(310px, .88fr);
  gap: 18px;
  align-items: start;
  margin-top: 18px;
}

.lin-graph-panel {
  min-width: 0;
  padding: 12px;
  border: 2px solid var(--ink);
  border-radius: 6px;
  background: var(--paper);
  box-shadow: 4px 4px 0 var(--teal);
}

.lin-graph {
  display: block;
  width: 100%;
  aspect-ratio: 1;
  max-height: 520px;
  overflow: visible;
}

.lin-graph-paper {
  fill: var(--card);
  stroke: var(--ink);
  stroke-width: 2;
}

.lin-grid-line {
  stroke: var(--line);
  stroke-width: 1.4;
}

.lin-axis {
  stroke: var(--ink);
  stroke-width: 2.3;
}

.lin-axis-label {
  fill: var(--ink-soft);
  font: 700 11px "JetBrains Mono", ui-monospace, monospace;
}

.lin-axis-name {
  fill: var(--red-deep);
  font: 800 15px "JetBrains Mono", ui-monospace, monospace;
}

.lin-line {
  stroke: var(--red);
  stroke-width: 5;
  stroke-linecap: round;
}

.lin-point-halo {
  fill: var(--gold-tint);
  stroke: var(--ink);
  stroke-width: 2;
}

.lin-point {
  fill: var(--teal);
  stroke: var(--ink);
  stroke-width: 1.5;
}

.lin-work-panel {
  min-width: 0;
}

.lin-question-wrap {
  min-height: 138px;
  padding: 16px 16px 18px;
  border: 2px solid var(--ink);
  border-radius: 6px;
  background: var(--paper);
  box-shadow: 4px 4px 0 var(--gold);
  animation: lin-qIn 300ms cubic-bezier(.2,.9,.3,1);
}

.lin-type {
  margin: 0 0 10px;
  color: var(--gold);
  font-size: 13px;
  font-weight: 700;
}

.lin-prompt {
  margin: 0;
  color: var(--ink);
  font-family: "Fraunces", Georgia, serif;
  font-size: clamp(25px, 4.4vw, 34px);
  line-height: 1.1;
  font-weight: 600;
}

.lin-hint {
  margin: 10px 0 0;
  color: var(--ink-soft);
  font-size: 13px;
  line-height: 1.35;
  font-weight: 700;
}

.lin-number-answer,
.lin-equation-answer,
.lin-choice-prompt {
  min-height: 76px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  margin-top: 14px;
  padding: 13px 12px;
  border: 2px solid var(--ink);
  border-radius: 6px;
  background: var(--paper);
  box-shadow: 4px 4px 0 var(--teal);
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: clamp(24px, 5.5vw, 34px);
  font-weight: 800;
}

.lin-number-answer input {
  width: 6.5ch;
  height: 52px;
  border: 2.5px solid var(--gold);
  border-radius: 6px;
  background: var(--gold-tint);
  color: var(--ink);
  font: inherit;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.lin-number-answer input.is-shaking,
.lin-equation-answer.is-shaking {
  animation: lin-shake 400ms;
}

.lin-equation-answer {
  flex-wrap: wrap;
  justify-content: flex-start;
  font-size: 18px;
}

.lin-equation-label {
  flex: 1 1 100%;
  color: var(--ink-soft);
  font-size: 13px;
  font-weight: 800;
}

.lin-equation-answer label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--teal);
}

.lin-equation-answer label span {
  min-width: 1.2ch;
}

.lin-equation-answer input {
  width: 6.5ch;
  height: 48px;
  border: 2.5px solid var(--gold);
  border-radius: 6px;
  background: var(--gold-tint);
  color: var(--ink);
  font: 800 22px "JetBrains Mono", ui-monospace, monospace;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.lin-choice-prompt {
  min-height: 58px;
  justify-content: flex-start;
  color: var(--ink-soft);
  font-size: 14px;
  font-weight: 800;
}

.lin-feedback {
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
  animation: lin-popIn 300ms cubic-bezier(.2,.8,.2,1);
}

.lin-feedback span {
  color: var(--ink-soft);
  font-size: 13px;
  font-weight: 700;
}

.lin-feedback strong {
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 16px;
  font-weight: 800;
}

.lin-keypad {
  margin-top: 14px;
  padding: 14px;
  border: 2px solid var(--ink);
  border-radius: 6px;
  background: var(--card);
  box-shadow: 4px 4px 0 var(--teal);
}

.lin-keypad-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
  color: var(--ink-soft);
  font-size: 12px;
  font-weight: 700;
}

.lin-keypad-head strong {
  color: var(--teal);
}

.lin-keys {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.lin-key,
.lin-choice {
  border: 2px solid var(--ink);
  border-radius: 6px;
  box-shadow: 3px 3px 0 var(--ink);
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-weight: 800;
  cursor: pointer;
  touch-action: manipulation;
}

.lin-key {
  height: 52px;
  font-size: 20px;
}

.lin-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 14px;
}

.lin-choice {
  min-height: 58px;
  background: var(--paper2);
  color: var(--ink);
  font-size: 18px;
  transition: background-color 150ms ease, box-shadow 150ms ease;
}

.lin-choice.is-selected {
  background: var(--teal-tint);
  box-shadow: 3px 3px 0 var(--teal);
}

.lin-review {
  padding-top: 22px;
}

.lin-review-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 14px;
  padding-top: 18px;
  border-top: 2px solid var(--line);
}

.lin-stamp {
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
  animation: lin-stampIn 550ms cubic-bezier(.2,.9,.3,1.2);
}

.lin-review-note {
  margin: 8px 0 0;
  color: var(--ink-soft);
  font-size: 14px;
  font-weight: 700;
}

.lin-review-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
}

.lin-review-list {
  display: grid;
  gap: 10px;
  margin-top: 18px;
}

.lin-review-row {
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

.lin-review-row.is-correct {
  --row-accent: var(--green);
}

.lin-review-row.is-miss {
  --row-accent: var(--red);
}

.lin-review-number {
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

.lin-review-question {
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 18px;
  font-weight: 800;
  overflow-wrap: anywhere;
}

.lin-review-kind {
  margin-top: 4px;
  color: var(--ink-soft);
  font-size: 12px;
  font-weight: 700;
}

.lin-review-values {
  display: grid;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
}

.lin-review-values span {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 6px;
  background: var(--card);
}

.lin-review-values strong {
  color: var(--ink);
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-weight: 800;
  text-align: right;
}

.lin-empty-review {
  margin: 18px 0 0;
  color: var(--ink-soft);
  font-weight: 700;
}

@keyframes lin-riseIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes lin-popIn {
  from { opacity: 0; transform: scale(.96); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes lin-qIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes lin-stampIn {
  from { opacity: 0; transform: rotate(-8deg) scale(.9); }
  to { opacity: 1; transform: rotate(-2deg) scale(1); }
}

@keyframes lin-shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-5px); }
  40% { transform: translateX(5px); }
  60% { transform: translateX(-3px); }
  80% { transform: translateX(3px); }
}

@media (max-width: 820px) {
  .lin-root {
    align-items: flex-start;
    padding-top: 12px;
  }

  .lin-card {
    padding: 18px 16px 22px;
  }

  .lin-stage {
    grid-template-columns: 1fr;
  }

  .lin-graph-panel {
    padding: 8px;
  }

  .lin-question-wrap {
    min-height: 0;
  }
}

@media (max-width: 560px) {
  .lin-topbar,
  .lin-review-head {
    align-items: stretch;
    flex-direction: column;
  }

  .lin-progress {
    align-items: flex-start;
  }

  .lin-run-counts {
    justify-content: flex-start;
  }

  .lin-options {
    grid-template-columns: 1fr;
  }

  .lin-review-row {
    grid-template-columns: 36px minmax(0, 1fr);
  }

  .lin-review-values {
    grid-column: 1 / -1;
  }
}
    `}</style>
  );
}

export function LinearEquationsWidget() {
  const [phase, setPhase] = useState("home");
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [runTimed, setRunTimed] = useState(false);
  const [question, setQuestion] = useState(null);
  const [queue, setQueue] = useState([]);
  const [answer, setAnswer] = useState(blankAnswer);
  const [activeSlot, setActiveSlot] = useState("single");
  const [elapsed, setElapsed] = useState(0);
  const [history, setHistory] = useState([]);
  const [review, setReview] = useState([]);
  const [currentCorrect, setCurrentCorrect] = useState(0);
  const [currentMisses, setCurrentMisses] = useState(0);
  const [bestTimed, setBestTimed] = useState(null);
  const [recentResult, setRecentResult] = useState(null);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [shakeAnswer, setShakeAnswer] = useState(false);
  const [lastWasBest, setLastWasBest] = useState(false);

  const startRef = useRef(0);
  const inputRef = useRef(null);
  const mRef = useRef(null);
  const cRef = useRef(null);

  const q = question;
  const isRunning = phase === "running";
  const isReview = phase === "review";
  const answered = history.length;
  const remainingMs = runTimed ? Math.max(0, RUN_MS - elapsed) : RUN_MS;

  const focusForQuestion = (nextQuestion) => {
    if (nextQuestion.mode === "equation") {
      setActiveSlot("m");
      window.setTimeout(() => mRef.current?.focus(), 30);
    } else if (nextQuestion.mode === "number") {
      setActiveSlot("single");
      window.setTimeout(() => inputRef.current?.focus(), 30);
    }
  };

  const finishRun = (score, finalHistory) => {
    const resultLabel = `${score}/${finalHistory.length || (runTimed ? score : PRACTICE_COUNT)}`;
    const best = runTimed && (bestTimed == null || score > bestTimed);

    if (runTimed) {
      if (best) setBestTimed(score);
      setRecentResult(score);
    } else {
      setRecentResult(resultLabel);
    }

    setLastWasBest(best);
    setReview(finalHistory);
    setFeedback(null);
    setShakeAnswer(false);
    setPhase("review");
  };

  useEffect(() => {
    if (!isRunning || !runTimed) return undefined;

    const id = window.setInterval(() => {
      const nextElapsed = performance.now() - startRef.current;
      setElapsed(nextElapsed);
      if (nextElapsed >= RUN_MS) {
        window.clearInterval(id);
        finishRun(currentCorrect, history);
      }
    }, 40);

    return () => window.clearInterval(id);
  }, [isRunning, runTimed, currentCorrect, history]);

  const start = () => {
    const timed = timerEnabled;
    const next = drawQuestion([]);
    setRunTimed(timed);
    setQuestion(next.question);
    setQueue(next.queue);
    setAnswer(blankAnswer());
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
    focusForQuestion(next.question);
  };

  const goHome = () => {
    setPhase("home");
    setRunTimed(false);
    setQuestion(null);
    setAnswer(blankAnswer());
    setFeedback(null);
  };

  const moveToNextQuestion = (sourceQueue = queue) => {
    const next = drawQuestion(sourceQueue);
    setQuestion(next.question);
    setQueue(next.queue);
    setAnswer(blankAnswer());
    focusForQuestion(next.question);
  };

  const insertAnswer = (ch) => {
    if (!q || q.mode === "choice") return;
    const slot = q.mode === "equation" ? activeSlot : "single";
    setAnswer((current) => ({
      ...current,
      [slot]: cleanMathAnswer(`${current[slot]}${ch}`),
    }));
  };

  const backspaceAnswer = () => {
    if (!q || q.mode === "choice") return;
    const slot = q.mode === "equation" ? activeSlot : "single";
    setAnswer((current) => ({
      ...current,
      [slot]: current[slot].slice(0, -1),
    }));
  };

  const clearAnswer = () => {
    if (!q || q.mode === "choice") return;
    const slot = q.mode === "equation" ? activeSlot : "single";
    setAnswer((current) => ({
      ...current,
      [slot]: "",
    }));
  };

  const submit = () => {
    if (!q || !canSubmit(answer, q)) return;
    if (runTimed && performance.now() - startRef.current >= RUN_MS) {
      finishRun(currentCorrect, history);
      return;
    }

    const correct = isCorrect(answer, q);
    const entry = {
      id: q.id,
      question: questionText(q),
      kind: q.tag,
      student: studentLabel(q, answer),
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
    "--teal-tint": C.tealTint,
    "--gold": C.gold,
    "--gold-tint": C.goldTint,
    "--green": C.green,
    "--green-tint": C.greenTint,
  };

  return (
    <div className="lin-root" style={vars}>
      <WidgetStyle />
      <div className="lin-bg" />
      <main className={`lin-card ${isRunning ? "is-running" : ""} ${isReview ? "is-review" : ""}`}>
        <header>
          <h1 className="lin-title">
            Linear Equations <span>{"\u00B7"} Graphs</span>
          </h1>
          <p className="lin-subtitle">
            gradient, intercepts, equations, and points on a straight line
          </p>
        </header>

        {phase === "home" && (
          <section className="lin-home">
            <label className="lin-timer-toggle">
              <input
                type="checkbox"
                checked={timerEnabled}
                onChange={(event) => setTimerEnabled(event.target.checked)}
              />
              <span>Timer</span>
              <strong>{timerEnabled ? "1 minute" : "off"}</strong>
            </label>

            <button type="button" className="lin-button primary" onClick={start}>
              {timerEnabled ? "Start 1 minute" : `Start ${PRACTICE_COUNT}`}
            </button>

            <div className="lin-stats" aria-label="session stats">
              <StatCard label="Best minute" value={statScore(bestTimed)} accent={C.teal} />
              <StatCard label="Last review" value={statScore(recentResult)} accent={C.gold} />
              <StatCard label="Correct so far" value={totalCorrect} accent={C.green} />
              <StatCard label="Attempts" value={totalAttempts} accent={C.redDeep} />
            </div>

            <p className="lin-tagline">
              Questions show a coordinate graph. Students calculate the gradient, identify
              intercepts, complete y = mx + c, or select a point on the line.
            </p>
          </section>
        )}

        {phase === "running" && q && (
          <section>
            <div className="lin-topbar">
              <div>
                {runTimed ? (
                  <>
                    <div className="lin-time">{fmt(remainingMs)}</div>
                    <div className="lin-time-label">time left</div>
                  </>
                ) : (
                  <>
                    <div className="lin-practice-label">
                      {Math.min(answered + 1, PRACTICE_COUNT)}/{PRACTICE_COUNT}
                    </div>
                    <div className="lin-time-label">question</div>
                  </>
                )}
              </div>
              <div className="lin-progress">
                <div className="lin-progress-label">Correct {currentCorrect}</div>
                <div className="lin-run-counts">
                  <span>Misses {currentMisses}</span>
                  <span>Answered {answered}</span>
                </div>
              </div>
            </div>

            <div className="lin-stage">
              <div className="lin-graph-panel">
                <CoordinateGraph q={q} />
              </div>

              <div className="lin-work-panel">
                <div className="lin-question-wrap" key={q.id}>
                  <p className="lin-type">{q.tag}</p>
                  <p className="lin-prompt">{q.prompt}</p>
                  <p className="lin-hint">
                    Use the graph. Fraction answers such as 2/3 and decimal answers are accepted.
                  </p>
                </div>

                <AnswerEntry
                  q={q}
                  answer={answer}
                  setAnswer={setAnswer}
                  setActiveSlot={setActiveSlot}
                  inputRef={inputRef}
                  mRef={mRef}
                  cRef={cRef}
                  shakeAnswer={shakeAnswer}
                />

                {q.mode === "choice" ? (
                  <ChoicePanel q={q} answer={answer} setAnswer={setAnswer} />
                ) : (
                  <Keypad onInsert={insertAnswer} onBackspace={backspaceAnswer} onClear={clearAnswer} />
                )}

                <button
                  type="button"
                  className="lin-button submit"
                  onClick={submit}
                  disabled={!canSubmit(answer, q)}
                >
                  Submit
                </button>

                {feedback && (
                  <div className="lin-feedback">
                    <span>Answer marked</span>
                    <strong>Incorrect</strong>
                  </div>
                )}

                <button type="button" className="lin-button link" onClick={() => finishRun(currentCorrect, history)}>
                  End and review
                </button>
              </div>
            </div>
          </section>
        )}

        {phase === "review" && (
          <section className="lin-review">
            <div className="lin-review-head">
              <div>
                <div className="lin-stamp">{currentCorrect} correct</div>
                <p className="lin-review-note">
                  {runTimed ? "One-minute run" : `${review.length} question set`}
                  {lastWasBest ? " - new best minute" : ""}
                </p>
              </div>
              <div className="lin-review-actions">
                <button type="button" className="lin-button primary" onClick={start}>
                  Try again
                </button>
                <button type="button" className="lin-button secondary" onClick={goHome}>
                  Home
                </button>
              </div>
            </div>

            {review.length > 0 ? (
              <div className="lin-review-list">
                {review.map((item, index) => (
                  <ReviewRow key={item.id} item={item} index={index} />
                ))}
              </div>
            ) : (
              <p className="lin-empty-review">No submitted answers in this run.</p>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export default LinearEquationsWidget;
