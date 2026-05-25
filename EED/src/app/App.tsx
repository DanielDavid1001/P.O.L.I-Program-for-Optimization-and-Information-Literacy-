import { useEffect, useRef, useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { StudentForm } from './components/StudentForm';
import { TeacherForm } from './components/TeacherForm';
import { StudentsList } from './components/StudentsList';
import { TeachersList } from './components/TeachersList';
import { MaterialForm } from './components/MaterialForm';
import { MaterialsList } from './components/MaterialsList';
import PasswordReset from './components/PasswordReset';
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
import formatDateBR from '../lib/formatDate';
import formatPhoneBR from '../lib/formatPhone';
import { classroomBg, logo, servicesImage, poliImage } from '../imports';
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
  getPublicSubjects as apiGetPublicSubjects,
  updateCurrentUser,
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

const TAB_PATHS: Record<AppTab, string> = {
  dashboard: '/dashboard',
  materials: '/materials',
  students: '/students',
  teachers: '/teachers',
  'add-material': '/add-material',
  'add-student': '/add-student',
  'add-teacher': '/add-teacher',
  profile: '/profile',
};

const PATH_TO_TAB: Record<string, AppTab> = Object.fromEntries(
  Object.entries(TAB_PATHS).map(([tab, path]) => [path, tab as AppTab])
) as Record<string, AppTab>;

const STUDENT_GRADES = ['Pré-Escola', '1º Ano', '2º Ano', '3º Ano', '4º Ano', '5º Ano', '6º Ano', '7º Ano', '8º Ano', '9º Ano', '1º Médio', '2º Médio', '3º Médio'];
const TEACHER_SPECIALTIES = ['Matemática', 'Português', 'Ciências', 'História', 'Geografia', 'Inglês', 'Artes', 'Educação Física', 'Tecnologia', 'Apoio Pedagógico'];

const isValidSpecialtyName = (value: string) => {
  const name = value.trim();
  if (!name) return false;
  if (name.length < 3) return false;

  const normalized = name.toLowerCase();
  // Ignore common diagnostic/test placeholders created during *debugging*
  if (normalized.includes('diagnostico') || normalized.includes('diagnóstico')) return false;
  if (normalized.includes('teste pós-logs') || normalized.includes('teste pos-logs')) return false;

  return true;
};

const normalizeSubjectNames = (value: any): string[] => {
  if (!Array.isArray(value)) return [];

  return Array.from(
    new Set(
      value
        .map((subject: any) => {
          if (typeof subject === 'string') return subject.trim();
          if (!subject || typeof subject !== 'object') return '';
          return String(subject.name ?? subject.title ?? subject.subject_name ?? '').trim();
        })
        .filter(Boolean)
    )
  );
};

function tabFromPath(pathname: string): AppTab | null {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  return PATH_TO_TAB[normalized] ?? null;
}

function tabToPath(tab: AppTab): string {
  return TAB_PATHS[tab];
}

const AUTH_USER_KEY = 'eed-auth-user';
const LAST_ACCOUNT_KEY = 'eed-last-account';

function mapRoleToDisplay(role?: string | null): string {
  const normalized = (role ?? '').toLowerCase();
  if (normalized === 'admin' || normalized === 'administrator' || normalized === 'administrador') return 'Administrador';
  if (normalized === 'student' || normalized === 'aluno' || normalized === 'estudante') return 'Aluno';
  return 'Professor';
}

function readCachedAuthUser() {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

function storeCachedAuthUser(user: any) {
  try {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  } catch (error) {
    // ignore storage failures
  }
}

function clearCachedAuthUser() {
  try {
    localStorage.removeItem(AUTH_USER_KEY);
  } catch (error) {
    // ignore storage failures
  }
}

function readCachedLastAccount() {
  try {
    const raw = localStorage.getItem(LAST_ACCOUNT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

function storeCachedLastAccount(account: { email?: string; role?: string } | null) {
  try {
    if (!account?.email) {
      localStorage.removeItem(LAST_ACCOUNT_KEY);
      return;
    }

    localStorage.setItem(
      LAST_ACCOUNT_KEY,
      JSON.stringify({
        email: account.email,
        role: account.role ?? 'Professor',
      }),
    );
  } catch (error) {
    // ignore storage failures
  }
}

function getAuthErrorMessage(error: any, fallback = 'Não foi possível autenticar.') {
  if (!error) {
    return fallback;
  }

  const message = typeof error?.message === 'string' ? error.message.trim() : '';
  if (message) {
    return message;
  }

  const errorBag = error?.errors;
  if (errorBag && typeof errorBag === 'object') {
    const firstError = Object.values(errorBag).flat().find((value) => typeof value === 'string' && value.trim() !== '');
    if (typeof firstError === 'string') {
      return firstError;
    }
  }

  if (typeof error?.error === 'string' && error.error.trim()) {
    return error.error;
  }

  return fallback;
}

interface PendingRegistration {
  role: string;
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  subjectsText?: string;
}

interface AuthFormState {
  role: string;
  name: string;
  email: string;
  phone: string;
  birthDate: string;
  age: string;
  grade: string;
  subjectsText: string;
  password: string;
  confirmPassword: string;
  remember: boolean;
  acceptTerms: boolean;
}

export default function App() {
  const [authToken, setAuthTokenState] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<any>(null);
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);
  const [authForm, setAuthForm] = useState<AuthFormState>(() => {
    const lastAccount = readCachedLastAccount();

    return {
      role: lastAccount?.role ?? 'Professor',
      name: '',
      email: lastAccount?.email ?? '',
      phone: '',
      birthDate: '',
      age: '',
      grade: '',
      subjectsText: '',
      password: '',
      confirmPassword: '',
      remember: true,
      acceptTerms: false,
    };
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
  const [activeTab, setActiveTab] = useState<AppTab>(() => {
    if (typeof window === 'undefined') {
      return 'dashboard';
    }

    return tabFromPath(window.location.pathname) ?? 'dashboard';
  });
  const [darkMode, setDarkMode] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [editReturnTab, setEditReturnTab] = useState<AppTab>('students');
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    birthDate: '',
    age: '',
    grade: '',
    subjectsText: '',
    teacherSubjects: [] as string[],
    isPcd: false,
    pcdNotes: '',
  });
  const [permissionMessage, setPermissionMessage] = useState<string | null>(null);
  const suppressPermissionPopupRef = useRef(false);

  const [materials, setMaterials] = useState<Material[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const loginSectionRef = useRef<HTMLDivElement | null>(null);
  const registerSectionRef = useRef<HTMLDivElement | null>(null);

  const normalizeRole = (role?: string | null): UserRole | null => {
    if (!role) return null;
    const normalized = role.toLowerCase();
    // Accept Portuguese variants and common synonyms
    if (normalized === 'admin' || normalized === 'administrator' || normalized === 'administrador') return 'admin';
    if (normalized === 'teacher' || normalized === 'professor' || normalized === 'prof') return 'teacher';
    if (normalized === 'student' || normalized === 'aluno' || normalized === 'estudante') return 'student';

    return null;
  };

  const currentRole = normalizeRole(authUser?.role);
  const profileData = authUser?.student ?? authUser?.profile ?? authUser ?? {};

  const profileSubjects = (() => {
    const fromAuth = profileData?.subjects ?? authUser?.subjects ?? [];
    if (Array.isArray(fromAuth) && fromAuth.length) return fromAuth;
    const match = teachers.find((t) => String((t as any).user_id ?? t.id) === String(authUser?.id));
    return Array.isArray(match?.subjects) ? match.subjects : [];
  })();

  const getAllowedTabs = (role: UserRole | null): AppTab[] => {
    if (role === 'student') {
      return ['materials', 'profile'];
    }

    if (role === 'teacher') {
      return ['dashboard', 'materials', 'students', 'teachers', 'add-material', 'profile'];
    }

    return ['dashboard', 'materials', 'students', 'teachers', 'add-material', 'add-student', 'add-teacher', 'profile'];
  };

  const allowedTabs = getAllowedTabs(currentRole);

  const isTabAllowed = (tab: AppTab) => allowedTabs.includes(tab);

  const fallbackTab: AppTab = currentRole === 'student' ? 'materials' : 'dashboard';

  const syncUrlToTab = (tab: AppTab, replace = false) => {
    if (typeof window === 'undefined') {
      return;
    }

    const nextUrl = `${window.location.origin}${tabToPath(tab)}${window.location.search}`;

    if (replace) {
      window.history.replaceState({ tab }, '', nextUrl);
    } else {
      window.history.pushState({ tab }, '', nextUrl);
    }
  };

  const openPermissionPopup = (message = 'Você não tem permissão para acessar essa área.') => {
    setPermissionMessage(message);
  };

  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; message: string; resolve?: (v: boolean) => void }>({ open: false, message: '' });

  useEffect(() => {
    // Expose confirm and permission helpers to global window for components to use
    (window as any).eedConfirm = (message: string) => {
      return new Promise<boolean>((resolve) => {
        setConfirmDialog({ open: true, message, resolve });
      });
    };

    // password reset modal opener
    (window as any).eedOpenPasswordReset = () => {
      setEditingProfile(false);
      const ev = new CustomEvent('open-password-reset');
      window.dispatchEvent(ev);
    };

    (window as any).eedPermission = (message: string) => {
      setPermissionMessage(message);
    };

    return () => {
      try {
        delete (window as any).eedConfirm;
        delete (window as any).eedPermission;
      } catch (_) {}
    };
  }, []);

  const safeSetActiveTab = (tab: AppTab) => {
    if (isTabAllowed(tab)) {
      setActiveTab(tab);
      syncUrlToTab(tab);
      return;
    }

    openPermissionPopup();
    setActiveTab(fallbackTab);
    syncUrlToTab(fallbackTab);
  };

  const canViewDashboard = currentRole !== 'student';
  const canViewStudents = currentRole === 'admin' || currentRole === 'teacher';
  const canViewTeachers = currentRole === 'admin' || currentRole === 'teacher';
  const canAccessForms = currentRole !== 'student';
  const canAddStudents = currentRole === 'admin';
  const canAddTeachers = currentRole === 'admin';
  const canAddMaterials = currentRole === 'admin' || currentRole === 'teacher';

  useEffect(() => {
    if (!authToken) return;

    // Don't auto-redirect while the edit-profile modal is open — prevents unexpected tab changes
    if (editingProfile) return;

    if (!isTabAllowed(activeTab)) {
      suppressPermissionPopupRef.current = true;
      setActiveTab(fallbackTab);
      syncUrlToTab(fallbackTab, true);
    }
  }, [activeTab, authToken, fallbackTab, isTabAllowed, editingProfile]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handlePermissionDenied = (event: Event) => {
      const customEvent = event as CustomEvent<{ message?: string }>;
      openPermissionPopup(customEvent.detail?.message ?? 'Você não tem permissão para acessar essa área.');
    };

    const syncFromLocation = () => {
      const tabFromLocation = tabFromPath(window.location.pathname);

      if (tabFromLocation && isTabAllowed(tabFromLocation)) {
        setActiveTab(tabFromLocation);
        return;
      }

      if (!isTabAllowed(activeTab)) {
        if (!suppressPermissionPopupRef.current) {
          openPermissionPopup();
        }
        suppressPermissionPopupRef.current = false;
        setActiveTab(fallbackTab);
      }

      if (tabFromLocation && !isTabAllowed(tabFromLocation)) {
        if (!suppressPermissionPopupRef.current) {
          openPermissionPopup();
        }
        suppressPermissionPopupRef.current = false;
      }
    };

    window.addEventListener('popstate', syncFromLocation);
    window.addEventListener('eed:permission-denied', handlePermissionDenied as EventListener);
    syncFromLocation();

    return () => {
      window.removeEventListener('popstate', syncFromLocation);
      window.removeEventListener('eed:permission-denied', handlePermissionDenied as EventListener);
    };
  }, [activeTab, fallbackTab, isTabAllowed]);

  const roleLabelMap: Record<UserRole, string> = {
    admin: 'Administrador',
    teacher: 'Professor',
    student: 'Aluno',
  };

  const openOwnProfile = () => {
    setActiveTab('profile');
  };

  const studentSubjectsToText = (subjects: unknown) => {
    if (!Array.isArray(subjects)) {
      return '';
    }

    return subjects
      .map((subject) => (typeof subject === 'string' ? subject : subject ? String(subject) : ''))
      .filter(Boolean)
      .join(', ');
  };

  const refreshAuthenticatedUser = async (fallbackUser: any = null) => {
    try {
      const freshUser = await getCurrentUser();
      setAuthUser(freshUser);
      storeCachedAuthUser(freshUser);
      return freshUser;
    } catch (error) {
      if (fallbackUser !== undefined) {
        setAuthUser(fallbackUser ?? null);
        storeCachedAuthUser(fallbackUser ?? null);
      }

      return fallbackUser;
    }
  };

  useEffect(() => {
    // keep profile form in sync with authenticated user
    setProfileForm({
      name: authUser?.name ?? profileData?.name ?? '',
      email: authUser?.email ?? profileData?.email ?? '',
      phone: formatPhoneBR(authUser?.phone ?? profileData?.phone ?? ''),
      birthDate: '',
      age: '',
      grade: '',
      subjectsText: '',
      teacherSubjects: currentRole === 'teacher' ? normalizeSubjectNames(profileData?.subjects ?? authUser?.subjects ?? []) : [],
      isPcd: false,
      pcdNotes: (profileData?.pcdNotes ?? profileData?.pcd_notes ?? authUser?.pcdNotes ?? authUser?.pcd_notes ?? '') as string,
    });
  }, [authUser, profileData]);

  const startEditProfile = () => {
    console.debug('[debug] startEditProfile called');
    setProfileForm({
      name: authUser?.name ?? profileData?.name ?? '',
      email: authUser?.email ?? profileData?.email ?? '',
      phone: formatPhoneBR(authUser?.phone ?? profileData?.phone ?? ''),
      birthDate: '',
      age: '',
      grade: '',
      subjectsText: currentRole === 'teacher' ? studentSubjectsToText(profileData?.subjects ?? authUser?.subjects ?? []) : '',
      teacherSubjects: currentRole === 'teacher' ? normalizeSubjectNames(profileData?.subjects ?? authUser?.subjects ?? []) : [],
      isPcd: false,
      pcdNotes: (profileData?.pcdNotes ?? profileData?.pcd_notes ?? authUser?.pcdNotes ?? authUser?.pcd_notes ?? '') as string,
    });
    setEditingProfile(true);
  };

  const cancelEditProfile = () => {
    setEditingProfile(false);
  };

  const saveProfile = async () => {
    setAuthError('');
    setAuthSubmitting(true);
    try {
      const payload: any = {
        name: profileForm.name,
        email: profileForm.email,
        phone: profileForm.phone,
      };

      // allow teachers to update their specialties/areas
      if (currentRole === 'teacher') {
        payload.subjects = profileForm.teacherSubjects;
      }

      if (currentRole === 'student') {
        payload.pcd_notes = profileForm.pcdNotes;
      }

      const res = await updateCurrentUser(payload);
      const updated = res.user ?? res;
      await refreshAuthenticatedUser(updated ?? null);
      setEditingProfile(false);
    } catch (err: any) {
      setAuthError(getAuthErrorMessage(err));
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleProfilePhoneChange = (value: string) => {
    setProfileForm((current) => ({ ...current, phone: formatPhoneBR(value) }));
  };

  useEffect(() => {
    const bootAuth = async () => {
      try {
        const savedToken = localStorage.getItem('eed-auth-token');
        const cachedUser = readCachedAuthUser();

        if (!savedToken) {
          setAuthLoading(false);
          return;
        }

        setAuthTokenState(savedToken);
        if (cachedUser) {
          setAuthUser(cachedUser);
        }

        try {
          const freshUser = await getCurrentUser();
          setAuthUser(freshUser);
          storeCachedAuthUser(freshUser);
        } catch (error) {
          // Keep the saved token and cached user if the initial refresh fails.
          if (!cachedUser) {
            setAuthUser(null);
          }
        }
      } catch (error) {
        // Do not force logout on boot errors. Keep the saved token if present.
        const savedToken = localStorage.getItem('eed-auth-token');
        if (savedToken) {
          setAuthTokenState(savedToken);
        }
      } finally {
        setAuthLoading(false);
      }
    };

    void bootAuth();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Normalizer used to map API material objects to the local Material shape
        const normalize = (material: any): Material => ({
          id: String(material?.id ?? ''),
          subjectName: material?.subjectName ?? material?.subject_name ?? material?.subject?.name ?? '',
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

        // Always attempt to load materials so students can view/download them
        const materialsPromise = currentRole === 'student'
          ? apiGetMaterials({ public: true })
          : apiGetMaterials();

        // If we're not authenticated, clear other lists but continue to load materials only
        if (!authToken) {
          setStudents([]);
          setTeachers([]);
          const materialsResponse = await materialsPromise.catch(() => []);
          const publicSubjectsResponse = await apiGetPublicSubjects().catch(() => []);
          const parsedMaterials = Array.isArray(materialsResponse)
            ? materialsResponse.map((material: any) => normalize(material))
            : [];

          const materialSubjectNames = Array.from(
            new Set(
              parsedMaterials
                .map((m) => String(m?.subjectName ?? '').trim())
                .filter(Boolean)
            )
          );

          const publicSubjects = Array.isArray(publicSubjectsResponse)
            ? publicSubjectsResponse
            : (publicSubjectsResponse as any)?.data ?? [];

          // Prefer subjects derived from existing materials for register consistency.
          if (materialSubjectNames.length > 0) {
            setSubjects(materialSubjectNames.map((name) => ({ id: name, name })));
          } else if (Array.isArray(publicSubjects) && publicSubjects.length > 0) {
            setSubjects(
              publicSubjects
                .map((s: any) => ({ id: s?.id ?? s?.name, name: typeof s === 'string' ? s : String(s?.name ?? '').trim() }))
                .filter((s: any) => Boolean(s.name))
            );
          }

          setMaterials(parsedMaterials);
          return;
        }

        const requestList: Promise<any>[] = [materialsPromise];

        if (currentRole !== 'student') {
          requestList.push(apiGetStudents());
        }

        if (currentRole === 'admin' || currentRole === 'teacher') {
          requestList.push(apiGetTeachers());
          requestList.push((await import('../lib/api')).getSubjects());
        }

        const results = await Promise.allSettled(requestList);
        const materialsResult = results[0];
        const studentsResult = currentRole !== 'student' ? results[1] : null;
        const hasTeacherAndSubjectResults = currentRole === 'admin' || currentRole === 'teacher';
        const teachersResult = hasTeacherAndSubjectResults ? results[2] : null;
        const subjectsResult = hasTeacherAndSubjectResults ? results[3] : null;

        const materialsResponse = materialsResult.status === 'fulfilled' ? materialsResult.value : [];
        const studentsResponse = studentsResult && studentsResult.status === 'fulfilled' ? studentsResult.value : [];
        const teachersResponse = teachersResult && teachersResult.status === 'fulfilled' ? teachersResult.value : [];
        const subjectsResponse = subjectsResult && subjectsResult.status === 'fulfilled' ? subjectsResult.value : [];

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
  }, [authToken, currentRole]);

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
    const lastAccount = readCachedLastAccount();
    setAuthForm({
      role: lastAccount?.role ?? 'Professor',
      name: '',
      email: lastAccount?.email ?? '',
      phone: '',
      birthDate: '',
      age: '',
      grade: '',
      subjectsText: '',
      password: '',
      confirmPassword: '',
      remember: true,
      acceptTerms: false,
    });
    setAuthError('');
  };

  const openLogin = () => {
    const lastAccount = readCachedLastAccount();
    setAuthForm((current) => ({
      ...current,
      role: lastAccount?.role ?? current.role ?? 'Professor',
      email: lastAccount?.email ?? current.email ?? '',
      password: '',
      confirmPassword: '',
      remember: true,
    }));
    setAuthMode('login');
    setAuthError('');
    setShowLoginPassword(false);
  };

  const openRegister = () => {
    // Refresh public materials so specialization options in register stay in sync
    // with real backend data and avoid stale local/session entries.
    void (async () => {
      try {
        const materialsResponse = await apiGetMaterials({ public: true });
        const names = Array.from(
          new Set(
            (Array.isArray(materialsResponse) ? materialsResponse : [])
              .map((material: any) => String(material?.subjectName ?? material?.subject_name ?? material?.subject?.name ?? '').trim())
              .filter(Boolean)
          )
        );

        if (names.length > 0) {
          setSubjects(names.map((name) => ({ id: name, name })));
          return;
        }

        // Fallback to canonical subjects only when no materials are available
        const publicSubjectsResponse = await apiGetPublicSubjects();
        const list = Array.isArray(publicSubjectsResponse)
          ? publicSubjectsResponse
          : (publicSubjectsResponse as any)?.data ?? [];
        const mapped = Array.isArray(list)
          ? list
              .map((s: any) => ({ id: s?.id ?? s?.name, name: typeof s === 'string' ? s : String(s?.name ?? '').trim() }))
              .filter((s: any) => Boolean(s.name))
          : [];
        setSubjects(mapped);
      } catch (error) {
        console.error('Failed to refresh register specializations from materials', error);
      }
    })();

    resetAuthForm();
    setAuthMode('register');
    setAuthError('');
    setShowLoginPassword(false);
    setShowRegisterPassword(false);
    setShowRegisterConfirmPassword(false);
  };

  const mapRoleToBackend = (role: string): UserRole => {
    if (role === 'Administrador') return 'admin';
    if (role === 'Aluno') return 'student';
    return 'teacher';
  };

  const teacherSpecialtyOptions = Array.from(
    new Set(
      subjects
        .map((s: any) => (typeof s === 'string' ? s : String(s?.name ?? '').trim()))
        .filter((name: string) => isValidSpecialtyName(name))
    )
  );

  const fallbackTeacherSpecialties = TEACHER_SPECIALTIES.filter(
    (name) => !teacherSpecialtyOptions.some((option) => option.toLowerCase() === name.toLowerCase())
  );

  const teacherProfileSpecialties = Array.from(new Set([...teacherSpecialtyOptions, ...fallbackTeacherSpecialties]));

  const formatRegistrationPhone = (value: string) => {
    return formatPhoneBR(value);
  };

  const validatePhone = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (!digits) {
      setPhoneError('');
      return true;
    }

    if (digits.length !== 10 && digits.length !== 11) {
      setPhoneError('Telefone incompleto — use o formato (xx) xxxx-xxxx ou (xx) 9xxxx-xxxx');
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

  const calculateAgeFromBirthDate = (birthDate: string) => {
    const birth = new Date(birthDate);
    if (Number.isNaN(birth.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    const dayDiff = today.getDate() - birth.getDate();

    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      age -= 1;
    }

    return age;
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

    const passwordErrorMessage = validateAuthPassword(pendingRegistration.password);
    if (passwordErrorMessage) {
      setAuthError(passwordErrorMessage);
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
        subjects: (pendingRegistration.subjectsText ?? '')
          .split(',')
          .map((subject) => subject.trim())
          .filter(Boolean),
      } as any);

      const result = await apiLogin(pendingRegistration.email, pendingRegistration.password);
      setAuthToken(result.token);
      setAuthTokenState(result.token);
      await refreshAuthenticatedUser(result.user ?? null);
      storeCachedLastAccount({ email: pendingRegistration.email, role: pendingRegistration.role });
      closeRegistrationTokenModal();
    } catch (error: any) {
      setAuthError(getAuthErrorMessage(error));
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
          setAuthError('As senhas não conferem.');
          return;
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
          if (!authForm.birthDate || !authForm.grade) {
            throw new Error('Preencha data de nascimento e série do aluno.');
          }

          const studentAge = calculateAgeFromBirthDate(authForm.birthDate);
          if (studentAge === null || studentAge < 1 || studentAge > 100) {
            throw new Error('A idade do aluno deve estar entre 1 e 100 anos.');
          }

          await apiRegister({
            name: authForm.name,
            email: authForm.email,
            password: authForm.password,
            password_confirmation: authForm.confirmPassword,
            role: 'student',
            registration_token: '',
            phone: authForm.phone.replace(/\D/g, ''),
            birth_date: authForm.birthDate,
            age: studentAge,
            grade: authForm.grade,
          } as any);

          const loginResult = await apiLogin(authForm.email, authForm.password);
          setAuthToken(loginResult.token);
          setAuthTokenState(loginResult.token);
          await refreshAuthenticatedUser(loginResult.user ?? null);
          storeCachedLastAccount({ email: authForm.email, role: authForm.role });
          setAuthSubmitting(false);
          return;
        }

        const staffPayload = {
          name: authForm.name,
          email: authForm.email,
          password: authForm.password,
          password_confirmation: authForm.confirmPassword,
          role: mapRoleToBackend(authForm.role),
          registration_token: '',
          phone: authForm.phone.replace(/\D/g, ''),
          subjects: authForm.subjectsText
            .split(',')
            .map((subject) => subject.trim())
            .filter(Boolean),
        };

        if (authForm.role === 'Professor' && !staffPayload.subjects.length) {
          throw new Error('Informe ao menos uma especialidade para o professor.');
        }

        // API will generate a token and write it to the server terminal.
        // Do NOT rely on the API to return the token over HTTP; open the
        // modal and ask the user to copy the token from the server terminal.
        await apiRegister(staffPayload as any);
        setPendingRegistration({
          role: authForm.role,
          name: authForm.name,
          email: authForm.email,
          password: authForm.password,
          confirmPassword: authForm.confirmPassword,
          subjectsText: authForm.subjectsText,
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
      await refreshAuthenticatedUser(result.user ?? null);
        storeCachedLastAccount({ email: authForm.email, role: authForm.role });
      if (!authForm.remember) {
        try {
          sessionStorage.setItem('eed-auth-token-session', result.token);
        } catch (error) {
          // ignore session storage failures
        }
      }
    } catch (error: any) {
      setAuthError(getAuthErrorMessage(error));
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
    clearCachedAuthUser();
    setAuthTokenState(null);
    setAuthUser(null);
    setAuthMode(null);
    setEditingProfile(false);
    setRegistrationTokenModalOpen(false);
    setRegistrationTokenValue('');
    setPendingRegistration(null);
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
                      <button
                        type="button"
                        onClick={() => (window as any).eedOpenPasswordReset && (window as any).eedOpenPasswordReset()}
                        className="font-medium text-orange-600 transition hover:text-orange-700"
                      >
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
                          maxLength={15}
                          pattern="\(\d{2}\)\s?\d{4,5}-\d{4}"
                          value={authForm.phone}
                          onChange={(event) => setAuthForm((current) => ({ ...current, phone: formatRegistrationPhone(event.target.value) }))}
                          className="w-full rounded-2xl border border-slate-300 bg-white py-4 pl-11 pr-4 text-slate-800 outline-none transition focus:border-orange-500"
                          placeholder="(11) 91234-5678"
                        />
                        {phoneError && (
                          <p className="mt-2 text-sm text-red-600">{phoneError}</p>
                        )}
                      </div>
                    </div>

                    {authForm.role === 'Aluno' && (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-800">Data de Nascimento</label>
                          <input
                            type="date"
                            value={authForm.birthDate}
                            onChange={(event) => setAuthForm((current) => ({ ...current, birthDate: event.target.value }))}
                            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-4 text-slate-800 outline-none transition focus:border-orange-500"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-800">Série</label>
                          <select
                            value={authForm.grade}
                            onChange={(event) => setAuthForm((current) => ({ ...current, grade: event.target.value }))}
                            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-4 text-slate-800 outline-none transition focus:border-orange-500"
                            required
                          >
                            <option value="">Selecione a série</option>
                            {STUDENT_GRADES.map((grade) => (
                              <option key={grade} value={grade}>{grade}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    {authForm.role === 'Professor' && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-800">Especialidade</label>
                        <select
                          value={authForm.subjectsText}
                          onChange={(event) => setAuthForm((current) => ({ ...current, subjectsText: event.target.value }))}
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-4 text-slate-800 outline-none transition focus:border-orange-500"
                          required
                        >
                          <option value="">Selecione a especialidade</option>
                          {teacherSpecialtyOptions.map((specialty) => (
                            <option key={specialty} value={specialty}>{specialty}</option>
                          ))}
                          {fallbackTeacherSpecialties.map((specialty) => (
                            <option key={specialty} value={specialty}>{specialty}</option>
                          ))}
                        </select>
                      </div>
                    )}

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
                    O token de registro é gerado no servidor e exibido no terminal. Copie-o do terminal do servidor e cole neste campo.
                  </p>
                </div>

                <div className="mt-6 space-y-2">
                  <label className="text-sm font-medium text-slate-800">Token de cadastro</label>
                  <input
                    value={registrationTokenValue}
                    onChange={(event) => setRegistrationTokenValue(event.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-4 text-slate-800 outline-none transition focus:border-orange-500"
                    placeholder="Verifique o terminal do servidor e cole o token aqui"
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

          {editingProfile && (
            <div className={`fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-sm ${darkMode ? 'bg-black/70' : 'bg-slate-950/50'}`}>
              <div className={`w-full max-w-lg rounded-[1rem] border p-6 shadow-lg ${darkMode ? 'border-slate-700 bg-slate-900 text-slate-100 shadow-black/40' : 'border-white/70 bg-white text-slate-900'}`}>
                <div className="space-y-2">
                  <p className={`text-sm font-semibold uppercase tracking-[0.2em] ${darkMode ? 'text-orange-300' : 'text-orange-600'}`}>Editar Perfil</p>
                  <h3 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Atualize seus dados</h3>
                  <p className={`text-sm leading-6 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Altere nome, email e telefone. Email precisa ser único.</p>
                </div>

                <div className="mt-6 space-y-4">
                  <div>
                    <label className={`text-sm font-medium ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>Nome</label>
                    <input className={`mt-2 w-full rounded-2xl border px-4 py-3 outline-none transition ${darkMode ? 'border-slate-700 bg-slate-800 text-white placeholder:text-slate-400 focus:border-orange-400' : 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-orange-500'}`} value={profileForm.name} onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div>
                    <label className={`text-sm font-medium ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>Email</label>
                    <input className={`mt-2 w-full rounded-2xl border px-4 py-3 outline-none transition ${darkMode ? 'border-slate-700 bg-slate-800 text-white placeholder:text-slate-400 focus:border-orange-400' : 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-orange-500'}`} value={profileForm.email} onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))} />
                  </div>
                  <div>
                    <label className={`text-sm font-medium ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>Telefone</label>
                    <input className={`mt-2 w-full rounded-2xl border px-4 py-3 outline-none transition ${darkMode ? 'border-slate-700 bg-slate-800 text-white placeholder:text-slate-400 focus:border-orange-400' : 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-orange-500'}`} value={profileForm.phone} onChange={(e) => handleProfilePhoneChange(e.target.value)} placeholder="(xx) xxxx-xxxx" />
                  </div>
                  {currentRole === 'student' && (
                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <label className={`text-sm font-medium ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>Observações</label>
                        <button
                          type="button"
                          onClick={() => setProfileForm((current) => ({ ...current, pcdNotes: '' }))}
                          className={`text-xs font-semibold transition ${darkMode ? 'text-orange-300 hover:text-orange-200' : 'text-orange-600 hover:text-orange-700'}`}
                        >
                          Apagar observações
                        </button>
                      </div>
                      <textarea
                        className={`mt-2 w-full rounded-2xl border px-4 py-3 outline-none transition ${darkMode ? 'border-slate-700 bg-slate-800 text-white placeholder:text-slate-400 focus:border-orange-400' : 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-orange-500'}`}
                        rows={5}
                        value={profileForm.pcdNotes}
                        onChange={(e) => setProfileForm((current) => ({ ...current, pcdNotes: e.target.value }))}
                        placeholder="Escreva observações, necessidades e adaptações do aluno..."
                      />
                    </div>
                  )}
                  {currentRole === 'teacher' && (
                    <div>
                      <label className={`text-sm font-medium ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>Especialidades</label>
                      <div className={`mt-2 max-h-56 overflow-y-auto rounded-2xl border p-3 ${darkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50'}`}>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {teacherProfileSpecialties.map((specialty) => (
                            <label
                              key={specialty}
                              className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 text-sm transition ${profileForm.teacherSubjects.includes(specialty) ? (darkMode ? 'border-orange-400 bg-orange-500/10 text-white' : 'border-orange-300 bg-orange-50 text-slate-900') : (darkMode ? 'border-slate-700 bg-slate-900 text-slate-200' : 'border-slate-200 bg-white text-slate-700')}`}
                            >
                              <input
                                type="checkbox"
                                checked={profileForm.teacherSubjects.includes(specialty)}
                                onChange={(event) => {
                                  setProfileForm((current) => ({
                                    ...current,
                                    teacherSubjects: event.target.checked
                                      ? Array.from(new Set([...current.teacherSubjects, specialty]))
                                      : current.teacherSubjects.filter((item) => item !== specialty),
                                  }));
                                }}
                                className="h-4 w-4 rounded border-slate-400 text-orange-500 focus:ring-orange-500"
                              />
                              <span>{specialty}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <p className={`mt-2 text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Selecione uma ou mais especialidades cadastradas no sistema.</p>
                    </div>
                  )}
                </div>

                {authError && (
                  <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${darkMode ? 'border-red-900/50 bg-red-950/40 text-red-200' : 'border-red-200 bg-red-50 text-red-700'}`}>{authError}</div>
                )}

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button type="button" onClick={cancelEditProfile} className={`rounded-full border px-5 py-3 text-sm font-semibold transition ${darkMode ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}>Cancelar</button>
                  <button type="button" onClick={saveProfile} disabled={authSubmitting} className="rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-orange-600 disabled:opacity-70">{authSubmitting ? 'Salvando...' : 'Salvar alterações'}</button>
                </div>
              </div>
            </div>
          )}
          <PasswordReset darkMode={darkMode} />
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
              <div className="flex min-h-[400px] items-center justify-center rounded-[1.5rem] border border-transparent bg-gradient-to-br from-white/90 to-orange-50/50 p-4 overflow-hidden">
                <img src={servicesImage} alt="Serviços - Estudo Em Dia" className="h-full w-full rounded-[0.5rem] object-cover shadow-md" />
              </div>

              <div className="space-y-4 rounded-[1.5rem] border border-orange-200 bg-white/85 p-5">
                <div className="flex min-h-[180px] items-center justify-center rounded-[1.25rem] border-2 border-transparent bg-white px-6">
                  <img src={poliImage} alt="Imagem P.O.L.I" className="max-h-56 w-full rounded-lg object-cover shadow" />
                </div>
                <p className="text-center mt-3 text-sm text-slate-500">W E L C O M E</p>
              </div>
            </section>
          </div>
        </main>
        <PasswordReset darkMode={darkMode} />
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
      setPermissionMessage('Erro ao criar material: ' + (e?.error || e?.message || JSON.stringify(e)));
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
      setEditReturnTab('students');
      safeSetActiveTab('students');

      const resetNotice = created?.reset_password_token ? `\n\nToken de redefinição: ${created.reset_password_token}` : '';
      const resetUrlNotice = created?.reset_password_url ? `\nLink de redefinição: ${created.reset_password_url}` : '';
      alert(`Aluno cadastrado com sucesso!${resetNotice}${resetUrlNotice}`);
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
      const returnTab = editReturnTab ?? 'students';
      setEditReturnTab('students');
      safeSetActiveTab(returnTab);
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
      const fetched = Array.isArray(list) ? list.map((s: any) => ({ id: s?.id ?? s?.ID ?? s?.code ?? s?.name, name: typeof s === 'string' ? s : (s.name ?? s.title ?? String(s?.id ?? '')) })) : [];

      // Also merge unique subject names already present on uploaded materials
      const materialNames = Array.from(new Set(materials.map((m: any) => (m?.subjectName ?? m?.subject_name ?? m?.title ?? '').toString()).filter(Boolean)));

      const namesSet = new Set(fetched.map(f => String(f.name).toLowerCase()));
      const merged = [...fetched];
      materialNames.forEach((n) => {
        if (!namesSet.has(String(n).toLowerCase())) {
          merged.push({ id: n, name: n });
          namesSet.add(String(n).toLowerCase());
        }
      });

      setSubjects(merged);
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
      setEditReturnTab('teachers');
      safeSetActiveTab('teachers');

      const resetNotice = created?.reset_password_token ? `\n\nToken de redefinição: ${created.reset_password_token}` : '';
      const resetUrlNotice = created?.reset_password_url ? `\nLink de redefinição: ${created.reset_password_url}` : '';
      alert(`Professor cadastrado com sucesso!${resetNotice}${resetUrlNotice}`);
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
      const returnTab = editReturnTab ?? 'teachers';
      setEditReturnTab('teachers');
      safeSetActiveTab(returnTab);
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
    setEditReturnTab(activeTab);
    setEditingStudent(student);
    safeSetActiveTab('add-student');
  };

  const handleEditTeacher = (teacher: Teacher) => {
    setEditReturnTab(activeTab);
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
          {canAddMaterials && (
          <button
            onClick={() => {
              if (canAddMaterials) {
                setActiveTab('add-material');
                syncUrlToTab('add-material');
              } else {
                openPermissionPopup('Somente administradores e professores podem inserir materias.');
              }
            }}
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
          {currentRole === 'admin' && (
            <>
              <button
                onClick={() => { setActiveTab('add-student'); syncUrlToTab('add-student'); }}
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
                onClick={() => { setActiveTab('add-teacher'); syncUrlToTab('add-teacher'); }}
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
            </>
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
            <MaterialsList materials={materials} onRemove={removeMaterial} darkMode={darkMode} role={currentRole} />
          )}
          {activeTab === 'students' && (
            <StudentsList students={students} onRemove={removeStudent} onEdit={handleEditStudent} darkMode={darkMode} role={currentRole} />
          )}
          {activeTab === 'teachers' && (
            <TeachersList teachers={teachers} onRemove={removeTeacher} onEdit={handleEditTeacher} darkMode={darkMode} role={currentRole} />
          )}
          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className={`col-span-1 rounded-2xl border p-6 ${darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'}`}>
                <div className="flex flex-col items-center gap-4">
                  <div className={`h-28 w-28 rounded-full flex items-center justify-center ${darkMode ? 'bg-gray-800 text-gray-200' : 'bg-blue-600 text-white'}`}>
                    <User size={36} />
                  </div>
                  <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{authUser?.name ?? 'Usuário'}</h3>
                  <div className={`px-3 py-1 rounded-full text-sm font-semibold ${darkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-700 shadow-sm'}`}>{roleLabelMap[currentRole ?? 'teacher']}</div>
                  <p className={`mt-3 text-sm text-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {currentRole === 'student' ? 'Perfil do Aluno' : currentRole === 'teacher' ? 'Perfil do Professor' : 'Perfil Administrativo'}
                  </p>
                </div>

                <div className="mt-6 space-y-4">
                  <div className={`rounded-2xl border p-4 ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                    <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Email</p>
                    <p className={`mt-2 text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{authUser?.email ?? '—'}</p>
                  </div>
                  <div className={`rounded-2xl border p-4 ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                    <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Telefone</p>
                    <p className={`mt-2 text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{formatPhoneBR(authUser?.phone ?? profileData?.phone ?? '') || '—'}</p>
                  </div>
                  <div className={`rounded-2xl border p-4 ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                    <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Membro desde</p>
                    <p className={`mt-2 text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{authUser?.created_at ? formatDateBR(authUser?.created_at) : '—'}</p>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={startEditProfile}
                    className={`w-full px-4 py-2 rounded-lg transition-colors ${darkMode ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-200 text-slate-800 hover:bg-slate-300'}`}
                  >
                    Editar Perfil
                  </button>
                </div>
              </div>

              <div className="col-span-2 space-y-6">
                {currentRole === 'student' && (
                  <div className={`rounded-2xl border p-6 ${darkMode ? 'border-cyan-700 bg-gray-900' : 'border-cyan-200 bg-white'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-lg ${darkMode ? 'bg-cyan-700 text-white' : 'bg-cyan-500 text-white'}`}>
                        <GraduationCap size={20} />
                      </div>
                      <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Dados do Aluno</h3>
                    </div>

                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className={`rounded-lg p-4 ${darkMode ? 'bg-cyan-950/40' : 'bg-cyan-50'}`}>
                        <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${darkMode ? 'text-cyan-300' : 'text-cyan-600'}`}>Série</p>
                        <p className={`mt-2 text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{profileData?.grade ?? authUser?.grade ?? '—'}</p>
                      </div>
                      <div className={`rounded-lg p-4 ${darkMode ? 'bg-cyan-950/40' : 'bg-cyan-50'}`}>
                        <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${darkMode ? 'text-cyan-300' : 'text-cyan-600'}`}>Idade</p>
                        <p className={`mt-2 text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{profileData?.age ?? authUser?.age ?? '—'}</p>
                      </div>
                      {/* Data de Nascimento e Turma removidos do perfil do aluno por solicitação */}
                    </div>

                    <div className={`mt-4 rounded-lg p-4 ${darkMode ? 'bg-cyan-950/40' : 'bg-cyan-50'}`}>
                      <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${darkMode ? 'text-cyan-300' : 'text-cyan-600'}`}>Observações</p>
                      <p className={`mt-2 text-sm leading-6 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{profileData?.pcdNotes ?? profileData?.pcd_notes ?? authUser?.pcdNotes ?? authUser?.pcd_notes ?? 'Nenhuma observação cadastrada.'}</p>
                    </div>
                  </div>
                )}

                <div className={`rounded-2xl border p-6 ${darkMode ? 'border-purple-700 bg-gray-900' : 'border-purple-200 bg-white'}`}>
                  <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-lg ${darkMode ? 'bg-purple-700 text-white' : 'bg-purple-500 text-white'}`}>
                      <Shield size={20} />
                    </div>
                    <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Permissões de Acesso</h3>
                  </div>

                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {(() => {
                        const perms: string[] = ['Editar Perfil', 'Baixar Materias'];
                        if (currentRole === 'teacher' || currentRole === 'admin') perms.push('Inserir Materiais');
                        if (currentRole === 'admin') {
                          perms.push('Cadastrar Aluno', 'Cadastrar Professor');
                        }
                        return perms.map((p, i) => (
                          <div
                            key={i}
                            className={`rounded-lg p-4 text-sm font-medium transition-colors ${
                              darkMode
                                ? 'bg-purple-900/30 text-purple-100 border border-purple-800/50'
                                : 'bg-purple-50 text-purple-900 border border-purple-100'
                            }`}
                          >
                            {p}
                          </div>
                        ));
                      })()}
                    </div>
                </div>

                {currentRole === 'teacher' && (
                  <div className={`rounded-2xl border p-6 ${darkMode ? 'border-blue-600 bg-gray-900' : 'border-blue-200 bg-white'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-lg ${darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'}`}>
                        <BookOpen size={20} />
                      </div>
                      <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Disciplinas Lecionadas</h3>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-4">
                      {profileSubjects && profileSubjects.length ? (
                        profileSubjects.map((s: any, idx: number) => (
                          <div key={idx} className={`px-6 py-3 rounded-xl ${darkMode ? 'bg-slate-800 text-white' : 'bg-sky-50 text-sky-700'}`}>{typeof s === 'string' ? s : s.name ?? s.title}</div>
                        ))
                      ) : (
                        <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Nenhuma disciplina atribuída</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          {permissionMessage && (
            <div className={`fixed inset-0 z-60 flex items-center justify-center p-4 ${darkMode ? 'bg-black/60' : 'bg-slate-950/40'}`}>
              <div className={`w-full max-w-md rounded-lg border p-6 shadow-lg ${darkMode ? 'bg-slate-900 text-slate-100 border-slate-700' : 'bg-white text-slate-900 border-gray-200'}`}>
                <p className={`text-sm font-semibold uppercase tracking-[0.2em] ${darkMode ? 'text-orange-300' : 'text-orange-600'}`}>Acesso negado</p>
                <div className="mt-4 text-sm leading-6">{permissionMessage}</div>
                <div className="mt-6 text-right">
                  <button onClick={() => setPermissionMessage(null)} className={`rounded-full px-4 py-2 text-sm font-semibold ${darkMode ? 'bg-orange-600 text-white' : 'bg-orange-500 text-white'}`}>Fechar</button>
                </div>
              </div>
            </div>
          )}

          {confirmDialog.open && (
            <div className={`fixed inset-0 z-70 flex items-center justify-center p-4 ${darkMode ? 'bg-black/60' : 'bg-slate-950/40'}`}>
              <div className={`w-full max-w-md rounded-lg border p-6 shadow-lg ${darkMode ? 'bg-slate-900 text-slate-100 border-slate-700' : 'bg-white text-slate-900 border-gray-200'}`}>
                <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Confirmação</p>
                <div className="mt-4 text-sm leading-6">{confirmDialog.message}</div>
                <div className="mt-6 flex gap-3 justify-end">
                  <button onClick={() => {
                    try { confirmDialog.resolve?.(false); } catch(_){}
                    setConfirmDialog({ open: false, message: '' });
                  }} className={`px-4 py-2 rounded-lg border ${darkMode ? 'bg-slate-800 text-white border-slate-700' : 'bg-white text-gray-700 border-gray-200'}`}>Cancelar</button>
                  <button onClick={() => {
                    try { confirmDialog.resolve?.(true); } catch(_){}
                    setConfirmDialog({ open: false, message: '' });
                  }} className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-red-600 text-white' : 'bg-red-500 text-white'}`}>Sim, excluir</button>
                </div>
              </div>
            </div>
          )}

          {editingProfile && (
            <div className={`fixed inset-0 z-[80] flex items-center justify-center px-4 backdrop-blur-sm ${darkMode ? 'bg-black/70' : 'bg-slate-950/50'}`}>
              <div className={`w-full max-w-lg rounded-[1rem] border p-6 shadow-lg ${darkMode ? 'border-slate-700 bg-slate-900 text-slate-100 shadow-black/40' : 'border-white/70 bg-white text-slate-900'}`}>
                <div className="space-y-2">
                  <p className={`text-sm font-semibold uppercase tracking-[0.2em] ${darkMode ? 'text-orange-300' : 'text-orange-600'}`}>Editar Perfil</p>
                  <h3 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Atualize seus dados</h3>
                  <p className={`text-sm leading-6 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Altere nome, email e telefone. Email precisa ser único.</p>
                </div>

                <div className="mt-6 space-y-4">
                  <div>
                    <label className={`text-sm font-medium ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>Nome</label>
                    <input className={`mt-2 w-full rounded-2xl border px-4 py-3 outline-none transition ${darkMode ? 'border-slate-700 bg-slate-800 text-white placeholder:text-slate-400 focus:border-orange-400' : 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-orange-500'}`} value={profileForm.name} onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div>
                    <label className={`text-sm font-medium ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>Email</label>
                    <input className={`mt-2 w-full rounded-2xl border px-4 py-3 outline-none transition ${darkMode ? 'border-slate-700 bg-slate-800 text-white placeholder:text-slate-400 focus:border-orange-400' : 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-orange-500'}`} value={profileForm.email} onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))} />
                  </div>
                  <div>
                    <label className={`text-sm font-medium ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>Telefone</label>
                    <input className={`mt-2 w-full rounded-2xl border px-4 py-3 outline-none transition ${darkMode ? 'border-slate-700 bg-slate-800 text-white placeholder:text-slate-400 focus:border-orange-400' : 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-orange-500'}`} value={profileForm.phone} onChange={(e) => handleProfilePhoneChange(e.target.value)} placeholder="(xx) xxxx-xxxx" />
                  </div>
                  {currentRole === 'teacher' && (
                    <div>
                      <label className={`text-sm font-medium ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>Especialidades</label>
                      <div className={`mt-2 max-h-56 overflow-y-auto rounded-2xl border p-3 ${darkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50'}`}>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {teacherProfileSpecialties.map((specialty) => (
                            <label
                              key={specialty}
                              className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 text-sm transition ${profileForm.teacherSubjects.includes(specialty) ? (darkMode ? 'border-orange-400 bg-orange-500/10 text-white' : 'border-orange-300 bg-orange-50 text-slate-900') : (darkMode ? 'border-slate-700 bg-slate-900 text-slate-200' : 'border-slate-200 bg-white text-slate-700')}`}
                            >
                              <input
                                type="checkbox"
                                checked={profileForm.teacherSubjects.includes(specialty)}
                                onChange={(event) => {
                                  setProfileForm((current) => ({
                                    ...current,
                                    teacherSubjects: event.target.checked
                                      ? Array.from(new Set([...current.teacherSubjects, specialty]))
                                      : current.teacherSubjects.filter((item) => item !== specialty),
                                  }));
                                }}
                                className="h-4 w-4 rounded border-slate-400 text-orange-500 focus:ring-orange-500"
                              />
                              <span>{specialty}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <p className={`mt-2 text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Selecione uma ou mais especialidades cadastradas no sistema.</p>
                    </div>
                  )}
                </div>

                {authError && (
                  <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${darkMode ? 'border-red-900/50 bg-red-950/40 text-red-200' : 'border-red-200 bg-red-50 text-red-700'}`}>{authError}</div>
                )}

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button type="button" onClick={cancelEditProfile} className={`rounded-full border px-5 py-3 text-sm font-semibold transition ${darkMode ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}>Cancelar</button>
                  <button type="button" onClick={saveProfile} disabled={authSubmitting} className="rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-orange-600 disabled:opacity-70">{authSubmitting ? 'Salvando...' : 'Salvar alterações'}</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'add-material' && canAddMaterials && <MaterialForm onSubmit={addMaterial} darkMode={darkMode} availableSubjects={subjects} />}
          {activeTab === 'add-student' && canAddStudents && (
            <StudentForm
              onSubmit={editingStudent ? updateStudent : addStudent}
              materials={materials}
              darkMode={darkMode}
              editingStudent={editingStudent}
              onCancel={() => {
                setEditingStudent(null);
                const returnTab = editReturnTab ?? 'students';
                setEditReturnTab('students');
                setActiveTab(returnTab);
              }}
            />
          )}
          {activeTab === 'add-teacher' && canAddTeachers && (
            <TeacherForm
              onSubmit={saveTeacher}
              darkMode={darkMode}
              editingTeacher={editingTeacher}
              availableSubjects={subjects}
              refreshSubjects={refreshSubjects}
              onCancel={() => {
                setEditingTeacher(null);
                const returnTab = editReturnTab ?? 'teachers';
                setEditReturnTab('teachers');
                setActiveTab(returnTab);
              }}
            />
          )}
          <PasswordReset darkMode={darkMode} />
        </div>
      </div>
    </div>
  );
}
