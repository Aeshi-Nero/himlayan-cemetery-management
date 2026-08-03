<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CemeteryMap extends Model
{
    use HasFactory;

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'id',
        'cemetery_id',
        'name',
        'description',
        'boundary_data',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'boundary_data' => 'array',
        ];
    }
}
