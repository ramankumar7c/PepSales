# Notification Service

A robust notification service that supports email, SMS, and in-app notifications with queue-based processing and retry mechanisms.

## Live Demo

The service is deployed at: [https://pepsales-8vmw.onrender.com](https://pepsales-8vmw.onrender.com)

### Testing the Deployed Service

You can test the service using Postman or curl. Here are some example requests:

1. **Health Check**
```bash
curl -X GET https://pepsales-8vmw.onrender.com/health
```

2. **Send SMS Notification**
```bash
curl -X POST https://pepsales-8vmw.onrender.com/notifications \
-H "Content-Type: application/json" \
-d '{
    "type": "SMS",
    "userId": "user123",
    "title": "SMS Alert",
    "message": "Your order has been shipped",
    "metadata": {
        "phoneNumber": "+1234567890"
    }
}'
```

3. **Send Email Notification**
```bash
curl -X POST https://pepsales-8vmw.onrender.com/notifications \
-H "Content-Type: application/json" \
-d '{
    "type": "EMAIL",
    "userId": "user123",
    "title": "Welcome Email",
    "message": "Welcome to our service!",
    "metadata": {
        "email": "your-email@example.com"
    }
}'
```

4. **Send In-App Notification**
```bash
curl -X POST https://pepsales-8vmw.onrender.com/notifications \
-H "Content-Type: application/json" \
-d '{
    "type": "IN_APP",
    "userId": "user123",
    "title": "New Message",
    "message": "You have a new message",
    "metadata": {
        "priority": "high"
    }
}'
```

5. **Get User Notifications**
```bash
curl -X GET https://pepsales-8vmw.onrender.com/notifications/users/user123
```

Note: The deployed service has SMS and In-App notifications working. Email notifications require proper SMTP configuration.

## Features

- Multiple notification types (Email, SMS, In-app)
- Queue-based processing using RabbitMQ
- Automatic retry mechanism for failed notifications
- RESTful API endpoints
- TypeScript implementation

## Prerequisites

- Node.js (v14 or higher)
- RabbitMQ server (or CloudAMQP account)
- SMTP server (for email notifications)
- Twilio account (for SMS notifications)

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=3000

# RabbitMQ Configuration
# For local development:
# RABBITMQ_URL=amqp://localhost
# For production (CloudAMQP):
RABBITMQ_URL=amqp://your-cloudamqp-url

# SMTP (Email) Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
SMTP_FROM=your-email@gmail.com

# Twilio (SMS) Configuration
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone
```

## Queue System

The service uses CloudAMQP for message queuing in production, which provides:
- Managed RabbitMQ service
- Automatic scaling
- High availability
- Message persistence
- Monitoring and metrics

For local development, you can use a local RabbitMQ instance.

## Installation

1. Clone the repository:
```bash
git clone https://github.com/ramankumar7c/PepSales.git
cd PepSales
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. For production:
```bash
npm run build
npm start
```

## API Documentation

### 1. Send Notification
```http
POST /notifications
Content-Type: application/json

{
  "userId": "user123",
  "type": "EMAIL|SMS|IN_APP",
  "title": "Notification Title",
  "message": "Notification Message",
  "metadata": {
    // For EMAIL
    "email": "user@example.com",
    
    // For SMS
    "phoneNumber": "+1234567890",
    
    // For IN_APP
    "deviceId": "device123",
    "priority": "high"
  }
}
```

Response (201 Created):
```json
{
    "id": "41800e6c-5142-4695-9196-cab09409d9f2",
    "userId": "user123",
    "type": "EMAIL",
    "title": "Test Email",
    "message": "This is a test email from the notification service",
    "metadata": {
        "email": "user@example.com"
    },
    "status": "PENDING",
    "createdAt": "2025-05-18T03:05:39.038Z",
    "updatedAt": "2025-05-18T03:05:39.038Z"
}
```

### 2. Get User Notifications
```http
GET /users/{id}/notifications
```

Response (200 OK):
```json
[
    {
        "id": "41800e6c-5142-4695-9196-cab09409d9f2",
        "userId": "user123",
        "type": "EMAIL",
        "title": "Test Email",
        "message": "This is a test email from the notification service",
        "metadata": {
            "email": "user@example.com"
        },
        "status": "PENDING",
        "createdAt": "2025-05-18T03:05:39.038Z",
        "updatedAt": "2025-05-18T03:05:39.038Z"
    }
]
```

### 3. Health Check
```http
GET /health
```

Response (200 OK):
```json
{
  "status": "ok"
}
```

## Implementation Details

### Queue System
- Uses RabbitMQ for message queuing
- Implements retry mechanism with 1-minute delay
- Maximum of 3 retries for failed notifications
- Dead letter queue for failed messages

### Notification Types

1. **Email Notifications**
   - Uses Nodemailer with SMTP
   - Supports HTML and plain text
   - Configurable SMTP settings

2. **SMS Notifications**
   - Uses Twilio API
   - Supports international phone numbers
   - Requires verified numbers in trial mode

3. **In-app Notifications**
   - Currently logs to console
   - Ready for WebSocket integration
   - Supports metadata for customization

## Assumptions

1. The service uses in-memory storage for notifications. In a production environment, this should be replaced with a proper database.
2. In-app notifications are currently just logged to the console. In a real application, this would be implemented using WebSockets or a push notification service.
3. The retry mechanism uses a 1-minute delay between retries, with a maximum of 3 retries.
4. The service assumes that the RabbitMQ server is running and accessible.
5. Email and SMS configurations are required only if those notification types are used.

## Error Handling

- Failed notifications are automatically retried up to 3 times
- After max retries, notifications are marked as failed
- All errors are logged for monitoring and debugging
- Queue system ensures message persistence

## Future Improvements

1. **Database Integration**
   - Add PostgreSQL/MongoDB for persistent storage
   - Implement notification history
   - Add user preferences

2. **Real-time Notifications**
   - Add WebSocket support for in-app notifications
   - Implement push notifications
   - Add notification preferences

3. **Enhanced Features**
   - Add notification templates
   - Support for notification groups
   - Rate limiting
   - Authentication and authorization

4. **Monitoring and Analytics**
   - Add logging service
   - Implement metrics collection
   - Add monitoring dashboard

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request