<?php

use Illuminate\Support\Facades\Schedule;

Schedule::command('reminders:burial')->dailyAt('08:00');
Schedule::command('reminders:installment')->dailyAt('08:00');
