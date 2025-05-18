import { Request, Response } from 'express';
import { NotificationService } from '../services/notification.service';
import { Notification, CreateNotificationDto } from '../types/notification';

export class NotificationController {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  sendNotification = async (req: Request, res: Response): Promise<void> => {
    try {
      const notificationData: CreateNotificationDto = req.body;
      
      // Create a complete notification object
      const notification: Notification = {
        id: `notif_${Date.now()}`,
        userId: notificationData.userId,
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        metadata: notificationData.metadata || {},
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const result = await this.notificationService.sendNotification(notification);
      res.status(201).json(result);
    } catch (error) {
      console.error('Error sending notification:', error);
      res.status(500).json({ error: 'Failed to send notification' });
    }
  };

  getUserNotifications = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.params.id;
      const notifications = await this.notificationService.getUserNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error('Error getting user notifications:', error);
      res.status(500).json({ error: 'Failed to get user notifications' });
    }
  };
} 