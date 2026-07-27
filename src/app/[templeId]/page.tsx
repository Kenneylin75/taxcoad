import React from "react";
import { notFound } from "next/navigation";
import GuestAppClient from "./GuestAppClient";
import { getTempleBasicInfo } from "@/app/actions";

// Protect the route against automated PHP vulnerability scans and bot probes.
// This prevents Next.js from initializing session cookies for these bad requests.
const BOT_PATTERNS = [
  /\.php\d?$/i,
  /\.asp(x)?$/i,
  /\.cgi$/i,
  /\.env$/i,
  /\.bak$/i,
  /\.zip$/i,
  /^wp-admin/i,
  /^wp-login\.php/i,
  /^wp-signup\.php/i,
  /^xmlrpc\.php/i,
  /^config\.php/i,
  /^readme\.php/i,
  /^admin\.php/i,
  /^system\.php/i,
  /^ge\.php/i,
  /^mar\.php/i,
];

function isBotScan(templeId: string): boolean {
  return BOT_PATTERNS.some((pattern) => pattern.test(templeId));
}

export default async function TempleGuestPage({ params }: { params: Promise<{ templeId: string }> | { templeId: string } }) {
  // Await the params if it's a promise (Next.js 13+ app router best practice)
  const resolvedParams = await params;
  const templeId = resolvedParams.templeId;
  
  // 1. Route Protection: Reject known bot probes before any session or database logic
  if (isBotScan(templeId)) {
    console.warn(`[templeId] bot scan blocked: ${templeId}`);
    return notFound();
  }
  
  console.log("[templeId] page triggered with templeId:", templeId);
  
  // 2. We NO LONGER call await setGuestTempleContext(templeId) here.
  // Next.js strictly forbids modifying cookies in Server Components during render.
  // Cookie setting is now delegated to the GuestAppClient via useEffect.

  const templeInfo = await getTempleBasicInfo(templeId);
  return <GuestAppClient templeId={templeId} templeInfo={templeInfo} />;
}
