<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AmiAudit;
use App\Models\AmiFinding;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AmiAuditController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(AmiAudit::query()->latest()->paginate(20));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'ppepp_cycle_id' => ['required', 'exists:ppepp_cycles,id'],
            'org_unit_id' => ['required', 'exists:org_units,id'],
            'audit_date' => ['nullable', 'date'],
            'score' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'finding_summary' => ['nullable', 'string'],
            'lead_auditor_id' => ['nullable', 'exists:users,id'],
        ]);

        return response()->json(AmiAudit::create($data), 201);
    }

    public function show(AmiAudit $amiAudit): JsonResponse
    {
        return response()->json($amiAudit);
    }

    public function addFinding(Request $request, AmiAudit $amiAudit): JsonResponse
    {
        $data = $request->validate([
            'finding_code' => ['nullable', 'string', 'max:50'],
            'description' => ['required', 'string'],
            'severity' => ['required', 'in:minor,major,observation'],
            'recommendation' => ['nullable', 'string'],
            'root_cause' => ['nullable', 'string'],
            'status' => ['sometimes', 'in:open,in_progress,closed'],
        ]);

        $finding = AmiFinding::create([
            'ami_audit_id' => $amiAudit->id,
            ...$data,
        ]);

        return response()->json($finding, 201);
    }
}
