import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { notificationRoutes } from './routes/notification.routes';
import { QueueService } from './services/queue.service';
import { NotificationService } from './services/notification.service';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize services
const notificationService = new NotificationService();
const queueService = new QueueService(notificationService);

// Routes
app.use('/notifications', notificationRoutes);

// Health check endpoint
app.get('/health', (_, res) => {
    res.json({ status: 'ok' });
});

// Start server
app.listen(port, async () => {
    try {
        await queueService.initialize();
        console.log(`Server is running on port ${port}`);
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
});

// Handle graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received. Closing queue service...');
    await queueService.close();
    process.exit(0);
}); 