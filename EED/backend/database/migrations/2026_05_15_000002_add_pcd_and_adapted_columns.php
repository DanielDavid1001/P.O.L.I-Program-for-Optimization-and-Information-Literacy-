<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('students')) {
            Schema::table('students', function (Blueprint $table) {
                if (! Schema::hasColumn('students', 'is_pcd')) {
                    $table->boolean('is_pcd')->default(false)->after('subjects');
                }

                if (! Schema::hasColumn('students', 'subjects_count')) {
                    $table->integer('subjects_count')->nullable()->after('is_pcd');
                }

                if (! Schema::hasColumn('students', 'pcd_notes')) {
                    $table->text('pcd_notes')->nullable()->after('subjects_count');
                }
            });
        }

        if (Schema::hasTable('materials')) {
            Schema::table('materials', function (Blueprint $table) {
                if (! Schema::hasColumn('materials', 'is_adapted')) {
                    $table->boolean('is_adapted')->default(false)->after('uploaded_by');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('students')) {
            Schema::table('students', function (Blueprint $table) {
                foreach (['pcd_notes', 'subjects_count', 'is_pcd'] as $column) {
                    if (Schema::hasColumn('students', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }

        if (Schema::hasTable('materials')) {
            Schema::table('materials', function (Blueprint $table) {
                if (Schema::hasColumn('materials', 'is_adapted')) {
                    $table->dropColumn('is_adapted');
                }
            });
        }
    }
};
