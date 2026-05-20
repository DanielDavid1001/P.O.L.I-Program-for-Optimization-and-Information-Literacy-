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
                if (! Schema::hasColumn('students', 'age')) {
                    $table->integer('age')->nullable()->after('birth_date');
                }

                if (! Schema::hasColumn('students', 'subjects')) {
                    $table->json('subjects')->nullable()->after('age');
                }
            });
        }

        if (Schema::hasTable('materials')) {
            Schema::table('materials', function (Blueprint $table) {
                if (! Schema::hasColumn('materials', 'subject_name')) {
                    $table->string('subject_name')->nullable()->after('type');
                }

                if (! Schema::hasColumn('materials', 'grade')) {
                    $table->string('grade')->nullable()->after('subject_name');
                }

                if (! Schema::hasColumn('materials', 'file_name')) {
                    $table->string('file_name')->nullable()->after('grade');
                }

                if (! Schema::hasColumn('materials', 'file_data')) {
                    $table->longText('file_data')->nullable()->after('file_name');
                }

                if (! Schema::hasColumn('materials', 'upload_date')) {
                    $table->date('upload_date')->nullable()->after('file_data');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('students')) {
            Schema::table('students', function (Blueprint $table) {
                if (Schema::hasColumn('students', 'subjects')) {
                    $table->dropColumn('subjects');
                }

                if (Schema::hasColumn('students', 'age')) {
                    $table->dropColumn('age');
                }
            });
        }

        if (Schema::hasTable('materials')) {
            Schema::table('materials', function (Blueprint $table) {
                foreach (['upload_date', 'file_data', 'file_name', 'grade', 'subject_name'] as $column) {
                    if (Schema::hasColumn('materials', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }
    }
};