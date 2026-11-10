import ChatWorkspace from "@/src/components/customer/ChatWorkspace";
export default async function SurveyorChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ChatWorkspace id={id} role="surveyor" />;
}
