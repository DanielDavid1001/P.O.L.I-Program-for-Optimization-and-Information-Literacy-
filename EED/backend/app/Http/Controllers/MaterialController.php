<?php

namespace App\Http\Controllers;

use App\Models\Material;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class MaterialController extends Controller
{
    public function index()
    {
        return Material::with('subject')->get();
    }

    public function show($id)
    {
        return Material::with('subject')->findOrFail($id);
    }

    public function store(Request $request)
    {
        try {
            $user = $request->user();
            $roleRaw = strtolower(trim((string) optional($user)->role));
            $roleMap = ['professor' => 'teacher', 'prof' => 'teacher', 'administrador' => 'admin', 'aluno' => 'student'];
            $role = $roleMap[$roleRaw] ?? $roleRaw;

            // Allow only teachers and admins to create materials
            if (! in_array($role, ['admin', 'teacher'], true)) {
                return response()->json(['message' => 'Você não tem permissão para criar materiais.'], 403);
            }

            $data = $request->all();
            
            // Manual validation for required fields
            if (empty($data['subjectName'])) {
                return response()->json(['message' => 'subjectName é obrigatório'], 422);
            }
            if (empty($data['grade'])) {
                return response()->json(['message' => 'grade é obrigatório'], 422);
            }
            if (empty($data['uploadDate'])) {
                return response()->json(['message' => 'uploadDate é obrigatório'], 422);
            }
            
            // Validate file if present
            if ($request->hasFile('file')) {
                $file = $request->file('file');
                if (!$file->isValid()) {
                    return response()->json(['message' => 'Arquivo inválido'], 422);
                }
                if ($file->getMimeType() !== 'application/pdf') {
                    return response()->json(['message' => 'Apenas arquivos PDF são permitidos'], 422);
                }
                if ($file->getSize() > 51200 * 1024) {
                    return response()->json(['message' => 'Arquivo muito grande (máx. 50MB)'], 422);
                }
            }

            $uploadDate = $data['uploadDate'];
            if (is_string($uploadDate) && str_contains($uploadDate, '/')) {
                $uploadDate = Carbon::createFromFormat('d/m/Y', $uploadDate)->format('Y-m-d');
            } else {
                $uploadDate = Carbon::parse($uploadDate)->format('Y-m-d');
            }

            // Convert is_adapted from string ('1'/'0') to boolean
            $isAdapted = false;
            if (!empty($data['is_adapted'])) {
                $isAdapted = in_array($data['is_adapted'], [true, 1, '1', 'true', 'True', 'TRUE'], true);
            }

            // if a file was uploaded, store it on disk and set file_url accordingly
            $fileUrlToSave = null;
            $fileDataToSave = $data['fileData'] ?? null;
            $fileNameToSave = $data['fileName'] ?? null;

            if ($request->hasFile('file')) {
                $uploaded = $request->file('file');
                $fileNameToSave = $uploaded->getClientOriginalName();
                $path = $uploaded->store('materials');
                $fileUrlToSave = Storage::url($path);
                $fileDataToSave = null; // avoid storing base64 in DB
            } else {
                if (!empty($data['file_url']) && is_string($data['file_url']) && !str_starts_with($data['file_url'], 'data:')) {
                    $fileUrlToSave = $data['file_url'];
                }
            }

            $material = Material::create([
                'title' => $data['title'] ?? ($data['fileName'] ?? ($data['subjectName'] . ' - ' . $data['grade'])),
                'subject_name' => $data['subjectName'],
                'grade' => $data['grade'],
                'file_name' => $fileNameToSave,
                'file_data' => $fileDataToSave,
                'upload_date' => $uploadDate,
                'description' => $data['description'] ?? null,
                'type' => $data['type'] ?? null,
                'subject_id' => $data['subject_id'] ?? null,
                'file_url' => $fileUrlToSave,
                'uploaded_by' => $request->user()?->id,
                'is_adapted' => $isAdapted,
            ]);

            return response()->json($material, 201);
        } catch (\Throwable $e) {
            Log::error('Failed to create material', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Erro ao criar material',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $material = Material::findOrFail($id);
            $data = $request->all();

            // Parse uploadDate if provided
            if (!empty($data['uploadDate'])) {
                $uploadDate = $data['uploadDate'];
                if (is_string($uploadDate) && str_contains($uploadDate, '/')) {
                    $uploadDate = Carbon::createFromFormat('d/m/Y', $uploadDate)->format('Y-m-d');
                } else {
                    $uploadDate = Carbon::parse($uploadDate)->format('Y-m-d');
                }
                $data['uploadDate'] = $uploadDate;
            }

            // Convert is_adapted from string ('1'/'0') to boolean
            if (!empty($data['is_adapted'])) {
                $isAdapted = in_array($data['is_adapted'], [true, 1, '1', 'true', 'True', 'TRUE'], true);
                $data['is_adapted'] = $isAdapted;
            }

            // Handle file upload
            if ($request->hasFile('file')) {
                $uploaded = $request->file('file');
                $fileNameToSave = $uploaded->getClientOriginalName();
                $path = $uploaded->store('materials');
                $data['file_url'] = Storage::url($path);
                $data['file_name'] = $fileNameToSave;
                unset($data['fileData']);
            } else {
                if (!empty($data['file_url']) && is_string($data['file_url']) && str_starts_with($data['file_url'], 'data:')) {
                    unset($data['file_url']);
                }
            }

            // Map field names for update
            $updateData = [];
            $fieldMapping = [
                'title' => 'title',
                'subjectName' => 'subject_name',
                'grade' => 'grade',
                'fileName' => 'file_name',
                'uploadDate' => 'upload_date',
                'description' => 'description',
                'type' => 'type',
                'subject_id' => 'subject_id',
                'file_url' => 'file_url',
                'is_adapted' => 'is_adapted',
            ];
            foreach ($fieldMapping as $requestField => $dbField) {
                if (isset($data[$requestField])) {
                    $updateData[$dbField] = $data[$requestField];
                }
            }

            $material->update($updateData);

            return response()->json($material, 200);
        } catch (\Throwable $e) {
            Log::error('Failed to update material', [
                'id' => $id,
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Erro ao atualizar material',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $material = Material::findOrFail($id);
            $material->delete();
            return response()->json(['message' => 'Material deletado com sucesso'], 200);
        } catch (\Throwable $e) {
            Log::error('Failed to delete material', [
                'id' => $id,
                'message' => $e->getMessage(),
            ]);
            return response()->json(['message' => 'Erro ao deletar material'], 500);
        }
    }
}
