<?php

namespace App\Console\Commands;

use App\Models\InstallmentSchedule;
use App\Models\User;
use App\Models\UserNotification;
use App\Notifications\InstallmentReminder;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class SendInstallmentReminders extends Command
{
    protected $signature = 'reminders:installment';

    protected $description = 'Send notifications for installment payments due in 3 days';

    public function handle(): void
    {
        $threeDaysFromNow = now()->addDays(3)->toDateString();

        InstallmentSchedule::whereDate('due_date', $threeDaysFromNow)
            ->where('status', 'unpaid')
            ->with(['contract.client'])
            ->each(function (InstallmentSchedule $schedule) {
                $staffUsers = User::where('is_active', true)
                    ->whereIn('role', ['rcc', 'super_admin'])
                    ->get();

                foreach ($staffUsers as $user) {
                    UserNotification::create([
                        'id' => 'ntf-'.(string) Str::uuid(),
                        'user_id' => $user->id,
                        'title' => 'Installment Due Soon',
                        'body' => 'Installment of ₱'.number_format($schedule->amount_due, 2)
                            .' due on '.$schedule->due_date->format('M d, Y')
                            .' for contract #'.$schedule->contract_id,
                        'type' => 'installment_due',
                        'link' => '/admin/contracts',
                    ]);
                }

                if ($schedule->contract?->client) {
                    $schedule->contract->client->notify(new InstallmentReminder($schedule));
                }
            });

        $this->info('Installment reminders sent.');
    }
}
