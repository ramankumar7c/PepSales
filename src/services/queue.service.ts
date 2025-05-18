import amqp, { Channel, Connection } from 'amqplib';
import { Notification } from '../types/notification';
import { NotificationService } from './notification.service';

export class QueueService {
    private connection: Connection | null = null;
    private channel: Channel | null = null;
    private readonly mainQueue = 'notifications';
    private readonly retryQueue = 'notifications-retry';
    private readonly maxRetries = 3;

    constructor(private notificationService: NotificationService) {}

    async initialize(): Promise<void> {
        try {
            this.connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
            this.channel = await this.connection.createChannel();

            // Create queues
            await this.channel.assertQueue(this.mainQueue, { durable: true });
            await this.channel.assertQueue(this.retryQueue, { 
                durable: true,
                arguments: {
                    'x-dead-letter-exchange': '',
                    'x-dead-letter-routing-key': this.mainQueue,
                    'x-message-ttl': 60000 // 1 minute in milliseconds
                }
            });

            // Start consuming messages
            await this.consumeMessages();
            console.log('Queue service initialized successfully');
        } catch (error) {
            console.error('Failed to initialize queue service:', error);
            throw error;
        }
    }

    async enqueueNotification(notification: Notification): Promise<void> {
        if (!this.channel) {
            throw new Error('Queue channel not initialized');
        }

        try {
            await this.channel.sendToQueue(
                this.mainQueue,
                Buffer.from(JSON.stringify(notification)),
                { persistent: true }
            );
            console.log('Notification enqueued:', notification.id);
        } catch (error) {
            console.error('Failed to enqueue notification:', error);
            throw error;
        }
    }

    private async consumeMessages(): Promise<void> {
        if (!this.channel) {
            throw new Error('Queue channel not initialized');
        }

        await this.channel.consume(this.mainQueue, async (msg) => {
            if (!msg) return;

            try {
                const notification: Notification = JSON.parse(msg.content.toString());
                console.log('Processing notification:', notification.id);

                // Process the notification
                await this.notificationService.sendNotification(notification);

                // Acknowledge the message
                this.channel?.ack(msg);
                console.log('Notification processed successfully:', notification.id);
            } catch (error) {
                console.error('Failed to process notification:', error);

                // Get retry count from message properties
                const retryCount = (msg.properties.headers?.retryCount as number) || 0;

                if (retryCount < this.maxRetries) {
                    // Move to retry queue
                    if (this.channel) {
                        await this.channel.sendToQueue(
                            this.retryQueue,
                            msg.content,
                            {
                                persistent: true,
                                headers: {
                                    ...msg.properties.headers,
                                    retryCount: retryCount + 1
                                }
                            }
                        );
                    }
                    this.channel?.ack(msg);
                    console.log(`Notification moved to retry queue (attempt ${retryCount + 1}/${this.maxRetries}):`, notification.id);
                } else {
                    // Max retries reached, acknowledge and log
                    this.channel?.ack(msg);
                    console.log('Max retries reached for notification:', notification.id);
                }
            }
        });
    }

    async close(): Promise<void> {
        try {
            if (this.channel) {
                await this.channel.close();
            }
            if (this.connection) {
                await this.connection.close();
            }
            console.log('Queue service closed successfully');
        } catch (error) {
            console.error('Failed to close queue service:', error);
            throw error;
        }
    }
} 