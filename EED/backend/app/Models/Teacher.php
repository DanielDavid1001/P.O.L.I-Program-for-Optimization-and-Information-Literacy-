<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Teacher extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'is_intern',
    ];

    protected $casts = [
        'is_intern' => 'boolean',
    ];

    public function subjects()
    {
        return $this->belongsToMany(Subject::class, 'teacher_subject');
    }

    public function materials()
    {
        return $this->hasMany(Material::class, 'uploaded_by');
    }
}
