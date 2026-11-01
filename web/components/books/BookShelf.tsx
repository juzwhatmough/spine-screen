import { AuthorGroup } from "./AuthorGroup";
import { MoreSuggestions } from "./MoreSuggestions";
import type { BookShelfData } from "@/lib/books/groupItems";
import type { ListItemRow } from "@/types/database";

export function BookShelf({
  shelf,
  authorLabel,
  animatingOut,
  isDone,
  getRating,
  onItemStatusChange,
  onItemRatingChange,
  onOpenDetail,
}: {
  shelf: BookShelfData;
  // "All authors" or the selected author's name (section 5.3's Author
  // chip) — combined with this shelf's own (already-filtered) title
  // count for the section 5.1/5.6 subline, e.g. "Mandy Robotham · 8
  // titles". Replaces the removed stats bar.
  authorLabel: string;
  animatingOut: Set<string>;
  isDone: (item: ListItemRow) => boolean;
  getRating: (item: ListItemRow) => ListItemRow["rating"];
  onItemStatusChange: (itemId: string, nowDone: boolean, title?: string) => void;
  onItemRatingChange: (itemId: string, rating: ListItemRow["rating"]) => void;
  onOpenDetail: (itemId: string, trigger: HTMLButtonElement) => void;
}) {
  const titleCount = shelf.groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <section className="shelf" id={shelf.id}>
      <div className="mq-shelf-head-row">
        <div>
          <h2 className="mq-shelf-heading">{shelf.tag}</h2>
          <p className="mq-shelf-subline">
            {authorLabel} · {titleCount} {titleCount === 1 ? "title" : "titles"}
          </p>
        </div>
        <MoreSuggestions genre={shelf.tag} />
      </div>

      {shelf.groups.map((group) => (
        <AuthorGroup
          key={group.author}
          group={group}
          animatingOut={animatingOut}
          isDone={isDone}
          getRating={getRating}
          onItemStatusChange={onItemStatusChange}
          onItemRatingChange={onItemRatingChange}
          onOpenDetail={onOpenDetail}
        />
      ))}
    </section>
  );
}
