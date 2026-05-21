import { DashboardPage } from "@/modules/dashboard/dashboard-page";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default function Page(props: PageProps) {
  return <DashboardPage searchParams={props.searchParams} />;
}
