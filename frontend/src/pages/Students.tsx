import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
        setError(err instanceof Error ? err.message : "Failed to load students");
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
        setError(err instanceof Error ? err.message : "Failed to load students");
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
          <PageHeaderHeading>Students</PageHeaderHeading>
        </PageHeader>
        <div className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">Loading...</p>
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
        <PageHeaderHeading>Students</PageHeaderHeading>
        <Button onClick={() => navigate("/students/new")}>New Student</Button>
      </PageHeader>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Filter by Student Group</label>
        <select
          className="w-full max-w-xs rounded-md border px-3 py-2 text-sm"
          value={selectedGroup ?? ""}
          onChange={(e) => setSelectedGroup(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">All Groups</option>
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
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Student Groups</TableHead>
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

