<?php

namespace App\Notifications;

use App\Models\Burial;
use App\Notifications\Channels\SentClientNotificationChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class BurialScheduled extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Burial $burial) {}

    public function via(object $notifiable): array
    {
        $channels = [SentClientNotificationChannel::class];
        if ($notifiable->email) {
            $channels[] = 'mail';
        }

        return $channels;
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Burial Scheduled - HIMLAYAN')
            ->greeting('Dear '.$notifiable->full_name.',')
            ->line('A burial has been scheduled for:')
            ->line('**Deceased:** '.$this->burial->deceased_name)
            ->line('**Date:** '.$this->burial->burial_date->format('M d, Y g:i A'))
            ->line('**Plot:** '.($this->burial->plot?->plot_number ?? 'N/A'))
            ->line('**Status:** '.ucfirst($this->burial->burial_status))
            ->action('View Details', url('/admin/burials'))
            ->line('Please arrive on time. Bring the Burial Permit (AF 58).');
    }

    public function toClient(object $notifiable): array
    {
        return [
            'type' => 'burial_scheduled',
            'subject' => 'Burial Scheduled: '.$this->burial->deceased_name,
            'body' => 'Burial for '.$this->burial->deceased_name
                .' scheduled on '.$this->burial->burial_date->format('M d, Y g:i A')
                .' at plot '.($this->burial->plot?->plot_number ?? 'N/A'),
            'reference_type' => 'burial',
            'reference_id' => $this->burial->id,
        ];
    }
}
