<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use App\Models\User;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

function poli_registration_token_path(): string
{
    return storage_path('app/poli/registration-token.txt');
}

function poli_read_registration_token(): ?string
{
    $path = poli_registration_token_path();

    if (! File::exists($path)) {
        return null;
    }

    $token = trim((string) File::get($path));

    return $token !== '' ? $token : null;
}

function poli_store_registration_token(string $token): void
{
    $path = poli_registration_token_path();
    File::ensureDirectoryExists(dirname($path));
    File::put($path, $token . PHP_EOL);
}

Artisan::command('poli:generate-registration-token', function () {
    $token = Str::random(64);
    poli_store_registration_token($token);

    $this->info('Token de cadastro gerado com sucesso:');
    $this->line($token);
    $this->line('O token foi salvo em storage/app/poli/registration-token.txt');
})->purpose('Generate and store the registration token for admins and teachers');

Artisan::command('poli:create-first-admin {name?} {email?} {--password=} {--force}', function () {
    $existingAdmin = User::query()->where('role', 'admin')->exists();

    if ($existingAdmin && ! $this->option('force')) {
        $this->warn('Já existe um administrador no sistema. Use --force se quiser criar outro.');
        return 1;
    }

    $token = poli_read_registration_token();
    if (! $token) {
        $this->warn('Nenhum token encontrado. Gerando um novo token de cadastro...');
        $token = Str::random(64);
        poli_store_registration_token($token);
    }

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
    $this->line('Token de cadastro ativo: ' . $token);
    $this->line('Compartilhe esse token apenas com administradores e professores autorizados.');
})->purpose('Create the first admin user and ensure the registration token exists');

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');
