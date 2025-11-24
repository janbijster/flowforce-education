import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import { fetchMaterial, MaterialDetail } from "@/lib/api";

export default function MaterialView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [material, setMaterial] = useState<MaterialDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const loadMaterial = async () => {
      try {
        const data = await fetchMaterial(Number(id));
        setMaterial(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load material");
      } finally {
        setLoading(false);
      }
    };

    loadMaterial();
  }, [id]);

  const handleDownload = () => {
    if (material?.file_url) {
      window.open(material.file_url, '_blank');
    }
  };

  if (loading) {
    return (
      <>
        <PageHeader>
          <PageHeaderHeading>Material Details</PageHeaderHeading>
        </PageHeader>
        <div className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </>
    );
  }

  if (error || !material) {
    return (
      <>
        <PageHeader>
          <PageHeaderHeading>Material Details</PageHeaderHeading>
        </PageHeader>
        <div className="flex items-center justify-center p-8">
          <p className="text-destructive">{error || "Material not found"}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader>
        <PageHeaderHeading>{material.title}</PageHeaderHeading>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/materials/overview")}>
            Back to Overview
          </Button>
          <Button variant="outline" onClick={() => navigate(`/materials/${material.id}/edit`)}>
            Edit
          </Button>
          {material.file_url && (
            <Button onClick={handleDownload}>
              Download
            </Button>
          )}
        </div>
      </PageHeader>

      <div className="space-y-6">
        {/* Basic Information */}
        <div className="rounded-md border">
          <Table>
            <TableBody>
              <TableRow>
                <TableHead className="w-48">Title</TableHead>
                <TableCell className="font-medium">{material.title}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableCell className="capitalize">{material.material_type}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableCell>{material.description || "-"}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableCell>{material.order}</TableCell>
              </TableRow>
              {material.material_type === 'presentation' && material.slide_count && (
                <TableRow>
                  <TableHead>Slide Count</TableHead>
                  <TableCell>{material.slide_count}</TableCell>
                </TableRow>
              )}
              <TableRow>
                <TableHead>Created</TableHead>
                <TableCell>{new Date(material.created_at).toLocaleString()}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead>Last Updated</TableHead>
                <TableCell>{new Date(material.updated_at).toLocaleString()}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Course Hierarchy */}
        <div className="rounded-md border">
          <Table>
            <TableBody>
              {material.course_name && (
                <TableRow>
                  <TableHead className="w-48">Course</TableHead>
                  <TableCell>{material.course_name}</TableCell>
                </TableRow>
              )}
              {material.modules_names.length > 0 && (
                <TableRow>
                  <TableHead>Modules</TableHead>
                  <TableCell>{material.modules_names.join(", ")}</TableCell>
                </TableRow>
              )}
              {material.lessons_names.length > 0 && (
                <TableRow>
                  <TableHead>Lessons</TableHead>
                  <TableCell>{material.lessons_names.join(", ")}</TableCell>
                </TableRow>
              )}
              {material.topics_names.length > 0 && (
                <TableRow>
                  <TableHead>Topics</TableHead>
                  <TableCell>{material.topics_names.join(", ")}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* File */}
        {material.file_url && (
          <div className="rounded-md border p-4">
            <h3 className="font-semibold mb-2">File</h3>
            <div className="flex items-center gap-4">
              <a
                href={material.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {material.file_url}
              </a>
              <Button size="sm" onClick={handleDownload}>
                Download
              </Button>
            </div>
          </div>
        )}

        {/* Rich Text Content */}
        {material.content && (
          <div className="rounded-md border p-4">
            <h3 className="font-semibold mb-2">Content</h3>
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: material.content }}
            />
          </div>
        )}
      </div>
    </>
  );
}

