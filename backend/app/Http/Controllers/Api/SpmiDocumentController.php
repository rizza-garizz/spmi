<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SpmiDocument;
use App\Models\SpmiDocumentVersion;
use App\Support\SharedCatalog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class SpmiDocumentController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            SpmiDocument::query()
                ->with(['standard', 'unit', 'versions'])
                ->latest()
                ->paginate(20)
        );
    }

    public function store(Request $request): JsonResponse
    {
        $allowedTypes = array_map(
            static fn (array $item) => $item['value'],
            SharedCatalog::documentTypes()
        );

        $data = $request->validate([
            'code' => ['required', 'string', 'max:50', 'unique:spmi_documents,code'],
            'title' => ['required', 'string', 'max:255'],
            'type' => ['required', 'in:' . implode(',', $allowedTypes)],
            'mutu_standard_id' => ['nullable', 'exists:mutu_standards,id'],
            'org_unit_id' => ['nullable', 'exists:org_units,id'],
            'status' => ['sometimes', 'in:draft,review,approved,archived'],
            'file' => ['required', 'file', 'max:51200'],
        ]);

        return DB::transaction(function () use ($data, $request) {
            $document = SpmiDocument::create([
                'code' => $data['code'],
                'title' => $data['title'],
                'type' => $data['type'],
                'mutu_standard_id' => $data['mutu_standard_id'] ?? null,
                'org_unit_id' => $data['org_unit_id'] ?? null,
                'status' => $data['status'] ?? 'draft',
                'current_version' => '1.0',
                'owner_id' => $request->user()?->id,
            ]);

            $version = $document->versions()->create([
                'version_number' => 1,
                'file_path' => $data['file']->store('spmi-documents', 'public'),
                'file_name' => $data['file']->getClientOriginalName(),
                'mime_type' => $data['file']->getClientMimeType(),
                'file_size' => $data['file']->getSize(),
                'status' => 'draft',
                'created_by' => $request->user()?->id,
            ]);

            $document->update([
                'current_version_id' => $version->id,
            ]);

            return response()->json($document->load('versions', 'standard', 'unit'), 201);
        });
    }

    public function show(SpmiDocument $spmiDocument): JsonResponse
    {
        return response()->json($spmiDocument->load('versions', 'standard', 'unit'));
    }

    public function update(Request $request, SpmiDocument $spmiDocument): JsonResponse
    {
        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'status' => ['sometimes', 'in:draft,review,approved,archived'],
            'file' => ['nullable', 'file', 'max:51200'],
            'note' => ['nullable', 'string'],
        ]);

        $spmiDocument->fill(array_filter($data, fn ($value, $key) => $key !== 'file', ARRAY_FILTER_USE_BOTH));
        $spmiDocument->save();

        if ($request->hasFile('file')) {
            $nextVersion = (int) $spmiDocument->versions()->max('version_number') + 1;
            $stored = $request->file('file')->store('spmi-documents', 'public');

            $version = $spmiDocument->versions()->create([
                'version_number' => $nextVersion,
                'file_path' => $stored,
                'file_name' => $request->file('file')->getClientOriginalName(),
                'mime_type' => $request->file('file')->getClientMimeType(),
                'file_size' => $request->file('file')->getSize(),
                'meta' => ['note' => $data['note'] ?? null],
                'status' => $spmiDocument->status === 'approved' ? 'approved' : 'draft',
                'created_by' => $request->user()?->id,
            ]);

            $spmiDocument->update([
                'current_version' => (string) $nextVersion,
                'current_version_id' => $version->id,
            ]);
        }

        return response()->json($spmiDocument->fresh()->load('versions', 'standard', 'unit'));
    }

    public function destroy(SpmiDocument $spmiDocument): JsonResponse
    {
        $spmiDocument->delete();

        return response()->json(['message' => 'Dokumen dihapus.']);
    }

    public function download(SpmiDocumentVersion $version): JsonResponse
    {
        return response()->json([
            'file_name' => $version->file_name,
            'download_url' => $version->file_path ? Storage::disk('public')->url($version->file_path) : null,
        ]);
    }
}
