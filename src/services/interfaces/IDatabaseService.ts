
export interface IUserService {
  getCurrentUser(): Promise<any>;
  updateUserProfile(userId: string, data: any): Promise<any>;
  getUserById(userId: string): Promise<any>;
}

export interface IAstroSpotService {
  getSpots(userId?: string): Promise<any[]>;
  getSpotById(spotId: string): Promise<any>;
  createSpot(data: any): Promise<any>;
  updateSpot(spotId: string, data: any): Promise<any>;
  deleteSpot(spotId: string): Promise<boolean>;
}

export interface IReservationService {
  getReservations(userId: string): Promise<any[]>;
  createReservation(data: any): Promise<any>;
  updateReservation(reservationId: string, data: any): Promise<any>;
  cancelReservation(reservationId: string): Promise<boolean>;
}

export interface IMessagingService {
  getConversations(userId: string): Promise<any[]>;
  getMessages(senderId: string, receiverId: string): Promise<any[]>;
  sendMessage(data: any): Promise<any>;
  markMessagesAsRead(senderId: string, receiverId: string): Promise<void>;
}
