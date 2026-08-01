<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PathEdge extends Model
{
    use HasFactory;

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'id',
        'from_node_id',
        'to_node_id',
        'distance_weight',
        'pathway_name',
    ];

    protected function casts(): array
    {
        return [
            'distance_weight' => 'integer',
        ];
    }

    public function fromNode(): BelongsTo
    {
        return $this->belongsTo(PathNode::class, 'from_node_id');
    }

    public function toNode(): BelongsTo
    {
        return $this->belongsTo(PathNode::class, 'to_node_id');
    }
}
