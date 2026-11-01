import { BookCard } from "./BookCard";
import type { AuthorGroup as AuthorGroupData } from "@/lib/books/groupItems";
import type { ListItemRow } from "@/types/database";

export function AuthorGroup({
  group,
  animatingOut,
  isDone,
  getRating,
  onItemStatusChange,
  onItemRatingChange,
  onOpenDetail,
}: {
  group: AuthorGroupData;
  animatingOut: Set<string>;
  isDone: (item: ListItemRow) => boolean;
  getRating: (item: ListItemRow) => ListItemRow["rating"];
  onItemStatusChange: (itemId: string, nowDone: boolean, title?: string) => void;
  onItemRatingChange: (itemId: string, rating: ListItemRow["rating"]) => void;
  onOpenDetail: (itemId: string, trigger: HTMLButtonElement) => void;
}) {
  return (
    <div className="author-group">
      <div className="author-row">
        <h3>{group.author}</h3>
      </div>
      <div className="cards">
        {group.items.map((item) => (
          <BookCard
            key={item.id}
            item={item}
            done={isDone(item)}
            rating={getRating(item)}
            exiting={animatingOut.has(item.id)}
            onStatusChange={onItemStatusChange}
            onRatingChange={onItemRatingChange}
            onOpenDetail={onOpenDetail}
          />
        ))}
      </div>
    </div>
  );
}
