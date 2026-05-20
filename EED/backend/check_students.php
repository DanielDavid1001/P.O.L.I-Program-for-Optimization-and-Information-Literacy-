<?php
require "vendor/autoload.php";
require "bootstrap/app.php";

$app = require 'bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Http\Kernel::class);
$request = \Illuminate\Http\Request::capture();
$response = $kernel->handle($request);

$students = \App\Models\Student::all();
echo "Total students in database: " . $students->count() . "\n";
foreach ($students as $student) {
    echo "ID: $student->id | Name: $student->name | Email: $student->email\n";
}
