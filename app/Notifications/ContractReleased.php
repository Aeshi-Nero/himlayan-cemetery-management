<?php

namespace App\Notifications;

use App\Models\Contract;
use App\Notifications\Channels\SentClientNotificationChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ContractReleased extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Contract $contract) {}

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
            ->subject('Cemetery Lease Contract Released - HIMLAYAN')
            ->greeting('Dear '.$notifiable->full_name.',')
            ->line('Your Cemetery Lease Contract (#'.$this->contract->id.') has been released and is now in effect.')
            ->line('**Plot:** '.($this->contract->plot?->plot_number ?? 'N/A'))
            ->line('**Contract Date:** '.$this->contract->contract_date->format('M d, Y'))
            ->line('Kindly complete the Client Satisfaction Form (CSF) so we can serve you better.')
            ->action('Complete Satisfaction Form', url('/admin/contracts'))
            ->line('Thank you for trusting HIMLAYAN.');
    }

    public function toClient(object $notifiable): array
    {
        return [
            'type' => 'contract_released',
            'subject' => 'Contract Released',
            'body' => 'Your contract (#'.$this->contract->id.') for lot '
                .($this->contract->plot?->plot_number ?? 'N/A')
                .' has been released and is now in effect. Please complete the Client Satisfaction Form.',
            'reference_type' => 'contract',
            'reference_id' => $this->contract->id,
        ];
    }
}
