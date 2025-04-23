
export interface Comment {
  id: string;
  content: string;
  created_at: string;
  profiles?: {
    username: string | null;
    avatar_url: string | null;
  };
}
