import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import notificationRoutes from './routes/notification.routes';
import { NotificationService } from './services/notification.service';

const app = express();
const port = process.env.PORT || 3000;
const notificationService = new NotificationService();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/notifications', notificationRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Closing server...');
  await notificationService.close();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Closing server...');
  await notificationService.close();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
}); 