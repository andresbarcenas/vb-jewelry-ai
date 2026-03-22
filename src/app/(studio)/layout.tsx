import { StudioShell } from "@/components/layout/studio-shell";
import { StudioDataProvider } from "@/lib/studio-data-provider";

export default function StudioLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <StudioDataProvider>
      <StudioShell>{children}</StudioShell>
    </StudioDataProvider>
  );
}
