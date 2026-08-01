<?php

namespace Database\Seeders;

use App\Models\ActivityLog;
use App\Models\Burial;
use App\Models\BurialPermit;
use App\Models\CemeteryMap;
use App\Models\Client;
use App\Models\ClientFeedback;
use App\Models\ColumbaryNiche;
use App\Models\Contract;
use App\Models\Inquiry;
use App\Models\InstallmentSchedule;
use App\Models\PathEdge;
use App\Models\PathNode;
use App\Models\Payment;
use App\Models\Plot;
use App\Models\PreNeedPlan;
use App\Models\Setting;
use App\Models\User;
use App\Models\UserNotification;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->seedUsers();
        $this->seedPathNodes();
        $this->seedPathEdges();
        $this->seedPlots();
        $this->seedClients();
        $this->seedContracts();
        $this->seedInquiries();
        $this->seedBurials();
        $this->seedPayments();
        $this->seedPreNeedPlans();
        $this->seedColumbaryNiches();
        $this->seedInstallmentSchedules();
        $this->seedBurialPermits();
        $this->seedClientFeedback();
        $this->seedUserNotifications();
        $this->seedActivityLog();
        $this->seedCemeteryMap();
        $this->seedSettings();
    }

    private function seedUsers(): void
    {
        $users = [
            ['usr-1', 'Super Admin User', 'admin@himlayan.gov.ph', 'super_admin'],
            ['usr-2', 'RCC Memorial Clerk', 'rcc@himlayan.gov.ph', 'rcc'],
            ['usr-3', 'Cemetery Engineer', 'engineer@himlayan.gov.ph', 'engineer'],
            ['usr-4', 'Grounds Staff', 'staff@himlayan.gov.ph', 'staff'],
        ];

        foreach ($users as [$id, $name, $email, $role]) {
            User::create([
                'id' => $id,
                'name' => $name,
                'email' => $email,
                'password' => Hash::make('Admin@123'),
                'role' => $role,
                'is_active' => true,
                'email_verified_at' => now(),
            ]);
        }
    }

    private function seedPathNodes(): void
    {
        $nodes = [
            ['node-gate-1', 14.6700, 121.0400, 'Main Gate Entrance'],
            ['node-1', 14.6710, 121.0405, 'Main Entrance Avenue A'],
            ['node-2', 14.6720, 121.0410, 'Section A North Plaza'],
            ['node-3', 14.6730, 121.0415, 'Section A North Pathway'],
            ['node-4', 14.6740, 121.0420, 'Section A Garden Loop'],
            ['node-5', 14.6715, 121.0425, 'Section B East Entrance'],
            ['node-6', 14.6725, 121.0430, 'Section B Promenade'],
            ['node-7', 14.6735, 121.0435, 'Section B Memorial Cross'],
            ['node-8', 14.6745, 121.0440, 'Section B East Perimeter'],
            ['node-9', 14.6690, 121.0410, 'Section C South Junction'],
            ['node-10', 14.6680, 121.0420, 'Section C Apartment Terraces'],
            ['node-11', 14.6670, 121.0430, 'Section C South Garden'],
            ['node-12', 14.6660, 121.0440, 'Section C Quiet Meadow'],
            ['node-13', 14.6705, 121.0390, 'Section D West Avenue'],
            ['node-14', 14.6715, 121.0385, 'Section D Family Mausoleum Lane'],
            ['node-15', 14.6725, 121.0380, 'Section D Heritage Circle'],
            ['node-16', 14.6735, 121.0375, 'Section D West Gate Exit'],
            ['node-17', 14.6700, 121.0420, 'Central Chapel & Administration Building'],
            ['node-18', 14.6710, 121.0430, 'Central Fountain Plaza'],
            ['node-19', 14.6720, 121.0440, 'Central Peace Pavilion'],
        ];

        foreach ($nodes as [$id, $lat, $lng, $label]) {
            PathNode::create([
                'id' => $id,
                'lat' => $lat,
                'lng' => $lng,
                'node_label' => $label,
                'is_accessible' => true,
            ]);
        }
    }

    private function seedPathEdges(): void
    {
        $edges = [
            ['e-1', 'node-gate-1', 'node-1', 120, 'Main Gate Avenue'],
            ['e-2', 'node-1', 'node-2', 130, 'Section A Main Drive'],
            ['e-3', 'node-2', 'node-3', 125, 'Section A North Path'],
            ['e-4', 'node-3', 'node-4', 140, 'Section A Garden Loop'],
            ['e-5', 'node-1', 'node-17', 200, 'Chapel Walkway'],
            ['e-6', 'node-17', 'node-18', 150, 'Fountain Promenade'],
            ['e-7', 'node-18', 'node-19', 160, 'Peace Pavilion Path'],
            ['e-8', 'node-17', 'node-5', 170, 'East Link Road'],
            ['e-9', 'node-5', 'node-6', 130, 'Section B Avenue'],
            ['e-10', 'node-6', 'node-7', 135, 'Memorial Cross Way'],
            ['e-11', 'node-7', 'node-8', 145, 'East Perimeter Road'],
            ['e-12', 'node-gate-1', 'node-9', 150, 'South Entry Road'],
            ['e-13', 'node-9', 'node-10', 140, 'Apartment Terrace Way'],
            ['e-14', 'node-10', 'node-11', 145, 'South Garden Path'],
            ['e-15', 'node-11', 'node-12', 155, 'Quiet Meadow Lane'],
            ['e-16', 'node-gate-1', 'node-13', 110, 'West Perimeter Avenue'],
            ['e-17', 'node-13', 'node-14', 125, 'Family Mausoleum Way'],
            ['e-18', 'node-14', 'node-15', 130, 'Heritage Circle Lane'],
            ['e-19', 'node-15', 'node-16', 135, 'West Gate Link'],
            ['e-20', 'node-2', 'node-18', 210, 'North-Central Cross Road'],
            ['e-21', 'node-6', 'node-18', 190, 'East-Central Link'],
            ['e-22', 'node-10', 'node-17', 220, 'South-Central Link'],
            ['e-23', 'node-14', 'node-17', 200, 'West-Central Link'],
        ];

        foreach ($edges as [$id, $from, $to, $weight, $name]) {
            PathEdge::create([
                'id' => $id,
                'from_node_id' => $from,
                'to_node_id' => $to,
                'distance_weight' => $weight,
                'pathway_name' => $name,
            ]);
        }
    }

    private function seedPlots(): void
    {
        $sections = [
            ['name' => 'A', 'latOffset' => 0.003, 'lngOffset' => 0.001, 'node' => 'node-3', 'typeDist' => ['single', 'single', 'family']],
            ['name' => 'B', 'latOffset' => 0.002, 'lngOffset' => 0.003, 'node' => 'node-6', 'typeDist' => ['single', 'family', 'family']],
            ['name' => 'C', 'latOffset' => -0.002, 'lngOffset' => 0.002, 'node' => 'node-10', 'typeDist' => ['apartment', 'apartment', 'single']],
            ['name' => 'D', 'latOffset' => 0.001, 'lngOffset' => -0.002, 'node' => 'node-14', 'typeDist' => ['family', 'family', 'apartment']],
        ];

        $plotId = 1;

        foreach ($sections as $sec) {
            for ($i = 1; $i <= 20; $i++) {
                $pNum = $sec['name'].'-'.str_pad((string) $i, 2, '0', STR_PAD_LEFT);
                $lotType = $sec['typeDist'][$i % 3];
                $capacity = match ($lotType) {
                    'single' => 1,
                    'family' => 4,
                    default => 8,
                };
                $price = match ($lotType) {
                    'single' => 15000,
                    'family' => 35000,
                    default => 60000,
                };

                $status = 'available';
                $currentOccupants = 0;
                $burialDate = null;
                $burialTime = null;
                $inquirerName = null;
                $deceasedName = null;

                if ($i % 4 === 0) {
                    $status = 'occupied';
                    $currentOccupants = 1;
                } elseif ($i % 7 === 0) {
                    $status = 'reserved';
                    $daysAhead = ($i % 3) + 1;
                    $burialDate = now()->addDays($daysAhead)->setTime(10, 0);
                    $burialTime = '10:00 AM';
                    $inquirerName = $i % 2 === 0 ? 'Elena Ramos' : 'Juan Dela Cruz';
                    $deceasedName = $i % 2 === 0 ? 'Mateo Ramos' : 'Rosalina Dela Cruz';
                } elseif ($i % 11 === 0) {
                    $status = 'full';
                    $currentOccupants = $capacity;
                }

                $lat = 14.6700 + $sec['latOffset']
                    + (floor(($i - 1) / 5) * 0.0003)
                    + (($i % 5) * 0.0001);
                $lng = 121.0400 + $sec['lngOffset']
                    + (($i % 5) * 0.0003)
                    + (floor(($i - 1) / 5) * 0.0001);

                Plot::create([
                    'id' => "plot-{$plotId}",
                    'plot_number' => $pNum,
                    'section' => $sec['name'],
                    'lat' => round($lat, 7),
                    'lng' => round($lng, 7),
                    'lot_type' => $lotType,
                    'capacity' => $capacity,
                    'current_occupants' => $currentOccupants,
                    'status' => $status,
                    'price' => $price,
                    'nearest_path_node_id' => $sec['node'],
                    'notes' => "Himlayan Memorial Section {$sec['name']} plot lot #{$pNum}",
                    'burial_date' => $burialDate,
                    'burial_time' => $burialTime,
                    'inquirer_name' => $inquirerName,
                    'deceased_name' => $deceasedName,
                ]);

                $plotId++;
            }
        }
    }

    private function seedClients(): void
    {
        $clients = [
            ['cli-1', 'Maria Santos', '+63 917 123 4567', 'maria.santos@gmail.com', '123 Katipunan Ave, Metro Manila', 'CRN-1984-55412', 'UMID'],
            ['cli-2', 'Juan Dela Cruz', '+63 918 987 6543', 'juan.delacruz@yahoo.com', '456 Commonwealth Ave, Metro Manila', 'PASSPORT-A99881', 'Passport'],
            ['cli-3', 'Elena Ramos', '+63 920 555 1212', 'elena.ramos@outlook.com', '789 Visayas Ave, Metro Manila', 'SSS-03-9988711-2', 'SSS ID'],
        ];

        foreach ($clients as [$id, $name, $contact, $email, $address, $idNumber, $idType]) {
            Client::create([
                'id' => $id,
                'full_name' => $name,
                'contact_number' => $contact,
                'email' => $email,
                'address' => $address,
                'id_number' => $idNumber,
                'id_type' => $idType,
            ]);
        }
    }

    private function seedContracts(): void
    {
        Contract::create([
            'id' => 'ctr-1',
            'contract_number' => 'HMC-2026-1001',
            'client_id' => 'cli-1',
            'plot_id' => 'plot-4',
            'contract_date' => '2026-01-15',
            'contract_type' => 'new',
            'commencement_date' => '2026-01-15',
            'expiration_date' => '2056-01-15',
            'total_amount' => 15000,
            'payment_type' => 'cash',
            'status' => 'released',
            'prepared_by' => 'usr-2',
            'approved_by_superadmin_at' => '2026-01-16T10:00:00Z',
            'approved_by_treasurer_at' => '2026-01-16T11:00:00Z',
            'approved_by_mayor_at' => '2026-01-17T08:00:00Z',
            'death_certificate_number' => 'DC-2026-0012',
            'amount_paid' => 15000,
            'balance_remaining' => 0,
            'created_at' => '2026-01-15T08:00:00Z',
        ]);

        Contract::create([
            'id' => 'ctr-2',
            'contract_number' => 'HMC-2026-1002',
            'client_id' => 'cli-2',
            'plot_id' => 'plot-8',
            'contract_date' => '2026-03-20',
            'contract_type' => 'new',
            'commencement_date' => '2026-03-20',
            'expiration_date' => '2076-03-20',
            'total_amount' => 35000,
            'payment_type' => 'installment',
            'status' => 'paid',
            'prepared_by' => 'usr-2',
            'amount_paid' => 10000,
            'balance_remaining' => 25000,
            'created_at' => '2026-03-20T09:30:00Z',
        ]);
    }

    private function seedInquiries(): void
    {
        Inquiry::create([
            'id' => 'inq-1',
            'client_id' => 'cli-1',
            'plot_id' => 'plot-1',
            'inquiry_date' => '2026-07-20',
            'message' => 'Interested in purchasing a Single Lot in Section A near the shade trees.',
            'status' => 'approved',
            'processed_by' => 'usr-2',
            'processed_at' => '2026-07-21T09:00:00Z',
            'created_at' => '2026-07-20T14:22:00Z',
        ]);

        Inquiry::create([
            'id' => 'inq-2',
            'client_id' => 'cli-3',
            'plot_id' => 'plot-25',
            'inquiry_date' => '2026-07-22',
            'message' => 'Requesting quotation and installment terms for Family Lot B-05.',
            'status' => 'pending',
            'created_at' => '2026-07-22T11:05:00Z',
        ]);
    }

    private function seedBurials(): void
    {
        Burial::create([
            'id' => 'bur-1',
            'plot_id' => 'plot-4',
            'contract_id' => 'ctr-1',
            'deceased_name' => 'Roberto Santos',
            'date_of_birth' => '1945-05-12',
            'date_of_death' => '2026-01-10',
            'burial_date' => '2026-01-18T10:00:00',
            'burial_status' => 'completed',
            'scheduled_by' => 'usr-2',
            'notes' => 'Funeral service held at Central Chapel. Full military honor detail.',
            'created_at' => '2026-01-15T11:00:00Z',
        ]);
    }

    private function seedPayments(): void
    {
        Payment::create([
            'id' => 'pay-1',
            'contract_id' => 'ctr-1',
            'amount' => 15000,
            'payment_date' => '2026-01-15',
            'payment_method' => 'cash',
            'receipt_number' => 'OR-2026-00891',
            'collected_by' => 'usr-2',
            'notes' => 'Full payment for Plot A-04',
            'created_at' => '2026-01-15T09:00:00Z',
        ]);

        Payment::create([
            'id' => 'pay-2',
            'contract_id' => 'ctr-2',
            'amount' => 10000,
            'payment_date' => '2026-03-20',
            'payment_method' => 'installment',
            'receipt_number' => 'OR-2026-01102',
            'collected_by' => 'usr-2',
            'notes' => 'Initial downpayment for Plot A-08',
            'created_at' => '2026-03-20T10:15:00Z',
        ]);
    }

    private function seedPreNeedPlans(): void
    {
        $plans = [
            ['pln-1', 'Basic Burial Plan', 'basic-burial', 'burial', 'Affordable in-ground interment package with standard coffin burial, marker, and memorial service support.', 45000, ['Standard in-ground burial plot', 'Basic casket handling', 'Granite marker', 'Memorial service coordination']],
            ['pln-2', 'Heritage Funeral Plan', 'heritage-funeral', 'funeral', 'Complete funeral service package with chapel rental, visitation, and full service coordination.', 95000, ['Chapel visitation (3 days)', 'Complete embalming & preparation', 'Casket & urn options', 'Funeral procession', 'Memorial service']],
            ['pln-3', 'Columbary Memorial Plan', 'columbary-memorial', 'memorial', 'Urn interment in the landscaped columbarium with an engraved niche and perpetual care.', 30000, ['Columbary niche (single urn)', 'Engraved nameplate', 'Perpetual care & maintenance', 'Annual commemoration']],
        ];

        foreach ($plans as [$id, $name, $slug, $type, $description, $price, $features]) {
            PreNeedPlan::create([
                'id' => $id,
                'name' => $name,
                'slug' => $slug,
                'type' => $type,
                'description' => $description,
                'features' => $features,
                'price' => $price,
                'is_active' => true,
            ]);
        }
    }

    private function seedColumbaryNiches(): void
    {
        $sections = [
            ['section' => 'A', 'baseLat' => 14.6690, 'baseLng' => 121.0425],
            ['section' => 'B', 'baseLat' => 14.6695, 'baseLng' => 121.0430],
        ];

        $nicheId = 1;

        foreach ($sections as $sec) {
            for ($i = 1; $i <= 24; $i++) {
                $row = (int) ceil($i / 4);
                $tier = (($i - 1) % 4) + 1;

                $status = 'available';
                if ($i % 9 === 0) {
                    $status = 'occupied';
                } elseif ($i % 5 === 0) {
                    $status = 'reserved';
                }

                ColumbaryNiche::create([
                    'id' => "niche-{$nicheId}",
                    'niche_number' => $sec['section'].'-'.str_pad((string) $i, 3, '0', STR_PAD_LEFT),
                    'section' => $sec['section'],
                    'row' => (string) $row,
                    'tier' => (string) $tier,
                    'status' => $status,
                    'price' => 30000,
                    'map_x' => round($sec['baseLng'] + (($i - 1) % 4) * 0.00015, 7),
                    'map_y' => round($sec['baseLat'] - ($row - 1) * 0.0002, 7),
                    'notes' => "Columbary section {$sec['section']}, row {$row}, tier {$tier}",
                ]);

                $nicheId++;
            }
        }
    }

    private function seedInstallmentSchedules(): void
    {
        $start = '2026-04-20';

        for ($i = 1; $i <= 5; $i++) {
            $status = 'paid';
            if ($i === 5) {
                $status = 'unpaid';
            }

            InstallmentSchedule::create([
                'id' => "sch-{$i}",
                'contract_id' => 'ctr-2',
                'due_date' => date('Y-m-d', strtotime($start." +".($i - 1)." month")),
                'amount_due' => 5000,
                'amount_paid' => $status === 'paid' ? 5000 : 0,
                'status' => $status,
                'paid_at' => $status === 'paid' ? now()->subDays(3) : null,
            ]);
        }
    }

    private function seedBurialPermits(): void
    {
        BurialPermit::create([
            'id' => 'prm-1',
            'contract_id' => 'ctr-1',
            'permit_number' => 'AF58-000001',
            'deceased_name' => 'Roberto Santos',
            'date_of_birth' => '1945-05-12',
            'date_of_death' => '2026-01-10',
            'death_certificate_number' => 'DC-2026-0012',
            'burial_permit_fee' => 1500,
            'status' => 'used',
            'issued_by' => 'usr-2',
            'issued_at' => '2026-01-17T09:00:00Z',
        ]);
    }

    private function seedClientFeedback(): void
    {
        ClientFeedback::create([
            'id' => 'fb-1',
            'contract_id' => 'ctr-1',
            'client_id' => 'cli-1',
            'rating' => 5,
            'comments' => 'The staff were very compassionate and handled everything professionally during our family\'s time of need.',
            'status' => 'submitted',
            'submitted_at' => '2026-02-01T10:00:00Z',
        ]);
    }

    private function seedUserNotifications(): void
    {
        UserNotification::create([
            'id' => 'ntf-1',
            'user_id' => 'usr-2',
            'type' => 'installment_due',
            'title' => 'Installment due soon',
            'body' => 'Contract HMC-2026-1002 has an installment due on '.date('M d, Y').'.',
            'link' => '/admin/contracts',
            'is_read' => false,
        ]);

        UserNotification::create([
            'id' => 'ntf-2',
            'user_id' => 'usr-2',
            'type' => 'burial_reminder',
            'title' => 'Burial scheduled',
            'body' => 'A burial is scheduled in the next 3 days. Please verify arrangements.',
            'link' => '/admin/burials',
            'is_read' => false,
        ]);
    }

    private function seedActivityLog(): void
    {
        ActivityLog::create([
            'id' => 'act-1',
            'user_id' => 'usr-1',
            'user_email' => 'admin@himlayan.gov.ph',
            'action' => 'SYSTEM_INITIALIZATION',
            'module' => 'System',
            'description' => 'Himlayan Cemetery Management System loaded with 80 plots & pathfinding network.',
            'ip_address' => '127.0.0.1',
        ]);
    }

    private function seedCemeteryMap(): void
    {
        CemeteryMap::create([
            'id' => 'map-1',
            'name' => 'Himlayan Memorial Park Master Boundary',
            'description' => 'Official Himlayan Memorial Park boundary perimeter and sector outlines.',
            'boundary_data' => [
                'type' => 'FeatureCollection',
                'features' => [
                    [
                        'type' => 'Feature',
                        'properties' => ['name' => 'Cemetery Perimeter'],
                        'geometry' => [
                            'type' => 'Polygon',
                            'coordinates' => [
                                [
                                    [121.0370, 14.6750],
                                    [121.0450, 14.6750],
                                    [121.0450, 14.6650],
                                    [121.0370, 14.6650],
                                    [121.0370, 14.6750],
                                ],
                            ],
                        ],
                    ],
                ],
            ],
            'created_by' => 'usr-1',
        ]);
    }

    private function seedSettings(): void
    {
        Setting::set('map_usage_count', 15842);
    }
}
