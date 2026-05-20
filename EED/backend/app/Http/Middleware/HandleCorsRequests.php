<?php

namespace App\Http\Middleware;

use Illuminate\Http\Middleware\HandleCors;

class HandleCorsRequests extends HandleCors
{
    protected $except = [];
}
