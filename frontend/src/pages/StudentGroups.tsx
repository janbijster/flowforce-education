import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PageHeader, PageHeaderHeading } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchStudentGroups, fetchCourses, StudentGroup, Course } from "@/lib/api";

export default function StudentGroups() {
  const { t } = useTranslation();
  const [studentGroups, setStudentGroups] = useState<StudentGroup[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [groups, cs] = await Promise.all([
          fetchStudentGroups(),
          fetchCourses(),
        ]);
        setStudentGroups(groups);
        setCourses(cs);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("errors.failedToLoadStudentGroups"));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const loadGroups = async () => {
      try {
        const groups = await fetchStudentGroups(selectedCourse || undefined);
        setStudentGroups(groups);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("errors.failedToLoadStudentGroups"));
      }
    };
    loadGroups();
  }, [selectedCourse]);

  const handleRowClick = (id: number) => {
    navigate(`/student-groups/${id}`);
  };

  if (loading) {
    return (
      <>
        <PageHeader>
          <PageHeaderHeading>{t("studentGroups.studentGroups")}</PageHeaderHeading>
        </PageHeader>
        <div className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">{t("common.loading")}</p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageHeader>
          <PageHeaderHeading>Student Groups</PageHeaderHeading>
        </PageHeader>
        <div className="flex items-center justify-center p-8">
          <p className="text-destructive">{error}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader>
        <PageHeaderHeading>{t("studentGroups.studentGroups")}</PageHeaderHeading>
        <Button onClick={() => navigate("/student-groups/new")}>{t("studentGroups.newStudentGroup")}</Button>
      </PageHeader>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">{t("studentGroups.filterByCourse")}</label>
        <select
          className="w-full max-w-xs rounded-md border px-3 py-2 text-sm"
          value={selectedCourse ?? ""}
          onChange={(e) => setSelectedCourse(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">{t("studentGroups.allCourses")}</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.name}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("common.name")}</TableHead>
              <TableHead>{t("quizzes.course")}</TableHead>
              <TableHead>{t("materials.modules")}</TableHead>
              <TableHead>{t("common.year")}</TableHead>
              <TableHead>{t("studentGroups.students")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {studentGroups.map((group) => (
              <TableRow
                key={group.id}
                onClick={() => handleRowClick(group.id)}
                className="cursor-pointer"
              >
                <TableCell className="font-medium">{group.name}</TableCell>
                <TableCell>{group.course_name}</TableCell>
                <TableCell>
                  {group.modules_names && group.modules_names.length > 0
                    ? group.modules_names.join(", ")
                    : "—"}
                </TableCell>
                <TableCell>{group.year}</TableCell>
                <TableCell>{group.students_count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

