<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Auth\Notifications\ResetPassword as ResetPasswordNotification;
use App\Models\User;

class PasswordResetController extends Controller
{
    public function forgot(Request $request)
    {
        $request->validate(['email' => 'required|email']);
        $email = $request->input('email');

        $user = User::where('email', $email)->first();
        if (! $user) {
            // Respond success to avoid user enumeration
            return response()->json(['message' => 'Seu token de reset chegou.'], 200);
        }

        $token = Password::broker()->createToken($user);

        // Log the token so developers can read it from terminal via log tailing
        Log::info("Password reset token for {$email}: {$token}");

        if (app()->environment(['local', 'testing']) || config('app.debug')) {
            Log::channel('stderr')->info("Password reset token for {$email}: {$token}");
        }

        // If mail driver configured, send the normal notification
        try {
            // This will only attempt delivery; if mail is not configured it will be handled by the app
            $user->notify(new ResetPasswordNotification($token));
        } catch (\Throwable $e) {
            Log::warning('Failed to send reset email: ' . $e->getMessage());
        }

        return response()->json(['message' => 'Seu token de reset chegou.'], 200);
    }

    public function reset(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'token' => 'required|string',
            'password' => 'required|string|min:8|confirmed'
        ]);

        $credentials = $request->only('email', 'password', 'password_confirmation', 'token');

        $status = Password::broker()->reset($credentials, function ($user, $password) {
            $user->password = Hash::make($password);
            $user->setRememberToken(Str::random(60));
            $user->save();
        });

        if ($status === Password::PASSWORD_RESET) {
            return response()->json(['message' => 'Password reset successful'], 200);
        }

        return response()->json(['message' => 'Invalid token or email'], 400);
    }
}
