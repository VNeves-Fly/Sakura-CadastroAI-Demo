import { getApiDocSpec } from "@/modules/shared/infrastructure/swagger/swagger-spec";
import { ApiDocViewer } from "@/modules/shared/components/api-doc-viewer";

export default function ApiDocsPage() {
  const spec = getApiDocSpec();

  return <ApiDocViewer spec={spec} />;
}
