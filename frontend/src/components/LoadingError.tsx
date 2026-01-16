import { useTranslation } from "react-i18next";
import { PageHeader, PageHeaderHeading } from "@/components/page-header";

interface LoadingErrorProps {
  loading: boolean;
  error: string | null;
  title: string;
  children: React.ReactNode;
}

export function LoadingError({ loading, error, title, children }: LoadingErrorProps) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <>
        <PageHeader>
          <PageHeaderHeading>{title}</PageHeaderHeading>
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
          <PageHeaderHeading>{title}</PageHeaderHeading>
        </PageHeader>
        <div className="flex items-center justify-center p-8">
          <p className="text-destructive">{error}</p>
        </div>
      </>
    );
  }

  return <>{children}</>;
}
