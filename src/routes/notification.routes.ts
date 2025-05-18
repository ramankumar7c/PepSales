import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';

const router = Router();
const notificationController = new NotificationController();

// POST /notifications
router.post('/', (req, res) => notificationController.createNotification(req, res));

// GET /users/:id/notifications
router.get('/users/:id/notifications', (req, res) => notificationController.getUserNotifications(req, res));

export default router; 