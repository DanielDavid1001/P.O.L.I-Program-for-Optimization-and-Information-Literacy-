import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Student, Teacher, Material } from "../App.tsx";
import {
  GraduationCap,
  Users,
  BookOpen,
  TrendingUp,
} from "lucide-react";

interface DashboardProps {
  students: Student[];
  teachers: Teacher[];
  materials: Material[];
  darkMode: boolean;
}

export function Dashboard({
  students,
  teachers,
  materials,
  darkMode,
}: DashboardProps) {

  const materialsByGrade: { [key: string]: number } = {};
  materials.forEach((material) => {
    if (material.grade) {
      materialsByGrade[material.grade] =
        (materialsByGrade[material.grade] || 0) + 1;
    }
  });

  const materialGradeData = Object.entries(
    materialsByGrade,
  ).map(([name, value], index) => ({
    id: `material-grade-${name.replace(/\s+/g, "-").toLowerCase()}-${index}`,
    name,
    value,
  }));

  // Order grades in a natural school sequence and limit displayed items to 6.
  const gradeOrder = [
    "Pré-Escola",
    "1º Ano",
    "2º Ano",
    "3º Ano",
    "4º Ano",
    "5º Ano",
    "6º Ano",
    "7º Ano",
    "8º Ano",
    "9º Ano",
    "1º Médio",
    "2º Médio",
    "3º Médio",
  ];

  const sortedMaterialGradeData = [...materialGradeData].sort((a, b) => {
    const ia = gradeOrder.indexOf(a.name);
    const ib = gradeOrder.indexOf(b.name);
    if (ia === -1 && ib === -1) return a.name.localeCompare(b.name);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

  const MAX_MATERIAL_ITEMS = 6;
  const displayMaterialGradeData = sortedMaterialGradeData.slice(0, MAX_MATERIAL_ITEMS);

  const gradeData = students.reduce(
    (acc: { [key: string]: number }, student) => {
      if (student.grade) {
        acc[student.grade] = (acc[student.grade] || 0) + 1;
      }
      return acc;
    },
    {},
  );

  const gradeChartData = Object.entries(gradeData).map(
    ([name, total], index) => ({
      id: `student-grade-${name.replace(/\s+/g, "-").toLowerCase()}-${index}`,
      name,
      total,
    }),
  );

  const COLORS = [
    "#FF8C42",
    "#7AB800",
    "#4A90E2",
    "#E74C3C",
    "#9B59B6",
    "#1ABC9C",
  ];

  const internCount = teachers.filter((t) => t.isIntern).length;
  const regularCount = teachers.filter(
    (t) => !t.isIntern,
  ).length;

  const teacherTypeData = [
    {
      id: "teacher-type-interns-0",
      name: "Estagiários",
      value: internCount,
    },
    {
      id: "teacher-type-regular-1",
      name: "Regulares",
      value: regularCount,
    },
  ];

  const materialsChartData = Object.entries(
    materialsByGrade,
  ).map(([name, value], index) => ({
    id: `materials-total-${name.replace(/\s+/g, "-").toLowerCase()}-${index}`,
    name,
    total: value,
  }));

  const adaptedByGrade: { [key: string]: number } = {};
  materials.forEach((material) => {
    if (material.grade && material.isAdapted) {
      adaptedByGrade[material.grade] = (adaptedByGrade[material.grade] || 0) + 1;
    }
  });

  const combinedPcdAdaptedData = Object.entries(adaptedByGrade).map(([name, value], index) => ({
    id: `adapted-materials-${name.replace(/\s+/g, "-").toLowerCase()}-${index}`,
    name,
    adapted: value,
  }));

  const hasStudentGradeData = combinedPcdAdaptedData.length > 0;
  const hasMaterialGradeData = materialGradeData.length > 0;
  const hasMaterialsBarData = gradeChartData.length > 0;

  const MATERIAL_COLORS = [
    "#FF8C42",
    "#4A90E2",
    "#7AB800",
    "#FF8C42",
    "#4A90E2",
    "#7AB800",
    "#FF8C42",
    "#4A90E2",
    "#7AB800",
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2
          className={`text-2xl font-bold mb-6 ${darkMode ? "text-white" : "text-gray-800"}`}
        >
          Dashboard - Visão Geral
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm uppercase tracking-wide">
                Total de Alunos
              </p>
              <p className="text-4xl font-bold mt-2">
                {students.length}
              </p>
            </div>
            <div className="bg-white/20 p-3 rounded-full">
              <GraduationCap size={32} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm uppercase tracking-wide">
                Professores
              </p>
              <p className="text-4xl font-bold mt-2">
                {teachers.length}
              </p>
            </div>
            <div className="bg-white/20 p-3 rounded-full">
              <Users size={32} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm uppercase tracking-wide">
                Estagiários
              </p>
              <p className="text-4xl font-bold mt-2">
                {internCount}
              </p>
            </div>
            <div className="bg-white/20 p-3 rounded-full">
              <BookOpen size={32} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm uppercase tracking-wide">
                Materias Cadastrados
              </p>
              <p className="text-4xl font-bold mt-2">
                {materials.length}
              </p>
            </div>
            <div className="bg-white/20 p-3 rounded-full">
              <TrendingUp size={32} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div
          key="chart-container-pcd-adapted-by-grade"
          className={`rounded-lg shadow-md p-6 border-t-4 border-green-600 ${darkMode ? "bg-gray-700" : "bg-white"}`}
        >
          <h3
            className={`text-xl font-bold mb-4 ${darkMode ? "text-white" : "text-gray-800"}`}
          >
            Quantidade de Materias Adaptadas por Série
          </h3>
          <ResponsiveContainer width="100%" height={300} key="responsive-bar-chart-pcd">
            {hasStudentGradeData ? (
              <BarChart data={combinedPcdAdaptedData} key="bar-chart-pcd">
                <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
                <XAxis dataKey="name" stroke="#7AB800" />
                <YAxis stroke="#F79646" />
                <Tooltip />
                <Legend />
                <Bar dataKey="adapted" fill="#2b75ff" name="Materias Adaptados" isAnimationActive={false} />
              </BarChart>
            ) : (
              <div className={`h-full flex items-center justify-center text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Marque materias como adaptados para visualizar este gráfico.
              </div>
            )}
          </ResponsiveContainer>
        </div>

        <div
          key="chart-container-materials-by-grade"
          className={`rounded-lg shadow-md p-6 border-t-4 border-blue-500 ${darkMode ? "bg-gray-700" : "bg-white"}`}
        >
          <h3
            className={`text-xl font-bold mb-4 ${darkMode ? "text-white" : "text-gray-800"}`}
          >
            Materias por Série
          </h3>
          <ResponsiveContainer
            width="100%"
            height={300}
            key="responsive-pie-materials"
          >
            {hasMaterialGradeData ? (
              <PieChart key="pie-chart-materials">
                <Pie
                  data={displayMaterialGradeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {displayMaterialGradeData.map((entry, index) => (
                    <Cell
                      key={`cell-material-${entry.id}`}
                      fill={
                        entry.name === "..."
                          ? "#CBD5E1"
                          : MATERIAL_COLORS[index % MATERIAL_COLORS.length]
                      }
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            ) : (
              <div className={`h-full flex items-center justify-center text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Cadastre materias com série para visualizar este gráfico.
              </div>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div
          key="chart-container-teacher-types"
          className={`rounded-lg shadow-md p-6 border-t-4 border-orange-500 ${darkMode ? "bg-gray-700" : "bg-white"}`}
        >
          <h3
            className={`text-xl font-bold mb-4 ${darkMode ? "text-white" : "text-gray-800"}`}
          >
            Tipos de Professores
          </h3>
          <ResponsiveContainer width="100%" height={300} key="responsive-pie-teachers">
            <PieChart key="pie-chart-teachers">
              <Pie
                data={teacherTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {teacherTypeData.map((entry, index) => (
                  <Cell
                    key={`cell-teacher-${entry.id}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div
          key="chart-container-materials-total"
          className={`rounded-lg shadow-md p-6 border-t-4 border-purple-500 ${darkMode ? "bg-gray-700" : "bg-white"}`}
        >
          <h3 className={`text-xl font-bold mb-4 ${darkMode ? "text-white" : "text-gray-800"}`}>
            Quantidade de Alunos Cadastrados por Série
          </h3>
          <ResponsiveContainer width="100%" height={300} key="responsive-bar-students-by-grade">
            {hasMaterialsBarData ? (
              <BarChart data={gradeChartData} key="bar-chart-students-by-grade">
                <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
                <XAxis dataKey="name" stroke="#2b75ff" />
                <YAxis stroke="#F79646" />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" fill="#7AB800" name="Alunos" isAnimationActive={false} />
              </BarChart>
            ) : (
              <div className={`h-full flex items-center justify-center text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Cadastre alunos com série para visualizar este gráfico.
              </div>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
