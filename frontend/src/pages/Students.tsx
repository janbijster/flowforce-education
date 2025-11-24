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
import { fetchStudents, fetchStudentGroups, Student, StudentGroup } from "@/lib/api";

export default function Students() {
  const { t } = useTranslation();
  const [students, setStudents] = useState<Student[]>([]);
  const [studentGroups, setStudentGroups] = useState<StudentGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [st, groups] = await Promise.all([
          fetchStudents(),
          fetchStudentGroups(),
        ]);
        setStudents(st);
        setStudentGroups(groups);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("errors.failedToLoadStudents"));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const loadStudents = async () => {
      try {
        const st = await fetchStudents(selectedGroup || undefined);
        setStudents(st);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("errors.failedToLoadStudents"));
      }
    };
    loadStudents();
  }, [selectedGroup]);

  const handleRowClick = (id: number) => {
    navigate(`/students/${id}`);
  };

  if (loading) {
    return (
      <>
        <PageHeader>
          <PageHeaderHeading>{t("students.students")}</PageHeaderHeading>
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
          <PageHeaderHeading>Students</PageHeaderHeading>
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
        <PageHeaderHeading>{t("students.students")}</PageHeaderHeading>
        <Button onClick={() => navigate("/students/new")}>{t("students.newStudent")}</Button>
      </PageHeader>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">{t("students.filterByStudentGroup")}</label>
        <select
          className="w-full max-w-xs rounded-md border px-3 py-2 text-sm"
          value={selectedGroup ?? ""}
          onChange={(e) => setSelectedGroup(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">{t("students.allGroups")}</option>
          {studentGroups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name} ({group.course_name})
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("common.name")}</TableHead>
              <TableHead>{t("common.email")}</TableHead>
              <TableHead>{t("students.studentGroups")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow
                key={student.id}
                onClick={() => handleRowClick(student.id)}
                className="cursor-pointer"
              >
                <TableCell className="font-medium">{student.full_name}</TableCell>
                <TableCell>{student.email || "—"}</TableCell>
                <TableCell>
                  {student.student_groups_names && student.student_groups_names.length > 0
                    ? student.student_groups_names.join(", ")
                    : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

