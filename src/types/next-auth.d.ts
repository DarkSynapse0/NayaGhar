import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "tenant" | "landlord" | "admin";
      phone: string;
    } & DefaultSession["user"];
  }
}
