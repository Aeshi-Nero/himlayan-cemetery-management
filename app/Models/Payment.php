<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    use HasFactory;

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'id',
        'contract_id',
        'amount',
        'payment_date',
        'payment_method',
        'receipt_number',
        'af_51_number',
        'collected_by',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'float',
            'payment_date' => 'date',
        ];
    }

    public function contract(): BelongsTo
    {
        return $this->belongsTo(Contract::class);
    }
}
