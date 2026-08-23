import { BookCard } from "./BookCard";
import type { AuthorGroup as AuthorGroupData } from "@/lib/books/groupItems";

export function AuthorGroup({ group, color }: { group: AuthorGroupData; color: string }) {
  return (
    <div className="author-group">
      <div className="author-row">
        <h3>{group.author}</h3>
      </div>
      <div className="cards">
        {group.items.map((item) => (
          <BookCard key={item.id} item={item} color={color} />
        ))}
      </div>
    </div>
  );
}
