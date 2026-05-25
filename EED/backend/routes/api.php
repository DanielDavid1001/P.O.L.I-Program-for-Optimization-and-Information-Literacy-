<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\TeacherController;
use App\Http\Controllers\SubjectController;
use App\Http\Controllers\MaterialController;
use App\Http\Controllers\ClassroomController;
use App\Models\Teacher;
use App\Models\Student;

Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

// Allow public listing and viewing of materials so students and guests can access PDFs
Route::get('/materials', [MaterialController::class, 'index']);
Route::get('/materials/{material}', [MaterialController::class, 'show']);
Route::get('/subjects-public', [SubjectController::class, 'publicIndex']);

// Password reset flow (public)
use App\Http\Controllers\PasswordResetController;
Route::post('/forgot-password', [PasswordResetController::class, 'forgot']);
Route::post('/reset-password', [PasswordResetController::class, 'reset']);

// Allow authenticated teachers/admins to create materials (controller enforces role)
Route::post('/materials', [MaterialController::class, 'store'])->middleware('auth:sanctum');

Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', function (Request $request) {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $normalizedRole = strtolower(trim((string) $user->role));
        $roleAliases = [
            'professor' => 'teacher',
            'prof' => 'teacher',
            'administrador' => 'admin',
            'aluno' => 'student',
        ];
        $canonicalRole = $roleAliases[$normalizedRole] ?? $normalizedRole;

        $profile = null;
        $studentProfile = null;
        $teacherProfile = null;

        if ($canonicalRole === 'teacher') {
            $teacherProfile = Teacher::query()
                ->where('user_id', $user->id)
                ->with('subjects')
                ->first()
                ?? Teacher::query()->where('email', $user->email)->with('subjects')->first();
            $profile = $teacherProfile;
        } elseif ($canonicalRole === 'student') {
            $studentProfile = Student::query()
                ->where('user_id', $user->id)
                ->with('classroom')
                ->first()
                ?? Student::query()->where('email', $user->email)->with('classroom')->first();
            $profile = $studentProfile;
        }

        $response = [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            // expose created_at so frontend can show "Membro desde"
            'created_at' => $user->created_at ? $user->created_at->toIso8601String() : null,
            'phone' => $user->phone ?? ($profile->phone ?? null),
            'profile' => $profile,
        ];

        if ($studentProfile) {
            $response['student'] = [
                'id' => $studentProfile->id,
                'name' => $studentProfile->name,
                'email' => $studentProfile->email,
                'phone' => $studentProfile->phone,
                'birth_date' => $studentProfile->birth_date,
                'grade' => $studentProfile->grade,
                'age' => $studentProfile->age,
                'subjects' => $studentProfile->subjects ?? [],
                'is_pcd' => $studentProfile->is_pcd,
                'subjects_count' => $studentProfile->subjects_count,
                'pcd_notes' => $studentProfile->pcd_notes,
                'classroom' => $studentProfile->classroom,
            ];
        }

        if ($teacherProfile) {
            $response['teacher'] = [
                'id' => $teacherProfile->id,
                'name' => $teacherProfile->name,
                'email' => $teacherProfile->email,
                'phone' => $teacherProfile->phone,
                'subjects' => $teacherProfile->subjects ?? [],
            ];
        }

        return response()->json(array_filter($response, static fn ($value) => $value !== null));
    });

    Route::patch('/user', [AuthController::class, 'update']);
});

Route::middleware(['auth:sanctum', 'role:admin,teacher'])->group(function () {
    Route::apiResource('students', StudentController::class);
    Route::apiResource('subjects', SubjectController::class);
    Route::apiResource('classrooms', ClassroomController::class);

    Route::put('/materials/{material}', [MaterialController::class, 'update']);
    Route::patch('/materials/{material}', [MaterialController::class, 'update']);
    

    Route::post('/teachers', [TeacherController::class, 'store']);
});
// Allow admins and teachers to list/view teachers; only admins can modify or delete
Route::middleware(['auth:sanctum', 'role:admin,teacher'])->group(function () {
    Route::get('/teachers', [TeacherController::class, 'index']);
    Route::get('/teachers/{teacher}', [TeacherController::class, 'show']);
});

Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::put('/teachers/{teacher}', [TeacherController::class, 'update']);
    Route::patch('/teachers/{teacher}', [TeacherController::class, 'update']);
    Route::delete('/teachers/{teacher}', [TeacherController::class, 'destroy']);
    // Only admins can delete materials
    Route::delete('/materials/{material}', [MaterialController::class, 'destroy']);
});
