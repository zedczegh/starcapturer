
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

type Profile = {
  username: string | null;
  created_at: string;
};

export default function SupabaseConnectionTest() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("username, created_at")
          .limit(10);

        if (error) {
          throw error;
        }

        setProfiles(data);
      } catch (error: any) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h1>Supabase Connection Test</h1>
      <p>This page demonstrates a connection to the Supabase backend by fetching the first 10 profiles.</p>
      <ul>
        {profiles.map((profile) => (
          <li key={profile.created_at}>
            <strong>Username:</strong> {profile.username || "N/A"}, <strong>Created At:</strong> {profile.created_at}
          </li>
        ))}
      </ul>
    </div>
  );
}
