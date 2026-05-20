<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('students')) {
            return;
        }

        Schema::table('students', function (Blueprint $table) {
            // Remove grade definitivamente
            if (Schema::hasColumn('students', 'grade')) {
                $table->dropColumn('grade');
            }

            if (!Schema::hasColumn('students', 'age')) {
                $table->integer('age')->nullable()->after('name');
            }

            if (!Schema::hasColumn('students', 'subjects')) {
                $table->json('subjects')->nullable()->after('age');
            }
        });

        // Make email nullable so we can create students without email
        try {
            DB::statement('ALTER TABLE students MODIFY email VARCHAR(255) NULL');
        } catch (\Exception $e) {
            // some drivers may not allow MODIFY; ignore if fails
        }
    }

    public function down(): void
    {
        if (!Schema::hasTable('students')) {
            return;
        }

        Schema::table('students', function (Blueprint $table) {
            if (Schema::hasColumn('students', 'subjects')) {
                $table->dropColumn('subjects');
            }

            if (Schema::hasColumn('students', 'age')) {
                $table->dropColumn('age');
            }

        });

        try {
            DB::statement('ALTER TABLE students MODIFY email VARCHAR(255) NOT NULL');
        } catch (\Exception $e) {
            // ignore
        }
    }
};