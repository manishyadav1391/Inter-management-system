"use client";
import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import ReduxProvider from "@/app/store/ReduxProvider";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthSessionProvider>
      <ReduxProvider>{children}</ReduxProvider>
    </NextAuthSessionProvider>
  );
}