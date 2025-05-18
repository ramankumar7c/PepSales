import { Request, Response } from 'express';
import { NotificationService } from '../services/notification.service';
import { CreateNotificationDto } from '../types/notification';

export class NotificationController {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  async createNotification(req: Request, res: Response): Promise<void> {
    try {
      const dto: CreateNotificationDto = req.body;
      const notification = await this.notificationService.createNotification(dto);
      res.status(201).json(notification);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create notification' });
    }
  }

  async getUserNotifications(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const notifications = await this.notificationService.getUserNotifications(id);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  }
} 