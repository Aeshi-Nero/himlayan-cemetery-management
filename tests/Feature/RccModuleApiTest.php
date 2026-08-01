<?php

namespace Tests\Feature;

use App\Models\BurialPermit;
use App\Models\Client;
use App\Models\Contract;
use App\Models\SentClientNotification;
use App\Models\User;
use App\Models\UserNotification;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RccModuleApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(DatabaseSeeder::class);
    }

    private function rccUser(): User
    {
        return User::where('email', 'rcc@himlayan.gov.ph')->firstOrFail();
    }

    public function test_burial_permit_crud_and_client_notification(): void
    {
        $user = $this->rccUser();

        // Create a draft contract first (permit issuance is available from draft).
        $contractResponse = $this->actingAs($user)->postJson('/api/contracts', [
            'client_id' => 'cli-3',
            'plot_id' => 'plot-2',
            'contract_type' => 'new',
        ])->assertOk();

        $contractId = $contractResponse->json('data.id');

        $this->actingAs($user)
            ->postJson('/api/burial-permits', [
                'contract_id' => $contractId,
                'deceased_name' => 'Lourdes Santos',
                'date_of_death' => '2026-07-30',
                'death_certificate_number' => 'DC-2026-0012',
                'burial_permit_fee' => 1500,
            ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.permit_number', 'AF58-000002')
            ->assertJsonPath('data.status', 'issued');

        $this->assertDatabaseHas('burial_permits', ['permit_number' => 'AF58-000002']);

        // Issuing the permit advances the contract from draft -> permit_issued.
        $this->assertDatabaseHas('contracts', [
            'id' => $contractId,
            'status' => 'permit_issued',
        ]);

        // Contract copies the death certificate number.
        $this->assertDatabaseHas('contracts', [
            'id' => $contractId,
            'death_certificate_number' => 'DC-2026-0012',
        ]);

        // Client notification was recorded via the custom channel.
        $this->assertDatabaseCount('sent_client_notifications', 1);
        $this->assertDatabaseHas('sent_client_notifications', [
            'client_id' => 'cli-3',
            'type' => 'burial_permit_issued',
        ]);

        $permit = BurialPermit::where('permit_number', 'AF58-000002')->firstOrFail();

        $this->actingAs($user)
            ->putJson("/api/burial-permits/{$permit->id}", ['status' => 'cancelled'])
            ->assertOk()
            ->assertJsonPath('data.status', 'cancelled');

        $this->actingAs($user)
            ->deleteJson("/api/burial-permits/{$permit->id}")
            ->assertOk();

        $this->assertDatabaseMissing('burial_permits', ['id' => $permit->id]);
    }

    public function test_burial_permit_rejected_on_released_contract(): void
    {
        $user = $this->rccUser();

        $this->actingAs($user)
            ->postJson('/api/burial-permits', [
                'contract_id' => 'ctr-1',
                'deceased_name' => 'Lourdes Santos',
                'date_of_death' => '2026-07-30',
                'burial_permit_fee' => 1500,
            ])
            ->assertStatus(422);
    }

    public function test_burial_permit_compute_rental(): void
    {
        $user = $this->rccUser();

        $this->actingAs($user)
            ->postJson('/api/burial-permits/compute-rental', [
                'contract_type' => 'new',
                'lot_type' => 'individual',
            ])
            ->assertOk()
            ->assertJsonPath('data.fee', 2000);

        $this->actingAs($user)
            ->postJson('/api/burial-permits/compute-rental', [
                'contract_type' => 'renewal',
                'ordinance_period' => 'pre_2002',
                'lot_type' => 'individual',
            ])
            ->assertOk()
            ->assertJsonPath('data.fee', 200);
    }

    public function test_pre_need_plan_crud(): void
    {
        $user = $this->rccUser();

        $this->actingAs($user)
            ->postJson('/api/pre-need-plans', [
                'name' => 'Eternal Peace Plan',
                'type' => 'memorial',
                'price' => 25000,
                'features' => ['Urn niche', 'Engraving'],
                'is_active' => true,
            ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Eternal Peace Plan');

        $this->assertDatabaseCount('pre_need_plans', 4);

        $this->actingAs($user)
            ->getJson('/api/pre-need-plans')
            ->assertOk()
            ->assertJsonCount(4, 'data');

        // Attach a contract to pln-2, then deletion of the plan is blocked.
        $this->actingAs($user)
            ->postJson('/api/contracts', [
                'client_id' => 'cli-3',
                'contract_type' => 'new',
                'pre_need_plan_id' => 'pln-2',
                'total_amount' => 95000,
                'payment_type' => 'cash',
            ])
            ->assertOk();

        $this->actingAs($user)
            ->deleteJson('/api/pre-need-plans/pln-2')
            ->assertStatus(422);
    }

    public function test_columbary_niche_crud_and_position(): void
    {
        $user = $this->rccUser();

        $this->actingAs($user)
            ->postJson('/api/columbary-niches', [
                'niche_number' => 'C-001',
                'section' => 'C',
                'price' => 30000,
                'status' => 'available',
            ])
            ->assertOk()
            ->assertJsonPath('data.niche_number', 'C-001');

        $this->assertDatabaseHas('columbary_niches', ['niche_number' => 'C-001']);

        $this->actingAs($user)
            ->getJson('/api/columbary-niches')
            ->assertOk()
            ->assertJsonCount(49, 'data');

        $niche = \App\Models\ColumbaryNiche::where('niche_number', 'C-001')->firstOrFail();

        $this->actingAs($user)
            ->patchJson("/api/columbary-niches/{$niche->id}/position", ['map_x' => 121.5, 'map_y' => 14.6])
            ->assertOk();

        $niche->refresh();
        $this->assertSame(121.5, (float) $niche->map_x);
    }

    public function test_client_feedback_store(): void
    {
        $user = $this->rccUser();

        $this->actingAs($user)
            ->postJson('/api/client-feedback', [
                'contract_id' => 'ctr-1',
                'client_id' => 'cli-1',
                'rating' => 5,
                'comments' => 'Very professional staff.',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'submitted');

        $this->assertDatabaseCount('client_feedback', 2);
    }

    public function test_client_notification_manual_send(): void
    {
        $user = $this->rccUser();

        $this->actingAs($user)
            ->postJson('/api/client-notifications', [
                'client_id' => 'cli-2',
                'subject' => 'Reminder: Contract renewal',
                'body' => 'Your lease contract is up for renewal soon.',
                'channel' => 'database',
            ])
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('sent_client_notifications', [
            'client_id' => 'cli-2',
            'subject' => 'Reminder: Contract renewal',
        ]);
    }

    public function test_user_notifications_list_and_read(): void
    {
        $user = $this->rccUser();

        $this->actingAs($user)
            ->getJson('/api/user-notifications')
            ->assertOk()
            ->assertJsonPath('unread_count', 2)
            ->assertJsonCount(2, 'data');

        $this->actingAs($user)
            ->postJson('/api/user-notifications/read-all')
            ->assertOk();

        $this->assertSame(0, UserNotification::where('user_id', 'usr-2')->unread()->count());
    }

    public function test_contract_lifecycle_and_approval_flow(): void
    {
        $user = $this->rccUser();

        $contractResponse = $this->actingAs($user)
            ->postJson('/api/contracts', [
                'client_id' => 'cli-3',
                'plot_id' => 'plot-2',
                'contract_type' => 'new',
                'total_amount' => 10000,
                'payment_type' => 'installment',
                'installments' => 4,
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'draft');

        $contract = Contract::where('client_id', 'cli-3')->firstOrFail();
        $this->assertSame(4, $contract->installmentSchedules()->count());

        // Payments are not allowed before rental computation.
        $this->actingAs($user)
            ->postJson('/api/payments', [
                'contract_id' => $contract->id,
                'amount' => 1000,
                'payment_method' => 'installment',
            ])
            ->assertStatus(422);

        // Compute the rental -> rental_computed.
        $this->actingAs($user)
            ->putJson("/api/contracts/{$contract->id}", [
                'lot_type' => 'individual',
                'ordinance_period' => '2013_present',
                'total_amount' => 10000,
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'rental_computed');

        // Payment of 5000 covers two 2500 installments.
        $this->actingAs($user)
            ->postJson('/api/payments', [
                'contract_id' => $contract->id,
                'amount' => 5000,
                'payment_method' => 'installment',
            ])
            ->assertOk();

        $this->assertSame(2, $contract->installmentSchedules()->where('status', 'paid')->count());
        $this->assertDatabaseHas('sent_client_notifications', ['type' => 'payment_received']);

        // Contract is not yet fully paid, so it stays rental_computed.
        $this->assertSame('rental_computed', $contract->fresh()->status);

        // Remaining payment satisfies the total -> paid.
        $this->actingAs($user)
            ->postJson('/api/payments', [
                'contract_id' => $contract->id,
                'amount' => 5000,
                'payment_method' => 'installment',
            ])
            ->assertOk();

        $this->assertSame('paid', $contract->fresh()->status);

        // Generate the printable contract from the payment -> pending_approval.
        $this->actingAs($user)
            ->postJson("/api/contracts/{$contract->id}/generate")
            ->assertOk()
            ->assertJsonPath('data.status', 'pending_approval');

        // Approvals require pending_approval and are ordered Treasurer -> Mayor.
        $this->actingAs($user)
            ->postJson("/api/contracts/{$contract->id}/approve-mayor")
            ->assertStatus(422);

        $this->actingAs($user)
            ->postJson("/api/contracts/{$contract->id}/approve-treasurer")
            ->assertOk();
        $this->actingAs($user)
            ->postJson("/api/contracts/{$contract->id}/approve-mayor")
            ->assertOk()
            ->assertJsonPath('data.status', 'approved');

        $this->assertNotNull($contract->fresh()->approved_by_treasurer_at, 'treasurer timestamp null; status='.$contract->fresh()->status);
        $this->assertNotNull($contract->fresh()->approved_by_mayor_at, 'mayor timestamp null; status='.$contract->fresh()->status);
        $this->assertDatabaseHas('sent_client_notifications', ['type' => 'contract_approved']);

        // Mayor approval does NOT auto-release.
        $this->assertSame('approved', $contract->fresh()->status);

        // Release advances approved -> released (RCC only).
        $this->actingAs($user)
            ->postJson("/api/contracts/{$contract->id}/release")
            ->assertOk()
            ->assertJsonPath('data.status', 'released');

        $this->assertDatabaseHas('sent_client_notifications', ['type' => 'contract_released']);

        // Released contracts cannot receive further payments or approvals.
        $this->actingAs($user)
            ->postJson('/api/payments', [
                'contract_id' => $contract->id,
                'amount' => 100,
            ])
            ->assertStatus(422);
        $this->actingAs($user)
            ->postJson("/api/contracts/{$contract->id}/approve-treasurer")
            ->assertStatus(422);
    }

    public function test_release_requires_approved_contract_and_rcc_role(): void
    {
        $user = $this->rccUser();

        // Draft contract cannot be released.
        $contractResponse = $this->actingAs($user)
            ->postJson('/api/contracts', [
                'client_id' => 'cli-3',
                'plot_id' => 'plot-2',
                'contract_type' => 'new',
            ])
            ->assertOk();

        $contractId = $contractResponse->json('data.id');

        $this->actingAs($user)
            ->postJson("/api/contracts/{$contractId}/release")
            ->assertStatus(422);

        // Staff cannot release contracts.
        $staff = User::where('email', 'staff@himlayan.gov.ph')->firstOrFail();

        $this->actingAs($staff)
            ->postJson("/api/contracts/{$contractId}/release")
            ->assertStatus(403);
    }

    public function test_contract_generation_requires_paid_contract(): void
    {
        $user = $this->rccUser();

        $contractResponse = $this->actingAs($user)
            ->postJson('/api/contracts', [
                'client_id' => 'cli-3',
                'plot_id' => 'plot-2',
                'contract_type' => 'new',
            ])
            ->assertOk();

        $contractId = $contractResponse->json('data.id');

        $this->actingAs($user)
            ->postJson("/api/contracts/{$contractId}/generate")
            ->assertStatus(422);
    }

    public function test_public_reserve_creates_contract_and_reserves_resource(): void
    {
        // Plan reservation
        $this->postJson('/api/reserve', [
            'type' => 'plan',
            'full_name' => 'Angela Cruz',
            'contact_number' => '+63 999 555 1234',
            'email' => 'angela.cruz@gmail.com',
            'pre_need_plan_id' => 'pln-3',
        ])
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('clients', ['full_name' => 'Angela Cruz']);
        $this->assertDatabaseHas('contracts', ['client_id' => Client::where('full_name', 'Angela Cruz')->first()->id]);

        // Public reservations create Draft contracts.
        $this->assertDatabaseHas('contracts', [
            'client_id' => Client::where('full_name', 'Angela Cruz')->first()->id,
            'status' => 'draft',
        ]);

        // Lot reservation marks the plot reserved.
        $this->postJson('/api/reserve', [
            'type' => 'lot',
            'full_name' => 'Benjie Tan',
            'contact_number' => '+63 999 555 6789',
            'plot_id' => 'plot-5',
        ])
            ->assertOk();

        $this->assertDatabaseHas('plots', ['id' => 'plot-5', 'status' => 'reserved']);

        // Public plans / columbarium data endpoints are open.
        $this->getJson('/api/reserve/plans')->assertOk();
        $this->getJson('/api/reserve/columbarium')->assertOk()->assertJsonCount(48, 'data');
        $this->getJson('/api/reserve/lots')->assertOk();
    }

    public function test_burial_approve_marks_completed(): void
    {
        $user = $this->rccUser();

        $this->actingAs($user)
            ->postJson('/api/burials/bur-1/approve')
            ->assertOk()
            ->assertJsonPath('data.burial_status', 'completed');

        $this->assertNotNull(\App\Models\Burial::find('bur-1')->approved_at);
    }

    public function test_inquiry_supports_contacted_status(): void
    {
        $user = $this->rccUser();

        $this->actingAs($user)
            ->patchJson('/api/inquiries/inq-2', ['status' => 'contacted'])
            ->assertOk()
            ->assertJsonPath('data.status', 'contacted');
    }
}
