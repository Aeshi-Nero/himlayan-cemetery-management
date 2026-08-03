<?php

use App\Http\Controllers\Api\AuditController;
use App\Http\Controllers\Api\BurialController;
use App\Http\Controllers\Api\BurialPermitController;
use App\Http\Controllers\Api\CemeteryMapController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\ClientFeedbackController;
use App\Http\Controllers\Api\ClientNotificationController;
use App\Http\Controllers\Api\ColumbaryNicheController;
use App\Http\Controllers\Api\ContractController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\GeminiController;
use App\Http\Controllers\Api\InquiryController;
use App\Http\Controllers\Api\MapUsageController;
use App\Http\Controllers\Api\PathfindingController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\PlotConnectionController;
use App\Http\Controllers\Api\PlotController;
use App\Http\Controllers\Api\PreNeedPlanController;
use App\Http\Controllers\Api\ReserveController;
use App\Http\Controllers\Api\SettingsController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\UserNotificationController;
use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Public/LandingPage');
});

Route::get('/lots', function () {
    return Inertia::render('Public/MemorialLotsPage');
})->name('lots');

Route::get('/lots/{plot}', function (string $plot) {
    return Inertia::render('Public/LotDetailPage', [
        'plotId' => $plot,
    ]);
})->where('plot', '[^/]+')->name('lots.show');

Route::get('/map', function () {
    return Inertia::render('Public/MemorialMapPage');
})->name('map');

Route::get('/inquiry', function () {
    return Inertia::render('Public/InquiryPage');
})->name('inquiry');

Route::get('/plans', function () {
    return Inertia::render('Public/PlansPage');
})->name('plans');

Route::get('/plans/{slug}', function (string $slug) {
    return Inertia::render('Public/PlanDetailPage', [
        'slug' => $slug,
    ]);
})->where('slug', '[^/]+')->name('plans.show');

Route::get('/columbarium', function () {
    return Inertia::render('Public/ColumbariumPage');
})->name('columbarium');

Route::get('/reserve', function () {
    return Inertia::render('Public/ReservePage');
})->name('reserve');

Route::get('/reserve/confirmation', function () {
    return Inertia::render('Public/ReserveConfirmationPage');
})->name('reserve.confirmation');

Route::get('/dashboard', function () {
    return redirect()->route('admin.dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::prefix('admin')->middleware(['auth', 'verified'])->group(function () {
    Route::get('/', fn () => redirect()->route('admin.dashboard'))->name('admin');
    Route::get('/dashboard', fn () => Inertia::render('Admin/DashboardPage'))->name('admin.dashboard');
    Route::get('/records', fn () => Inertia::render('Admin/DeceasedRecordsPage'))->name('admin.records');
    Route::get('/inquiries', fn () => Inertia::render('Admin/InquiriesPage'))->name('admin.inquiries');
    Route::get('/contracts', fn () => Inertia::render('Admin/ContractsPage'))->name('admin.contracts');
    Route::get('/payments', fn () => Inertia::render('Admin/PaymentsPage'))->name('admin.payments');
    Route::get('/burials', fn () => Inertia::render('Admin/BurialSchedulingPage'))->name('admin.burials');
    Route::get('/permits', fn () => Inertia::render('Admin/BurialPermitsPage'))->name('admin.permits');
    Route::get('/plans', fn () => Inertia::render('Admin/PreNeedPlansPage'))->name('admin.plans');
    Route::get('/niches', fn () => Inertia::render('Admin/ColumbaryNichesPage'))->name('admin.niches');
    Route::get('/feedback', fn () => Inertia::render('Admin/ClientFeedbackPage'))->name('admin.feedback');
    Route::get('/client-notifications', fn () => Inertia::render('Admin/ClientNotificationsPage'))->name('admin.client-notifications');
    Route::get('/reports', fn () => Inertia::render('Admin/ReportsPage'))->name('admin.reports');
    Route::get('/map-editor', fn () => Inertia::render('Admin/MapEditorPage'))->name('admin.map-editor');
    Route::get('/plots', fn () => Inertia::render('Admin/PlotsPage'))->name('admin.plots');
    Route::get('/pathways', fn () => Inertia::render('Admin/PathwaysPage'))->name('admin.pathways');
    Route::get('/users', fn () => Inertia::render('Admin/UsersPage'))
        ->middleware('role:super_admin')
        ->name('admin.users');
    Route::get('/audit', fn () => Inertia::render('Admin/AuditPage'))->name('admin.audit');
    Route::get('/settings', fn () => Inertia::render('Admin/SettingsPage'))->name('admin.settings');
});

Route::get('/engineer/workspace', fn () => Inertia::render('Engineer/EngineerWorkspacePage'))
    ->middleware(['auth', 'verified', 'role:engineer,super_admin'])
    ->name('engineer.workspace');

/*
|--------------------------------------------------------------------------
| Himlayan JSON Web API (hybrid with Inertia)
|--------------------------------------------------------------------------
| Session-authenticated, CSRF-protected JSON endpoints used by the map
| editors, pathfinding, statistics, and the public/data pages.
*/
Route::prefix('api')->middleware('web')->group(function () {
    // Public data endpoints
    Route::get('plots', [PlotController::class, 'index']);
    Route::get('plots/{plot}', [PlotController::class, 'show'])->where('plot', '[^/]+');
    Route::get('burials', [BurialController::class, 'index']);
    Route::get('pathfinding/nodes', [PathfindingController::class, 'nodes']);
    Route::get('pathfinding/edges', [PathfindingController::class, 'edges']);
    Route::get('pathfinding/find-path', [PathfindingController::class, 'findPath']);
    Route::get('plot-connections', [PlotConnectionController::class, 'index']);
    Route::get('cemetery-map', [CemeteryMapController::class, 'show']);
    Route::get('stats/map-usage', [MapUsageController::class, 'show']);
    Route::post('stats/map-usage/increment', [MapUsageController::class, 'increment']);
    Route::post('inquiries', [InquiryController::class, 'store']);
    Route::get('reserve/plans', [ReserveController::class, 'plans']);
    Route::get('reserve/columbarium', [ReserveController::class, 'columbarium']);
    Route::get('reserve/lots', [ReserveController::class, 'lots']);
    Route::post('reserve', [ReserveController::class, 'store']);
    Route::post('gemini/chat', [GeminiController::class, 'chat']);
    Route::post('gemini/analyze-image', [GeminiController::class, 'analyzeImage']);

    // Authenticated endpoints
    Route::middleware('auth')->group(function () {
        Route::get('dashboard', [DashboardController::class, 'show']);
        Route::get('audit', [AuditController::class, 'index']);

        Route::get('users', [UserController::class, 'index'])->middleware('role:super_admin');
        Route::post('users', [UserController::class, 'store'])->middleware('role:super_admin');
        Route::get('users/{user}', [UserController::class, 'show'])->middleware('role:super_admin');
        Route::put('users/{user}', [UserController::class, 'update'])->middleware('role:super_admin');
        Route::delete('users/{user}', [UserController::class, 'destroy'])->middleware('role:super_admin');

        Route::get('settings', [SettingsController::class, 'index'])->middleware('role:super_admin');
        Route::put('settings', [SettingsController::class, 'update'])->middleware('role:super_admin');

        Route::get('clients', [ClientController::class, 'index']);
        Route::post('clients', [ClientController::class, 'store']);

        Route::get('contracts', [ContractController::class, 'index']);
        Route::post('contracts', [ContractController::class, 'store']);
        Route::put('contracts/{contract}', [ContractController::class, 'update'])->where('contract', '[^/]+');
        Route::delete('contracts/{contract}', [ContractController::class, 'destroy'])->where('contract', '[^/]+');
        Route::post('contracts/{contract}/approve-treasurer', [ContractController::class, 'approveTreasurer'])->where('contract', '[^/]+');
        Route::post('contracts/{contract}/approve-mayor', [ContractController::class, 'approveMayor'])->where('contract', '[^/]+');
        Route::post('contracts/{contract}/generate', [ContractController::class, 'generate'])->where('contract', '[^/]+');
        Route::post('contracts/{contract}/release', [ContractController::class, 'release'])->where('contract', '[^/]+');

        Route::get('payments', [PaymentController::class, 'index']);
        Route::post('payments', [PaymentController::class, 'store']);
        Route::put('payments/{payment}', [PaymentController::class, 'update'])->where('payment', '[^/]+');
        Route::delete('payments/{payment}', [PaymentController::class, 'destroy'])->where('payment', '[^/]+');

        Route::post('burials', [BurialController::class, 'store']);
        Route::put('burials/{burial}', [BurialController::class, 'update'])->where('burial', '[^/]+');
        Route::delete('burials/{burial}', [BurialController::class, 'destroy'])->where('burial', '[^/]+');
        Route::post('burials/{burial}/approve', [BurialController::class, 'approve'])->where('burial', '[^/]+');

        Route::get('burial-permits', [BurialPermitController::class, 'index']);
        Route::post('burial-permits', [BurialPermitController::class, 'store']);
        Route::put('burial-permits/{burialPermit}', [BurialPermitController::class, 'update'])->where('burialPermit', '[^/]+');
        Route::delete('burial-permits/{burialPermit}', [BurialPermitController::class, 'destroy'])->where('burialPermit', '[^/]+');
        Route::post('burial-permits/compute-rental', [BurialPermitController::class, 'computeRental']);

        Route::get('pre-need-plans', [PreNeedPlanController::class, 'index']);
        Route::post('pre-need-plans', [PreNeedPlanController::class, 'store']);
        Route::put('pre-need-plans/{preNeedPlan}', [PreNeedPlanController::class, 'update'])->where('preNeedPlan', '[^/]+');
        Route::delete('pre-need-plans/{preNeedPlan}', [PreNeedPlanController::class, 'destroy'])->where('preNeedPlan', '[^/]+');

        Route::get('columbary-niches', [ColumbaryNicheController::class, 'index']);
        Route::post('columbary-niches', [ColumbaryNicheController::class, 'store']);
        Route::put('columbary-niches/{columbaryNiche}', [ColumbaryNicheController::class, 'update'])->where('columbaryNiche', '[^/]+');
        Route::patch('columbary-niches/{columbaryNiche}/position', [ColumbaryNicheController::class, 'updatePosition'])->where('columbaryNiche', '[^/]+');
        Route::delete('columbary-niches/{columbaryNiche}', [ColumbaryNicheController::class, 'destroy'])->where('columbaryNiche', '[^/]+');

        Route::get('client-feedback', [ClientFeedbackController::class, 'index']);
        Route::post('client-feedback', [ClientFeedbackController::class, 'store']);
        Route::delete('client-feedback/{clientFeedback}', [ClientFeedbackController::class, 'destroy'])->where('clientFeedback', '[^/]+');

        Route::get('client-notifications', [ClientNotificationController::class, 'index']);
        Route::post('client-notifications', [ClientNotificationController::class, 'store']);

        Route::get('user-notifications', [UserNotificationController::class, 'index']);
        Route::post('user-notifications/{userNotification}/read', [UserNotificationController::class, 'markRead'])->where('userNotification', '[^/]+');
        Route::post('user-notifications/read-all', [UserNotificationController::class, 'markAllRead']);

        Route::get('inquiries', [InquiryController::class, 'index']);
        Route::put('inquiries/{inquiry}', [InquiryController::class, 'update'])->where('inquiry', '[^/]+');
        Route::patch('inquiries/{inquiry}', [InquiryController::class, 'update'])->where('inquiry', '[^/]+');
        Route::delete('inquiries/{inquiry}', [InquiryController::class, 'destroy'])->where('inquiry', '[^/]+');

        // Map editor mutations
        Route::post('plots', [PlotController::class, 'store']);
        Route::put('plots/{plot}', [PlotController::class, 'update'])->where('plot', '[^/]+');
        Route::delete('plots/{plot}', [PlotController::class, 'destroy'])->where('plot', '[^/]+');

        Route::post('plot-connections/sync', [PlotConnectionController::class, 'sync']);

        Route::post('cemetery-map', [CemeteryMapController::class, 'store']);
        Route::delete('cemetery-map', [CemeteryMapController::class, 'destroy']);
    });
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
