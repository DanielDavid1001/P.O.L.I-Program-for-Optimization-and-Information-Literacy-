<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateTeacherSubjectTable extends Migration
{
    public function up()
    {
        Schema::create('teacher_subject', function (Blueprint $table) {
            $table->id();
            $table->foreignId('teacher_id')
                  ->constrained('teachers')
                  ->cascadeOnDelete();
            $table->foreignId('subject_id')
                  ->constrained('subjects')
                  ->cascadeOnDelete();
            $table->timestamps();

            // Evitar duplicatas: um professor não pode ser atribuído 2x à mesma disciplina
            $table->unique(['teacher_id', 'subject_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('teacher_subject');
    }
}
