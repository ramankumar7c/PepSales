import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';
import twilio from 'twilio';
import { Notification, NotificationType, NotificationStatus, CreateNotificationDto } from '../types/notification';
import { QueueService } from './queue.service';

// In-memory storage for notifications (replace with a database in production)
const notifications: Notification[] = [];

// Email configuration
const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
});

// SMS configuration
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export class NotificationService {
  private queueService: QueueService;

  constructor() {
    this.queueService = new QueueService();
    this.initializeQueue();
  }

  private async initializeQueue(): Promise<void> {
    await this.queueService.connect();
    await this.queueService.consumeNotifications(this.processNotification.bind(this));
  }

  async createNotification(dto: CreateNotificationDto): Promise<Notification> {
    const notification: Notification = {
      id: uuidv4(),
      ...dto,
      status: NotificationStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    notifications.push(notification);
    await this.queueService.publishNotification(notification);
    return notification;
  }

  async getUserNotifications(userId: string): Promise<Notification[]> {
    return notifications.filter(n => n.userId === userId);
  }

  private async processNotification(notification: Notification): Promise<void> {
    try {
      switch (notification.type) {
        case NotificationType.EMAIL:
          await this.sendEmail(notification);
          break;
        case NotificationType.SMS:
          await this.sendSMS(notification);
          break;
        case NotificationType.IN_APP:
          await this.sendInAppNotification(notification);
          break;
      }
      
      notification.status = NotificationStatus.SENT;
      notification.updatedAt = new Date();
    } catch (error) {
      notification.status = NotificationStatus.FAILED;
      notification.updatedAt = new Date();
      throw error;
    }
  }

  private async sendEmail(notification: Notification): Promise<void> {
    await emailTransporter.sendMail({
      from: process.env.SMTP_FROM,
      to: notification.metadata?.email,
      subject: notification.title,
      text: notification.message,
    });
  }

  private async sendSMS(notification: Notification): Promise<void> {
    await twilioClient.messages.create({
      body: `${notification.title}\n${notification.message}`,
      to: notification.metadata?.phoneNumber,
      from: process.env.TWILIO_PHONE_NUMBER,
    });
  }

  private async sendInAppNotification(notification: Notification): Promise<void> {
    // Implement in-app notification logic (e.g., WebSocket, push notification)
    // This is a placeholder for the actual implementation
    console.log('In-app notification:', notification);
  }

  async close(): Promise<void> {
    await this.queueService.close();
  }
} 