import amqp from 'amqplib';
import { Notification } from '../types/notification';

export class QueueService {
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;
  private readonly queueName = 'notifications';
  private readonly retryQueueName = 'notifications-retry';
  private readonly maxRetries = 3;

  async connect(): Promise<void> {
    try {
      this.connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
      this.channel = await this.connection.createChannel();
      
      // Create main queue
      await this.channel.assertQueue(this.queueName, {
        durable: true
      });

      // Create retry queue with dead letter exchange
      await this.channel.assertQueue(this.retryQueueName, {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': '',
          'x-dead-letter-routing-key': this.queueName,
          'x-message-ttl': 60000 // 1 minute delay
        }
      });

      console.log('Connected to RabbitMQ');
    } catch (error) {
      console.error('Failed to connect to RabbitMQ:', error);
      throw error;
    }
  }

  async publishNotification(notification: Notification): Promise<void> {
    if (!this.channel) {
      throw new Error('Queue channel not initialized');
    }

    const message = {
      notification,
      retryCount: 0
    };

    await this.channel.sendToQueue(
      this.queueName,
      Buffer.from(JSON.stringify(message)),
      { persistent: true }
    );
  }

  async consumeNotifications(callback: (notification: Notification) => Promise<void>): Promise<void> {
    if (!this.channel) {
      throw new Error('Queue channel not initialized');
    }

    await this.channel.consume(this.queueName, async (msg) => {
      if (!msg) return;

      try {
        const { notification, retryCount } = JSON.parse(msg.content.toString());
        await callback(notification);
        this.channel?.ack(msg);
      } catch (error) {
        console.error('Error processing notification:', error);
        
        const { notification, retryCount } = JSON.parse(msg.content.toString());
        
        if (retryCount < this.maxRetries) {
          // Move to retry queue
          await this.channel?.sendToQueue(
            this.retryQueueName,
            Buffer.from(JSON.stringify({
              notification,
              retryCount: retryCount + 1
            })),
            { persistent: true }
          );
          this.channel?.ack(msg);
        } else {
          // Max retries reached, reject message
          this.channel?.reject(msg, false);
        }
      }
    });
  }

  async close(): Promise<void> {
    await this.channel?.close();
    await this.connection?.close();
  }
} 