<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OrgUnit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrgUnitController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            OrgUnit::query()->with('children')->orderBy('name')->get()
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'max:50', 'unique:org_units,code'],
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'in:fakultas,prodi,unit,lpm,other'],
            'parent_id' => ['nullable', 'exists:org_units,id'],
        ]);

        return response()->json(OrgUnit::create($data), 201);
    }
}
