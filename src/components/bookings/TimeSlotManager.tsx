import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Plus, Loader2 } from 'lucide-react';
import TimeSlotForm from './TimeSlotForm';
import TimeSlotItem from './TimeSlotItem';
import { toast } from 'sonner';

interface TimeSlot {
  id: string;
  spot_id: string;
  creator_id: string;
  start_time: string;
  end_time: string;
  max_capacity: number;
  description: string;
  price: number;
  currency: string;
  astro_spot_reservations: {
    id: string;
    user_id: string;
    status: string;
    profiles?: {
      username?: string;
      avatar_url?: string;
    };
  }[];
}

interface TimeSlotManagerProps {
  spotId: string;
  isOwner: boolean;
  creatorId?: string;  // Adding this prop
  spotName?: string;   // Adding this prop
}

const TimeSlotManager: React.FC<TimeSlotManagerProps> = ({ 
  spotId, 
  isOwner,
  creatorId,  // Add these new props
  spotName 
}) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);

  const fetchTimeSlots = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('astro_spot_timeslots')
        .select(`
          *,
          astro_spot_reservations (
            id,
            user_id,
            status
          )
        `)
        .eq('spot_id', spotId)
        .order('start_time', { ascending: true });
      
      if (error) throw error;
      
      // For each reservation, fetch the profile data
      const enhancedData = await Promise.all((data || []).map(async (slot) => {
        if (slot.astro_spot_reservations && slot.astro_spot_reservations.length > 0) {
          const enhancedReservations = await Promise.all(slot.astro_spot_reservations.map(async (reservation) => {
            try {
              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('username, avatar_url')
                .eq('id', reservation.user_id)
                .single();
                
              if (profileError) throw profileError;
              
              return {
                ...reservation,
                profiles: profileData || { username: 'Unknown User', avatar_url: null }
              };
            } catch (err) {
              // If we can't fetch the profile, just return the reservation with default values
              return {
                ...reservation,
                profiles: { username: 'Unknown User', avatar_url: null }
              };
            }
          }));
          
          return {
            ...slot,
            astro_spot_reservations: enhancedReservations
          };
        }
        
        return slot;
      }));
      
      setTimeSlots(enhancedData as TimeSlot[]);
    } catch (error) {
      console.error('Error fetching time slots:', error);
      toast.error(t('Failed to load time slots', '加载时段失败'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (spotId) {
      fetchTimeSlots();
    }
  }, [spotId]);

  const handleAddSlot = () => {
    setEditingSlot(null);
    setShowForm(true);
  };

  const handleEditSlot = (slot: TimeSlot) => {
    setEditingSlot(slot);
    setShowForm(true);
  };

  const handleSaveTimeSlot = async (formData: {
    start_time: string;
    end_time: string;
    max_capacity: number;
    description: string;
    price: number;
    currency: string;
  }) => {
    try {
      if (!user) return;
      
      if (editingSlot) {
        // Update existing time slot
        const { error } = await supabase.rpc('update_astro_spot_timeslot', {
          p_id: editingSlot.id,
          p_spot_id: spotId,
          p_creator_id: user.id,
          p_start_time: formData.start_time,
          p_end_time: formData.end_time,
          p_max_capacity: formData.max_capacity,
          p_description: formData.description,
          p_price: formData.price,
          p_currency: formData.currency
        });
        
        if (error) throw error;
        
        toast.success(t('Time slot updated successfully', '时段更新成功'));
      } else {
        // Create new time slot
        const { error } = await supabase.rpc('insert_astro_spot_timeslot', {
          p_spot_id: spotId,
          p_creator_id: user.id,
          p_start_time: formData.start_time,
          p_end_time: formData.end_time,
          p_max_capacity: formData.max_capacity,
          p_description: formData.description,
          p_price: formData.price,
          p_currency: formData.currency
        });
        
        if (error) throw error;
        
        toast.success(t('Time slot created successfully', '时段创建成功'));
      }
      
      setShowForm(false);
      fetchTimeSlots();
    } catch (error: any) {
      console.error('Error saving time slot:', error);
      toast.error(t('Failed to save time slot', '保存时段失败'));
    }
  };

  const handleDeleteTimeSlot = async (slotId: string) => {
    try {
      const { error } = await supabase
        .from('astro_spot_timeslots')
        .delete()
        .eq('id', slotId)
        .eq('spot_id', spotId);
        
      if (error) throw error;
      
      toast.success(t('Time slot deleted successfully', '时段删除成功'));
      fetchTimeSlots();
    } catch (error) {
      console.error('Error deleting time slot:', error);
      toast.error(t('Failed to delete time slot', '删除时段失败'));
    }
  };

  const handleCancelEdit = () => {
    setShowForm(false);
    setEditingSlot(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
        <span className="ml-2 text-cosmic-300">{t('Loading time slots...', '加载时段中...')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-cosmic-100">
          {t('Available Time Slots', '可用时段')}
        </h3>
        
        {isOwner && !showForm && (
          <Button 
            onClick={handleAddSlot}
            size="sm" 
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            <Plus className="h-4 w-4 mr-1" />
            {t('Add Time Slot', '添加时段')}
          </Button>
        )}
      </div>
      
      <Separator className="bg-cosmic-700/50" />
      
      {showForm ? (
        <TimeSlotForm 
          initialData={editingSlot}
          spotId={spotId}
          onSuccess={() => {
            setShowForm(false);
            fetchTimeSlots();
          }}
          onCancel={handleCancelEdit}
        />
      ) : timeSlots.length > 0 ? (
        <div className="space-y-4">
          {timeSlots.map(slot => (
            <TimeSlotItem
              key={slot.id}
              timeSlot={slot}
              isOwner={isOwner}
              onEdit={() => handleEditSlot(slot)}
              onDelete={() => handleDeleteTimeSlot(slot.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-cosmic-400">
          <p>{t('No time slots available for this spot yet.', '此地点暂无可用时段。')}</p>
          {isOwner && (
            <p className="mt-2">
              {t('Click "Add Time Slot" to create your first available time.', '点击"添加时段"创建您的第一个可用时间。')}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default TimeSlotManager;
