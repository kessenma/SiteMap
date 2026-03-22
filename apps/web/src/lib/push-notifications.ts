/**
 * PushNotificationService — server-side helper for sending push notifications
 * through the Go notifications server via Gorush.
 *
 * Usage:
 *   import { pushNotificationService } from '#/lib/push-notifications'
 *   await pushNotificationService.sendToUser(userId, 'Title', 'Body')
 */

class PushNotificationService {
  private serverUrl: string

  constructor(url?: string) {
    this.serverUrl =
      url ??
      process.env.NOTIFICATIONS_SERVER_URL ??
      'http://notifications-server:8080'
  }

  /** Send a notification to a single user's devices */
  async sendToUser(
    userId: string,
    title: string,
    message: string,
    data?: Record<string, string>,
  ): Promise<void> {
    const res = await fetch(`${this.serverUrl}/api/push/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, title, message, data }),
    })

    if (!res.ok) {
      const text = await res.text()
      console.error(`Push notification failed for user ${userId}: ${text}`)
    }
  }

  /** Send a notification to multiple users' devices */
  async sendToUsers(
    userIds: string[],
    title: string,
    message: string,
    data?: Record<string, string>,
  ): Promise<void> {
    const notifications = userIds.map((userId) => ({
      user_id: userId,
      title,
      message,
      data,
    }))

    const res = await fetch(`${this.serverUrl}/api/push/send-batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notifications),
    })

    if (!res.ok) {
      const text = await res.text()
      console.error(`Batch push notification failed: ${text}`)
    }
  }

  /** Check if the notifications server is healthy */
  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${this.serverUrl}/health`)
      return res.ok
    } catch {
      return false
    }
  }
}

export const pushNotificationService = new PushNotificationService()
