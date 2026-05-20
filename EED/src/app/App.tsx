import { useEffect, useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { StudentForm } from './components/StudentForm';
import { TeacherForm } from './components/TeacherForm';
import { StudentsList } from './components/StudentsList';
import { TeachersList } from './components/TeachersList';
import { MaterialForm } from './components/MaterialForm';
import { MaterialsList } from './components/MaterialsList';
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  BookOpen,
  UserPlus,
  BookMarked,
  Plus,
  Moon,
  Sun,
} from 'lucide-react';
import logo from '../imports/image.png';
import {
  createStudent as apiCreateStudent,
  updateStudent as apiUpdateStudent,
  deleteStudent as apiDeleteStudent,
  getStudents as apiGetStudents,
  createTeacher as apiCreateTeacher,
  updateTeacher as apiUpdateTeacher,
  deleteTeacher as apiDeleteTeacher,
  getTeachers as apiGetTeachers,
  createMaterial as apiCreateMaterial,
  deleteMaterial as apiDeleteMaterial,
  getMaterials as apiGetMaterials,
} from '../lib/api';

export interface Material {
  id: string;
  subjectName: string;
  grade: string;
  fileName: string;
  fileData: string;
  uploadDate: string;
  isAdapted?: boolean;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  phone?: string;
  birth_date?: string;
  grade?: string;
  age?: number;
  subjects?: string[];
  isPcd?: boolean;
  pcdNotes?: string;
}

export interface Teacher {
  id: string;
  name: string;
  subjects?: string[];
  email: string;
  phone?: string;
  isIntern?: boolean;
  is_intern?: boolean;
}

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  const [materials, setMaterials] = useState<Material[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [studentsResponse, teachersResponse, materialsResponse, subjectsResponse] = await Promise.all([
          apiGetStudents(),
          apiGetTeachers(),
          apiGetMaterials(),
          // load subjects for teacher specialization selector
          (await import('../lib/api')).getSubjects(),
        ]);

        setStudents(
          Array.isArray(studentsResponse)
            ? studentsResponse.map((student: any) => ({
                id: String(student.id),
                name: student.name ?? '',
                email: student.email ?? '',
                phone: student.phone ?? '',
                birth_date: student.birth_date ?? student.birthDate ?? '',
                grade: student.grade ?? '',
                age: student.age ?? undefined,
                subjects: Array.isArray(student.subjects) ? student.subjects : [],
                isPcd: student.isPcd ?? student.is_pcd ?? false,
                pcdNotes: student.pcdNotes ?? student.pcd_notes ?? '',
              }))
            : []
        );
        setTeachers(Array.isArray(teachersResponse) ? teachersResponse.map((teacher: any) => ({
          ...teacher,
          id: String(teacher.id),
          isIntern: (teacher.is_intern ?? teacher.isIntern) ?? false,
          subjects: Array.isArray(teacher.subjects)
            ? teacher.subjects.map((s: any) => (typeof s === 'string' ? s : s.name ?? s.title ?? String(s.id ?? '')))
            : [],
        })) : []);
        // subjectsResponse may be paginated ({data: [...]}) or an array
        const subjList = Array.isArray(subjectsResponse) ? subjectsResponse : (subjectsResponse?.data ?? []);
        setSubjects(Array.isArray(subjList) ? subjList.map((s: any) => ({ id: s?.id ?? s?.ID ?? s?.code ?? s?.name, name: typeof s === 'string' ? s : (s.name ?? s.title ?? String(s?.id ?? '')) })) : []);
        // if there's session data for materials, prefer that (keeps user session state on reload)
        const sessionMaterials = (() => {
          try {
            const raw = sessionStorage.getItem('eed-materials');
            if (!raw) return null;
            return JSON.parse(raw);
          } catch (e) {
            return null;
          }
        })();

        const normalize = (material: any): Material => ({
          id: String(material?.id ?? ''),
          subjectName: material?.subjectName ?? material?.subject_name ?? material?.title ?? '',
          grade: material?.grade ?? '',
          fileName: material?.fileName ?? material?.file_name ?? '',
          fileData: material?.fileData ?? material?.file_data ?? material?.file_url ?? '',
          uploadDate: material?.uploadDate ?? material?.upload_date ?? material?.created_at ?? new Date().toISOString().split('T')[0],
          isAdapted: !!(
            material?.isAdapted === true ||
            material?.is_adapted === true ||
            material?.isAdapted === 1 ||
            material?.is_adapted === 1 ||
            material?.isAdapted === '1' ||
            material?.is_adapted === '1'
          ),
        });

        const parsedMaterials = Array.isArray(materialsResponse)
          ? materialsResponse.map((material: any) => normalize(material))
          : [];

        const sessionNormalized = Array.isArray(sessionMaterials)
          ? sessionMaterials.map(normalize)
          : [];

        const mergedMaterials = [...parsedMaterials];
        const seenIds = new Set(mergedMaterials.map((material) => material.id));

        sessionNormalized.forEach((material) => {
          if (!seenIds.has(material.id)) {
            mergedMaterials.push(material);
          }
        });

        setMaterials(mergedMaterials);
      } catch (error) {
        console.error('Failed to load persisted data', error);
      }
    };

    void loadData();
  }, []);

  useEffect(() => {
    // restore active tab from session if present
    try {
      const saved = sessionStorage.getItem('eed-activeTab');
      if (saved) setActiveTab(saved);
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('eed-darkmode');
      if (saved !== null) {
        setDarkMode(saved === 'true');
      }
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('eed-darkmode', darkMode ? 'true' : 'false');
    } catch (e) {
      // ignore
    }
  }, [darkMode]);

  const addMaterial = async (material: any) => {
    try {
      let created: any;
      if (typeof FormData !== 'undefined' && material instanceof FormData) {
        created = await apiCreateMaterial(material);
      } else {
        created = await apiCreateMaterial({
          subjectName: material.subjectName,
          grade: material.grade,
          fileName: material.fileName,
          fileData: material.fileData,
          uploadDate: material.uploadDate,
          file_url: material.fileData,
          description: `Arquivo ${material.fileName}`,
          is_adapted: material.isAdapted ?? false,
          type: 'pdf',
        });
      }

      const newItem: Material = {
        id: String(created.id),
        subjectName: created.subjectName ?? created.subject_name ?? (material.get ? material.get('subjectName') : material.subjectName),
        grade: created.grade ?? created.grade ?? (material.get ? material.get('grade') : material.grade),
        fileName: created.fileName ?? created.file_name ?? (material.get ? material.get('fileName') : material.fileName),
        fileData: created.fileData ?? created.file_data ?? created.file_url ?? (material.get ? material.get('file_url') || material.get('file') : material.fileData),
        uploadDate: created.uploadDate ?? created.upload_date ?? (material.get ? material.get('uploadDate') : material.uploadDate),
        isAdapted: created.isAdapted ?? created.is_adapted ?? (material.get ? (material.get('is_adapted') === '1' || material.get('is_adapted') === 'true') : material.isAdapted ?? false),
      };

      setMaterials((current) => {
        const next = [...current, newItem];
        try {
          sessionStorage.setItem('eed-materials', JSON.stringify(next));
        } catch (_) {}
        return next;
      });
    } catch (err) {
      console.error('Failed to create material', err);
      const e: any = err;
      alert('Erro ao criar material: ' + (e?.error || e?.message || JSON.stringify(e)));
      throw err;
    }
  };

  const addStudent = async (student: Student) => {
    try {
      const payload = { name: student.name, email: student.email, phone: student.phone, birth_date: student.birth_date, grade: student.grade, age: student.age, subjects: student.subjects, is_pcd: student.isPcd, pcd_notes: student.pcdNotes };
      const created = await apiCreateStudent(payload);
      setStudents((current) => [
        ...current,
        {
          id: String(created.id),
          name: created.name ?? student.name,
          email: created.email ?? student.email,
          phone: created.phone ?? student.phone,
          birth_date: created.birth_date ?? student.birth_date,
          grade: created.grade ?? student.grade,
          age: created.age ?? student.age,
          subjects: Array.isArray(created.subjects) ? created.subjects : student.subjects ?? [],
          isPcd: created.isPcd ?? created.is_pcd ?? student.isPcd ?? false,
          pcdNotes: created.pcdNotes ?? created.pcd_notes ?? student.pcdNotes ?? '',
        },
      ]);
      setEditingStudent(null);
      setActiveTab('students');
    } catch (err) {
      console.error('Failed to create student', err);
      const e: any = err;
      alert('Erro ao criar aluno: ' + (e?.message || JSON.stringify(e)));
      throw err;
    }
  };

  const updateStudent = async (student: Student) => {
    try {
      const payload = { name: student.name, email: student.email, phone: student.phone, birth_date: student.birth_date, grade: student.grade, age: student.age, subjects: student.subjects, is_pcd: student.isPcd, pcd_notes: student.pcdNotes };
      const updated = await apiUpdateStudent(student.id, payload);
      setStudents((current) =>
        current.map((item) =>
          String(item.id) === String(updated.id)
            ? {
                id: String(updated.id),
                name: updated.name ?? student.name,
                email: updated.email ?? student.email,
                phone: updated.phone ?? student.phone,
                birth_date: updated.birth_date ?? student.birth_date,
                grade: updated.grade ?? student.grade,
                age: updated.age ?? student.age,
                subjects: Array.isArray(updated.subjects) ? updated.subjects : student.subjects ?? [],
                isPcd: updated.isPcd ?? updated.is_pcd ?? student.isPcd ?? false,
                pcdNotes: updated.pcdNotes ?? updated.pcd_notes ?? student.pcdNotes ?? '',
              }
            : item
        )
      );
      setEditingStudent(null);
      setActiveTab('students');
    } catch (err) {
      console.error('Failed to update student', err);
      const e: any = err;
      alert('Erro ao atualizar aluno: ' + (e?.message || JSON.stringify(e)));
      throw err;
    }
  };

  const refreshSubjects = async () => {
    try {
      const api = await import('../lib/api');
      const resp = await api.getSubjects();
      const list = Array.isArray(resp) ? resp : (resp?.data ?? []);
      setSubjects(Array.isArray(list) ? list.map((s: any) => ({ id: s?.id ?? s?.ID ?? s?.code ?? s?.name, name: typeof s === 'string' ? s : (s.name ?? s.title ?? String(s?.id ?? '')) })) : []);
    } catch (err) {
      console.error('Failed to refresh subjects', err);
    }
  };

  const addTeacher = async (teacher: Teacher) => {
    try {
      // map teacher.subjects (names) to IDs when possible for robustness
      const payloadSubjects = (teacher.subjects ?? []).map((s: any) => {
        if (typeof s === 'number') return s;
        const found = subjects.find((sub: any) => String(sub.name).toLowerCase() === String(s).toLowerCase());
        return found ? found.id : s;
      });

      const created = await apiCreateTeacher({ name: teacher.name, email: teacher.email, phone: teacher.phone, is_intern: (teacher.isIntern ?? teacher.is_intern) ?? false, subjects: payloadSubjects });

      const normalizedSubjects = Array.isArray(created.subjects)
        ? created.subjects.map((s: any) => (typeof s === 'string' ? s : s.name ?? s.title ?? String(s.id ?? '')))
        : (teacher.subjects ?? []);

      setTeachers((current) => [...current, { ...created, id: String(created.id), isIntern: (created.is_intern ?? created.isIntern) ?? false, subjects: normalizedSubjects }]);
      setEditingTeacher(null);
      setActiveTab('teachers');
    } catch (err) {
      console.error('Failed to create teacher', err);
      const e: any = err;
      alert('Erro ao criar professor: ' + (e?.message || JSON.stringify(e)));
      throw err;
    }
  };

  const updateTeacher = async (teacher: Teacher) => {
    try {
      const payloadSubjects = (teacher.subjects ?? []).map((s: any) => {
        if (typeof s === 'number') return s;
        const found = subjects.find((sub: any) => String(sub.name).toLowerCase() === String(s).toLowerCase());
        return found ? found.id : s;
      });

      const updated = await apiUpdateTeacher(teacher.id, { name: teacher.name, email: teacher.email, phone: teacher.phone, is_intern: (teacher.isIntern ?? teacher.is_intern) ?? false, subjects: payloadSubjects });

      const normalizedSubjects = Array.isArray(updated.subjects)
        ? updated.subjects.map((s: any) => (typeof s === 'string' ? s : s.name ?? s.title ?? String(s.id ?? '')))
        : (teacher.subjects ?? []);

      setTeachers((current) => current.map((item) => (String(item.id) === String(updated.id) ? { ...updated, id: String(updated.id), isIntern: (updated.is_intern ?? updated.isIntern) ?? false, subjects: normalizedSubjects } : item)));
      setEditingTeacher(null);
      setActiveTab('teachers');
    } catch (err) {
      console.error('Failed to update teacher', err);
      const e: any = err;
      alert('Erro ao atualizar professor: ' + (e?.message || JSON.stringify(e)));
      throw err;
    }
  };

  // Unified save handler: decides create vs update based on presence of id
  const saveTeacher = async (teacher: Teacher) => {
    if (teacher.id && String(teacher.id).length > 0) {
      return updateTeacher(teacher);
    }
    return addTeacher(teacher);
  };

  const removeMaterial = async (id: string) => {
    await apiDeleteMaterial(id);
    const next = materials.filter((item) => item.id !== id);
    setMaterials(next);
    try {
      sessionStorage.setItem('eed-materials', JSON.stringify(next));
    } catch (_) {}
  };
  const removeStudent = async (id: string) => {
    await apiDeleteStudent(id);
    setStudents((current) => current.filter((item) => item.id !== id));
  };
  const removeTeacher = async (id: string) => {
    await apiDeleteTeacher(id);
    setTeachers((current) => current.filter((item) => item.id !== id));
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setActiveTab('add-student');
  };

  const handleEditTeacher = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setActiveTab('add-teacher');
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <header className={`shadow-sm border-b-4 border-orange-500 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src={logo}
                alt="Estudo em Dia"
                className="h-20 w-auto rounded-lg shadow-sm bg-white p-1"
              />
              <div>
                <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  <span className="md:hidden">E.E.D</span>
                  <span className="hidden md:inline">Estudo Em Dia - Apoio Pedagógico </span>
                </h1>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Powered With P.O.L.I</p>
              </div>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-3 rounded-lg transition-colors ${
                darkMode ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title={darkMode ? 'Modo Claro' : 'Modo Escuro'}
            >
              {darkMode ? <Sun size={24} /> : <Moon size={24} />}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
              activeTab === 'dashboard'
                ? 'bg-blue-500 text-white'
                : darkMode
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <LayoutDashboard size={20} />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('materials')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
              activeTab === 'materials'
                ? 'bg-purple-600 text-white'
                : darkMode
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <BookMarked size={20} />
            Materias dos Alunos
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
              activeTab === 'students'
                ? 'bg-green-600 text-white'
                : darkMode
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <GraduationCap size={20} />
            Alunos
          </button>
          <button
            onClick={() => setActiveTab('teachers')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
              activeTab === 'teachers'
                ? 'bg-orange-500 text-white'
                : darkMode
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Users size={20} />
            Professores
          </button>
          <button
            onClick={() => setActiveTab('add-material')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
              activeTab === 'add-material'
                ? 'bg-purple-600 text-white'
                : darkMode
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Plus size={20} />
            Inserir Materias
          </button>
          <button
            onClick={() => setActiveTab('add-student')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
              activeTab === 'add-student'
                ? 'bg-green-600 text-white'
                : darkMode
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <UserPlus size={20} />
            Cadastrar Aluno
          </button>
          <button
            onClick={() => setActiveTab('add-teacher')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
              activeTab === 'add-teacher'
                ? 'bg-orange-500 text-white'
                : darkMode
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <BookOpen size={20} />
            Cadastrar Professor
          </button>
        </nav>

        <div className={`rounded-lg shadow-md p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          {activeTab === 'dashboard' && (
            <Dashboard students={students} teachers={teachers} materials={materials} darkMode={darkMode} />
          )}
          {activeTab === 'materials' && (
            <MaterialsList materials={materials} onRemove={removeMaterial} darkMode={darkMode} />
          )}
          {activeTab === 'students' && (
            <StudentsList students={students} onRemove={removeStudent} onEdit={handleEditStudent} darkMode={darkMode} />
          )}
          {activeTab === 'teachers' && (
            <TeachersList teachers={teachers} onRemove={removeTeacher} onEdit={handleEditTeacher} darkMode={darkMode} />
          )}
          {activeTab === 'add-material' && <MaterialForm onSubmit={addMaterial} darkMode={darkMode} />}
          {activeTab === 'add-student' && (
            <StudentForm
              onSubmit={editingStudent ? updateStudent : addStudent}
              materials={materials}
              darkMode={darkMode}
              editingStudent={editingStudent}
              onCancel={() => {
                setEditingStudent(null);
                setActiveTab('students');
              }}
            />
          )}
          {activeTab === 'add-teacher' && (
            <TeacherForm
              onSubmit={saveTeacher}
              darkMode={darkMode}
              editingTeacher={editingTeacher}
              availableSubjects={subjects}
              refreshSubjects={refreshSubjects}
              onCancel={() => {
                setEditingTeacher(null);
                setActiveTab('teachers');
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
