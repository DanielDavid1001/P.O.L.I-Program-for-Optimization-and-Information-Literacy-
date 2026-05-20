<?php

namespace App\Http\Controllers;

use App\Models\Classroom;
use Illuminate\Http\Request;

class ClassroomController extends Controller
{
    public function index()
    {
        return Classroom::with('students')->get();
    }

    public function show($id)
    {
        return Classroom::with('students')->findOrFail($id);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string',
            'year' => 'nullable|string',
            'shift' => 'nullable|string',
        ]);

        $classroom = Classroom::create($data);
        return response()->json($classroom, 201);
    }

    public function update(Request $request, $id)
    {
        $classroom = Classroom::findOrFail($id);
        $data = $request->validate([
            'name' => 'sometimes|required|string',
            'year' => 'nullable|string',
            'shift' => 'nullable|string',
        ]);

        $classroom->update($data);
        return response()->json($classroom);
    }

    public function destroy($id)
    {
        Classroom::destroy($id);
        return response()->noContent();
    }
}
