<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRoleAccess
{
    public function handle(Request $request, Closure $next, string $roles): Response
    {
        $userRole = strtolower((string) optional($request->user())->role);
        $allowedRoles = array_filter(array_map('trim', explode(',', strtolower($roles))));

        if ($userRole === '' || ! in_array($userRole, $allowedRoles, true)) {
            return response()->json([
                'message' => 'Você não tem permissão para acessar este recurso.',
            ], 403);
        }

        return $next($request);
    }
}