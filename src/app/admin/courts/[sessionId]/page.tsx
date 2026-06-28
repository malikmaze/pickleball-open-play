import { redirect } from "next/navigation";

export default async function AdminCourtsRedirect({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  redirect(`/admin/sessions/${sessionId}/courts`);
}
