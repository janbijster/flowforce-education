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
import { fetchStudentGroupProgress, TopicProgress, fetchStudent, StudentDetail } from "@/lib/api";
import { ProgressBar } from "@/components/ProgressBar";

export default function StudentGroupProgress() {
  const { studentId, groupId } = useParams<{ studentId: string; groupId: string }>();
  const navigate = useNavigate();
  const [topics, setTopics] = useState<TopicProgress[]>([]);
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId || !groupId) return;

    const loadData = async () => {
      try {
        const [topicsData, studentData] = await Promise.all([
          fetchStudentGroupProgress(Number(studentId), Number(groupId)),
          fetchStudent(Number(studentId)),
        ]);
        setTopics(topicsData);
        setStudent(studentData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [studentId, groupId]);

  if (loading) {
    return (
      <>
        <PageHeader>
          <PageHeaderHeading>Student Group Progress</PageHeaderHeading>
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
          <PageHeaderHeading>Student Group Progress</PageHeaderHeading>
        </PageHeader>
        <div className="flex items-center justify-center p-8">
          <p className="text-destructive">{error || "Data not found"}</p>
        </div>
      </>
    );
  }

  const group = student.student_groups_with_progress?.find(g => g.id === Number(groupId));

  return (
    <>
      <PageHeader>
        <PageHeaderHeading>
          {student.full_name} - {group?.name || "Group Progress"}
        </PageHeaderHeading>
        <div className="flex gap-2">
          <Button onClick={() => navigate(`/students/${studentId}`)} variant="outline">
            Back to Student
          </Button>
        </div>
      </PageHeader>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Topic</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Module</TableHead>
              <TableHead>Lesson</TableHead>
              <TableHead>Progress</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topics.length > 0 ? (
              topics.map((topic) => (
                <TableRow key={topic.id}>
                  <TableCell className="font-medium">{topic.name}</TableCell>
                  <TableCell>{topic.course_name}</TableCell>
                  <TableCell>{topic.module_name}</TableCell>
                  <TableCell>{topic.lesson_name}</TableCell>
                  <TableCell>
                    <ProgressBar
                      mastered={topic.questions_correct}
                      total={topic.questions_answered || topic.total_questions}
                      label={`${topic.questions_correct}/${topic.questions_answered || topic.total_questions} questions correct`}
                    />
                    {topic.questions_answered < topic.total_questions && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {topic.total_questions - topic.questions_answered} questions not yet answered
                      </p>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No topics found for this group
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

