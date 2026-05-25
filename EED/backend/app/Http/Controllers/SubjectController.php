<?php

namespace App\Http\Controllers;

use App\Models\Subject;
use Illuminate\Http\Request;

class SubjectController extends Controller
{
    public function publicIndex()
    {
        return Subject::query()
            ->select(['id', 'name', 'code'])
            ->orderBy('name')
            ->get();
    }

    public function index()
    {
        return Subject::with('teacher')->paginate(20);
    }

    public function show($id)
    {
        return Subject::with('teacher')->findOrFail($id);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string',
            'code' => 'nullable|string',
            'teacher_id' => 'nullable|exists:teachers,id',
        ]);

        $subject = Subject::create($data);
        return response()->json($subject, 201);
    }

    public function update(Request $request, $id)
    {
        $subject = Subject::findOrFail($id);
        $data = $request->validate([
            'name' => 'sometimes|required|string',
            'code' => 'nullable|string',
            'teacher_id' => 'nullable|exists:teachers,id',
        ]);

        $subject->update($data);
        return response()->json($subject);
    }

    public function destroy($id)
    {
        Subject::destroy($id);
        return response()->noContent();
    }
}
