<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

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

        try {
            // Only auto-create/link users when action is performed by an admin
            if ($request->user() && ($request->user()->role ?? '') === 'admin') {
                $user = User::where('email', $student->email)->first();
                if (! $user) {
                    $password = Str::random(12);
                    $user = User::create([
                        'name' => $student->name,
                        'email' => $student->email,
                        'password' => Hash::make($password),
                        'role' => 'student',
                    ]);
                } else {
                    $user->name = $student->name;
                    $user->save();
                }

                $student->user_id = $user->id;
                $student->save();
            }
        } catch (\Exception $e) {
            // do not block student creation if user sync/creation fails
        }

        return response()->json($student, 201);
    }

    public function update(Request $request, $id)
    {
        $student = Student::findOrFail($id);
        $oldEmail = $student->email;
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


        try {
            // If there's an admin performing the update, ensure a linked user exists and is synced
            if ($request->user() && ($request->user()->role ?? '') === 'admin') {
                $user = User::where('email', $oldEmail)->first();
                if ($user) {
                    $user->name = $student->name;
                    if (!empty($student->email)) {
                        $user->email = $student->email;
                    }
                    $user->save();
                } else {
                    // create and link
                    if (!empty($student->email)) {
                        $password = Str::random(12);
                        $user = User::create([
                            'name' => $student->name,
                            'email' => $student->email,
                            'password' => Hash::make($password),
                            'role' => 'student',
                        ]);
                        $student->user_id = $user->id;
                        $student->save();
                    }
                }
            }
        } catch (\Exception $e) {
            // ignore sync failures
        }

        return response()->json($student);
    }

    public function destroy($id)
    {
        Student::destroy($id);
        return response()->noContent();
    }
}
