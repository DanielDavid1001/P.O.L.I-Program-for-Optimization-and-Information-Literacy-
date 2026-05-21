import { useEffect, useRef, useState } from 'react';
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
  ArrowDown,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  Shield,
} from 'lucide-react';
import { classroomBg, logo, servicesImage } from '../imports';
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
  clearAuthToken,
  getCurrentUser,
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
  setAuthToken,
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

type AuthMode = 'login' | 'register';

type UserRole = 'admin' | 'teacher' | 'student';

type AppTab = 'dashboard' | 'materials' | 'students' | 'teachers' | 'add-material' | 'add-student' | 'add-teacher' | 'profile';

interface PendingRegistration {
  role: string;
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface AuthFormState {
  role: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  remember: boolean;
  acceptTerms: boolean;
}

export default function App() {
  const [authToken, setAuthTokenState] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<any>(null);
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);
  const [authForm, setAuthForm] = useState<AuthFormState>({
    role: 'Professor',
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    remember: true,
    acceptTerms: false,
  });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(true);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false);
  const [registrationTokenModalOpen, setRegistrationTokenModalOpen] = useState(false);
  const [registrationTokenValue, setRegistrationTokenValue] = useState('');
  const [pendingRegistration, setPendingRegistration] = useState<PendingRegistration | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [darkMode, setDarkMode] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  const [materials, setMaterials] = useState<Material[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const loginSectionRef = useRef<HTMLDivElement | null>(null);
  const registerSectionRef = useRef<HTMLDivElement | null>(null);

  const normalizeRole = (role?: string | null): UserRole | null => {
    if (!role) return null;

    const normalized = role.toLowerCase();
    if (normalized === 'admin' || normalized === 'teacher' || normalized === 'student') {
      return normalized;
    }

    return null;
  };

  const currentRole = normalizeRole(authUser?.role);

  const getAllowedTabs = (role: UserRole | null): AppTab[] => {
    if (role === 'student') {
      return ['materials', 'profile'];
    }

    if (role === 'teacher') {
      return ['dashboard', 'materials', 'students', 'add-material', 'add-student', 'add-teacher', 'profile'];
    }

    return ['dashboard', 'materials', 'students', 'teachers', 'add-material', 'add-student', 'add-teacher', 'profile'];
  };

  const allowedTabs = getAllowedTabs(currentRole);

  const isTabAllowed = (tab: AppTab) => allowedTabs.includes(tab);

  const fallbackTab: AppTab = currentRole === 'student' ? 'materials' : 'dashboard';

  const safeSetActiveTab = (tab: AppTab) => {
    if (isTabAllowed(tab)) {
      setActiveTab(tab);
      return;
    }

    setActiveTab(fallbackTab);
  };

  const canViewDashboard = currentRole !== 'student';
  const canViewStudents = currentRole === 'admin' || currentRole === 'teacher';
  const canViewTeachers = currentRole === 'admin';
  const canAccessForms = currentRole !== 'student';

  useEffect(() => {
    if (!authToken) {
      return;
    }

    if (!isTabAllowed(activeTab)) {
      setActiveTab(fallbackTab);
    }
  }, [activeTab, authToken, fallbackTab, isTabAllowed]);

  const roleLabelMap: Record<UserRole, string> = {
    admin: 'Administrador',
    teacher: 'Professor',
    student: 'Aluno',
  };

  const openOwnProfile = () => {
    setActiveTab('profile');
  };

  useEffect(() => {
    const bootAuth = async () => {
      try {
        const savedToken = localStorage.getItem('eed-auth-token');

        if (!savedToken) {
          setAuthLoading(false);
          return;
        }

        setAuthTokenState(savedToken);
        setAuthUser(await getCurrentUser());
      } catch (error) {
        clearAuthToken();
        setAuthTokenState(null);
        setAuthUser(null);
      } finally {
        setAuthLoading(false);
      }
    };

    void bootAuth();
  }, []);

  useEffect(() => {
    if (!authToken) {
      setMaterials([]);
      setStudents([]);
      setTeachers([]);
      setSubjects([]);
      return;
    }

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
  }, [authToken]);

  useEffect(() => {
    // restore active tab from session if present
    try {
      const saved = sessionStorage.getItem('eed-activeTab');
        if (saved && isTabAllowed(saved as AppTab)) {
          setActiveTab(saved as AppTab);
        }
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

  const resetAuthForm = () => {
    setAuthForm({
      role: 'Professor',
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      remember: true,
      acceptTerms: false,
    });
    setAuthError('');
  };

  const openLogin = () => {
    setAuthMode('login');
    setAuthError('');
    setShowLoginPassword(false);
  };

  const openRegister = () => {
    setAuthMode('register');
    setAuthError('');
    setShowLoginPassword(false);
    setShowRegisterPassword(false);
    setShowRegisterConfirmPassword(false);
  };

  const mapRoleToBackend = (role: string) => {
    if (role === 'Administrador') return 'admin';
    if (role === 'Aluno') return 'student';
    return 'teacher';
  };

  const formatRegistrationPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 10);

    if (digits.length <= 2) {
      return digits.length ? `(${digits}` : '';
    }

    if (digits.length <= 6) {
      return `(${digits.slice(0, 2)})${digits.slice(2)}`;
    }

    return `(${digits.slice(0, 2)})${digits.slice(2, 6)}-${digits.slice(6)}`;
  };

  const validatePhone = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (!digits) {
      setPhoneError('');
      return true;
    }

    if (digits.length !== 10) {
      setPhoneError('Telefone incompleto — use o formato (xx)xxxx-xxxx');
      return false;
    }

    setPhoneError('');
    return true;
  };

  const hasCommonPasswordSequence = (password: string) => {
    const normalized = password.toLowerCase();
    const sequences = ['0123456789', 'abcdefghijklmnopqrstuvwxyz', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm'];

    return sequences.some((sequence) => {
      for (let index = 0; index <= sequence.length - 4; index += 1) {
        if (normalized.includes(sequence.slice(index, index + 4))) {
          return true;
        }
      }

      return false;
    });
  };

  const validateAuthPassword = (password: string) => {
    if (password.trim().length < 8) {
      return 'A senha precisa ter pelo menos 8 caracteres.';
    }

    if (hasCommonPasswordSequence(password)) {
      return 'A senha não pode conter sequências previsíveis como 1234 ou abcd.';
    }

    return '';
  };

  const closeRegistrationTokenModal = () => {
    setRegistrationTokenModalOpen(false);
    setRegistrationTokenValue('');
    setPendingRegistration(null);
    setAuthSubmitting(false);
  };

  const submitRegistrationWithToken = async () => {
    if (!pendingRegistration) {
      return;
    }

    const trimmedToken = registrationTokenValue.trim();
    if (!trimmedToken) {
      setAuthError('Informe o token de cadastro.');
      return;
    }

    const passwordError = validateAuthPassword(pendingRegistration.password);
    if (passwordError) {
      setAuthError(passwordError);
      return;
    }

    // validate phone for staff registration
    if (!validatePhone(authForm.phone)) {
      setAuthSubmitting(false);
      return;
    }

    setAuthError('');
    setAuthSubmitting(true);

    try {
      await apiRegister({
        name: pendingRegistration.name,
        email: pendingRegistration.email,
        password: pendingRegistration.password,
        password_confirmation: pendingRegistration.confirmPassword,
        role: mapRoleToBackend(pendingRegistration.role),
        registration_token: trimmedToken,
        phone: authForm.phone.replace(/\D/g, ''),
      });

      const result = await apiLogin(pendingRegistration.email, pendingRegistration.password);
      setAuthToken(result.token);
      setAuthTokenState(result.token);
      setAuthUser(result.user ?? null);
      closeRegistrationTokenModal();
    } catch (error: any) {
      setAuthError(error?.message ?? error?.error ?? 'Não foi possível autenticar.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const closeAuthScreen = () => {
    setAuthMode(null);
    setAuthError('');
    setAuthSubmitting(false);
    setShowLoginPassword(false);
    setShowRegisterPassword(false);
    setShowRegisterConfirmPassword(false);
    closeRegistrationTokenModal();
  };

  const handleAuthSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError('');

    try {
      if (authMode === 'register' && authForm.password !== authForm.confirmPassword) {
        throw new Error('As senhas não conferem.');
      }

      if (authMode === 'register') {
        const passwordError = validateAuthPassword(authForm.password);
        if (passwordError) {
          throw new Error(passwordError);
        }

        // validate phone when registering (if provided)
        if (!validatePhone(authForm.phone)) {
          setAuthSubmitting(false);
          return;
        }

        if (authForm.role === 'Aluno') {
          await apiRegister({
            name: authForm.name,
            email: authForm.email,
            password: authForm.password,
            password_confirmation: authForm.confirmPassword,
            role: 'student',
            registration_token: '',
            phone: authForm.phone.replace(/\D/g, ''),
          });

          const loginResult = await apiLogin(authForm.email, authForm.password);
          setAuthToken(loginResult.token);
          setAuthTokenState(loginResult.token);
          setAuthUser(loginResult.user ?? null);
          setAuthSubmitting(false);
          return;
        }

        setPendingRegistration({
          role: authForm.role,
          name: authForm.name,
          email: authForm.email,
          password: authForm.password,
          confirmPassword: authForm.confirmPassword,
        });
        setRegistrationTokenValue('');
        setRegistrationTokenModalOpen(true);
        setAuthSubmitting(false);
        return;
      }

      setAuthSubmitting(true);

      const result = await apiLogin(authForm.email, authForm.password);
      setAuthToken(result.token);
      setAuthTokenState(result.token);
      setAuthUser(result.user ?? null);
      if (!authForm.remember) {
        try {
          sessionStorage.setItem('eed-auth-token-session', result.token);
        } catch (error) {
          // ignore session storage failures
        }
      }
    } catch (error: any) {
      setAuthError(error?.message ?? error?.error ?? 'Não foi possível autenticar.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await apiLogout();
    } catch (error) {
      // clear local session even if the API call fails
    }

    clearAuthToken();
    setAuthTokenState(null);
    setAuthUser(null);
    setActiveTab('dashboard');
    setMaterials([]);
    setStudents([]);
    setTeachers([]);
    setSubjects([]);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,_#fff7ed,_#e0f2fe_45%,_#f8fafc_80%)] text-gray-800">
        <div className="rounded-2xl border border-white/60 bg-white/80 px-6 py-5 shadow-xl backdrop-blur">
          Carregando sistema...
        </div>
      </div>
    );
  }

  if (!authToken) {
    if (authMode === 'login' || authMode === 'register') {
      const isLogin = authMode === 'login';

      return (
        <div
          className="min-h-screen text-slate-900"
          style={{
            backgroundColor: '#FFFDD0',
            backgroundImage:
              `linear-gradient(rgba(255, 253, 208, 0.86), rgba(255, 253, 208, 0.88)), radial-gradient(circle at top left, rgba(255, 140, 66, 0.10), transparent 30%), radial-gradient(circle at top right, rgba(74, 144, 226, 0.08), transparent 25%), url(${classroomBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
          }}
        >
          <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <img
                src={logo}
                alt="Estudo em Dia"
                className="h-16 w-auto rounded-2xl bg-white p-1 shadow-md"
              />
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  Estudo Em Dia
                </h1>
                <p className="text-sm text-slate-600">Apoio pedagógico com foco em organização, inclusão e acompanhamento.</p>
              </div>
            </div>

            <button
              onClick={() => setAuthMode(null)}
              className="rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50"
            >
              Voltar
            </button>
          </header>

          <main className="mx-auto max-w-5xl px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pt-10">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[0.95fr_1.05fr]">
              <section className="space-y-6 rounded-[2rem] border border-white/70 bg-white/80 p-7 shadow-[0_24px_80px_rgba(15,23,42,0.15)] backdrop-blur-md lg:p-8">
                <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-orange-700">
                  <ArrowDown size={14} /> {isLogin ? 'Bem-vindo de volta' : 'Criar sua conta'}
                </div>

                <div className="space-y-4">
                  <h2 className="text-4xl font-black leading-tight tracking-tight text-slate-900 sm:text-5xl">
                    {isLogin ? 'Faça login para continuar' : 'Preencha os dados para começar'}
                  </h2>
                  <p className="max-w-xl text-base leading-7 text-slate-600">
                    {isLogin
                      ? 'Acesse a área interna com seu e-mail e senha.'
                      : 'Crie sua conta para acessar o painel do Estudo Em Dia.'}
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <button
                    onClick={openLogin}
                    className={`rounded-full px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5 ${isLogin ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25' : 'border border-orange-500 bg-white text-orange-600'}`}
                  >
                    Login
                  </button>
                  <button
                    onClick={openRegister}
                    className={`rounded-full px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5 ${!isLogin ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25' : 'border border-orange-500 bg-white text-orange-600'}`}
                  >
                    Register
                  </button>
                </div>

                <div className="grid gap-4 pt-2">
                  {[
                    'Gestão de alunos, professores e materiais em um painel único.',
                    'Fluxo de acesso com autenticação por token.',
                    'Tela separada para Login e Register, sem poluir a inicial.',
                  ].map((text) => (
                    <div key={text} className="rounded-2xl border border-orange-100 bg-white/85 p-4 text-sm leading-6 text-slate-600 shadow-sm transition-transform duration-300 ease-out hover:-translate-y-1">
                      {text}
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.16)] backdrop-blur-sm lg:p-8">
                {isLogin ? (
                  <form className="space-y-5" onSubmit={handleAuthSubmit}>
                    <div className="mb-6 flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-600">Login</p>
                        <h3 className="mt-2 text-3xl font-black text-slate-900">Bem-vindo de volta</h3>
                        <p className="mt-2 text-sm text-slate-600">Faça login para continuar</p>
                      </div>
                      <img src={logo} alt="Estudo em Dia" className="h-20 w-20 rounded-3xl bg-white p-2 shadow-md" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-800">Perfil de Acesso</label>
                      <div className="relative">
                        <Shield size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <select
                          value={authForm.role}
                          onChange={(event) => setAuthForm((current) => ({ ...current, role: event.target.value }))}
                          className="w-full appearance-none rounded-2xl border border-orange-500 bg-white px-11 py-4 text-slate-700 outline-none transition focus:border-orange-600"
                        >
                          <option>Professor</option>
                          <option>Administrador</option>
                          <option>Aluno</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-800">Email</label>
                      <div className="relative">
                        <Mail size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="email"
                          value={authForm.email}
                          onChange={(event) => setAuthForm((current) => ({ ...current, email: event.target.value }))}
                          className="w-full rounded-2xl border border-slate-300 bg-white py-4 pl-11 pr-4 text-slate-800 outline-none transition focus:border-orange-500"
                          placeholder="seu@email.com"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-800">Senha</label>
                      <div className="relative">
                        <Lock size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type={showLoginPassword ? 'text' : 'password'}
                          value={authForm.password}
                          onChange={(event) => setAuthForm((current) => ({ ...current, password: event.target.value }))}
                          className="w-full rounded-2xl border border-slate-300 bg-white py-4 pl-11 pr-12 text-slate-800 outline-none transition focus:border-orange-500"
                          placeholder="••••••••"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword((current) => !current)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-700"
                          aria-label={showLoginPassword ? 'Ocultar senha' : 'Mostrar senha'}
                        >
                          {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 text-sm">
                      <label className="flex items-center gap-2 font-medium text-slate-700">
                        <input
                          type="checkbox"
                          checked={authForm.remember}
                          onChange={(event) => setAuthForm((current) => ({ ...current, remember: event.target.checked }))}
                          className="h-4 w-4 rounded border-slate-400 text-orange-500 focus:ring-orange-500"
                        />
                        Lembrar-me
                      </label>
                      <button type="button" className="font-medium text-orange-600 transition hover:text-orange-700">
                        Esqueceu a senha?
                      </button>
                    </div>

                    {authError && (
                      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {authError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={authSubmitting}
                      className="w-full rounded-2xl bg-orange-500 px-4 py-4 font-semibold text-white shadow-lg shadow-orange-500/30 transition hover:-translate-y-0.5 hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {authSubmitting ? 'Entrando...' : 'Entrar'}
                    </button>
                  </form>
                ) : (
                  <form className="space-y-5" onSubmit={handleAuthSubmit}>
                    <div className="mb-6 flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-600">Register</p>
                        <h3 className="mt-2 text-3xl font-black text-slate-900">Criar sua conta</h3>
                        <p className="mt-2 text-sm text-slate-600">Preencha os dados para começar</p>
                      </div>
                      <img src={logo} alt="Estudo em Dia" className="h-20 w-20 rounded-3xl bg-white p-2 shadow-md" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-800">Perfil de Acesso</label>
                      <div className="relative">
                        <Shield size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <select
                          value={authForm.role}
                          onChange={(event) => setAuthForm((current) => ({ ...current, role: event.target.value }))}
                          className="w-full appearance-none rounded-2xl border border-slate-300 bg-white px-11 py-4 text-slate-700 outline-none transition focus:border-orange-500"
                        >
                          <option>Professor</option>
                          <option>Administrador</option>
                          <option>Aluno</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-800">Nome Completo</label>
                        <div className="relative">
                          <User size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            value={authForm.name}
                            onChange={(event) => setAuthForm((current) => ({ ...current, name: event.target.value }))}
                            className="w-full rounded-2xl border border-slate-300 bg-white py-4 pl-11 pr-4 text-slate-800 outline-none transition focus:border-orange-500"
                            placeholder="João Silva"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-800">Email</label>
                        <div className="relative">
                          <Mail size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="email"
                            value={authForm.email}
                            onChange={(event) => setAuthForm((current) => ({ ...current, email: event.target.value }))}
                            className="w-full rounded-2xl border border-slate-300 bg-white py-4 pl-11 pr-4 text-slate-800 outline-none transition focus:border-orange-500"
                            placeholder="seu@email.com"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-800">Telefone</label>
                      <div className="relative">
                        <Phone size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="tel"
                          inputMode="numeric"
                          autoComplete="tel"
                          maxLength={13}
                          pattern="\(\d{2}\)\d{4}-\d{4}"
                          value={authForm.phone}
                          onChange={(event) => setAuthForm((current) => ({ ...current, phone: formatRegistrationPhone(event.target.value) }))}
                          className="w-full rounded-2xl border border-slate-300 bg-white py-4 pl-11 pr-4 text-slate-800 outline-none transition focus:border-orange-500"
                          placeholder="(11)1234-5678"
                        />
                        {phoneError && (
                          <p className="mt-2 text-sm text-red-600">{phoneError}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-800">Senha</label>
                        <div className="relative">
                          <Lock size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type={showRegisterPassword ? 'text' : 'password'}
                            value={authForm.password}
                            onChange={(event) => setAuthForm((current) => ({ ...current, password: event.target.value }))}
                            className="w-full rounded-2xl border border-slate-300 bg-white py-4 pl-11 pr-12 text-slate-800 outline-none transition focus:border-orange-500"
                            placeholder="••••••••"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowRegisterPassword((current) => !current)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-700"
                            aria-label={showRegisterPassword ? 'Ocultar senha' : 'Mostrar senha'}
                          >
                            {showRegisterPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-800">Confirmar Senha</label>
                        <div className="relative">
                          <Lock size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type={showRegisterConfirmPassword ? 'text' : 'password'}
                            value={authForm.confirmPassword}
                            onChange={(event) => setAuthForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                            className="w-full rounded-2xl border border-slate-300 bg-white py-4 pl-11 pr-12 text-slate-800 outline-none transition focus:border-orange-500"
                            placeholder="••••••••"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowRegisterConfirmPassword((current) => !current)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-700"
                            aria-label={showRegisterConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
                          >
                            {showRegisterConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {authError && (
                      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {authError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={authSubmitting}
                      className="w-full rounded-2xl bg-orange-500 px-4 py-4 font-semibold text-white shadow-lg shadow-orange-500/30 transition hover:-translate-y-0.5 hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {authSubmitting ? 'Criando Conta...' : 'Criar Conta'}
                    </button>
                  </form>
                )}
              </section>
            </div>
          </main>

          {registrationTokenModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm">
              <div className="w-full max-w-lg rounded-[2rem] border border-white/70 bg-white p-6 shadow-[0_30px_90px_rgba(15,23,42,0.25)]">
                <div className="space-y-2">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-600">Confirmação de cadastro</p>
                  <h3 className="text-2xl font-black text-slate-900">Digite o token enviado para o registro</h3>
                  <p className="text-sm leading-6 text-slate-600">
                    Esse passo fica em um modal para que, no futuro, o token possa chegar por e-mail sem alterar o fluxo da tela.
                  </p>
                </div>

                <div className="mt-6 space-y-2">
                  <label className="text-sm font-medium text-slate-800">Token de cadastro</label>
                  <input
                    value={registrationTokenValue}
                    onChange={(event) => setRegistrationTokenValue(event.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-4 text-slate-800 outline-none transition focus:border-orange-500"
                    placeholder="Cole o token aqui"
                    autoFocus
                  />
                </div>

                {authError && (
                  <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {authError}
                  </div>
                )}

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeRegistrationTokenModal}
                    className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => void submitRegistrationWithToken()}
                    disabled={authSubmitting}
                    className="rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {authSubmitting ? 'Confirmando...' : 'Confirmar token'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div
        className="min-h-screen text-slate-900"
        style={{
          backgroundColor: '#FFFDD0',
          backgroundImage:
            `linear-gradient(rgba(255, 253, 208, 0.86), rgba(255, 253, 208, 0.88)), radial-gradient(circle at top left, rgba(255, 140, 66, 0.10), transparent 30%), radial-gradient(circle at top right, rgba(74, 144, 226, 0.08), transparent 25%), url(${classroomBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      >
        <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <img
              src={logo}
              alt="Estudo em Dia"
              className="h-16 w-auto rounded-2xl bg-white p-1 shadow-md"
            />
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Estudo Em Dia
              </h1>
              <p className="text-sm text-slate-600">Apoio pedagógico com foco em organização, inclusão e acompanhamento.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={openLogin}
              className="rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50"
            >
              Login
            </button>
            <button
              onClick={openRegister}
              className="rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition hover:-translate-y-0.5 hover:bg-orange-600"
            >
              Register
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pt-10">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[0.95fr_1.05fr]">
            <section className="space-y-6 rounded-[2rem] border border-white/70 bg-white/75 p-7 shadow-[0_24px_80px_rgba(15,23,42,0.15)] backdrop-blur-md lg:p-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-orange-700">
               Bem-vindo ao E.E.D
              </div>

              <div className="space-y-4">
                <h2 className="text-4xl font-black leading-tight tracking-tight text-slate-900 sm:text-5xl">
                  Faça login para continuar
                </h2>
                <p className="max-w-xl text-base leading-7 text-slate-600">
                  Acesse a área interna ou crie sua conta para entrar no painel do Estudo Em Dia.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <button
                  onClick={openLogin}
                  className="rounded-full border border-orange-500 bg-white px-5 py-3 text-sm font-semibold text-orange-600 transition hover:-translate-y-0.5 hover:bg-orange-50"
                >
                  Ir para Login
                </button>
                <button
                  onClick={openRegister}
                  className="rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition hover:-translate-y-0.5 hover:bg-orange-600"
                >
                  Ir para Register
                </button>
              </div>

              <div className="grid gap-4 pt-2">
                {[
                  'Gestão de alunos, professores e materiais em um painel único.',
                  'Fluxo de acesso com autenticação por token.',
                  'Tela separada para Login e Register, sem poluir a inicial.',
                ].map((text) => (
                  <div key={text} className="rounded-2xl border border-orange-100 bg-white/85 p-4 text-sm leading-6 text-slate-600 shadow-sm transition-transform duration-300 ease-out hover:-translate-y-1">
                    {text}
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-6 rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.16)] backdrop-blur-sm lg:p-8">
              <div className="flex min-h-[400px] items-center justify-center rounded-[1.5rem] border border-dashed border-orange-200 bg-gradient-to-br from-white/90 to-orange-50/50 p-4 overflow-hidden">
                <img src={servicesImage} alt="Serviços - Estudo Em Dia" className="h-full w-full rounded-[0.5rem] object-cover shadow-md" />
              </div>

              <div className="space-y-4 rounded-[1.5rem] border border-orange-200 bg-white/85 p-5">
                <div className="flex min-h-[180px] items-center justify-center rounded-[1.25rem] border-2 border-dashed border-orange-200 bg-gradient-to-br from-white to-orange-50 px-6 text-center">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-600">
                      Espaço para imagem
                    </p>
                    <p className="text-sm leading-6 text-slate-600">
                      Você pode inserir uma imagem futuramente aqui.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    );
  }

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
      safeSetActiveTab('students');
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
      safeSetActiveTab('students');
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
      safeSetActiveTab('teachers');
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
      safeSetActiveTab('teachers');
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
    safeSetActiveTab('add-student');
  };

  const handleEditTeacher = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    safeSetActiveTab('add-teacher');
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
            <div className="flex items-center gap-3">
              {authUser?.name && (
                <span className={`hidden rounded-full px-4 py-2 text-sm font-medium sm:inline-flex ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'}`}>
                  {authUser.name}
                </span>
              )}
              <button
                onClick={handleLogout}
                className={`rounded-lg px-4 py-3 text-sm font-semibold transition-colors ${
                  darkMode ? 'bg-gray-700 text-gray-100 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Sair
              </button>
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
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => safeSetActiveTab('dashboard')}
            disabled={!canViewDashboard}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
              activeTab === 'dashboard'
                ? 'bg-blue-500 text-white'
                : darkMode
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            } ${!canViewDashboard ? 'hidden' : ''}`}
          >
            <LayoutDashboard size={20} />
            Dashboard
          </button>
          <button
            onClick={() => safeSetActiveTab('materials')}
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
          {canViewStudents && (
          <button
            onClick={() => safeSetActiveTab('students')}
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
          )}
          {canViewTeachers && (
          <button
            onClick={() => safeSetActiveTab('teachers')}
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
          )}
          {canAccessForms && (
          <button
            onClick={() => safeSetActiveTab('add-material')}
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
          )}
          {canAccessForms && (
          <button
            onClick={() => safeSetActiveTab('add-student')}
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
          )}
          {canAccessForms && (
          <button
            onClick={() => safeSetActiveTab('add-teacher')}
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
          )}
          <button
            onClick={() => safeSetActiveTab('profile')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
              activeTab === 'profile'
                ? 'bg-slate-700 text-white'
                : darkMode
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <User size={20} />
            Meu perfil
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
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className={`rounded-2xl border p-6 ${darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className={`text-sm font-semibold uppercase tracking-[0.2em] ${darkMode ? 'text-orange-300' : 'text-orange-600'}`}>
                      Meu perfil
                    </p>
                    <h2 className={`mt-2 text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {authUser?.name || 'Usuário'}
                    </h2>
                    <p className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Aqui estão os dados da sua conta.
                    </p>
                  </div>
                  <div className={`rounded-full px-4 py-2 text-sm font-semibold ${darkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-700 shadow-sm'}`}>
                    {roleLabelMap[currentRole ?? 'teacher']}
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className={`rounded-2xl border p-4 ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                    <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Nome</p>
                    <p className={`mt-2 text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{authUser?.name || '—'}</p>
                  </div>
                  <div className={`rounded-2xl border p-4 ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                    <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Email</p>
                    <p className={`mt-2 text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{authUser?.email || '—'}</p>
                  </div>
                  <div className={`rounded-2xl border p-4 ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                    <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Função</p>
                    <p className={`mt-2 text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{roleLabelMap[currentRole ?? 'teacher']}</p>
                  </div>
                  <div className={`rounded-2xl border p-4 ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                    <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Telefone</p>
                    <p className={`mt-2 text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{authUser?.phone || '—'}</p>
                  </div>
                </div>

                <div className={`mt-6 rounded-2xl border px-4 py-4 text-sm ${darkMode ? 'border-gray-700 bg-gray-800 text-gray-300' : 'border-gray-200 bg-white text-gray-600'}`}>
                  {currentRole === 'student'
                    ? 'Você pode acessar apenas Materiais e seu Perfil.'
                    : currentRole === 'teacher'
                    ? 'Você pode acessar Materiais, Alunos, cadastros e seu Perfil. A área de Professores fica reservada ao administrador.'
                    : 'Você tem acesso total ao sistema.'}
                </div>
              </div>
            </div>
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
