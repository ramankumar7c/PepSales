export type NotificationType = 'EMAIL' | 'SMS' | 'IN_APP';
export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED';

export interface NotificationMetadata {
    email?: string;
    phoneNumber?: string;
    deviceId?: string;
    priority?: 'low' | 'medium' | 'high';
    [key: string]: any;
}

export interface Notification {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    metadata: NotificationMetadata;
    status: NotificationStatus;
    createdAt: string;
    updatedAt: string;
}

export interface CreateNotificationDto {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, any>;
} 