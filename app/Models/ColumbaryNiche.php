<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ColumbaryNiche extends Model
{
    use HasFactory;

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'id',
        'niche_number',
        'section',
        'row',
        'tier',
        'status',
        'price',
        'map_x',
        'map_y',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'float',
            'map_x' => 'float',
            'map_y' => 'float',
        ];
    }

    public function contracts(): HasMany
    {
        return $this->hasMany(Contract::class);
    }
}
