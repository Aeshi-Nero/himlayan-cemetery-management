<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminPagesSmokeTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\DatabaseSeeder::class);
    }

    public function test_staff_can_access_standard_admin_pages(): void
    {
        $user = User::where('role', 'staff')->first()
            ?? User::factory()->create(['role' => 'staff']);

        foreach ([
            'admin/dashboard',
            'admin/records',
            'admin/inquiries',
            'admin/contracts',
            'admin/payments',
            'admin/burials',
            'admin/reports',
            'admin/map-editor',
            'admin/plots',
            'admin/pathways',
            'admin/audit',
            'admin/settings',
        ] as $uri) {
            $this->actingAs($user)->get('/'.$uri)->assertOk();
        }
    }

    public function test_super_admin_can_access_users_page_but_staff_cannot(): void
    {
        $superAdmin = User::where('role', 'super_admin')->first()
            ?? User::factory()->create(['role' => 'super_admin']);
        $staff = User::factory()->create(['role' => 'staff']);

        $this->actingAs($superAdmin)->get('/admin/users')->assertOk();
        $this->actingAs($staff)->get('/admin/users')->assertForbidden();
    }

    public function test_engineer_workspace_role_guards(): void
    {
        $engineer = User::factory()->create(['role' => 'engineer']);
        $staff = User::factory()->create(['role' => 'staff']);
        $superAdmin = User::factory()->create(['role' => 'super_admin']);

        $this->actingAs($engineer)->get('/engineer/workspace')->assertOk();
        $this->actingAs($superAdmin)->get('/engineer/workspace')->assertOk();
        $this->actingAs($staff)->get('/engineer/workspace')->assertForbidden();
    }

    public function test_unauthenticated_admin_redirects_to_login(): void
    {
        $this->get('/admin/dashboard')->assertRedirect('/login');
    }
}
