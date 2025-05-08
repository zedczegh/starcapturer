
export interface Comment {
  id: string;
  content: string;  // This is the field from the database, not "comment"
  created_at: string;
  image_url?: string | null;
  profiles?: {
    username: string | null;
    avatar_url: string | null;
  } | null;
  parent_id?: string | null;
  replies?: Comment[];
}
