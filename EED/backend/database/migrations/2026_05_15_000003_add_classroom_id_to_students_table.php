<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('students') && ! Schema::hasColumn('students', 'classroom_id')) {
            Schema::table('students', function (Blueprint $table) {
                $table->foreignId('classroom_id')
                    ->nullable()
                    ->after('birth_date')
                    ->constrained('classrooms')
                    ->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('students') && Schema::hasColumn('students', 'classroom_id')) {
            Schema::table('students', function (Blueprint $table) {
                $table->dropConstrainedForeignId('classroom_id');
            });
        }
    }
};