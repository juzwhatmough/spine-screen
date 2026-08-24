import Link from "next/link";

export function TabNav({ active }: { active: "books" | "shows" }) {
  return (
    <div className="tab-nav" role="tablist">
      <Link href="/books" className={active === "books" ? "active" : ""} role="tab">
        📚 Books
      </Link>
      <Link href="/shows" className={active === "shows" ? "active" : ""} role="tab">
        📺 Shows
      </Link>
    </div>
  );
}
