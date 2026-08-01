<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PathNode extends Model
{
    use HasFactory;

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'id',
        'lat',
        'lng',
        'node_label',
        'is_accessible',
    ];

    protected function casts(): array
    {
        return [
            'lat' => 'float',
            'lng' => 'float',
            'is_accessible' => 'boolean',
        ];
    }

    public function edgesFrom(): HasMany
    {
        return $this->hasMany(PathEdge::class, 'from_node_id');
    }

    public function edgesTo(): HasMany
    {
        return $this->hasMany(PathEdge::class, 'to_node_id');
    }
}
