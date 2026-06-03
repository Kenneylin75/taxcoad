import React from "react";
import GuestAppClient from "../GuestAppClient";
import { setGuestTempleContext } from "@/app/actions";

export default async function TempleGuestLoginPage({ params }: { params: Promise<{ templeId: string }> | { templeId: string } }) {
  // Await the params if it's a promise (Next.js 13+ app router best practice)
  const resolvedParams = await params;
  const templeId = resolvedParams.templeId;
  
  // Set the secure context for this temple's guest session
  await setGuestTempleContext(templeId);

  return <GuestAppClient templeId={templeId} forceLogin={true} />;
}
