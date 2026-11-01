import { ShowCard } from "./ShowCard";
import { MoreSuggestionsShow } from "./MoreSuggestionsShow";
import type { ShowShelfData } from "@/lib/shows/groupItems";
import type { ListItemRow } from "@/types/database";

export function ShowShelf({
  shelf,
  platformLabel,
  animatingOut,
  isDone,
  getRating,
  onItemStatusChange,
  onItemRatingChange,
  onOpenDetail,
}: {
  shelf: ShowShelfData;
  // Mirrors BookShelf.tsx's authorLabel — "All services", the selected
  // platform, "Not currently streaming" or "Unconfirmed" depending on
  // which filter chip is active.
  platformLabel: string;
  animatingOut: Set<string>;
  isDone: (item: ListItemRow) => boolean;
  getRating: (item: ListItemRow) => ListItemRow["rating"];
  onItemStatusChange: (itemId: string, nowDone: boolean, title?: string) => void;
  onItemRatingChange: (itemId: string, rating: ListItemRow["rating"]) => void;
  onOpenDetail: (itemId: string, trigger: HTMLButtonElement) => void;
}) {
  return (
    <section className="shelf" id={shelf.id}>
      <div className="mq-shelf-head-row">
        <div>
          <h2 className="mq-shelf-heading">{shelf.tag}</h2>
          <p className="mq-shelf-subline">
            {platformLabel} · {shelf.items.length} {shelf.items.length === 1 ? "show" : "shows"}
          </p>
        </div>
        <MoreSuggestionsShow genre={shelf.tag} />
      </div>

      <div className="cards">
        {shelf.items.map((item) => (
          <ShowCard
            key={item.id}
            item={item}
            watched={isDone(item)}
            rating={getRating(item)}
            exiting={animatingOut.has(item.id)}
            onStatusChange={onItemStatusChange}
            onRatingChange={onItemRatingChange}
            onOpenDetail={onOpenDetail}
          />
        ))}
      </div>
    </section>
  );
}
