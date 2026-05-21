<?php

namespace App\Http\Controllers;

use App\Models\Teacher;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
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

        try {
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

                $teacher->user_id = $user->id;
                $teacher->save();
            }
        } catch (\Exception $e) {
            // ignore sync failures
        }

        return response()->json($teacher, 201);
    }

    public function update(Request $request, $id)
    {
        $teacher = Teacher::findOrFail($id);
        $oldEmail = $teacher->email;
        $data = $request->validate([
            'name' => 'sometimes|required|string',
            'email' => "sometimes|required|email|unique:teachers,email,$id",
            'phone' => 'nullable|string',
            'is_intern' => 'nullable|boolean',
            'subjects' => 'nullable|array',
            'subjects.*' => 'nullable',
        ]);

        $teacher->update($data);


        try {
            if ($request->user() && ($request->user()->role ?? '') === 'admin') {
                $user = User::where('email', $oldEmail)->first();
                if ($user) {
                    $user->name = $teacher->name;
                    if (!empty($teacher->email)) {
                        $user->email = $teacher->email;
                    }
                    $user->save();
                } else {
                    if (!empty($teacher->email)) {
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
                }
            }
        } catch (\Exception $e) {
            // ignore
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

        return response()->json($teacher);
    }

    public function destroy($id)
    {
        Teacher::destroy($id);
        return response()->noContent();
    }
}
