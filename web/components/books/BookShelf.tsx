import { AuthorGroup } from "./AuthorGroup";
import { MoreSuggestions } from "./MoreSuggestions";
import type { BookShelfData } from "@/lib/books/groupItems";

export function BookShelf({ shelf }: { shelf: BookShelfData }) {
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
        <AuthorGroup key={group.author} group={group} color={shelf.color} />
      ))}

      <div className="subhead-row">
        <span className="subhead">More to explore</span>
        <MoreSuggestions genre={shelf.tag} />
      </div>
    </section>
  );
}
