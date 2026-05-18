<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PpeppCycle;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PpeppCycleController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(PpeppCycle::query()->latest()->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'academic_year_start' => ['required', 'integer', 'min:2000'],
            'academic_year_end' => ['required', 'integer', 'min:2001'],
            'period' => ['required', 'in:semester,annual,semester_ganjil,semester_genap,yearly'],
            'status' => ['sometimes', 'in:planned,running,closed'],
        ]);

        return response()->json(PpeppCycle::create($data), 201);
    }

    public function update(Request $request, PpeppCycle $ppeppCycle): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'period' => ['sometimes', 'in:semester,annual,semester_ganjil,semester_genap,yearly'],
            'status' => ['sometimes', 'in:planned,running,closed'],
        ]);

        $ppeppCycle->update($data);

        return response()->json($ppeppCycle->fresh());
    }
}
