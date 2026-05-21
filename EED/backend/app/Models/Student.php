<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Student extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'user_id',
        'email',
        'phone',
        'birth_date',
        'grade',
        'classroom_id',
        'age',
        'subjects',
        'is_pcd',
        'subjects_count',
        'pcd_notes',
    ];

    protected $casts = [
        'subjects' => 'array',
        'is_pcd' => 'boolean',
        'subjects_count' => 'integer',
    ];

    public function classroom()
    {
        return $this->belongsTo(Classroom::class);
    }

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class, 'user_id');
    }
}
