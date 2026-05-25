<?php

namespace App\Http\Middleware;

use App\Models\Student;
use App\Models\Teacher;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRoleAccess
{
    public function handle(Request $request, Closure $next, string $roles): Response
    {
        $user = $request->user();
        $userRoleRaw = strtolower(trim((string) optional($user)->role));
        // Normalize common Portuguese role labels to canonical values
        $map = [
            'professor' => 'teacher',
            'prof' => 'teacher',
            'administrador' => 'admin',
            'aluno' => 'student',
        ];

        $userRole = $map[$userRoleRaw] ?? $userRoleRaw;

        // Fallback inference: if the user role is missing or stale, infer from profile tables.
        if (($userRole === '' || ! in_array($userRole, ['admin', 'teacher', 'student'], true)) && $user?->email) {
            if (Teacher::query()->where('email', $user->email)->exists()) {
                $userRole = 'teacher';
            } elseif (Student::query()->where('email', $user->email)->exists()) {
                $userRole = 'student';
            }
        }

        // Explicit allowance: permit teachers and admins to POST to materials endpoints
        if (in_array($userRole, ['teacher', 'admin'], true) && strtoupper($request->method()) === 'POST' && str_contains(strtolower($request->path()), 'materials')) {
            return $next($request);
        }


        // Determine allowed roles from middleware parameter
        $allowedRoles = array_filter(array_map('trim', explode(',', strtolower($roles))));

        // By default, allow actions when the user's canonical role is present in the allowed roles.
        // If user's role is 'teacher' but the middleware does not include 'teacher', then restrict write methods.
        // If the route explicitly allows 'teacher', permit immediately (teachers can perform writes when allowed)
        if ($userRole === 'teacher' && in_array('teacher', $allowedRoles, true)) {
            return $next($request);
        }
        if ($userRole === 'teacher' && ! in_array('teacher', $allowedRoles, true)) {
            // allow safe read-only methods for teachers when they are not explicitly permitted
            if (in_array($request->method(), ['GET', 'HEAD', 'OPTIONS'], true)) {
                return $next($request);
            }
            return response()->json([
                'message' => 'Você não tem permissão para acessar este recurso.',
            ], 403);
        }

        // (No temporary bypasses remain) allow teacher write only when 'teacher' present in allowed roles

        if ($userRole === '' || ! in_array($userRole, $allowedRoles, true)) {
            return response()->json([
                'message' => 'Você não tem permissão para acessar este recurso.',
            ], 403);
        }

        return $next($request);
    }
}