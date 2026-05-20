<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Material extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'subject_name',
        'grade',
        'file_name',
        'file_data',
        'upload_date',
        'description',
        'type',
        'subject_id',
        'file_url',
        'uploaded_by',
        'is_adapted',
    ];

    protected $casts = [
        'is_adapted' => 'boolean',
    ];

    public function subject()
    {
        return $this->belongsTo(Subject::class);
    }

    public function teacher()
    {
        return $this->belongsTo(Teacher::class, 'uploaded_by');
    }
}
