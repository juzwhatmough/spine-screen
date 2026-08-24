import { ShowCard } from "./ShowCard";
import { MoreSuggestionsShow } from "./MoreSuggestionsShow";
import type { ShowShelfData } from "@/lib/shows/groupItems";

export function ShowShelf({ shelf }: { shelf: ShowShelfData }) {
  return (
    <section
      className="shelf"
      id={shelf.id}
      style={{ "--tagcolor": shelf.color } as React.CSSProperties}
    >
      <div className="shelf-head">
        <span className="shelf-tag" style={{ background: shelf.color }}>
          {shelf.tag}
        </span>
        <h2>{shelf.tag}</h2>
      </div>
      <p className="shelf-note">{shelf.note}</p>

      <div className="cards">
        {shelf.items.map((item) => (
          <ShowCard key={item.id} item={item} color={shelf.color} />
        ))}
      </div>

      <div className="subhead-row">
        <span className="subhead">More to explore</span>
        <MoreSuggestionsShow genre={shelf.tag} />
      </div>
    </section>
  );
}
