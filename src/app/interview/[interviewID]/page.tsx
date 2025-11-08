"use client";

import VoiceAssistantV2 from "@/lib/VoiceAssistant/VoiceAssistantV2";
import { useParams } from "next/navigation";
import { useEffect } from "react";

export default function InterviewPage() {
  const params = useParams();
  const interviewID = params.interviewID as string;

  useEffect(() => {
    if (!localStorage.user) {
      window.location.href = "/job-portal";
    }
  }, []);

  return (
    <>
      <VoiceAssistantV2 interviewID={interviewID} />
    </>
  );
}
