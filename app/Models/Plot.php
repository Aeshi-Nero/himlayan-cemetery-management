<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Plot extends Model
{
    use HasFactory;

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'id',
        'plot_number',
        'section',
        'lat',
        'lng',
        'lot_type',
        'capacity',
        'current_occupants',
        'status',
        'price',
        'nearest_path_node_id',
        'notes',
        'width',
        'height',
        'rotation',
        'color',
        'cemetery_id',
        'deceased_names',
        'burial_date',
        'burial_time',
        'inquirer_name',
        'deceased_name',
    ];

    protected function casts(): array
    {
        return [
            'lat' => 'float',
            'lng' => 'float',
            'price' => 'float',
            'current_occupants' => 'integer',
            'capacity' => 'integer',
            'deceased_names' => 'array',
            'burial_date' => 'datetime',
        ];
    }

    public function nearestPathNode(): BelongsTo
    {
        return $this->belongsTo(PathNode::class, 'nearest_path_node_id');
    }

    public function contracts(): HasMany
    {
        return $this->hasMany(Contract::class);
    }

    public function inquiries(): HasMany
    {
        return $this->hasMany(Inquiry::class);
    }

    public function burials(): HasMany
    {
        return $this->hasMany(Burial::class);
    }

    /**
     * Transition reserved plots with an elapsed burial date to occupied.
     */
    public static function syncReservedToOccupied(): void
    {
        $now = now();

        static::query()
            ->where('status', 'reserved')
            ->whereNotNull('burial_date')
            ->where('burial_date', '<=', $now)
            ->get()
            ->each(function (Plot $plot) {
                $plot->status = 'occupied';
                $plot->current_occupants = max(1, (int) $plot->current_occupants);
                $plot->save();
            });
    }
}
