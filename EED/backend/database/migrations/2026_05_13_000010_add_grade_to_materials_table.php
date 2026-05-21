<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddGradeToMaterialsTable extends Migration
{
    public function up()
    {
        if (! Schema::hasTable('materials') || Schema::hasColumn('materials', 'grade')) {
            return;
        }

        Schema::table('materials', function (Blueprint $table) {
            $table->string('grade')->nullable()->after('subject_id');
        });
    }

    public function down()
    {
        if (! Schema::hasTable('materials') || ! Schema::hasColumn('materials', 'grade')) {
            return;
        }

        Schema::table('materials', function (Blueprint $table) {
            $table->dropColumn('grade');
        });
    }
}
