// Hand-written types matching supabase/migrations/0001_init.sql.
// Keep in sync with the schema — regenerate with `supabase gen types
// typescript` once the Supabase CLI is wired up, if ever.

export type SourceStatus = "want" | "more" | "discover" | "ai" | "ai-known";

export type ListItemMeta = {
  hook?: string;
  source_status?: SourceStatus;
  // Shows only. `creator` holds the streaming platform for show rows (see
  // lib/shows/seedData.ts for why) — `note` and `currentlyStreaming` live
  // in meta since there's no dedicated column for them.
  note?: string | null;
  currentlyStreaming?: boolean;
};

export type ListItemRow = {
  id: string;
  user_id: string;
  media_type: "book" | "show";
  title: string;
  creator: string | null;
  genre: string | null;
  status: "want" | "in_progress" | "done";
  rating: "loved" | "liked" | "disliked" | null;
  meta: ListItemMeta;
  created_at: string;
};

export type UserProfileRow = {
  id: string;
  favorite_authors: string[];
  favorite_genres: string[];
  loved_books: string[];
  disliked_books: string[];
  loved_shows: string[];
  disliked_shows: string[];
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      list_items: {
        Row: ListItemRow;
        Insert: Partial<ListItemRow> &
          Pick<ListItemRow, "user_id" | "title"> & { media_type?: "book" | "show" };
        Update: Partial<ListItemRow>;
        Relationships: [];
      };
      user_profile: {
        Row: UserProfileRow;
        Insert: Partial<UserProfileRow> & Pick<UserProfileRow, "id">;
        Update: Partial<UserProfileRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};
