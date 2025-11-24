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
import { fetchCourses, fetchMaterials, Course, Material } from "@/lib/api";

export default function MaterialsBase() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const data = await fetchCourses();
        setCourses(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load courses");
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      const loadMaterials = async () => {
        try {
          setLoading(true);
          const data = await fetchMaterials({ course: selectedCourse });
          setMaterials(data);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to load materials");
        } finally {
          setLoading(false);
        }
      };

      loadMaterials();
    } else {
      setMaterials([]);
    }
  }, [selectedCourse]);

  const handleRowClick = (id: number) => {
    navigate(`/materials/${id}`);
  };

  if (loading && courses.length === 0) {
    return (
      <>
        <PageHeader>
          <PageHeaderHeading>Learning Materials</PageHeaderHeading>
        </PageHeader>
        <div className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </>
    );
  }

  if (error && courses.length === 0) {
    return (
      <>
        <PageHeader>
          <PageHeaderHeading>Learning Materials</PageHeaderHeading>
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
        <PageHeaderHeading>Learning Materials</PageHeaderHeading>
      </PageHeader>
      
      <div className="space-y-4">
        <div className="flex gap-4 items-center">
          <label htmlFor="course-select" className="text-sm font-medium">
            Select Course:
          </label>
          <select
            id="course-select"
            value={selectedCourse || ""}
            onChange={(e) => setSelectedCourse(e.target.value ? Number(e.target.value) : null)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="">-- Select a course --</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>
        </div>

        {selectedCourse && (
          <>
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <p className="text-muted-foreground">Loading materials...</p>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center p-8">
                <p className="text-destructive">{error}</p>
              </div>
            ) : materials.length === 0 ? (
              <div className="flex items-center justify-center p-8">
                <p className="text-muted-foreground">No materials found for this course.</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Modules</TableHead>
                      <TableHead>Lessons</TableHead>
                      <TableHead>Topics</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {materials.map((material) => (
                      <TableRow
                        key={material.id}
                        onClick={() => handleRowClick(material.id)}
                        className="cursor-pointer"
                      >
                        <TableCell className="font-medium">{material.title}</TableCell>
                        <TableCell>
                          <span className="capitalize">{material.material_type}</span>
                        </TableCell>
                        <TableCell>
                          {material.modules_names.length > 0
                            ? material.modules_names.join(", ")
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {material.lessons_names.length > 0
                            ? material.lessons_names.join(", ")
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {material.topics_names.length > 0
                            ? material.topics_names.join(", ")
                            : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

