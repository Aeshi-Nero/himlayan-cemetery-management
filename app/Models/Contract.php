<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Contract extends Model
{
    use HasFactory;

    public const STATUS_DRAFT = 'draft';
    public const STATUS_PERMIT_ISSUED = 'permit_issued';
    public const STATUS_RENTAL_COMPUTED = 'rental_computed';
    public const STATUS_PAID = 'paid';
    public const STATUS_PENDING_APPROVAL = 'pending_approval';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_RELEASED = 'released';
    public const STATUS_CANCELLED = 'cancelled';

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'id',
        'contract_number',
        'client_id',
        'plot_id',
        'pre_need_plan_id',
        'columbary_niche_id',
        'contract_date',
        'contract_type',
        'commencement_date',
        'expiration_date',
        'total_amount',
        'payment_type',
        'ordinance_period',
        'lot_type',
        'lot_area',
        'dimension',
        'status',
        'prepared_by',
        'approved_by_superadmin_at',
        'death_certificate_number',
        'af_51_number',
        'af_51_date',
        'approved_by_treasurer_at',
        'approved_by_mayor_at',
        'amount_paid',
        'balance_remaining',
    ];

    protected function casts(): array
    {
        return [
            'contract_date' => 'date',
            'commencement_date' => 'date',
            'expiration_date' => 'date',
            'total_amount' => 'float',
            'amount_paid' => 'float',
            'balance_remaining' => 'float',
            'lot_area' => 'float',
            'approved_by_superadmin_at' => 'datetime',
            'af_51_date' => 'date',
            'approved_by_treasurer_at' => 'datetime',
            'approved_by_mayor_at' => 'datetime',
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

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function burials(): HasMany
    {
        return $this->hasMany(Burial::class);
    }

    public function installmentSchedules(): HasMany
    {
        return $this->hasMany(InstallmentSchedule::class);
    }

    public function burialPermits(): HasMany
    {
        return $this->hasMany(BurialPermit::class);
    }

    public function preNeedPlan(): BelongsTo
    {
        return $this->belongsTo(PreNeedPlan::class);
    }

    public function columbaryNiche(): BelongsTo
    {
        return $this->belongsTo(ColumbaryNiche::class);
    }

    /**
     * Recompute the paid / remaining amounts from the recorded payments.
     */
    public function refreshPaymentTotals(): void
    {
        $paid = (float) $this->payments()->sum('amount');
        $this->amount_paid = $paid;
        $this->balance_remaining = max(0, (float) $this->total_amount - $paid);
        $this->save();
    }

    private const TRANSITIONS = [
        self::STATUS_PERMIT_ISSUED => [self::STATUS_DRAFT],
        self::STATUS_RENTAL_COMPUTED => [self::STATUS_DRAFT, self::STATUS_PERMIT_ISSUED],
        self::STATUS_PAID => [self::STATUS_PERMIT_ISSUED, self::STATUS_RENTAL_COMPUTED],
        self::STATUS_PENDING_APPROVAL => [self::STATUS_RENTAL_COMPUTED, self::STATUS_PAID],
        self::STATUS_APPROVED => [self::STATUS_PENDING_APPROVAL],
        self::STATUS_RELEASED => [self::STATUS_APPROVED],
    ];

    /**
     * Transition the contract to a new lifecycle status.
     *
     * @throws \RuntimeException when the transition is not legal
     */
    private function transition(string $target): void
    {
        if ($this->status === $target) {
            return;
        }

        if (! $this->canTransitionTo($target)) {
            throw new \RuntimeException(
                "Cannot move contract {$this->id} from status '{$this->status}' to '{$target}'."
            );
        }

        $this->status = $target;
        $this->save();
    }

    public function canTransitionTo(string $target): bool
    {
        return in_array($this->status, self::TRANSITIONS[$target] ?? [], true);
    }

    public function markPermitIssued(): void
    {
        $this->transition(self::STATUS_PERMIT_ISSUED);
    }

    public function markRentalComputed(): void
    {
        $this->transition(self::STATUS_RENTAL_COMPUTED);
    }

    public function markPaid(): void
    {
        $this->transition(self::STATUS_PAID);
    }

    public function submitForApproval(): void
    {
        $this->transition(self::STATUS_PENDING_APPROVAL);
    }

    public function markApproved(): void
    {
        $this->transition(self::STATUS_APPROVED);
    }

    public function markReleased(): void
    {
        $this->transition(self::STATUS_RELEASED);
    }

    public function isReleased(): bool
    {
        return $this->status === self::STATUS_RELEASED;
    }
}
