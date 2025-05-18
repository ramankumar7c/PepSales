import nodemailer from 'nodemailer';
import twilio from 'twilio';
import { Notification } from '../types/notification';
import { QueueService } from './queue.service';

export class NotificationService {
    private emailTransporter: nodemailer.Transporter;
    private twilioClient: twilio.Twilio;
    private queueService: QueueService;

    constructor() {
        // Initialize email transporter
        this.emailTransporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT),
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        // Initialize Twilio client
        this.twilioClient = twilio(
            process.env.TWILIO_ACCOUNT_SID,
            process.env.TWILIO_AUTH_TOKEN
        );

        // Initialize queue service
        this.queueService = new QueueService(this);
    }

    async sendNotification(notification: Notification): Promise<Notification> {
        try {
            // Enqueue the notification
            await this.queueService.enqueueNotification(notification);
            return notification;
        } catch (error) {
            console.error('Failed to enqueue notification:', error);
            throw error;
        }
    }

    async processNotification(notification: Notification): Promise<void> {
        try {
            switch (notification.type) {
                case 'EMAIL':
                    await this.sendEmail(notification);
                    break;
                case 'SMS':
                    await this.sendSMS(notification);
                    break;
                case 'IN_APP':
                    await this.sendInAppNotification(notification);
                    break;
                default:
                    throw new Error(`Unsupported notification type: ${notification.type}`);
            }
        } catch (error) {
            console.error('Failed to process notification:', error);
            throw error;
        }
    }

    private async sendEmail(notification: Notification): Promise<void> {
        const { email } = notification.metadata;
        if (!email) {
            throw new Error('Email address is required for email notifications');
        }

        await this.emailTransporter.sendMail({
            from: process.env.SMTP_FROM,
            to: email,
            subject: notification.title,
            text: notification.message
        });
    }

    private async sendSMS(notification: Notification): Promise<void> {
        const { phoneNumber } = notification.metadata;
        if (!phoneNumber) {
            throw new Error('Phone number is required for SMS notifications');
        }

        await this.twilioClient.messages.create({
            body: `${notification.title}\n${notification.message}`,
            to: phoneNumber,
            from: process.env.TWILIO_PHONE_NUMBER
        });
    }

    private async sendInAppNotification(notification: Notification): Promise<void> {
        // For now, just log the notification
        console.log('In-app notification:', {
            userId: notification.userId,
            title: notification.title,
            message: notification.message,
            metadata: notification.metadata
        });
    }

    async getUserNotifications(_userId: string): Promise<Notification[]> {
        // For now, return an empty array
        // In a real application, this would fetch from a database
        return [];
    }
}