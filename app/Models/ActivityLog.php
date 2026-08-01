<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Request;

class ActivityLog extends Model
{
    use HasFactory;

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'id',
        'user_id',
        'user_email',
        'action',
        'module',
        'description',
        'ip_address',
    ];

    public const MAX_RECORDS = 500;

    /**
     * Persist an activity log entry, trimming old records beyond the cap.
     */
    public static function record(string $action, string $module, string $description, ?\Illuminate\Http\Request $request = null): void
    {
        $user = $request?->user();

        static::create([
            'id' => 'act-'.now()->format('YmdHis').'-'.substr((string) uniqid(), -4),
            'user_id' => $user?->id,
            'user_email' => $user?->email,
            'action' => $action,
            'module' => $module,
            'description' => $description,
            'ip_address' => $request?->ip() ?? Request::ip() ?? '127.0.0.1',
        ]);

        if (static::count() > self::MAX_RECORDS) {
            $excessIds = static::orderByDesc('created_at')
                ->pluck('id')
                ->slice(self::MAX_RECORDS)
                ->all();

            if ($excessIds !== []) {
                static::whereIn('id', $excessIds)->delete();
            }
        }
    }
}
