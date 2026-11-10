import ChatWorkspace from "@/src/components/customer/ChatWorkspace";
export default async function CustomerChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ChatWorkspace id={id} role="customer" />;
}
