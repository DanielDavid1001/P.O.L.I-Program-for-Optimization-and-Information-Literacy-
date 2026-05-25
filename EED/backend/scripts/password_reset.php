<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;

$email = $argv[1] ?? null;
if (!$email) {
    echo "Usage: php password_reset.php user@example.com\n";
    exit(1);
}

$user = User::where('email', $email)->first();
if (!$user) {
    echo "No user found with email: {$email}\n";
    exit(1);
}

try {
    // Use the password broker to create the token and persist it
    $broker = app('auth.password.broker');
    $token = $broker->createToken($user);

    // Build a friendly frontend URL suggestion. If FRONTEND_URL env var exists, use it.
    $frontend = env('FRONTEND_URL', null) ?? 'http://localhost:5173';
    $resetUrl = rtrim($frontend, '/') . '/reset-password?token=' . urlencode($token) . '&email=' . urlencode($email);

    echo "Password reset token created for {$email}\n";
    echo "Token: {$token}\n";
    echo "Reset URL (suggested): {$resetUrl}\n";
    echo "NOTE: If your app sends emails, consider using the normal email flow. This CLI is useful when SMTP is not configured." . "\n";
    exit(0);
} catch (\Exception $e) {
    echo "Failed to create password reset token: " . $e->getMessage() . "\n";
    exit(1);
}
