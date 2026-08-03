<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlotConnection extends Model
{
    use HasFactory;

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'id',
        'cemetery_id',
        'from_plot_id',
        'to_plot_id',
    ];

    public function fromPlot(): BelongsTo
    {
        return $this->belongsTo(Plot::class, 'from_plot_id');
    }

    public function toPlot(): BelongsTo
    {
        return $this->belongsTo(Plot::class, 'to_plot_id');
    }
}
