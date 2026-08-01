<?php

namespace App\Console\Commands;

use App\Models\Burial;
use App\Models\UserNotification;
use Illuminate\Console\Command;

class SendBurialReminders extends Command
{
    protected $signature = 'reminders:burial';

    protected $description = 'Send notifications for burials scheduled tomorrow';

    public function handle(): void
    {
        $tomorrow = now()->addDay()->toDateString();

        Burial::whereDate('burial_date', $tomorrow)
            ->where('burial_status', 'scheduled')
            ->with(['plot', 'scheduledBy'])
            ->each(function (Burial $burial) {
                if (! $burial->scheduledBy) {
                    return;
                }

                UserNotification::create([
                    'id' => 'ntf-'.(string) \Illuminate\Support\Str::uuid(),
                    'user_id' => $burial->scheduledBy->id,
                    'title' => 'Burial Tomorrow',
                    'body' => "{$burial->deceased_name} - {$burial->burial_date?->format('M d, Y g:i A')} - Plot {$burial->plot?->plot_number}",
                    'type' => 'burial_reminder',
                    'link' => '/admin/burials',
                ]);
            });

        $this->info('Burial reminders sent.');
    }
}
