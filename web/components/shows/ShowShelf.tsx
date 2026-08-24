import { ShowCard } from "./ShowCard";
import { MoreSuggestionsShow } from "./MoreSuggestionsShow";
import type { ShowShelfData } from "@/lib/shows/groupItems";
import type { ListItemRow } from "@/types/database";

export function ShowShelf({
  shelf,
  animatingOut,
  isDone,
  getRating,
  onItemStatusChange,
  onItemRatingChange,
}: {
  shelf: ShowShelfData;
  animatingOut: Set<string>;
  isDone: (item: ListItemRow) => boolean;
  getRating: (item: ListItemRow) => ListItemRow["rating"];
  onItemStatusChange: (itemId: string, nowDone: boolean) => void;
  onItemRatingChange: (itemId: string, rating: ListItemRow["rating"]) => void;
}) {
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
          <ShowCard
            key={item.id}
            item={item}
            color={shelf.color}
            watched={isDone(item)}
            rating={getRating(item)}
            exiting={animatingOut.has(item.id)}
            onStatusChange={onItemStatusChange}
            onRatingChange={onItemRatingChange}
          />
        ))}
      </div>

      <div className="subhead-row">
        <span className="subhead">More to explore</span>
        <MoreSuggestionsShow genre={shelf.tag} />
      </div>
    </section>
  );
}
