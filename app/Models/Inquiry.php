<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Inquiry extends Model
{
    use HasFactory;

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'id',
        'client_id',
        'plot_id',
        'full_name',
        'contact_number',
        'email',
        'inquiry_date',
        'requested_burial_date',
        'deceased_name',
        'message',
        'status',
        'processed_by',
        'processed_at',
    ];

    protected function casts(): array
    {
        return [
            'inquiry_date' => 'date',
            'requested_burial_date' => 'datetime',
            'processed_at' => 'datetime',
        ];
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function plot(): BelongsTo
    {
        return $this->belongsTo(Plot::class);
    }
}
