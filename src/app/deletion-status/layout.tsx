import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Data Deletion Status | DmBroo",
  description: "Check the status of your data deletion request.",
  robots: "noindex, nofollow", // Keeps this out of search results
};

export default function DeletionStatusLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
