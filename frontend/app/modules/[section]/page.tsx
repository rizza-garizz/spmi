import { ModuleSectionLanding } from "@/components/modules/module-page-header";

export default async function ModuleSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;

  return <ModuleSectionLanding sectionId={section} />;
}
