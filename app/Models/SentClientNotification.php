<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SentClientNotification extends Model
{
    use HasUlids;

    protected $table = 'sent_client_notifications';

    protected $fillable = [
        'id',
        'client_id',
        'type',
        'channel',
        'subject',
        'body',
        'reference_type',
        'reference_id',
        'status',
        'response',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }
}
