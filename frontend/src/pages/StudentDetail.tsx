import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader, PageHeaderHeading } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { fetchStudent, StudentDetail as StudentDetailType } from "@/lib/api";

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
            <p className="text-sm font-medium text-muted-foreground">Student Groups</p>
            <p className="mt-1">
              {student.student_groups_names && student.student_groups_names.length > 0
                ? student.student_groups_names.join(", ")
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Question Answers</p>
            <p className="mt-1">{student.question_answers_count}</p>
          </div>
        </div>
      </div>
    </>
  );
}

