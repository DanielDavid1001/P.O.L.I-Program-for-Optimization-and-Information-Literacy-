<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Registration tokens are now generated on demand and logged from AuthController.
        // Build reset URLs for frontend flow and avoid dependency on web route password.reset.
        ResetPassword::createUrlUsing(function (object $notifiable, string $token) {
            $frontend = env('FRONTEND_URL', 'http://localhost:5173');
            return rtrim($frontend, '/') . '/reset-password?token=' . urlencode($token) . '&email=' . urlencode($notifiable->getEmailForPasswordReset());
        });
    }
}
