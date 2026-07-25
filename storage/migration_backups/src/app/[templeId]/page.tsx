import React from "react";
import GuestAppClient from "./GuestAppClient";
import { setGuestTempleContext, getTempleBasicInfo } from "@/app/actions";

export default async function TempleGuestPage({ params }: { params: Promise<{ templeId: string }> | { templeId: string } }) {
  // Await the params if it's a promise (Next.js 13+ app router best practice)
  const resolvedParams = await params;
  const templeId = resolvedParams.templeId;
  console.log("[templeId] page triggered with templeId:", templeId);
  
  // Set the secure context for this temple's guest session
  await setGuestTempleContext(templeId);

  const templeInfo = await getTempleBasicInfo(templeId);
  return <GuestAppClient templeId={templeId} templeInfo={templeInfo} />;
}
