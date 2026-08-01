<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LoginJsonTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\DatabaseSeeder::class);
    }

    public function test_json_login_authenticates_and_dashboard_accessible(): void
    {
        $this->postJson('/login', [
            'email' => 'admin@himlayan.gov.ph',
            'password' => 'Admin@123',
        ])->assertRedirect(route('dashboard'));

        $this->assertAuthenticated();

        $this->getJson('/api/dashboard')
            ->assertOk()
            ->assertJsonPath('data.totalPlots', 80);

        $this->getJson('/api/audit')->assertOk();
        $this->getJson('/api/users')->assertOk()->assertJsonCount(4, 'data');
    }

    public function test_json_login_with_bad_credentials_stays_guest(): void
    {
        $response = $this->postJson('/login', [
            'email' => 'admin@himlayan.gov.ph',
            'password' => 'wrong-password',
        ]);

        $this->assertContains($response->status(), [302, 422]);
        $this->assertGuest();
    }
}
