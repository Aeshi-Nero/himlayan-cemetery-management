<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Notifications\Notifiable;

class Client extends Model
{
    use HasFactory, HasUlids, Notifiable;

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'id',
        'full_name',
        'contact_number',
        'email',
        'address',
        'id_number',
        'id_type',
    ];

    public function contracts(): HasMany
    {
        return $this->hasMany(Contract::class);
    }

    public function inquiries(): HasMany
    {
        return $this->hasMany(Inquiry::class);
    }

    public function feedback(): HasMany
    {
        return $this->hasMany(ClientFeedback::class);
    }

    public function sentClientNotifications(): HasMany
    {
        return $this->hasMany(SentClientNotification::class);
    }
}
