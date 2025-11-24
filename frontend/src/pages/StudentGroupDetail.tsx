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
import { fetchStudentGroup, StudentGroupDetail as StudentGroupDetailType } from "@/lib/api";
import { Progress } from "@/components/ui/progress";

export default function StudentGroupDetail() {
  const { t } = useTranslation();
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
          <PageHeaderHeading>{t("studentGroups.studentGroupDetail")}</PageHeaderHeading>
        </PageHeader>
        <div className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">{t("common.loading")}</p>
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
          <p className="text-destructive">{error || t("studentGroups.studentGroupNotFound")}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader>
        <PageHeaderHeading>{t("studentGroups.studentGroupDetail")}</PageHeaderHeading>
        <div className="flex gap-2">
          <Button onClick={() => navigate(`/student-groups/${group.id}/edit`)} variant="outline">
            {t("common.edit")}
          </Button>
          <Button onClick={() => navigate("/student-groups")} variant="outline">
            {t("common.back")}
          </Button>
        </div>
      </PageHeader>

      <div className="space-y-6">
        <div className="rounded-md border p-4">
          <h2 className="text-lg font-semibold mb-4">{t("studentGroups.groupInformation")}</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t("common.name")}</p>
              <p className="mt-1">{group.name}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t("quizzes.course")}</p>
                <p className="mt-1">{group.course_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t("materials.modules")}</p>
                <p className="mt-1">
                  {group.modules_names && group.modules_names.length > 0
                    ? group.modules_names.join(", ")
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t("common.year")}</p>
                <p className="mt-1">{group.year}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t("studentGroups.students")}</p>
                <p className="mt-1">{group.students_count}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-md border">
          <div className="border-b p-3 text-sm font-medium">{t("studentGroups.students")}</div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("common.name")}</TableHead>
                <TableHead>{t("common.email")}</TableHead>
                <TableHead>{t("students.progress")}</TableHead>
                <TableHead className="w-24">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {group.students && group.students.length > 0 ? (
                group.students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>{student.full_name}</TableCell>
                    <TableCell>{student.email || "—"}</TableCell>
                    <TableCell>
                      {student.progress ? (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">
                              {student.progress.mastered_topics}/{student.progress.total_topics} {t("students.topicsMastered")}
                            </span>
                            <span className="text-muted-foreground">
                              {Math.round(student.progress.percentage)}%
                            </span>
                          </div>
                          <Progress value={student.progress.percentage} className="h-2" />
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
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
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    {t("studentGroups.noStudentsInGroup")}
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

