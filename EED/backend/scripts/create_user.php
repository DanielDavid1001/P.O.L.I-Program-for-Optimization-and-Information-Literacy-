<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;

$email = $argv[1] ?? 'admphone-test@example.com';
$plain = $argv[2] ?? 'Password123';

if (User::where('email', $email)->exists()) {
    echo "User exists: {$email}\n";
    exit(0);
}

$user = User::create([
    'name' => 'Admin Phone Test',
    'email' => $email,
    'password' => $plain,
    'role' => 'admin',
    'phone' => '(12)3456-7890',
]);

// Hashing will be handled by model casts if configured; if not, ensure hashed
if (password_get_info($user->password)['algo'] === 0) {
    $user->password = password_hash($plain, PASSWORD_BCRYPT);
    $user->save();
}

echo "Created user: {$user->email}\n";
