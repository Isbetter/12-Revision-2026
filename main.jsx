import React from "react";
import { createRoot } from "react-dom/client";
import EquationMinuteLevelTwoWidget from "./equation-minute-level-two-widget.jsx";
import LinearEquationsWidget from "./linear-equations-widget.jsx";
import TrigRatioWidget from "./trig-ratio-widget.jsx";
import TwoStepEquationsWidget from "./two-step-equations-widget.jsx";

const INTERACTIVES = [
  {
    slug: "two-step-equations",
    title: "Two-step Equations",
    topic: "Algebra",
    summary: "Integer answers, positive and negative solutions, timer optional.",
    details: "Start practice or a one-minute run.",
    Component: TwoStepEquationsWidget,
  },
  {
    slug: "equation-minute-level-two",
    title: "Equation Minute Level Two",
    topic: "Algebra",
    summary: "Brackets, fractions, powers, and integer answers.",
    details: "Level two questions with optional timing.",
    Component: EquationMinuteLevelTwoWidget,
  },
  {
    slug: "linear-equations",
    title: "Linear Equations",
    topic: "Coordinate geometry",
    summary: "Gradient, intercepts, equation form, and points on a line.",
    details: "Graph questions with review at the end.",
    Component: LinearEquationsWidget,
  },
  {
    slug: "trig-ratios",
    title: "Trig Ratios",
    topic: "Trigonometry",
    summary: "sin, cos, tan with unknown sides or angles.",
    details: "Answers marked to one decimal place.",
    Component: TrigRatioWidget,
  },
];

function getSlugFromHash() {
  return window.location.hash.replace(/^#\/?/, "").trim();
}

function Preview({ slug }) {
  if (slug === "linear-equations") {
    return (
      <div className="preview preview-linear" aria-hidden="true">
        <span className="axis axis-x" />
        <span className="axis axis-y" />
        <span className="line" />
        <span className="point point-a" />
        <span className="point point-b" />
      </div>
    );
  }

  if (slug === "trig-ratios") {
    return (
      <div className="preview preview-trig" aria-hidden="true">
        <span className="triangle" />
        <span className="ratio">tan 42 = x/9</span>
      </div>
    );
  }

  if (slug === "equation-minute-level-two") {
    return (
      <div className="preview preview-equation" aria-hidden="true">
        <span>(x + 4)^2</span>
        <strong>= 49</strong>
      </div>
    );
  }

  return (
    <div className="preview preview-equation" aria-hidden="true">
      <span>5x - 8</span>
      <strong>= 27</strong>
    </div>
  );
}

function Hub() {
  return (
    <main className="hub-root">
      <section className="hub-hero">
        <div>
          <h1>Year 12 Revision Interactives</h1>
          <p>Four maths practice tools, built for quick revision sessions.</p>
        </div>
        <div className="hub-count" aria-label="4 interactives">
          <span>04</span>
          <strong>interactives</strong>
        </div>
      </section>

      <section className="interactive-list" aria-label="Revision interactives">
        {INTERACTIVES.map((interactive, index) => (
          <a className="interactive-card" href={`#/${interactive.slug}`} key={interactive.slug}>
            <div className="card-number">{String(index + 1).padStart(2, "0")}</div>
            <Preview slug={interactive.slug} />
            <div className="card-copy">
              <div className="card-topic">{interactive.topic}</div>
              <h2>{interactive.title}</h2>
              <p>{interactive.summary}</p>
              <span>{interactive.details}</span>
            </div>
            <div className="card-action">Open</div>
          </a>
        ))}
      </section>
    </main>
  );
}

function Player({ interactive }) {
  const ActiveInteractive = interactive.Component;

  return (
    <div className="player-root">
      <header className="player-bar">
        <a href="#">All interactives</a>
        <span>{interactive.title}</span>
      </header>
      <ActiveInteractive />
    </div>
  );
}

function HubStyle() {
  return (
    <style>{`
* {
  box-sizing: border-box;
}

html {
  min-height: 100%;
  background: #ffffff;
}

body {
  min-width: 320px;
  min-height: 100%;
  margin: 0;
  color: #111111;
  background: #ffffff;
  font-family: "Helvetica Neue", Helvetica, sans-serif;
}

a {
  color: inherit;
}

.hub-root {
  width: min(1180px, calc(100% - 32px));
  margin: 0 auto;
  padding: 40px 0 56px;
}

.hub-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 32px;
  align-items: end;
  padding-bottom: 30px;
  border-bottom: 1px solid #111111;
}

.hub-hero h1 {
  max-width: 760px;
  margin: 0;
  font-size: clamp(40px, 8vw, 96px);
  line-height: .95;
  font-weight: 700;
}

.hub-hero p {
  max-width: 500px;
  margin: 18px 0 0;
  color: #3f3f3f;
  font-size: 18px;
  line-height: 1.45;
}

.hub-count {
  min-width: 156px;
  padding: 14px 0 0;
  border-top: 8px solid #e4002b;
  text-align: right;
}

.hub-count span,
.hub-count strong {
  display: block;
}

.hub-count span {
  font-size: 72px;
  line-height: .82;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.hub-count strong {
  margin-top: 12px;
  color: #4d4d4d;
  font-size: 14px;
}

.interactive-list {
  display: grid;
  margin-top: 20px;
}

.interactive-card {
  display: grid;
  grid-template-columns: 72px minmax(148px, 220px) minmax(0, 1fr) auto;
  gap: 22px;
  align-items: stretch;
  min-height: 178px;
  padding: 20px 0;
  border-bottom: 1px solid #d8d8d8;
  text-decoration: none;
}

.interactive-card:focus-visible {
  outline: 3px solid #e4002b;
  outline-offset: 6px;
}

.interactive-card:hover .card-action {
  color: #e4002b;
}

.card-number {
  color: #e4002b;
  font-size: 22px;
  line-height: 1;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.preview {
  position: relative;
  min-height: 138px;
  overflow: hidden;
  border: 1px solid #111111;
  border-radius: 8px;
  background: #f7f7f8;
}

.preview-linear {
  background-image:
    linear-gradient(#dddddd 1px, transparent 1px),
    linear-gradient(90deg, #dddddd 1px, transparent 1px);
  background-size: 22px 22px;
}

.preview-linear .axis {
  position: absolute;
  background: #111111;
}

.preview-linear .axis-x {
  left: 0;
  right: 0;
  top: 58%;
  height: 1px;
}

.preview-linear .axis-y {
  top: 0;
  bottom: 0;
  left: 43%;
  width: 1px;
}

.preview-linear .line {
  position: absolute;
  left: 16px;
  top: 78px;
  width: 190px;
  height: 3px;
  background: #e4002b;
  transform: rotate(-27deg);
  transform-origin: left center;
}

.preview-linear .point {
  position: absolute;
  width: 12px;
  height: 12px;
  border: 2px solid #111111;
  border-radius: 50%;
  background: #ffffff;
}

.preview-linear .point-a {
  left: 58px;
  top: 72px;
}

.preview-linear .point-b {
  right: 42px;
  top: 42px;
}

.preview-equation {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 10px;
  padding: 22px;
}

.preview-equation span {
  font-size: 34px;
  line-height: 1;
  font-weight: 700;
}

.preview-equation strong {
  color: #e4002b;
  font-size: 28px;
  line-height: 1;
}

.preview-trig {
  display: grid;
  place-items: center;
  padding: 18px;
}

.preview-trig .triangle {
  width: 112px;
  height: 82px;
  border-left: 3px solid #111111;
  border-bottom: 3px solid #111111;
  transform: skewX(-32deg);
}

.preview-trig .ratio {
  position: absolute;
  right: 14px;
  bottom: 13px;
  padding: 5px 7px;
  border: 1px solid #111111;
  background: #ffffff;
  color: #e4002b;
  font-size: 13px;
  font-weight: 700;
}

.card-copy {
  align-self: center;
  min-width: 0;
}

.card-topic {
  margin-bottom: 10px;
  color: #5f5f5f;
  font-size: 14px;
}

.card-copy h2 {
  margin: 0;
  font-size: clamp(25px, 4vw, 44px);
  line-height: 1;
}

.card-copy p {
  max-width: 560px;
  margin: 12px 0 0;
  color: #3f3f3f;
  font-size: 16px;
  line-height: 1.45;
}

.card-copy span {
  display: block;
  margin-top: 11px;
  color: #5f5f5f;
  font-size: 14px;
}

.card-action {
  align-self: center;
  min-width: 64px;
  color: #111111;
  font-size: 16px;
  font-weight: 700;
  text-align: right;
}

.player-root {
  min-height: 100vh;
  background: #ffffff;
}

.player-bar {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 54px;
  padding: 0 18px;
  border-bottom: 1px solid #111111;
  background: #ffffff;
  font-size: 14px;
  font-weight: 700;
}

.player-bar a {
  color: #e4002b;
  text-decoration: none;
}

.player-bar a:focus-visible {
  outline: 3px solid #e4002b;
  outline-offset: 4px;
}

.player-bar span {
  min-width: 0;
  overflow: hidden;
  color: #3f3f3f;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 820px) {
  .hub-root {
    width: min(100% - 24px, 620px);
    padding-top: 24px;
  }

  .hub-hero {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .hub-count {
    width: 128px;
    min-width: 0;
    text-align: left;
  }

  .hub-count span {
    font-size: 56px;
  }

  .interactive-card {
    grid-template-columns: 48px minmax(0, 1fr);
    gap: 14px;
    min-height: 0;
  }

  .preview {
    grid-column: 1 / -1;
    min-height: 132px;
  }

  .card-copy {
    grid-column: 2;
  }

  .card-action {
    grid-column: 2;
    align-self: start;
    text-align: left;
  }
}

@media (max-width: 520px) {
  .hub-hero h1 {
    font-size: 42px;
  }

  .hub-hero p {
    font-size: 16px;
  }

  .interactive-card {
    grid-template-columns: 1fr;
  }

  .card-number,
  .card-copy,
  .card-action {
    grid-column: 1;
  }
}
`}</style>
  );
}

function App() {
  const [slug, setSlug] = React.useState(getSlugFromHash);
  const activeInteractive = INTERACTIVES.find((interactive) => interactive.slug === slug);

  React.useEffect(() => {
    const onHashChange = () => setSlug(getSlugFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  React.useEffect(() => {
    document.title = activeInteractive
      ? `${activeInteractive.title} | Year 12 Revision`
      : "Year 12 Revision Interactives";
  }, [activeInteractive]);

  return (
    <>
      <HubStyle />
      {activeInteractive ? <Player interactive={activeInteractive} /> : <Hub />}
    </>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
