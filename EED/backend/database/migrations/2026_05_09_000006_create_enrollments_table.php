<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateEnrollmentsTable extends Migration
{
    public function up()
    {
        if (Schema::hasTable('schedules')) {
            return;
        }

        Schema::create('schedules', function (Blueprint $table) {
    $table->id();

    $table->string('name');

    $table->string('day')->nullable();

    $table->time('start_time')->nullable();

    $table->time('end_time')->nullable();

    $table->timestamps();
});

    Schema::create('schedule_students', function (Blueprint $table) {
    $table->id();

    $table->foreignId('student_id')
          ->constrained('students')
          ->cascadeOnDelete();

    $table->foreignId('schedule_id')
          ->constrained('schedules')
          ->cascadeOnDelete();

    $table->timestamps();
});
    }

    public function down()
    {
        Schema::dropIfExists('schedules');
    }
}
