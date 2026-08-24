import { AuthorGroup } from "./AuthorGroup";
import { MoreSuggestions } from "./MoreSuggestions";
import type { BookShelfData } from "@/lib/books/groupItems";
import type { ListItemRow } from "@/types/database";

export function BookShelf({
  shelf,
  animatingOut,
  isDone,
  getRating,
  onItemStatusChange,
  onItemRatingChange,
}: {
  shelf: BookShelfData;
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

      {shelf.groups.map((group) => (
        <AuthorGroup
          key={group.author}
          group={group}
          color={shelf.color}
          animatingOut={animatingOut}
          isDone={isDone}
          getRating={getRating}
          onItemStatusChange={onItemStatusChange}
          onItemRatingChange={onItemRatingChange}
        />
      ))}

      <div className="subhead-row">
        <span className="subhead">More to explore</span>
        <MoreSuggestions genre={shelf.tag} />
      </div>
    </section>
  );
}
