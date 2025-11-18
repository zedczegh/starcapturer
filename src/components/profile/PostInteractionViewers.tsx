import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Heart, ThumbsUp, Share2, Bookmark } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PostInteractionViewersProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface InteractionUser {
  user_id: string;
  interaction_type: string;
  created_at: string;
  profiles: {
    username: string | null;
    avatar_url: string | null;
  } | null;
}

export const PostInteractionViewers: React.FC<PostInteractionViewersProps> = ({
  postId,
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();

  const { data: interactions, isLoading } = useQuery({
    queryKey: ['post-interaction-viewers', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('post_interactions')
        .select('user_id, interaction_type, created_at')
        .eq('post_id', postId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles separately
      const userIds = [...new Set(data.map(d => d.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return data.map(interaction => ({
        ...interaction,
        profiles: profileMap.get(interaction.user_id) || null
      })) as InteractionUser[];
    },
    enabled: isOpen,
  });

  const groupedInteractions = React.useMemo(() => {
    if (!interactions) return { like: [], heart: [], share: [], collect: [] };

    return interactions.reduce(
      (acc, interaction) => {
        const type = interaction.interaction_type as keyof typeof acc;
        if (acc[type]) {
          acc[type].push(interaction);
        }
        return acc;
      },
      { like: [], heart: [], share: [], collect: [] } as Record<string, InteractionUser[]>
    );
  }, [interactions]);

  const handleUserClick = (userId: string) => {
    navigate(`/user/${userId}`);
    onClose();
  };

  const renderUserList = (users: InteractionUser[]) => {
    if (users.length === 0) {
      return (
        <div className="py-8 text-center text-muted-foreground">
          No interactions yet
        </div>
      );
    }

    return (
      <ScrollArea className="h-[400px]">
        <div className="space-y-2 p-4">
          {users.map((interaction) => (
            <div
              key={interaction.user_id + interaction.created_at}
              onClick={() => handleUserClick(interaction.user_id)}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent cursor-pointer transition-colors"
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={interaction.profiles?.avatar_url || ''} />
                <AvatarFallback>
                  {interaction.profiles?.username?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">
                  {interaction.profiles?.username || 'Anonymous User'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Post Interactions</DialogTitle>
          <DialogDescription>
            See who interacted with this post
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
        <Tabs defaultValue="like" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="like">
                <ThumbsUp className="h-4 w-4" />
                <span className="ml-1">{groupedInteractions.like.length}</span>
              </TabsTrigger>
              <TabsTrigger value="heart">
                <Heart className="h-4 w-4" />
                <span className="ml-1">{groupedInteractions.heart.length}</span>
              </TabsTrigger>
              <TabsTrigger value="share">
                <Share2 className="h-4 w-4" />
                <span className="ml-1">{groupedInteractions.share.length}</span>
              </TabsTrigger>
              <TabsTrigger value="collect">
                <Bookmark className="h-4 w-4" />
                <span className="ml-1">{groupedInteractions.collect.length}</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="like">
              {renderUserList(groupedInteractions.like)}
            </TabsContent>

            <TabsContent value="heart">
              {renderUserList(groupedInteractions.heart)}
            </TabsContent>

            <TabsContent value="share">
              {renderUserList(groupedInteractions.share)}
            </TabsContent>

            <TabsContent value="collect">
              {renderUserList(groupedInteractions.collect)}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};
