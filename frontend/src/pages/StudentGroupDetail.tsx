import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { fetchStudentGroup, StudentGroupDetail as StudentGroupDetailType } from "@/lib/api";

export default function StudentGroupDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [group, setGroup] = useState<StudentGroupDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const loadGroup = async () => {
      try {
        const data = await fetchStudentGroup(Number(id));
        setGroup(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load student group");
      } finally {
        setLoading(false);
      }
    };

    loadGroup();
  }, [id]);

  if (loading) {
    return (
      <>
        <PageHeader>
          <PageHeaderHeading>Student Group Detail</PageHeaderHeading>
        </PageHeader>
        <div className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </>
    );
  }

  if (error || !group) {
    return (
      <>
        <PageHeader>
          <PageHeaderHeading>Student Group Detail</PageHeaderHeading>
        </PageHeader>
        <div className="flex items-center justify-center p-8">
          <p className="text-destructive">{error || "Student group not found"}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader>
        <PageHeaderHeading>Student Group Detail</PageHeaderHeading>
        <div className="flex gap-2">
          <Button onClick={() => navigate(`/student-groups/${group.id}/edit`)} variant="outline">
            Edit
          </Button>
          <Button onClick={() => navigate("/student-groups")} variant="outline">
            Back
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-md border p-4">
            <h2 className="text-lg font-semibold mb-4">Group Information</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Name</p>
                <p className="mt-1">{group.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Course</p>
                  <p className="mt-1">{group.course_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Module</p>
                  <p className="mt-1">{group.module_name ?? "—"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Year</p>
                  <p className="mt-1">{group.year}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Students</p>
                  <p className="mt-1">{group.students_count}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-md border">
          <div className="border-b p-3 text-sm font-medium">Students</div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {group.students && group.students.length > 0 ? (
                group.students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>{student.full_name}</TableCell>
                    <TableCell>{student.email || "—"}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground">
                    No students in this group
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}

