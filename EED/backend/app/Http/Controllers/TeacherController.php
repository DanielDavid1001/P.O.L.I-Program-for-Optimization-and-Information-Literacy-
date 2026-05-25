<?php

namespace App\Http\Controllers;

use App\Models\Teacher;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

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
            'email' => 'required|email',
            'phone' => 'nullable|string',
            'is_intern' => 'nullable|boolean',
            'subjects' => 'nullable|array',
            'subjects.*' => 'nullable',
        ]);

        if ($this->emailExistsAcrossAccounts($data['email'])) {
            return response()->json([
                'message' => 'Esse email já está cadastrado.',
            ], 422);
        }

        $teacher = DB::transaction(function () use ($request, $data) {
            $teacher = Teacher::create($data);

            // If subjects provided, sync them. Subjects may be IDs or names.
            if (! empty($data['subjects']) && is_array($data['subjects'])) {
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

            if ($request->user() && ($request->user()->role ?? '') === 'admin') {
                $user = User::where('email', $teacher->email)->first();
                if (! $user) {
                    $password = Str::random(12);
                    $user = User::create([
                        'name' => $teacher->name,
                        'email' => $teacher->email,
                        'password' => Hash::make($password),
                        'role' => 'teacher',
                    ]);
                } else {
                    $user->name = $teacher->name;
                    $user->save();
                }

                if (! $user || ! $user->id) {
                    throw new \RuntimeException('Não foi possível criar o usuário vinculado ao professor.');
                }

                $teacher->user_id = $user->id;
                $teacher->save();

                $resetToken = Password::broker()->createToken($user);
                $teacher->setAttribute('reset_password_token', $resetToken);
                $teacher->setAttribute(
                    'reset_password_url',
                    rtrim(env('FRONTEND_URL', 'http://localhost:5173'), '/') . '/reset-password?token=' . urlencode($resetToken) . '&email=' . urlencode($user->email)
                );
            }

            return $teacher;
        });

        return response()->json($teacher, 201);
    }

    public function update(Request $request, $id)
    {
        $teacher = Teacher::findOrFail($id);
        $oldEmail = $teacher->email;
        $data = $request->validate([
            'name' => 'sometimes|required|string',
            'email' => 'sometimes|required|email',
            'phone' => 'nullable|string',
            'is_intern' => 'nullable|boolean',
            'subjects' => 'nullable|array',
            'subjects.*' => 'nullable',
        ]);

        $ignoreIds = [
            'teachers' => [$teacher->id],
        ];

        if (! empty($teacher->user_id)) {
            $ignoreIds['users'] = [$teacher->user_id];
        }

        if (array_key_exists('email', $data) && $this->emailExistsAcrossAccounts($data['email'], $ignoreIds)) {
            return response()->json([
                'message' => 'Esse email já está cadastrado.',
            ], 422);
        }

        $teacher = DB::transaction(function () use ($request, $teacher, $data, $oldEmail) {
            $teacher->update($data);

            if ($request->user() && ($request->user()->role ?? '') === 'admin') {
                $user = User::where('email', $oldEmail)->first();
                if ($user) {
                    $user->name = $teacher->name;
                    if (! empty($teacher->email)) {
                        $user->email = $teacher->email;
                    }
                    $user->save();
                } elseif (! empty($teacher->email)) {
                    $password = Str::random(12);
                    $user = User::create([
                        'name' => $teacher->name,
                        'email' => $teacher->email,
                        'password' => Hash::make($password),
                        'role' => 'teacher',
                    ]);
                    $teacher->user_id = $user->id;
                    $teacher->save();
                }

                if ($teacher->user_id && ! User::query()->whereKey($teacher->user_id)->exists()) {
                    throw new \RuntimeException('Não foi possível validar o usuário vinculado ao professor.');
                }
            }

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

            return $teacher;
        });

        return response()->json($teacher);
    }

    public function destroy($id)
    {
        Teacher::destroy($id);
        return response()->noContent();
    }
}
