<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\SharedCatalog;
use Illuminate\Http\JsonResponse;

class IntegrationController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'sources' => SharedCatalog::integrations(),
        ]);
    }
}
