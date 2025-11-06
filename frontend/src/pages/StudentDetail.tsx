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
import { fetchStudent, StudentDetail as StudentDetailType } from "@/lib/api";
import { ProgressBar } from "@/components/ProgressBar";

export default function StudentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<StudentDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const loadStudent = async () => {
      try {
        const data = await fetchStudent(Number(id));
        setStudent(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load student");
      } finally {
        setLoading(false);
      }
    };

    loadStudent();
  }, [id]);

  if (loading) {
    return (
      <>
        <PageHeader>
          <PageHeaderHeading>Student Detail</PageHeaderHeading>
        </PageHeader>
        <div className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </>
    );
  }

  if (error || !student) {
    return (
      <>
        <PageHeader>
          <PageHeaderHeading>Student Detail</PageHeaderHeading>
        </PageHeader>
        <div className="flex items-center justify-center p-8">
          <p className="text-destructive">{error || "Student not found"}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader>
        <PageHeaderHeading>Student Detail</PageHeaderHeading>
        <div className="flex gap-2">
          <Button onClick={() => navigate(`/students/${student.id}/edit`)} variant="outline">
            Edit
          </Button>
          <Button onClick={() => navigate("/students")} variant="outline">
            Back
          </Button>
        </div>
      </PageHeader>

      <div className="space-y-6">
        <div className="rounded-md border p-4 max-w-2xl">
          <h2 className="text-lg font-semibold mb-4">Student Information</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">First Name</p>
              <p className="mt-1">{student.first_name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Last Name</p>
              <p className="mt-1">{student.last_name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="mt-1">{student.email || "—"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Question Answers</p>
              <p className="mt-1">{student.question_answers_count}</p>
            </div>
          </div>
        </div>

        <div className="rounded-md border">
          <div className="border-b p-3 text-sm font-medium">Student Groups</div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Group Name</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead className="w-24">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {student.student_groups_with_progress && student.student_groups_with_progress.length > 0 ? (
                student.student_groups_with_progress.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell className="font-medium">{group.name}</TableCell>
                    <TableCell>{group.course_name}</TableCell>
                    <TableCell>{group.year}</TableCell>
                    <TableCell>
                      <ProgressBar
                        mastered={group.progress.mastered_topics}
                        total={group.progress.total_topics}
                        label={`${group.progress.mastered_topics}/${group.progress.total_topics} topics mastered`}
                      />
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/students/${student.id}/groups/${group.id}`)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No student groups
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

