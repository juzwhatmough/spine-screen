"use client";

import { useEffect, useRef, useState } from "react";

const REVEAL = 88;
const ARM_THRESHOLD = 40;
const AUTO_DISMISS_MS = 4500;

// Only one card can be armed at a time.
let armedReset: (() => void) | null = null;

// Two-step by design (ported from index.html): a left swipe only *arms* the
// card, revealing a Delete button behind it. Nothing is removed until that
// button is deliberately tapped, and even then the Undo toast catches
// mistakes.
export function SwipeDelete({
  onDelete,
  children,
}: {
  onDelete: () => void;
  children: React.ReactNode;
}) {
  const [x, setX] = useState(0);
  const [armed, setArmed] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [collapsing, setCollapsing] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, lock: null as "x" | "y" | null, startX: 0, startY: 0, moved: false });
  const armTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function reset() {
    setX(0);
    setArmed(false);
    if (armTimer.current) clearTimeout(armTimer.current);
    if (armedReset === reset) armedReset = null;
  }

  function arm() {
    if (armedReset && armedReset !== reset) armedReset();
    armedReset = reset;
    setX(-REVEAL);
    setArmed(true);
    if (armTimer.current) clearTimeout(armTimer.current);
    armTimer.current = setTimeout(reset, AUTO_DISMISS_MS);
  }

  useEffect(() => {
    // tap anywhere else to put an armed card back
    function onDocClick(e: MouseEvent) {
      if (armed && wrapRef.current && !wrapRef.current.contains(e.target as Node)) reset();
    }
    document.addEventListener("click", onDocClick, true);
    return () => {
      document.removeEventListener("click", onDocClick, true);
      if (armTimer.current) clearTimeout(armTimer.current);
      if (armedReset === reset) armedReset = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [armed]);

  function onPointerDown(e: React.PointerEvent) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    drag.current = { active: true, lock: null, startX: e.clientX, startY: e.clientY, moved: false };
    setDragging(true);
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d.active) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (d.lock === null) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      d.lock = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      if (d.lock === "x") e.currentTarget.setPointerCapture(e.pointerId);
    }
    if (d.lock !== "x") return;
    d.moved = true;
    const base = armed ? -REVEAL : 0;
    setX(Math.min(0, Math.max(base + dx, -(REVEAL + 24))));
  }

  function onPointerUp() {
    const d = drag.current;
    if (!d.active) return;
    d.active = false;
    setDragging(false);
    if (d.lock !== "x") return;
    if (x <= -ARM_THRESHOLD) arm();
    else reset();
  }

  function onClickCapture(e: React.MouseEvent) {
    // a swipe (or a tap on an armed card) must not also toggle read/watched
    if (drag.current.moved) {
      drag.current.moved = false;
      e.stopPropagation();
      e.preventDefault();
    } else if (armed) {
      e.stopPropagation();
      e.preventDefault();
      reset();
    }
  }

  function confirm(e: React.MouseEvent) {
    e.stopPropagation();
    const el = wrapRef.current;
    if (el) el.style.height = el.getBoundingClientRect().height + "px";
    requestAnimationFrame(() => setCollapsing(true));
    setTimeout(onDelete, 320);
  }

  return (
    <div
      ref={wrapRef}
      className={`swipe-wrap${armed ? " armed" : ""}${dragging ? " dragging" : ""}${collapsing ? " removing" : ""}`}
      style={{ "--swipe-x": `${x}px`, ...(collapsing ? { height: 0, opacity: 0, marginBottom: 0 } : {}) } as React.CSSProperties}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        drag.current.active = false;
        setDragging(false);
        reset();
      }}
      onClickCapture={onClickCapture}
    >
      <div className="delete-bg" aria-hidden={!armed}>
        <button type="button" className="delete-confirm-btn" tabIndex={armed ? 0 : -1} onClick={confirm}>
          🗑 Delete
        </button>
      </div>
      {children}
    </div>
  );
}
