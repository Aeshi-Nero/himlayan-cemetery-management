<?php

namespace App\Notifications;

use App\Models\Payment;
use App\Notifications\Channels\SentClientNotificationChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PaymentReceived extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Payment $payment) {}

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
            ->subject('Payment Received - HIMLAYAN')
            ->greeting('Dear '.$notifiable->full_name.',')
            ->line('We have received your payment:')
            ->line('**Amount:** ₱'.number_format($this->payment->amount, 2))
            ->line('**Receipt #:** '.($this->payment->receipt_number ?? 'N/A'))
            ->line('**Date:** '.$this->payment->payment_date->format('M d, Y'))
            ->line('**Contract #:** '.$this->payment->contract_id)
            ->action('View Payment', url('/admin/payments'))
            ->line('Thank you for your payment.');
    }

    public function toClient(object $notifiable): array
    {
        return [
            'type' => 'payment_received',
            'subject' => 'Payment Received: ₱'.number_format($this->payment->amount, 2),
            'body' => 'Payment of ₱'.number_format($this->payment->amount, 2)
                .' received - Receipt #: '.($this->payment->receipt_number ?? 'N/A'),
            'reference_type' => 'payment',
            'reference_id' => $this->payment->id,
        ];
    }
}
