<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'name' => config('app.name', 'SPMI'),
        'message' => 'SPMI API is running.',
        'environment' => app()->environment(),
    ]);
});
