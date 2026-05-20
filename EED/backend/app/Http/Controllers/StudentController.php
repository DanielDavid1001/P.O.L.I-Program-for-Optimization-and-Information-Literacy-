<?php

namespace App\Http\Controllers;

use App\Models\Student;
use Illuminate\Http\Request;

class StudentController extends Controller
{
    public function index()
    {
        return Student::with('classroom')->get();
    }

    public function show($id)
    {
        return Student::with('classroom')->findOrFail($id);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'nullable|string',
            'email' => 'required|email|unique:students',
            'phone' => 'nullable|string',
            'birth_date' => 'nullable|date',
            'grade' => 'nullable|string|max:50',
            'classroom_id' => 'nullable|exists:classrooms,id',
            'age' => 'nullable|integer',
            'subjects' => 'nullable|array',
            'subjects.*' => 'string',
            'is_pcd' => 'nullable|boolean',
            'subjects_count' => 'nullable|integer',
            'pcd_notes' => 'nullable|string',
        ]);

        if (empty($data['name'])) {
            $emailPrefix = str($data['email'])->before('@')->toString();
            $data['name'] = 'Aluno ' . ($emailPrefix !== '' ? $emailPrefix : 'sem-nome');
        }

        $student = Student::create($data);
        return response()->json($student, 201);
    }

    public function update(Request $request, $id)
    {
        $student = Student::findOrFail($id);
        $data = $request->validate([
            'name' => 'sometimes|nullable|string',
            'email' => "sometimes|required|email|unique:students,email,$id",
            'phone' => 'nullable|string',
            'birth_date' => 'nullable|date',
            'grade' => 'nullable|string|max:50',
            'classroom_id' => 'nullable|exists:classrooms,id',
            'age' => 'nullable|integer',
            'subjects' => 'nullable|array',
            'subjects.*' => 'string',
            'is_pcd' => 'nullable|boolean',
            'subjects_count' => 'nullable|integer',
            'pcd_notes' => 'nullable|string',
        ]);

        if (array_key_exists('name', $data) && empty($data['name'])) {
            $emailBase = $data['email'] ?? $student->email;
            $emailPrefix = str($emailBase)->before('@')->toString();
            $data['name'] = 'Aluno ' . ($emailPrefix !== '' ? $emailPrefix : 'sem-nome');
        }

        $student->update($data);
        return response()->json($student);
    }

    public function destroy($id)
    {
        Student::destroy($id);
        return response()->noContent();
    }
}
