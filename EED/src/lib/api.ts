const ENV_API_BASE = import.meta.env.VITE_API_URL?.trim();
const AUTH_TOKEN_KEY = 'eed-auth-token';

function getAuthToken() {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch (error) {
    return null;
  }
}

export function setAuthToken(token: string) {
  try {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch (error) {
    // ignore storage failures
  }
}

export function clearAuthToken() {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch (error) {
    // ignore storage failures
  }
}

function getApiBase() {
  if (typeof window === 'undefined') {
    return ENV_API_BASE?.replace(/\/$/, '') ?? '';
  }
  const { protocol, hostname, port } = window.location;

  // Priority: explicit env var, otherwise assume local backend at port 8000 in dev
  if (ENV_API_BASE) {
    return ENV_API_BASE.replace(/\/$/, '');
  }

  // If running on a dev server (localhost), default to PHP dev server at port 8000
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${protocol}//127.0.0.1:8000`;
  }

  // Fallback to empty string (same-origin) if nothing else matches
  return '';
}

function api(path: string) {
  const base = getApiBase();
  return `${base}/api${path}`;
}

function request(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers ?? {});
  const token = getAuthToken();

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  return fetch(api(path), {
    ...options,
    headers,
  });
}

function requestPublic(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers ?? {});

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  return fetch(api(path), {
    ...options,
    headers,
  });
}

async function handleResponse(res: Response) {
  if (!res.ok) {
    const payload = await res.json().catch(async () => {
      const rawText = await res.text().catch(() => '');
      return {
        message: rawText || `${res.status} ${res.statusText}`,
        status: res.status,
      };
    });

    if (res.status === 403 && typeof window !== 'undefined') {
      // Previously dispatched a global permission-denied event here.
      // Changed to let callers handle 403 responses locally to avoid a global popup.
    }

    throw payload;
  }
  return res.json().catch(() => ({}));
}

export async function getStudents() {
  const res = await request('/students');
  return handleResponse(res);
}

export async function getStudent(id: number | string) {
  const res = await request(`/students/${id}`);
  return handleResponse(res);
}

export async function createStudent(payload: any) {
  const res = await request('/students', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function updateStudent(id: number | string, payload: any) {
  const res = await request(`/students/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function deleteStudent(id: number | string) {
  const res = await request(`/students/${id}`, {
    method: 'DELETE',
  });
  if (res.status === 204) return {};
  return handleResponse(res);
}

// Teachers
export async function getTeachers() {
  const res = await request('/teachers');
  return handleResponse(res);
}

export async function getTeacher(id: number | string) {
  const res = await request(`/teachers/${id}`);
  return handleResponse(res);
}

export async function createTeacher(payload: any) {
  const res = await request('/teachers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function updateTeacher(id: number | string, payload: any) {
  const res = await request(`/teachers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function deleteTeacher(id: number | string) {
  const res = await request(`/teachers/${id}`, {
    method: 'DELETE',
  });
  if (res.status === 204) return {};
  return handleResponse(res);
}

// Subjects
export async function getSubjects() {
  const res = await request('/subjects');
  return handleResponse(res);
}

export async function getPublicSubjects() {
  const res = await requestPublic('/subjects-public');
  return handleResponse(res);
}

export async function createSubject(payload: any) {
  const res = await request('/subjects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function deleteSubject(id: number | string) {
  const res = await request(`/subjects/${id}`, {
    method: 'DELETE',
  });
  if (res.status === 204) return {};
  return handleResponse(res);
}

// Materials
export async function getMaterials(options?: { public?: boolean }) {
  const res = options?.public ? await requestPublic('/materials') : await request('/materials');
  return handleResponse(res);
}

export async function createMaterial(payload: any) {
  let res: Response;
  if (payload instanceof FormData) {
    res = await request('/materials', {
      method: 'POST',
      body: payload,
    });
  } else {
    res = await request('/materials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }
  return handleResponse(res);
}

export async function deleteMaterial(id: number | string) {
  const res = await request(`/materials/${id}`, {
    method: 'DELETE',
  });
  if (res.status === 204) return {};
  return handleResponse(res);
}

// Classrooms
export async function getClassrooms() {
  const res = await request('/classrooms');
  return handleResponse(res);
}

export async function createClassroom(payload: any) {
  const res = await request('/classrooms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function login(email: string, password: string) {
  const res = await request('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(res);
}

export async function register(payload: { name: string; email: string; password: string; password_confirmation: string; role: 'admin' | 'teacher' | 'student'; registration_token: string; phone?: string; birth_date?: string; age?: number | string | null; grade?: string | null; subjects?: string[]; }) {
  const res = await request('/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function getCurrentUser() {
  const res = await request('/user');
  return handleResponse(res);
}

export async function updateCurrentUser(payload: {
  name: string;
  email: string;
  phone?: string;
  birth_date?: string | null;
  grade?: string | null;
  subjects?: string[];
  is_pcd?: boolean;
  pcd_notes?: string | null;
}) {
  const res = await request('/user', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function logout() {
  const res = await request('/logout', { method: 'POST' });
  return handleResponse(res);
}

export async function forgotPassword(email: string) {
  const res = await requestPublic('/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return handleResponse(res);
}

export async function resetPassword(payload: { email: string; token: string; password: string; password_confirmation: string; }) {
  const res = await requestPublic('/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export default {
  getStudents, getStudent, createStudent, updateStudent, deleteStudent,
  getTeachers, getTeacher, createTeacher, updateTeacher, deleteTeacher,
  getSubjects, getPublicSubjects, createSubject,
  getMaterials, createMaterial, deleteMaterial,
  getClassrooms, createClassroom,
  login, register, logout, getCurrentUser,
  forgotPassword, resetPassword,
  setAuthToken, clearAuthToken,
};
