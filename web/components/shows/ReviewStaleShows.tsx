"use client";

import { useRef, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { AvailabilityResult } from "./AvailabilityResult";
import { updateShowPlatform } from "@/lib/actions/listItems";
import {
  lookupShowAvailability,
  type AvailabilityResult as Availability,
} from "@/lib/actions/showAvailability";
import type { ListItemRow } from "@/types/database";

const CONCURRENCY = 3;

type RowState = { phase: "idle" } | { phase: "loading" } | { phase: "result"; result: Availability } | { phase: "saved"; platform: string } | { phase: "kept" };

// Bulk version of the per-card check. Lists every show whose platform is
// unconfirmed or hasn't been checked in 60+ days. "Check all" looks each
// one up (a few at a time); every change still needs an explicit tap.
export function ReviewStaleShows({ items }: { items: ListItemRow[] }) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Record<string, RowState>>({});
  const [running, setRunning] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  function set(id: string, state: RowState) {
    setRows((r) => ({ ...r, [id]: state }));
  }

  async function check(item: ListItemRow) {
    set(item.id, { phase: "loading" });
    try {
      set(item.id, { phase: "result", result: await lookupShowAvailability(item.title) });
    } catch {
      set(item.id, { phase: "result", result: { status: "error" } });
    }
  }

  async function checkAll() {
    setRunning(true);
    const queue = items.filter((i) => (rows[i.id]?.phase ?? "idle") === "idle");
    await Promise.all(
      Array.from({ length: CONCURRENCY }, async () => {
        for (let item = queue.shift(); item; item = queue.shift()) await check(item);
      })
    );
    setRunning(false);
  }

  async function accept(item: ListItemRow, platform: string) {
    set(item.id, { phase: "saved", platform });
    try {
      await updateShowPlatform(item.id, platform, true);
    } catch {
      alert("Could not save that platform right now — please try again.");
      set(item.id, { phase: "idle" });
    }
  }

  const remaining = items.filter((i) => {
    const p = rows[i.id]?.phase;
    return p !== "saved" && p !== "kept";
  }).length;
  const idleCount = items.filter((i) => (rows[i.id]?.phase ?? "idle") === "idle").length;

  return (
    <>
      <button ref={btnRef} type="button" className="review-btn" onClick={() => setOpen(true)}>
        ↻ Review {items.length} to check
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Check streaming services" returnFocusRef={btnRef}>
        <p className="review-progress">
          {remaining === 0
            ? "All done — nice."
            : `${remaining} left. These are unconfirmed or haven’t been checked in 60+ days. Australian availability from TMDB / JustWatch; nothing changes until you tap.`}
        </p>
        {idleCount > 0 && (
          <button
            type="button"
            className="primary-btn"
            style={{ marginBottom: 12 }}
            disabled={running}
            onClick={checkAll}
          >
            {running ? "Checking…" : `Check all ${idleCount}`}
          </button>
        )}
        <ul className="review-list">
          {items.map((item) => {
            const state = rows[item.id] ?? { phase: "idle" as const };
            return (
              <li key={item.id} className="review-row">
                <h3>{item.title}</h3>
                <p className="review-meta">Currently: {item.creator ?? "Unknown"}</p>
                {state.phase === "idle" && (
                  <button type="button" className="avail-link" onClick={() => check(item)}>
                    Check this one
                  </button>
                )}
                {state.phase === "loading" && <p className="review-meta">Checking…</p>}
                {state.phase === "result" && (
                  <AvailabilityResult
                    result={state.result}
                    currentPlatform={item.creator ?? ""}
                    onAccept={(p) => accept(item, p)}
                    onDismiss={() => set(item.id, { phase: "kept" })}
                  />
                )}
                {state.phase === "saved" && <p className="review-done">✓ Saved: {state.platform}</p>}
                {state.phase === "kept" && <p className="review-meta">Left as is</p>}
              </li>
            );
          })}
        </ul>
      </Modal>
    </>
  );
}
