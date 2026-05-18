<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MutuStandard;
use App\Models\MutuStandardVersion;
use App\Support\SharedCatalog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MutuStandardController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            MutuStandard::query()
                ->withCount('versions')
                ->latest()
                ->get()
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'max:50', 'unique:mutu_standards,code'],
            'title' => ['required', 'string', 'max:255'],
            'category' => ['required', 'in:' . implode(',', SharedCatalog::standardCategoryKeys())],
            'description' => ['nullable', 'string'],
            'content' => ['nullable', 'array'],
        ]);

        return DB::transaction(function () use ($data, $request) {
            $standard = MutuStandard::create([
                'code' => $data['code'],
                'title' => $data['title'],
                'category' => $data['category'],
                'description' => $data['description'] ?? null,
                'status' => 'draft',
            ]);

            MutuStandardVersion::create([
                'mutu_standard_id' => $standard->id,
                'version_number' => 1,
                'content' => $data['content'] ?? [],
                'status' => 'draft',
                'created_by' => $request->user()?->id,
            ]);

            return response()->json($standard->load('versions'), 201);
        });
    }

    public function show(MutuStandard $mutuStandard): JsonResponse
    {
        return response()->json($mutuStandard->load('versions', 'publisher'));
    }

    public function update(Request $request, MutuStandard $mutuStandard): JsonResponse
    {
        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'category' => ['sometimes', 'in:' . implode(',', SharedCatalog::standardCategoryKeys())],
            'description' => ['nullable', 'string'],
            'status' => ['sometimes', 'in:draft,active,archived'],
            'content' => ['nullable', 'array'],
        ]);

        $mutuStandard->fill($data);
        $mutuStandard->save();

        if (array_key_exists('content', $data)) {
            $nextVersion = (int) $mutuStandard->versions()->max('version_number') + 1;

            $mutuStandard->versions()->create([
                'version_number' => $nextVersion,
                'content' => $data['content'] ?? [],
                'status' => $mutuStandard->status === 'active' ? 'approved' : 'draft',
                'created_by' => $request->user()?->id,
            ]);
        }

        return response()->json($mutuStandard->fresh()->load('versions'));
    }

    public function destroy(MutuStandard $mutuStandard): JsonResponse
    {
        $mutuStandard->delete();

        return response()->json(['message' => 'Standar dihapus.']);
    }

    public function publish(MutuStandard $mutuStandard, Request $request): JsonResponse
    {
        $mutuStandard->update([
            'status' => 'active',
            'published_at' => now(),
            'published_by' => $request->user()?->id,
        ]);

        return response()->json($mutuStandard->fresh()->load('versions'));
    }
}
