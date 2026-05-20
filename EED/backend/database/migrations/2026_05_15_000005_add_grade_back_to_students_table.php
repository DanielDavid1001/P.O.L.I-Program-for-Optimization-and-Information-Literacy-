<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('students')) {
            return;
        }

        if (!Schema::hasColumn('students', 'grade')) {
            Schema::table('students', function (Blueprint $table) {
                $table->string('grade')->nullable()->after('birth_date');
            });
        }
    }

    public function down(): void
    {
        if (!Schema::hasTable('students') || !Schema::hasColumn('students', 'grade')) {
            return;
        }

        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn('grade');
        });
    }
};
