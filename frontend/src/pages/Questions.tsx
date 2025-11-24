import { useEffect, useState, useMemo } from "react";
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
import { fetchQuestions, fetchCourses, fetchModules, Question, Course, Module } from "@/lib/api";
import { QuestionTypeBadge } from "@/components/QuestionTypeBadge";

export default function Questions() {
  const { t } = useTranslation();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [selectedModule, setSelectedModule] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [qs, cs] = await Promise.all([
          fetchQuestions(),
          fetchCourses(),
        ]);
        setQuestions(qs);
        setCourses(cs);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("errors.failedToLoadQuestions"));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const loadModules = async () => {
      if (selectedCourse) {
        try {
          const mods = await fetchModules(selectedCourse);
          setModules(mods);
          setSelectedModule((current) => {
            if (current && !mods.some(m => m.id === current)) {
              return null;
            }
            return current;
          });
        } catch (e) {
          setError(e instanceof Error ? e.message : t("errors.failedToLoadModules"));
        }
      } else {
        setModules([]);
        setSelectedModule(null);
      }
    };
    loadModules();
  }, [selectedCourse]);

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (selectedCourse && q.course_name) {
        const course = courses.find(c => c.id === selectedCourse);
        if (!course || q.course_name !== course.name) return false;
      }
      if (selectedModule && q.module_name) {
        const module = modules.find(m => m.id === selectedModule);
        if (!module || q.module_name !== module.name) return false;
      }
      return true;
    });
  }, [questions, selectedCourse, selectedModule, courses, modules]);

  const handleRowClick = (question: Question) => {
    const typePath = question.question_type === 'multiple_choice' 
      ? 'multiple-choice' 
      : question.question_type === 'order'
      ? 'order'
      : question.question_type === 'connect'
      ? 'connect'
      : 'number';
    navigate(`/questions/${typePath}/${question.id}`);
  };

  if (loading) {
    return (
      <>
        <PageHeader>
          <PageHeaderHeading>{t("questions.questions")}</PageHeaderHeading>
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
          <PageHeaderHeading>Questions</PageHeaderHeading>
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
        <PageHeaderHeading>{t("questions.questions")}</PageHeaderHeading>
        <Button onClick={() => navigate("/questions/new")}>{t("questions.newQuestion")}</Button>
      </PageHeader>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-1">{t("questions.filterByCourse")}</label>
          <select
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={selectedCourse ?? ""}
            onChange={(e) => setSelectedCourse(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">{t("questions.allCourses")}</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t("questions.filterByModule")}</label>
          <select
            className="w-full rounded-md border px-3 py-2 text-sm disabled:opacity-50"
            value={selectedModule ?? ""}
            onChange={(e) => setSelectedModule(e.target.value ? Number(e.target.value) : null)}
            disabled={!selectedCourse || modules.length === 0}
          >
            <option value="">{t("questions.allModules")}</option>
            {modules.map((module) => (
              <option key={module.id} value={module.id}>
                {module.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("questions.question")}</TableHead>
              <TableHead>{t("materials.type")}</TableHead>
              <TableHead>{t("quizzes.course")}</TableHead>
              <TableHead>{t("quizzes.module")}</TableHead>
              <TableHead>{t("materials.topics")}</TableHead>
              <TableHead>{t("questions.options")}</TableHead>
              <TableHead className="w-24">{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredQuestions.map((question) => (
              <TableRow
                key={`${question.question_type}:${question.id}`}
                onClick={() => handleRowClick(question)}
                className="cursor-pointer"
              >
                <TableCell className="max-w-[400px] truncate">{question.text}</TableCell>
                <TableCell>
                  <QuestionTypeBadge questionType={question.question_type} />
                </TableCell>
                <TableCell>{question.course_name ?? "—"}</TableCell>
                <TableCell>{question.module_name ?? "—"}</TableCell>
                <TableCell>{question.topic_name ?? "—"}</TableCell>
                <TableCell>
                  {question.question_type === 'multiple_choice' 
                    ? (question as any).options_count || 0
                    : question.question_type === 'order'
                    ? (question as any).order_options_count || 0
                    : question.question_type === 'connect'
                    ? (question as any).connect_options_count || 0
                    : 0}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const typePath = question.question_type === 'multiple_choice' 
                        ? 'multiple-choice' 
                        : question.question_type === 'order'
                        ? 'order'
                        : question.question_type === 'connect'
                        ? 'connect'
                        : 'number';
                      navigate(`/questions/${typePath}/${question.id}`);
                    }}
                    >
                    {t("common.view")}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
