<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
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
            'email' => 'required|email',
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

        if ($this->emailExistsAcrossAccounts($data['email'])) {
            return response()->json([
                'message' => 'Esse email já está cadastrado.',
            ], 422);
        }

        if (empty($data['name'])) {
            $emailPrefix = str($data['email'])->before('@')->toString();
            $data['name'] = 'Aluno ' . ($emailPrefix !== '' ? $emailPrefix : 'sem-nome');
        }

        $student = DB::transaction(function () use ($request, $data) {
            $student = Student::create($data);

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

                if (! $user || ! $user->id) {
                    throw new \RuntimeException('Não foi possível criar o usuário vinculado ao aluno.');
                }

                $student->user_id = $user->id;
                $student->save();

                $resetToken = Password::broker()->createToken($user);
                $student->setAttribute('reset_password_token', $resetToken);
                $student->setAttribute(
                    'reset_password_url',
                    rtrim(env('FRONTEND_URL', 'http://localhost:5173'), '/') . '/reset-password?token=' . urlencode($resetToken) . '&email=' . urlencode($user->email)
                );
            }

            return $student;
        });

        return response()->json($student, 201);
    }

    public function update(Request $request, $id)
    {
        $student = Student::findOrFail($id);
        $oldEmail = $student->email;
        $data = $request->validate([
            'name' => 'sometimes|nullable|string',
            'email' => 'sometimes|required|email',
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

        $ignoreIds = [
            'students' => [$student->id],
        ];

        if (! empty($student->user_id)) {
            $ignoreIds['users'] = [$student->user_id];
        }

        if (array_key_exists('email', $data) && $this->emailExistsAcrossAccounts($data['email'], $ignoreIds)) {
            return response()->json([
                'message' => 'Esse email já está cadastrado.',
            ], 422);
        }

        if (array_key_exists('name', $data) && empty($data['name'])) {
            $emailBase = $data['email'] ?? $student->email;
            $emailPrefix = str($emailBase)->before('@')->toString();
            $data['name'] = 'Aluno ' . ($emailPrefix !== '' ? $emailPrefix : 'sem-nome');
        }

        $student = DB::transaction(function () use ($request, $student, $data, $oldEmail) {
            $student->update($data);

            if ($request->user() && ($request->user()->role ?? '') === 'admin') {
                $user = User::where('email', $oldEmail)->first();
                if ($user) {
                    $user->name = $student->name;
                    if (! empty($student->email)) {
                        $user->email = $student->email;
                    }
                    $user->save();
                } elseif (! empty($student->email)) {
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

                if ($student->user_id && ! User::query()->whereKey($student->user_id)->exists()) {
                    throw new \RuntimeException('Não foi possível validar o usuário vinculado ao aluno.');
                }
            }

            return $student;
        });

        return response()->json($student);
    }

    public function destroy($id)
    {
        Student::destroy($id);
        return response()->noContent();
    }
}
