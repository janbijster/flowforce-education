import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import { fetchMaterial, MaterialDetail } from "@/lib/api";

export default function MaterialView() {
  const { t } = useTranslation();
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
        setError(err instanceof Error ? err.message : t("errors.failedToLoadMaterial"));
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
          <PageHeaderHeading>{t("materials.materialDetails")}</PageHeaderHeading>
        </PageHeader>
        <div className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">{t("common.loading")}</p>
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
          <p className="text-destructive">{error || t("errors.materialNotFound")}</p>
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
            {t("materials.backToOverview")}
          </Button>
          <Button variant="outline" onClick={() => navigate(`/materials/${material.id}/edit`)}>
            {t("common.edit")}
          </Button>
          {material.file_url && (
            <Button onClick={handleDownload}>
              {t("common.download")}
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
                <TableHead className="w-48">{t("materials.title")}</TableHead>
                <TableCell className="font-medium">{material.title}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead>{t("materials.type")}</TableHead>
                <TableCell className="capitalize">{material.material_type}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead>{t("materials.description")}</TableHead>
                <TableCell>{material.description || "-"}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead>{t("common.order")}</TableHead>
                <TableCell>{material.order}</TableCell>
              </TableRow>
              {material.material_type === 'presentation' && material.slide_count && (
                <TableRow>
                  <TableHead>{t("materials.slideCount")}</TableHead>
                  <TableCell>{material.slide_count}</TableCell>
                </TableRow>
              )}
              <TableRow>
                <TableHead>{t("common.created")}</TableHead>
                <TableCell>{new Date(material.created_at).toLocaleString()}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead>{t("common.lastUpdated")}</TableHead>
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
                  <TableHead className="w-48">{t("materials.course")}</TableHead>
                  <TableCell>{material.course_name}</TableCell>
                </TableRow>
              )}
              {material.modules_names.length > 0 && (
                <TableRow>
                  <TableHead>{t("materials.modules")}</TableHead>
                  <TableCell>{material.modules_names.join(", ")}</TableCell>
                </TableRow>
              )}
              {material.lessons_names.length > 0 && (
                <TableRow>
                  <TableHead>{t("materials.lessons")}</TableHead>
                  <TableCell>{material.lessons_names.join(", ")}</TableCell>
                </TableRow>
              )}
              {material.topics_names.length > 0 && (
                <TableRow>
                  <TableHead>{t("materials.topics")}</TableHead>
                  <TableCell>{material.topics_names.join(", ")}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* File */}
        {material.file_url && (
          <div className="rounded-md border p-4">
            <h3 className="font-semibold mb-2">{t("materials.file")}</h3>
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
                {t("common.download")}
              </Button>
            </div>
          </div>
        )}

        {/* Rich Text Content */}
        {material.content && (
          <div className="rounded-md border p-4">
            <h3 className="font-semibold mb-2">{t("materials.content")}</h3>
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

