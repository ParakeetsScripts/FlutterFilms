"use client";

import { AmbientField } from "@/components/cinematic/AmbientField";
import { CinematicDebug } from "@/components/cinematic/CinematicDebug";
import { CursorField } from "@/components/cinematic/CursorField";
import { MotionProvider } from "@/components/cinematic/MotionProvider";
import { SharedTransitionProvider } from "@/components/cinematic/SharedTransition";
import type { ReactNode } from "react";

export function CinematicRoot({ children }: { children: ReactNode }) {
  return (
    <MotionProvider>
      <SharedTransitionProvider>
        <AmbientField />
        {children}
        <CursorField />
        <CinematicDebug />
      </SharedTransitionProvider>
    </MotionProvider>
  );
}
