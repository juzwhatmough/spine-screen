"use client";

import { useState } from "react";
import { GENRE_TAGS } from "@/lib/books/genres";

export function GenrePicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (genres: string[]) => void;
}) {
  const [otherText, setOtherText] = useState("");
  const otherActive = value.some((g) => !GENRE_TAGS.includes(g));

  function toggle(tag: string) {
    onChange(value.includes(tag) ? value.filter((g) => g !== tag) : [...value, tag]);
  }

  function toggleOther() {
    if (otherActive) {
      onChange(value.filter((g) => GENRE_TAGS.includes(g)));
      setOtherText("");
    } else if (otherText.trim()) {
      onChange([...value, otherText.trim()]);
    }
  }

  function updateOtherText(text: string) {
    setOtherText(text);
    const withoutOther = value.filter((g) => GENRE_TAGS.includes(g));
    onChange(text.trim() ? [...withoutOther, text.trim()] : withoutOther);
  }

  return (
    <div>
      <div className="chip-group">
        {GENRE_TAGS.map((tag) => (
          <button
            key={tag}
            type="button"
            className={`chip${value.includes(tag) ? " active" : ""}`}
            onClick={() => toggle(tag)}
          >
            {tag}
          </button>
        ))}
        <button
          type="button"
          className={`chip${otherActive ? " active" : ""}`}
          onClick={toggleOther}
        >
          Other
        </button>
      </div>
      {otherActive && (
        <div className="field" style={{ marginTop: 10 }}>
          <input
            type="text"
            placeholder="e.g. Fantasy, Poetry…"
            value={otherText}
            onChange={(e) => updateOtherText(e.target.value)}
          />
        </div>
      )}
    </div>
  );
}
