<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;

abstract class Controller
{
    protected function emailExistsAcrossAccounts(string $email, array $ignoreIdsByTable = []): bool
    {
        $normalizedEmail = mb_strtolower(trim($email));

        $tables = [
            'users' => User::query(),
            'students' => Student::query(),
            'teachers' => Teacher::query(),
        ];

        foreach ($tables as $table => $query) {
            $ignoredIds = array_values(array_filter($ignoreIdsByTable[$table] ?? [], static fn ($value) => is_numeric($value)));

            $existing = $query->whereRaw('LOWER(email) = ?', [$normalizedEmail]);

            if (! empty($ignoredIds)) {
                $existing->whereNotIn('id', $ignoredIds);
            }

            if ($existing->exists()) {
                return true;
            }
        }

        return false;
    }
}
