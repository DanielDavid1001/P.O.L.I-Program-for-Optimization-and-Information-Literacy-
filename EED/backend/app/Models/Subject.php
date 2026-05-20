<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Subject extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'teacher_id',
    ];

    public function teachers()
    {
        return $this->belongsToMany(Teacher::class, 'teacher_subject');
    }

    public function materials()
    {
        return $this->hasMany(Material::class);
    }

    // Compatibilidade: manter relação com teacher_id se usado
    public function teacher()
    {
        return $this->belongsTo(Teacher::class);
    }
}
