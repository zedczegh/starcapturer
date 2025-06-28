
import { supabase } from '@/integrations/supabase/client';
import { IUserService, IAstroSpotService, IReservationService, IMessagingService } from '../interfaces/IDatabaseService';

export class SupabaseUserService implements IUserService {
  async getCurrentUser(): Promise<any> {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  async updateUserProfile(userId: string, data: any): Promise<any> {
    const { data: profile, error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return profile;
  }

  async getUserById(userId: string): Promise<any> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  }
}

export class SupabaseAstroSpotService implements IAstroSpotService {
  async getSpots(userId?: string): Promise<any[]> {
    let query = supabase.from('user_astro_spots').select('*');
    
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getSpotById(spotId: string): Promise<any> {
    const { data, error } = await supabase
      .from('user_astro_spots')
      .select('*')
      .eq('id', spotId)
      .single();

    if (error) throw error;
    return data;
  }

  async createSpot(data: any): Promise<any> {
    const { data: spot, error } = await supabase
      .from('user_astro_spots')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return spot;
  }

  async updateSpot(spotId: string, data: any): Promise<any> {
    const { data: spot, error } = await supabase
      .from('user_astro_spots')
      .update(data)
      .eq('id', spotId)
      .select()
      .single();

    if (error) throw error;
    return spot;
  }

  async deleteSpot(spotId: string): Promise<boolean> {
    const { error } = await supabase
      .from('user_astro_spots')
      .delete()
      .eq('id', spotId);

    if (error) throw error;
    return true;
  }
}

export class SupabaseReservationService implements IReservationService {
  async getReservations(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('astro_spot_reservations')
      .select(`
        *,
        astro_spot_timeslots (
          *,
          user_astro_spots (*)
        )
      `)
      .eq('user_id', userId);

    if (error) throw error;
    return data || [];
  }

  async createReservation(data: any): Promise<any> {
    const { data: reservation, error } = await supabase
      .from('astro_spot_reservations')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return reservation;
  }

  async updateReservation(reservationId: string, data: any): Promise<any> {
    const { data: reservation, error } = await supabase
      .from('astro_spot_reservations')
      .update(data)
      .eq('id', reservationId)
      .select()
      .single();

    if (error) throw error;
    return reservation;
  }

  async cancelReservation(reservationId: string): Promise<boolean> {
    const { error } = await supabase
      .from('astro_spot_reservations')
      .update({ status: 'cancelled' })
      .eq('id', reservationId);

    if (error) throw error;
    return true;
  }
}

export class SupabaseMessagingService implements IMessagingService {
  async getConversations(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('user_messages')
      .select(`
        *,
        sender:profiles!user_messages_sender_id_fkey(*),
        receiver:profiles!user_messages_receiver_id_fkey(*)
      `)
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getMessages(senderId: string, receiverId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('user_messages')
      .select('*')
      .or(`and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async sendMessage(data: any): Promise<any> {
    const { data: message, error } = await supabase
      .from('user_messages')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return message;
  }

  async markMessagesAsRead(senderId: string, receiverId: string): Promise<void> {
    const { error } = await supabase
      .from('user_messages')
      .update({ read: true })
      .eq('sender_id', senderId)
      .eq('receiver_id', receiverId);

    if (error) throw error;
  }
}
