<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RtmAction;
use App\Models\RtmMeeting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RtmController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(RtmMeeting::query()->latest()->paginate(20));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'ppepp_cycle_id' => ['required', 'exists:ppepp_cycles,id'],
            'meeting_date' => ['nullable', 'date'],
            'title' => ['required', 'string', 'max:255'],
            'conclusion' => ['nullable', 'string'],
            'status' => ['sometimes', 'in:draft,scheduled,done,archived'],
            'moderator_id' => ['nullable', 'exists:users,id'],
        ]);

        return response()->json(RtmMeeting::create($data), 201);
    }

    public function addAction(Request $request, RtmMeeting $rtmMeeting): JsonResponse
    {
        $data = $request->validate([
            'org_unit_id' => ['nullable', 'exists:org_units,id'],
            'action_item' => ['required', 'string'],
            'owner_notes' => ['nullable', 'string'],
            'due_date' => ['nullable', 'date'],
            'status' => ['sometimes', 'in:open,in_progress,done,overdue'],
        ]);

        $action = RtmAction::create([
            'rtm_meeting_id' => $rtmMeeting->id,
            ...$data,
        ]);

        return response()->json($action, 201);
    }
}
