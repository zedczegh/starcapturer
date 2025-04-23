
import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { User, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import ProfileTagsSelector from "@/components/profile/ProfileTagsSelector";

interface ProfileData {
  username: string | null;
  avatar_url: string | null;
  tags: string[];
}

interface MessageData {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at: string;
  read: boolean;
}

const ProfileMini: React.FC = () => {
  const { id: profileId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profileId) return;
    const fetchData = async () => {
      setLoading(true);
      // Fetch profile
      const { data, error } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", profileId)
        .maybeSingle();
      if (!data || error) {
        setProfile(null);
        setLoading(false);
        return;
      }
      // Tags
      const { data: tagRows } = await supabase
        .from("profile_tags")
        .select("tag")
        .eq("user_id", profileId);
      setProfile({
        username: data.username || "Stargazer",
        avatar_url: data.avatar_url,
        tags: tagRows ? tagRows.map((t) => t.tag) : [],
      });
      setLoading(false);
    };
    fetchData();
  }, [profileId]);

  // Fetch messages with this user
  useEffect(() => {
    if (!user?.id || !profileId) return;
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("user_messages")
        .select("*")
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${profileId}),and(sender_id.eq.${profileId},receiver_id.eq.${user.id})`)
        .order("created_at", { ascending: true });
      if (data) setMessages(data);
    };
    fetchMessages();
    // Optionally: add real-time subscription here
  }, [user?.id, profileId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!user?.id || !profileId || !input.trim() || sending) return;
    setSending(true);
    const { error, data } = await supabase
      .from("user_messages")
      .insert({
        sender_id: user.id,
        receiver_id: profileId,
        message: input.trim(),
      })
      .select()
      .single();
    if (error) {
      toast.error("Failed to send message.");
      setSending(false);
      return;
    }
    setInput("");
    setMessages((prev) => [...prev, data]);
    setSending(false);
  };

  const onEnterPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSend();
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-cosmic-900">Loading...</div>;
  }
  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-cosmic-900 text-white">
        <User className="w-10 h-10 mb-4 text-cosmic-400" />
        <div>User not found.</div>
        <Button className="mt-4" onClick={() => navigate(-1)}>Back</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cosmic-900 to-cosmic-950 flex flex-col items-center px-4 pt-20">
      <Card className="max-w-xl w-full mx-auto mt-4 glassmorphism p-8 rounded-xl shadow-glow">
        <div className="flex gap-4 items-center mb-8">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="avatar" className="w-20 h-20 rounded-full border-2 border-primary shadow" />
          ) : (
            <div className="w-20 h-20 flex items-center justify-center rounded-full bg-cosmic-800 border-2 border-cosmic-700 shadow-glow">
              <User className="w-10 h-10 text-cosmic-400" />
            </div>
          )}
          <div>
            <h2 className="text-2xl font-bold text-white">
              {profile.username ? `@${profile.username}` : "Stargazer"}
            </h2>
            {profile.tags && profile.tags.length > 0 && (
              <div className="mt-2">
                <ProfileTagsSelector selectedTags={profile.tags} onChange={() => {}} disabled />
              </div>
            )}
          </div>
        </div>
        <div className="border border-cosmic-800 rounded-lg bg-cosmic-950/50 p-4 mb-6">
          <h3 className="mb-2 font-semibold flex items-center text-primary gap-1">
            <MessageCircle className="w-5 h-5" /> Messages
          </h3>
          <div className="overflow-y-auto h-64 bg-black/40 rounded-lg px-2 py-3 flex flex-col gap-2">
            {messages.length === 0 && <div className="text-cosmic-300 text-sm text-center mt-8">No messages yet. Start the conversation!</div>}
            {messages.map((msg) => (
              <div key={msg.id}
                className={`rounded-lg px-3 py-2 max-w-[70%] ${
                  msg.sender_id === user.id
                    ? "ml-auto bg-primary/70 text-white"
                    : "mr-auto bg-cosmic-800/80 text-cosmic-200"
                }`}
              >
                {msg.message}
                <div className="text-xs mt-1 text-cosmic-300 opacity-70 text-right">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="flex mt-3 gap-2">
            <Input
              value={input}
              disabled={sending}
              placeholder="Send a message..."
              onChange={e => setInput(e.target.value)}
              onKeyDown={onEnterPress}
              className="flex-1"
            />
            <Button
              type="button"
              onClick={handleSend}
              disabled={sending || !input.trim()}
              className="px-4"
            >Send</Button>
          </div>
        </div>
        <Button variant="secondary" onClick={() => navigate(-1)}>Back</Button>
      </Card>
    </div>
  );
};

export default ProfileMini;
