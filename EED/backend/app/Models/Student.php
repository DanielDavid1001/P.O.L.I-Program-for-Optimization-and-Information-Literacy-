<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Student extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
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
}
