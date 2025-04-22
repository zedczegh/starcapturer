
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import NavBar from "@/components/NavBar";
import { useQuery } from '@tanstack/react-query';

interface AstroSpot {
  id: string;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  created_at: string;
}

const ManageAstroSpots = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: spots, isLoading, refetch } = useQuery({
    queryKey: ['userAstroSpots'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_astro_spots')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as AstroSpot[];
    },
    enabled: !!user
  });

  const handleDelete = async (spotId: string) => {
    try {
      const { error } = await supabase
        .from('user_astro_spots')
        .delete()
        .eq('id', spotId);
      
      if (error) throw error;
      
      toast.success("AstroSpot deleted successfully");
      refetch();
    } catch (error) {
      console.error('Error deleting astro spot:', error);
      toast.error("Failed to delete AstroSpot");
    }
  };

  const handleEdit = (spot: AstroSpot) => {
    navigate('/create-astro-spot', {
      state: {
        latitude: spot.latitude,
        longitude: spot.longitude,
        name: spot.name,
        isEditing: true,
        spotId: spot.id
      }
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="container py-8">
          <p>Please sign in to manage your AstroSpots.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-6">Manage Your AstroSpots</h1>
        {isLoading ? (
          <p>Loading your AstroSpots...</p>
        ) : spots && spots.length > 0 ? (
          <div className="grid gap-4">
            {spots.map((spot) => (
              <Card key={spot.id} className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">{spot.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {spot.description || 'No description'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Location: {spot.latitude.toFixed(6)}, {spot.longitude.toFixed(6)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(spot)}
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(spot.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <p>You haven't created any AstroSpots yet.</p>
        )}
      </div>
    </div>
  );
};

export default ManageAstroSpots;
