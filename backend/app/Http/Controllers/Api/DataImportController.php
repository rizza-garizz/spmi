<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DataImport;
use App\Support\SharedCatalog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DataImportController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(DataImport::query()->latest()->paginate(20));
    }

    public function store(Request $request): JsonResponse
    {
        $allowedTypes = array_map(
            static fn (array $item) => $item['value'],
            SharedCatalog::importTypes()
        );

        $data = $request->validate([
            'type' => ['required', 'in:' . implode(',', $allowedTypes)],
            'title' => ['required', 'string', 'max:255'],
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv', 'max:51200'],
            'meta' => ['nullable', 'array'],
        ]);

        $file = $data['file'];

        $import = DataImport::create([
            'type' => $data['type'],
            'title' => $data['title'],
            'file_path' => $file->store('imports', 'public'),
            'file_name' => $file->getClientOriginalName(),
            'meta' => $data['meta'] ?? [],
            'status' => 'queued',
            'uploaded_by' => $request->user()?->id,
        ]);

        return response()->json($import, 201);
    }
}
