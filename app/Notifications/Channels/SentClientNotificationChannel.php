<?php

namespace App\Notifications\Channels;

use App\Models\SentClientNotification;
use Illuminate\Notifications\Notification;

class SentClientNotificationChannel
{
    /**
     * Persist a client-facing notification into the sent_client_notifications
     * audit table (the "database" leg for the public portal).
     */
    public function send(object $notifiable, Notification $notification): void
    {
        if (! method_exists($notification, 'toClient')) {
            return;
        }

        $data = $notification->toClient($notifiable);

        SentClientNotification::create(array_merge([
            'client_id' => $notifiable->getKey(),
            'channel' => 'database',
            'status' => 'sent',
        ], $data));
    }
}
