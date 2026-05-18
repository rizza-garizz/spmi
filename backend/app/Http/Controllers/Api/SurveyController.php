<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Survey;
use App\Models\SurveyResponse;
use App\Support\SharedCatalog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SurveyController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Survey::query()->latest()->paginate(20));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'target' => ['required', 'in:' . implode(',', array_map(static fn (array $target) => $target['value'] ?? '', SharedCatalog::surveyTargets()))],
            'ppepp_cycle_id' => ['nullable', 'exists:ppepp_cycles,id'],
            'status' => ['sometimes', 'in:draft,published,closed'],
        ]);

        return response()->json(Survey::create($data), 201);
    }

    public function addResponse(Request $request, Survey $survey): JsonResponse
    {
        $data = $request->validate([
            'org_unit_id' => ['nullable', 'exists:org_units,id'],
            'answers' => ['required', 'array'],
            'score' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ]);

        $response = SurveyResponse::create([
            'survey_id' => $survey->id,
            ...$data,
        ]);

        return response()->json($response, 201);
    }
}
