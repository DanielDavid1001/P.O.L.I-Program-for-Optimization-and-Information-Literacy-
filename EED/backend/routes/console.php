<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Generate a compact registration token using md5 and substr.
 * Default length is 16 characters; adjust by passing $length.
 */
function poli_generate_registration_token(int $length = 16): string
{
    $raw = Str::random(64) . uniqid('', true);
    $hash = md5($raw);

    // Ensure requested length is within md5 hash bounds
    $length = max(8, min(32, $length));

    return substr($hash, 0, $length);
}

Artisan::command('poli:generate-registration-token {--length=16}', function () {
    $length = (int) $this->option('length');
    $length = max(8, min(32, $length));

    $token = poli_generate_registration_token($length);

    $this->info("Token de cadastro gerado com sucesso (length={$length}):");
    $this->line($token);
    $this->line('Esse token é temporário e não é salvo em arquivo.');
})->purpose('Generate a temporary registration token for admins and teachers');

Artisan::command('poli:create-first-admin {name?} {email?} {--password=} {--force}', function () {
    $existingAdmin = User::query()->where('role', 'admin')->exists();

    if ($existingAdmin && ! $this->option('force')) {
        $this->warn('Já existe um administrador no sistema. Use --force se quiser criar outro.');
        return 1;
    }

    $token = poli_generate_registration_token(16);

    $name = $this->argument('name') ?: $this->ask('Nome do primeiro administrador');
    $email = $this->argument('email') ?: $this->ask('E-mail do primeiro administrador');
    $password = $this->option('password') ?: $this->secret('Senha do primeiro administrador');

    $user = User::updateOrCreate(
        ['email' => $email],
        [
            'name' => $name,
            'password' => Hash::make($password),
            'role' => 'admin',
        ]
    );

    $this->info('Administrador inicial criado/atualizado com sucesso.');
    $this->line('E-mail: ' . $user->email);
    $this->line('Token de cadastro temporário: ' . $token);
    $this->line('Compartilhe esse token apenas com administradores e professores autorizados.');
})->purpose('Create the first admin user and print a temporary registration token');

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');
