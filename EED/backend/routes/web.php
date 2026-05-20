<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\StudentController;

// Public student creation endpoint - no CSRF middleware
Route::post('/students', [StudentController::class, 'store'])
    ->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\PreventRequestForgery::class);

// Serve the built frontend directly from Laravel so `php artisan serve` is enough.
Route::get('/', function () {
    $appIndex = public_path('app/index.html');

    if (! file_exists($appIndex)) {
        return response(
            '<!DOCTYPE html>' .
            '<html lang="pt-BR">' .
            '<head>' .
            '<meta charset="UTF-8" />' .
            '<meta name="viewport" content="width=device-width, initial-scale=1.0" />' .
            '<title>E.E.D Apoio Pedagogico</title>' .
            '</head>' .
            '<body style="font-family: sans-serif; padding: 24px">' .
            '<h1>Aplicação não compilada</h1>' .
            '<p>Execute <code>npm run build</code> dentro da pasta raiz do frontend e recarregue esta página.</p>' .
            '</body>' .
            '</html>',
            503,
            ['Content-Type' => 'text/html; charset=UTF-8']
        );
    }

    return response(file_get_contents($appIndex), 200)
        ->header('Content-Type', 'text/html; charset=UTF-8');
});

Route::get('/{any}', function () {
    $appIndex = public_path('app/index.html');

    if (file_exists($appIndex)) {
        return response(file_get_contents($appIndex), 200)
            ->header('Content-Type', 'text/html; charset=UTF-8');
    }

    abort(404);
})->where('any', '^(?!api).*$');
