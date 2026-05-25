<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Carbon\Carbon;

class AuthController extends Controller
{
    private const REGISTRATION_TOKEN_TTL_MINUTES = 15;

    private function writeTerminalMessage(string $message): void
    {
        try {
            $stderr = @fopen('php://stderr', 'w');
            if ($stderr !== false) {
                @stream_set_write_buffer($stderr, 0);
                @fwrite($stderr, $message);
                @fflush($stderr);
                @fclose($stderr);
            }

            $stdout = @fopen('php://stdout', 'w');
            if ($stdout !== false) {
                @stream_set_write_buffer($stdout, 0);
                @fwrite($stdout, $message);
                @fflush($stdout);
                @fclose($stdout);
            }
        } catch (\Throwable $e) {
            // Ignore any stream errors; logging below still runs.
        }

        @error_log($message, 4);
        @trigger_error(trim($message), E_USER_NOTICE);
    }

    private function generateRegistrationToken(int $length = 16): string
    {
        $length = max(8, min(32, $length));
        $raw = Str::random(64) . uniqid('', true);

        return substr(md5($raw), 0, $length);
    }

    private function registrationTokenCacheKey(string $email): string
    {
        return 'poli.registration_token.' . strtolower(trim($email));
    }

    private function storeRegistrationToken(string $email, string $token): void
    {
        Cache::put(
            $this->registrationTokenCacheKey($email),
            $token,
            now()->addMinutes(self::REGISTRATION_TOKEN_TTL_MINUTES)
        );
    }

    private function getRegistrationToken(string $email): ?string
    {
        $token = Cache::get($this->registrationTokenCacheKey($email));

        return is_string($token) && $token !== '' ? $token : null;
    }

    private function forgetRegistrationToken(string $email): void
    {
        Cache::forget($this->registrationTokenCacheKey($email));
    }

    private function deliverRegistrationToken(string $token, ?string $email = null): void
    {
        $terminalMessage = sprintf("Token gerado para registro: email=%s token=%s\n", $email ?? '', $token);

        // Write a single terminal message so the token appears once.
        $this->writeTerminalMessage($terminalMessage);
    }

    private function syncTeacherSubjects(Teacher $teacher, array $subjects): void
    {
        $subjectIds = [];

        foreach ($subjects as $subject) {
            if (is_numeric($subject)) {
                $subjectIds[] = (int) $subject;
                continue;
            }

            $name = trim((string) $subject);
            if ($name === '') {
                continue;
            }

            $subjectModel = Subject::firstOrCreate(['name' => $name], ['code' => null]);
            $subjectIds[] = $subjectModel->id;
        }

        $teacher->subjects()->sync($subjectIds);
        $teacher->load('subjects');
    }

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
        try {
            $data = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email',
                'password' => 'required|string|min:8|confirmed',
                'phone' => ['nullable', 'string', 'max:30'],
                'role' => ['required', Rule::in(['admin', 'teacher', 'student'])],
                'registration_token' => ['nullable', 'string'],
                'birth_date' => ['nullable', 'date'],
                'grade' => ['nullable', 'string', 'max:50'],
                'age' => ['nullable', 'integer'],
                'subjects' => ['nullable', 'array'],
                'subjects.*' => ['nullable'],
            ]);
        } catch (QueryException $exception) {
            return response()->json([
                'message' => 'Não foi possível verificar o cadastro agora. Verifique se já tem um email cadastrado.',
            ], 503);
        }

        if ($this->hasCommonPasswordSequence($data['password'])) {
            return response()->json([
                'message' => 'A senha não pode conter sequências previsíveis como 1234 ou abcd.',
            ], 422);
        }

        if ($this->emailExistsAcrossAccounts($data['email'])) {
            return response()->json([
                'message' => 'Esse email já está cadastrado.',
            ], 422);
        }

        if (in_array($data['role'], ['admin', 'teacher'], true)) {
            $expectedToken = (string) $this->getRegistrationToken($data['email']);
            $providedToken = trim((string) ($data['registration_token'] ?? ''));

            if ($expectedToken === '' || $providedToken === '' || ! hash_equals($expectedToken, $providedToken)) {
                $token = $this->generateRegistrationToken(16);
                $this->storeRegistrationToken($data['email'], $token);
                $this->deliverRegistrationToken($token, $data['email'] ?? null);

                return response()->json([
                    'message' => 'Token de cadastro gerado automaticamente. Verifique o terminal do servidor e use o token informado.',
                ], 202);
            }
        }

        try {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'role' => $data['role'],
                'phone' => $data['phone'] ?? null,
            ]);
        } catch (QueryException $exception) {
            $errorCode = $exception->errorInfo[0] ?? null;
            if ($errorCode === '23000') {
                return response()->json([
                    'message' => 'Esse email já está cadastrado.',
                ], 422);
            }

            return response()->json([
                'message' => 'Não foi possível concluir o cadastro agora. Tente novamente mais tarde.',
            ], 503);
        }

        // If registering a teacher, create a teacher profile (separate table)
        $teacher = null;
        $student = null;
        if ($user->role === 'teacher') {
            $teacher = Teacher::create([
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $data['phone'] ?? null,
                'user_id' => $user->id,
            ]);

            if (array_key_exists('subjects', $data) && is_array($data['subjects'])) {
                $this->syncTeacherSubjects($teacher, $data['subjects']);
            }
        }

        // If registering a student, create a student profile so dashboard counts it
        if ($user->role === 'student') {
            $calculatedAge = null;
            if (! empty($data['birth_date'])) {
                try {
                    $calculatedAge = Carbon::parse($data['birth_date'])->age;
                } catch (\Throwable $exception) {
                    $calculatedAge = $data['age'] ?? null;
                }
            } elseif (array_key_exists('age', $data)) {
                $calculatedAge = $data['age'];
            }

            $student = Student::create([
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $data['phone'] ?? null,
                'user_id' => $user->id,
                'birth_date' => $data['birth_date'] ?? null,
                'grade' => $data['grade'] ?? null,
                'age' => $calculatedAge,
            ]);
        }

        if (in_array($user->role, ['admin', 'teacher'], true)) {
            $sentToken = $data['registration_token'] ?? null;

            Log::info('Registro realizado', [
                'role' => $user->role,
                'email' => $user->email,
                'registration_token' => $sentToken,
            ]);
            Log::channel('stdout')->info(sprintf('Registro: role=%s email=%s token=%s', $user->role, $user->email, $sentToken));
            $registrationMessage = sprintf("Registro: role=%s email=%s token=%s\n", $user->role, $user->email, $sentToken);
            $this->writeTerminalMessage($registrationMessage);

            // The token is one-time only: discard it after successful registration.
            $this->forgetRegistrationToken($user->email);
        }

        $response = [
            'message' => 'Cadastro realizado com sucesso',
            'user' => $user,
        ];

        if ($teacher) {
            $response['teacher'] = $teacher;
        }
        if ($student) {
            $response['student'] = $student;
        }

        return response()->json($response, 201);
    }

    public function login(Request $request)
    {
        try {
            $credentials = $request->validate([
                'email' => 'required|email',
                'password' => 'required',
            ]);

            $user = User::where('email', $credentials['email'])->first();
            if (! $user) {
                return response()->json(['message' => 'Esse email não está cadastrado.'], 404);
            }

            if (!Auth::attempt($credentials)) {
                return response()->json(['message' => 'Email ou senha inválidos.'], 401);
            }

            $user = Auth::user();
            $token = $user->createToken('api-token')->plainTextToken;

            return response()->json(['user' => $user, 'token' => $token]);
        } catch (QueryException $exception) {
            return response()->json([
                'message' => 'Não foi possível acessar o cadastro agora. Verifique se já tem um email cadastrado.',
            ], 503);
        }
    }

    public function update(Request $request)
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $currentProfile = null;
        if (($user->role ?? '') === 'teacher') {
            $currentProfile = Teacher::query()
                ->where('user_id', $user->id)
                ->first()
                ?? Teacher::query()->where('email', $user->email)->first();
        } elseif (($user->role ?? '') === 'student') {
            $currentProfile = Student::query()
                ->where('user_id', $user->id)
                ->first()
                ?? Student::query()->where('email', $user->email)->first();
        }

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required','email'],
            'phone' => ['nullable','string','max:30'],
            'birth_date' => ['nullable', 'date'],
            'grade' => ['nullable', 'string', 'max:50'],
            'subjects' => ['nullable', 'array'],
            'subjects.*' => ['nullable'],
            'is_pcd' => ['nullable', 'boolean'],
            'pcd_notes' => ['nullable', 'string'],
        ]);

        $ignoreIds = [
            'users' => [$user->id],
        ];

        if ($currentProfile) {
            $ignoreIds[$user->role === 'teacher' ? 'teachers' : 'students'] = [$currentProfile->id];
        }

        if ($this->emailExistsAcrossAccounts($data['email'], $ignoreIds)) {
            return response()->json([
                'message' => 'Esse email já está cadastrado.',
            ], 422);
        }

        $oldEmail = $user->email;

        // Do not allow role changes through this endpoint
        $user->name = $data['name'];
        $user->email = $data['email'];
        $user->phone = $data['phone'] ?? $user->phone;
        $user->save();

        // Keep profile tables in sync if present
        if (($user->role ?? '') === 'teacher') {
            $profile = Teacher::query()
                ->where('user_id', $user->id)
                ->first()
                ?? Teacher::query()->where('email', $oldEmail)->first();
            if ($profile) {
                $profile->name = $user->name;
                $profile->email = $user->email;
                $profile->phone = $data['phone'] ?? $profile->phone;
                $profile->save();

                if (array_key_exists('subjects', $data) && is_array($data['subjects'])) {
                    $this->syncTeacherSubjects($profile, $data['subjects']);
                }
            }
        } elseif (($user->role ?? '') === 'student') {
            $profile = Student::query()
                ->where('user_id', $user->id)
                ->first()
                ?? Student::query()->where('email', $oldEmail)->first();
            if ($profile) {
                $profile->name = $user->name;
                $profile->email = $user->email;
                $profile->phone = $data['phone'] ?? $profile->phone;
                $profile->birth_date = $data['birth_date'] ?? $profile->birth_date;
                $profile->grade = array_key_exists('grade', $data) ? $data['grade'] : $profile->grade;
                if (array_key_exists('subjects', $data)) {
                    $profile->subjects = $data['subjects'];
                    $profile->subjects_count = is_array($data['subjects']) ? count($data['subjects']) : $profile->subjects_count;
                }
                if (array_key_exists('is_pcd', $data)) {
                    $profile->is_pcd = (bool) $data['is_pcd'];
                }
                if (array_key_exists('pcd_notes', $data)) {
                    $profile->pcd_notes = $data['pcd_notes'];
                }
                $profile->save();
            }
        }

        return response()->json([
            'message' => 'Perfil atualizado',
            'user' => $user,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out']);
    }
}
