<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddIsInternToTeachersTable extends Migration
{
    public function up()
    {
        if (!Schema::hasTable('teachers')) return;
        if (!Schema::hasColumn('teachers', 'is_intern')) {
            Schema::table('teachers', function (Blueprint $table) {
                $table->boolean('is_intern')->default(false)->after('phone');
            });
        }
    }

    public function down()
    {
        if (Schema::hasTable('teachers') && Schema::hasColumn('teachers', 'is_intern')) {
            Schema::table('teachers', function (Blueprint $table) {
                $table->dropColumn('is_intern');
            });
        }
    }
}
