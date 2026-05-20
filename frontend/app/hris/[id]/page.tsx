import { HrisEmployeeDetailPage } from "@/modules/hris/hris-employee-detail-page";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <HrisEmployeeDetailPage employeeId={id} />;
}
