<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AmiAuditController;
use App\Http\Controllers\Api\CatalogController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\IntegrationController;
use App\Http\Controllers\Api\DataImportController;
use App\Http\Controllers\Api\OrgUnitController;
use App\Http\Controllers\Api\MutuStandardController;
use App\Http\Controllers\Api\PpeppCycleController;
use App\Http\Controllers\Api\RtmController;
use App\Http\Controllers\Api\SpmiDocumentController;
use App\Http\Controllers\Api\SurveyController;
use App\Http\Controllers\Api\IndicatorController;
use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => response()->json(['ok' => true]));
Route::get('/catalog', [CatalogController::class, 'index']);
Route::get('/dashboard/summary', [DashboardController::class, 'summary']);
Route::get('/indicators', [IndicatorController::class, 'index']);

Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });
});

Route::middleware(['auth:sanctum', 'role:lpm,admin'])->group(function () {
    Route::prefix('org-units')->group(function () {
        Route::get('/', [OrgUnitController::class, 'index']);
        Route::post('/', [OrgUnitController::class, 'store']);
    });

    Route::prefix('standards')->group(function () {
        Route::get('/', [MutuStandardController::class, 'index']);
        Route::post('/', [MutuStandardController::class, 'store']);
        Route::get('/{mutuStandard}', [MutuStandardController::class, 'show']);
        Route::put('/{mutuStandard}', [MutuStandardController::class, 'update']);
        Route::delete('/{mutuStandard}', [MutuStandardController::class, 'destroy']);
        Route::post('/{mutuStandard}/publish', [MutuStandardController::class, 'publish']);
    });

    Route::prefix('documents')->group(function () {
        Route::get('/', [SpmiDocumentController::class, 'index']);
        Route::post('/', [SpmiDocumentController::class, 'store']);
        Route::get('/{spmiDocument}', [SpmiDocumentController::class, 'show']);
        Route::put('/{spmiDocument}', [SpmiDocumentController::class, 'update']);
        Route::delete('/{spmiDocument}', [SpmiDocumentController::class, 'destroy']);
        Route::get('/versions/{version}', [SpmiDocumentController::class, 'download']);
    });

    Route::prefix('ppepp')->group(function () {
        Route::get('/cycles', [PpeppCycleController::class, 'index']);
        Route::post('/cycles', [PpeppCycleController::class, 'store']);
        Route::put('/cycles/{ppeppCycle}', [PpeppCycleController::class, 'update']);
    });

    Route::prefix('ami')->group(function () {
        Route::get('/audits', [AmiAuditController::class, 'index']);
        Route::post('/audits', [AmiAuditController::class, 'store']);
        Route::get('/audits/{amiAudit}', [AmiAuditController::class, 'show']);
        Route::post('/audits/{amiAudit}/findings', [AmiAuditController::class, 'addFinding']);
    });

    Route::prefix('rtm')->group(function () {
        Route::get('/meetings', [RtmController::class, 'index']);
        Route::post('/meetings', [RtmController::class, 'store']);
        Route::post('/meetings/{rtmMeeting}/actions', [RtmController::class, 'addAction']);
    });

    Route::prefix('surveys')->group(function () {
        Route::get('/', [SurveyController::class, 'index']);
        Route::post('/', [SurveyController::class, 'store']);
        Route::post('/{survey}/responses', [SurveyController::class, 'addResponse']);
    });

    Route::prefix('imports')->group(function () {
        Route::get('/', [DataImportController::class, 'index']);
        Route::post('/', [DataImportController::class, 'store']);
    });

    Route::get('/integrations', [IntegrationController::class, 'index']);

    Route::prefix('indicators')->group(function () {
        Route::post('/', [IndicatorController::class, 'store']);
        Route::post('/{indicator}/values', [IndicatorController::class, 'addValue']);
        Route::delete('/{indicator}', [IndicatorController::class, 'destroy']);
    });
});

// Pintu Masuk Data dari SIAKAD Custom (Tanpa Login User, tapi diproteksi API Key)
Route::prefix('integration')->group(function () {
    Route::post('/siakad/push', [\App\Http\Controllers\Api\SiakadIntegrationController::class, 'pushData']);
});
