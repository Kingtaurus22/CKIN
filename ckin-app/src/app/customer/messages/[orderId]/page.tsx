import type { Metadata } from "next";
import { Suspense } from "react";
import MessagesWorkspace from "@/src/components/chat/MessagesWorkspace";
import PageFallback from "@/src/components/ui/PageFallback";

export const instant = false;

export const metadata: Metadata = { title: "Pesan" };

type Props = { params: Promise<{ orderId: string }> };

async function Content({ params }: Props) {
  const { orderId } = await params;
  return <MessagesWorkspace orderId={orderId} />;
}

export default function CustomerConversationPage({ params }: Props) {
  return (
    <Suspense fallback={<PageFallback />}>
      <Content params={params} />
    </Suspense>
  );
}
