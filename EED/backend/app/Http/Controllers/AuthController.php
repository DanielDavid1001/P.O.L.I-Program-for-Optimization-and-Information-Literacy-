<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class AuthController extends Controller
{
    private function hasCommonPasswordSequence(string $password): bool
    {
        $normalized = strtolower($password);
        $sequences = ['0123456789', 'abcdefghijklmnopqrstuvwxyz', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm'];

        foreach ($sequences as $sequence) {
            $limit = strlen($sequence) - 4;

            for ($index = 0; $index <= $limit; $index++) {
                if (str_contains($normalized, substr($sequence, $index, 4))) {
                    return true;
                }
            }
        }

        return false;
    }

    public function register(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'role' => ['required', Rule::in(['admin', 'teacher', 'student'])],
            'registration_token' => ['nullable', 'string'],
        ]);

        if ($this->hasCommonPasswordSequence($data['password'])) {
            return response()->json([
                'message' => 'A senha não pode conter sequências previsíveis como 1234 ou abcd.',
            ], 422);
        }

        if (in_array($data['role'], ['admin', 'teacher'], true)) {
            $expectedToken = trim((string) config('services.poli.registration_token', ''));
            $providedToken = trim((string) ($data['registration_token'] ?? ''));

            if ($expectedToken === '') {
                return response()->json([
                    'message' => 'Cadastro bloqueado. Gere o token de acesso no terminal antes de registrar administradores ou professores.',
                ], 403);
            }

            if (! hash_equals($expectedToken, $providedToken)) {
                return response()->json([
                    'message' => 'Token de cadastro inválido.',
                ], 403);
            }
        }

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'role' => $data['role'],
        ]);

        return response()->json($user, 201);
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if (!Auth::attempt($credentials)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        $user = Auth::user();
        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json(['user' => $user, 'token' => $token]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out']);
    }
}
