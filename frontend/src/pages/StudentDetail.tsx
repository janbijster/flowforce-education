import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { fetchStudent, StudentDetail as StudentDetailType } from "@/lib/api";
import { ProgressBar } from "@/components/ProgressBar";

export default function StudentDetail() {
  const { t } = useTranslation();
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
          <PageHeaderHeading>{t("students.studentDetail")}</PageHeaderHeading>
        </PageHeader>
        <div className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">{t("common.loading")}</p>
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
          <p className="text-destructive">{error || t("students.studentNotFound")}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader>
        <PageHeaderHeading>{t("students.studentDetail")}</PageHeaderHeading>
        <div className="flex gap-2">
          <Button onClick={() => navigate(`/students/${student.id}/edit`)} variant="outline">
            {t("common.edit")}
          </Button>
          <Button onClick={() => navigate("/students")} variant="outline">
            {t("common.back")}
          </Button>
        </div>
      </PageHeader>

      <div className="space-y-6">
        <div className="rounded-md border p-4 max-w-2xl">
          <h2 className="text-lg font-semibold mb-4">{t("students.studentInformation")}</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t("students.firstName")}</p>
              <p className="mt-1">{student.first_name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t("students.lastName")}</p>
              <p className="mt-1">{student.last_name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t("common.email")}</p>
              <p className="mt-1">{student.email || "—"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t("students.questionAnswers")}</p>
              <p className="mt-1">{student.question_answers_count}</p>
            </div>
          </div>
        </div>

        <div className="rounded-md border">
          <div className="border-b p-3 text-sm font-medium">{t("students.studentGroups")}</div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("students.groupName")}</TableHead>
                <TableHead>{t("quizzes.course")}</TableHead>
                <TableHead>{t("common.year")}</TableHead>
                <TableHead>{t("students.progress")}</TableHead>
                <TableHead className="w-24">{t("common.actions")}</TableHead>
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
                        label={`${group.progress.mastered_topics}/${group.progress.total_topics} ${t("students.topicsMastered")}`}
                      />
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/students/${student.id}/groups/${group.id}`)}
                      >
                        {t("common.view")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    {t("students.noStudentGroups")}
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

