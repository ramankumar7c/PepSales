import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';

const router = Router();
const notificationController = new NotificationController();

// Send notification
router.post('/', notificationController.sendNotification);

// Get user notifications
router.get('/users/:id', notificationController.getUserNotifications);

export const notificationRoutes = router; 