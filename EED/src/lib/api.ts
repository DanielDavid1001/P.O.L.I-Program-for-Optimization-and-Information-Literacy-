const ENV_API_BASE = import.meta.env.VITE_API_URL?.trim();

function getApiBase() {
  if (typeof window === 'undefined') {
    return ENV_API_BASE?.replace(/\/$/, '') ?? '';
  }

  const { protocol, hostname, port } = window.location;

  if ((hostname === 'localhost' || hostname === '127.0.0.1') && port === '8000') {
    return '';
  }

  if (port === '5173' || port === '4173') {
    return `${protocol}//127.0.0.1:8000`;
  }

  if (ENV_API_BASE) {
    return ENV_API_BASE.replace(/\/$/, '');
  }

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return '';
  }

  return '';
}

function api(path: string) {
  const base = getApiBase();
  return `${base}/api${path}`;
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
    throw payload;
  }
  return res.json().catch(() => ({}));
}

export async function getStudents() {
  const res = await fetch(api('/students'));
  return handleResponse(res);
}

export async function getStudent(id: number | string) {
  const res = await fetch(api(`/students/${id}`));
  return handleResponse(res);
}

export async function createStudent(payload: any) {
  const res = await fetch(api('/students'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function updateStudent(id: number | string, payload: any) {
  const res = await fetch(api(`/students/${id}`), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function deleteStudent(id: number | string) {
  const res = await fetch(api(`/students/${id}`), {
    method: 'DELETE',
  });
  if (res.status === 204) return {};
  return handleResponse(res);
}

// Teachers
export async function getTeachers() {
  const res = await fetch(api('/teachers'));
  return handleResponse(res);
}

export async function getTeacher(id: number | string) {
  const res = await fetch(api(`/teachers/${id}`));
  return handleResponse(res);
}

export async function createTeacher(payload: any) {
  const res = await fetch(api('/teachers'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function updateTeacher(id: number | string, payload: any) {
  const res = await fetch(api(`/teachers/${id}`), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function deleteTeacher(id: number | string) {
  const res = await fetch(api(`/teachers/${id}`), {
    method: 'DELETE',
  });
  if (res.status === 204) return {};
  return handleResponse(res);
}

// Subjects
export async function getSubjects() {
  const res = await fetch(api('/subjects'));
  return handleResponse(res);
}

export async function createSubject(payload: any) {
  const res = await fetch(api('/subjects'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function deleteSubject(id: number | string) {
  const res = await fetch(api(`/subjects/${id}`), {
    method: 'DELETE',
  });
  if (res.status === 204) return {};
  return handleResponse(res);
}

// Materials
export async function getMaterials() {
  const res = await fetch(api('/materials'));
  return handleResponse(res);
}

export async function createMaterial(payload: any) {
  let res: Response;
  if (payload instanceof FormData) {
    res = await fetch(api('/materials'), {
      method: 'POST',
      body: payload,
    });
  } else {
    res = await fetch(api('/materials'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }
  return handleResponse(res);
}

export async function deleteMaterial(id: number | string) {
  const res = await fetch(api(`/materials/${id}`), {
    method: 'DELETE',
  });
  if (res.status === 204) return {};
  return handleResponse(res);
}

// Classrooms
export async function getClassrooms() {
  const res = await fetch(api('/classrooms'));
  return handleResponse(res);
}

export async function createClassroom(payload: any) {
  const res = await fetch(api('/classrooms'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function login(email: string, password: string) {
  const res = await fetch(api('/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(res);
}

export async function logout() {
  const res = await fetch(api('/logout'), { method: 'POST' });
  return handleResponse(res);
}

export default {
  getStudents, getStudent, createStudent, updateStudent, deleteStudent,
  getTeachers, getTeacher, createTeacher, updateTeacher, deleteTeacher,
  getSubjects, createSubject,
  getMaterials, createMaterial, deleteMaterial,
  getClassrooms, createClassroom,
  login, logout,
};
