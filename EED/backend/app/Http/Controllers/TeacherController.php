<?php

namespace App\Http\Controllers;

use App\Models\Teacher;
use Illuminate\Http\Request;

class TeacherController extends Controller
{
    public function index()
    {
        return Teacher::with('subjects')->get();
    }

    public function show($id)
    {
        return Teacher::with('subjects')->findOrFail($id);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string',
            'email' => 'required|email|unique:teachers',
            'phone' => 'nullable|string',
            'is_intern' => 'nullable|boolean',
            'subjects' => 'nullable|array',
            'subjects.*' => 'nullable',
        ]);

        $teacher = Teacher::create($data);

        // If subjects provided, sync them. Subjects may be IDs or names.
        if (!empty($data['subjects']) && is_array($data['subjects'])) {
            $subjectIds = [];
            foreach ($data['subjects'] as $s) {
                if (is_numeric($s)) {
                    $subjectIds[] = (int) $s;
                    continue;
                }

                // treat as name: find or create
                $subject = \App\Models\Subject::firstOrCreate(['name' => $s], ['code' => null]);
                $subjectIds[] = $subject->id;
            }

            $teacher->subjects()->sync($subjectIds);
            $teacher->load('subjects');
        }

        return response()->json($teacher, 201);
    }

    public function update(Request $request, $id)
    {
        $teacher = Teacher::findOrFail($id);
        $data = $request->validate([
            'name' => 'sometimes|required|string',
            'email' => "sometimes|required|email|unique:teachers,email,$id",
            'phone' => 'nullable|string',
            'is_intern' => 'nullable|boolean',
            'subjects' => 'nullable|array',
            'subjects.*' => 'nullable',
        ]);

        $teacher->update($data);

        if (array_key_exists('subjects', $data)) {
            $subjectIds = [];
            if (is_array($data['subjects'])) {
                foreach ($data['subjects'] as $s) {
                    if (is_numeric($s)) {
                        $subjectIds[] = (int) $s;
                        continue;
                    }
                    $subject = \App\Models\Subject::firstOrCreate(['name' => $s], ['code' => null]);
                    $subjectIds[] = $subject->id;
                }
            }
            $teacher->subjects()->sync($subjectIds);
            $teacher->load('subjects');
        }

        return response()->json($teacher);
    }

    public function destroy($id)
    {
        Teacher::destroy($id);
        return response()->noContent();
    }
}
