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
import { LoadingError } from "@/components/LoadingError";
import { FilterSelect } from "@/components/FilterSelect";
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

  return (
    <LoadingError loading={loading} error={error} title={t("students.students")}>
      <PageHeader>
        <PageHeaderHeading>{t("students.students")}</PageHeaderHeading>
        <Button onClick={() => navigate("/students/new")}>{t("students.newStudent")}</Button>
      </PageHeader>

      <FilterSelect
        label={t("students.filterByStudentGroup")}
        value={selectedGroup}
        options={studentGroups}
        onChange={setSelectedGroup}
        allLabel={t("students.allGroups")}
        displayFn={(group) => `${group.name} (${group.course_name})`}
      />

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
    </LoadingError>
  );
}
