import type { Metadata } from "next";
import MessagesWorkspace from "@/src/components/chat/MessagesWorkspace";

export const metadata: Metadata = { title: "Pesan" };

export default function SurveyorMessagesPage() {
  return <MessagesWorkspace />;
}
