"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import AnnouncementFeed from "@saaf/ui/institutional/AnnouncementFeed";

export default function CitizenAnnouncementFeed() {
  const { isLoaded, isSignedIn, getToken, userId } = useAuth();
  const [sessionToken, setSessionToken] = useState<{ userId: string; token: string }>();
  useEffect(() => {
    let active = true;
    if (isLoaded && isSignedIn && userId) void getToken().then(value => { if (active && value) setSessionToken({ userId, token: value }); }).catch(() => undefined);
    return () => { active = false; };
  }, [getToken, isLoaded, isSignedIn, userId]);
  const token = isLoaded && isSignedIn && sessionToken?.userId === userId ? sessionToken.token : undefined;
  return <AnnouncementFeed audience="citizen" token={token}/>;
}
