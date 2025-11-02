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
import { fetchStudentGroups, fetchCourses, StudentGroup, Course } from "@/lib/api";

export default function StudentGroups() {
  const [studentGroups, setStudentGroups] = useState<StudentGroup[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [groups, cs] = await Promise.all([
          fetchStudentGroups(),
          fetchCourses(),
        ]);
        setStudentGroups(groups);
        setCourses(cs);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load student groups");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const loadGroups = async () => {
      try {
        const groups = await fetchStudentGroups(selectedCourse || undefined);
        setStudentGroups(groups);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load student groups");
      }
    };
    loadGroups();
  }, [selectedCourse]);

  const handleRowClick = (id: number) => {
    navigate(`/student-groups/${id}`);
  };

  if (loading) {
    return (
      <>
        <PageHeader>
          <PageHeaderHeading>Student Groups</PageHeaderHeading>
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
          <PageHeaderHeading>Student Groups</PageHeaderHeading>
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
        <PageHeaderHeading>Student Groups</PageHeaderHeading>
        <Button onClick={() => navigate("/student-groups/new")}>New Student Group</Button>
      </PageHeader>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Filter by Course</label>
        <select
          className="w-full max-w-xs rounded-md border px-3 py-2 text-sm"
          value={selectedCourse ?? ""}
          onChange={(e) => setSelectedCourse(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">All Courses</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.name}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Module</TableHead>
              <TableHead>Year</TableHead>
              <TableHead>Students</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {studentGroups.map((group) => (
              <TableRow
                key={group.id}
                onClick={() => handleRowClick(group.id)}
                className="cursor-pointer"
              >
                <TableCell className="font-medium">{group.name}</TableCell>
                <TableCell>{group.course_name}</TableCell>
                <TableCell>{group.module_name ?? "—"}</TableCell>
                <TableCell>{group.year}</TableCell>
                <TableCell>{group.students_count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

