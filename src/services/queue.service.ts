import amqp from 'amqplib';
import { Notification } from '../types/notification';
import { NotificationService } from './notification.service';

export class QueueService {
    private connection: any = null;
    private channel: amqp.Channel | null = null;
    private readonly mainQueue = 'notifications';
    private readonly retryQueue = 'notifications-retry';
    private readonly maxRetries = 3;
    private isInitialized = false;

    constructor(private notificationService: NotificationService) {}

    async initialize(): Promise<void> {
        if (this.isInitialized) {
            console.log('Queue service already initialized');
            return;
        }

        try {
            const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://localhost';
            console.log('Connecting to RabbitMQ at:', rabbitmqUrl);
            
            this.connection = await amqp.connect(rabbitmqUrl);
            if (!this.connection) {
                throw new Error('Failed to create RabbitMQ connection');
            }

            console.log('RabbitMQ connection established');
            this.channel = await this.connection.createChannel();
            if (!this.channel) {
                throw new Error('Failed to create RabbitMQ channel');
            }

            console.log('RabbitMQ channel created');

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

            console.log('RabbitMQ queues created');

            // Start consuming messages
            await this.consumeMessages();
            this.isInitialized = true;
            console.log('Queue service initialized successfully');
        } catch (error) {
            console.error('Failed to initialize queue service:', error);
            // Don't throw the error, just log it
            console.log('Queue service will operate in fallback mode');
        }
    }

    async enqueueNotification(notification: Notification): Promise<void> {
        if (!this.isInitialized || !this.channel) {
            console.log('Queue service not initialized, processing notification directly');
            // If queue is not available, process the notification directly
            await this.notificationService.processNotification(notification);
            return;
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
            // If queue operation fails, process the notification directly
            console.log('Processing notification directly due to queue error');
            await this.notificationService.processNotification(notification);
        }
    }

    private async consumeMessages(): Promise<void> {
        if (!this.channel) {
            console.log('Channel not available, skipping message consumption');
            return;
        }

        try {
            await this.channel.consume(this.mainQueue, async (msg) => {
                if (!msg) return;

                try {
                    const notification: Notification = JSON.parse(msg.content.toString());
                    console.log('Processing notification:', notification.id);

                    // Process the notification
                    await this.notificationService.processNotification(notification);

                    // Acknowledge the message
                    this.channel?.ack(msg);
                    console.log('Notification processed successfully:', notification.id);
                } catch (error) {
                    console.error('Failed to process notification:', error);

                    // Get retry count from message properties
                    const retryCount = (msg.properties.headers?.retryCount as number) || 0;
                    const notification: Notification = JSON.parse(msg.content.toString());

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
            console.log('Started consuming messages from queue');
        } catch (error) {
            console.error('Failed to start consuming messages:', error);
        }
    }

    async close(): Promise<void> {
        try {
            if (this.channel) {
                await this.channel.close();
            }
            if (this.connection) {
                await this.connection.close();
            }
            this.isInitialized = false;
            console.log('Queue service closed successfully');
        } catch (error) {
            console.error('Failed to close queue service:', error);
        }
    }
}