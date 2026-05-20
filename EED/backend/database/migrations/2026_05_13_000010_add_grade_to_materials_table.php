<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddGradeToMaterialsTable extends Migration
{
    public function up()
    {
        Schema::table('materials', function (Blueprint $table) {
            $table->string('grade')->nullable()->after('subject_id');
        });
    }

    public function down()
    {
        Schema::table('materials', function (Blueprint $table) {
            $table->dropColumn('grade');
        });
    }
}
