<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable(['name', 'email', 'password', 'role', 'is_active', 'department', 'phone', 'address', 'avatar'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, HasUlids, Notifiable;

    protected $keyType = 'string';

    public $incrementing = false;

    protected $appends = ['full_name'];

    public const ROLE_SUPER_ADMIN = 'super_admin';
    public const ROLE_RCC = 'rcc';
    public const ROLE_ENGINEER = 'engineer';

    public const ROLES = [
        self::ROLE_SUPER_ADMIN,
        self::ROLE_RCC,
        self::ROLE_ENGINEER,
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Display name accessor shared by the auth pages (name) and
     * the admin user-management pages (full_name).
     */
    public function getFullNameAttribute(): string
    {
        return $this->name;
    }

    public function isSuperAdmin(): bool
    {
        return $this->role === self::ROLE_SUPER_ADMIN;
    }

    public function isRcc(): bool
    {
        return $this->role === self::ROLE_RCC;
    }

    public function isEngineer(): bool
    {
        return $this->role === self::ROLE_ENGINEER;
    }

    public function activityLogs(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(ActivityLog::class, 'user_id');
    }
}
