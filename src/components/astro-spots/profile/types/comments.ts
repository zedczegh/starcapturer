
export interface Comment {
  id: string;
  content: string;
  created_at: string;
  image_url?: string | null;
  profiles?: {
    username: string | null;
    avatar_url: string | null;
  };
}
