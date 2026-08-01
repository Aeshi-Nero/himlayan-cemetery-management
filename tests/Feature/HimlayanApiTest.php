<?php

namespace Tests\Feature;

use App\Models\Plot;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HimlayanApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(DatabaseSeeder::class);
    }

    public function test_plots_index_returns_paginated_seed_data(): void
    {
        $response = $this->getJson('/api/plots');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('pagination.total', 80);

        $section = $this->getJson('/api/plots?section=A&limit=5');

        $section->assertOk()
            ->assertJsonPath('pagination.total', 20)
            ->assertJsonCount(5, 'data');
    }

    public function test_plot_show_by_id_and_plot_number(): void
    {
        $this->getJson('/api/plots/plot-1')
            ->assertOk()
            ->assertJsonPath('data.plot_number', 'A-01');

        $this->getJson('/api/plots/D-20')
            ->assertOk()
            ->assertJsonPath('data.id', 'plot-80');

        $this->getJson('/api/plots/does-not-exist')
            ->assertNotFound();
    }

    public function test_pathfinding_returns_astar_path(): void
    {
        $response = $this->getJson('/api/pathfinding/find-path?from=node-gate-1&to=node-12');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => [
                    'path' => [['nodeId', 'lat', 'lng', 'label', 'distanceFromPrevious']],
                    'totalDistance',
                    'nodesVisited',
                ],
            ]);

        $this->assertNotEmpty($response->json('data.path'));
        $this->assertSame('node-gate-1', $response->json('data.path.0.nodeId'));
        $this->assertSame('node-12', last($response->json('data.path'))['nodeId']);

        $this->getJson('/api/pathfinding/find-path')
            ->assertStatus(400);
    }

    public function test_map_usage_and_cemetery_map_endpoints(): void
    {
        $this->getJson('/api/stats/map-usage')
            ->assertOk()
            ->assertJsonPath('count', 15842);

        $this->getJson('/api/cemetery-map')
            ->assertOk()
            ->assertJsonPath('data.name', 'Himlayan Memorial Park Master Boundary');
    }

    public function test_public_inquiry_submission_creates_client_and_inquiry(): void
    {
        $response = $this->postJson('/api/inquiries', [
            'full_name' => 'Pedro Bautista',
            'contact_number' => '+63 900 111 2222',
            'email' => 'pedro.bautista@gmail.com',
            'plot_id' => 'plot-2',
            'message' => 'Interested in Family Lot A-02.',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'pending');

        $this->assertDatabaseHas('clients', ['full_name' => 'Pedro Bautista']);
        $this->assertDatabaseHas('inquiries', ['contact_number' => '+63 900 111 2222']);

        // Submitting again with the same contact number reuses the client.
        $this->postJson('/api/inquiries', [
            'full_name' => 'Pedro Bautista',
            'contact_number' => '+63 900 111 2222',
        ])->assertOk();

        $this->assertDatabaseCount('clients', 4);
    }

    public function test_authenticated_dashboard_returns_stats(): void
    {
        $user = User::where('email', 'admin@himlayan.gov.ph')->firstOrFail();

        $this->actingAs($user)
            ->getJson('/api/dashboard')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => [
                    'totalPlots',
                    'availablePlots',
                    'reservedPlots',
                    'occupiedPlots',
                    'occupancyRate',
                    'totalRevenue',
                    'pendingInquiries',
                    'activeContracts',
                    'completedBurials',
                    'scheduledBurials',
                    'recentActivity',
                ],
            ])
            ->assertJsonPath('data.totalPlots', 80);

        auth()->logout();

        $this->getJson('/api/dashboard')->assertUnauthorized();
    }

    public function test_authenticated_contract_flow(): void
    {
        $user = User::where('email', 'rcc@himlayan.gov.ph')->firstOrFail();

        $this->actingAs($user)
            ->postJson('/api/contracts', [
                'client_id' => 'cli-3',
                'plot_id' => 'plot-2',
                'contract_type' => 'new',
                'total_amount' => 15000,
                'payment_type' => 'cash',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'draft');

        // Plot should be reserved after a contract is created.
        $this->assertDatabaseHas('plots', ['id' => 'plot-2', 'status' => 'reserved']);

        $this->actingAs($user)
            ->getJson('/api/contracts')
            ->assertOk()
            ->assertJsonCount(3, 'data');
    }

    public function test_inquiry_approval_reserves_plot(): void
    {
        $user = User::where('email', 'rcc@himlayan.gov.ph')->firstOrFail();

        $this->actingAs($user)
            ->patchJson('/api/inquiries/inq-2', ['status' => 'approved'])
            ->assertOk()
            ->assertJsonPath('data.status', 'approved');

        $plot = Plot::find('plot-25');
        $this->assertSame('reserved', $plot->status);
        $this->assertSame('Elena Ramos', $plot->inquirer_name);
    }

    public function test_plot_mutation_requires_auth(): void
    {
        $this->postJson('/api/plots', [
            'plot_number' => 'Z-99',
            'section' => 'Z',
            'lot_type' => 'single',
        ])->assertUnauthorized();

        $this->getJson('/api/audit')->assertUnauthorized();
        $this->getJson('/api/users')->assertUnauthorized();
    }
}
