import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ALYSSA CYBER — أليسا" },
      { name: "description", content: "أليسا، مساعد عبدالله على تيليجرام." },
      { property: "og:title", content: "ALYSSA CYBER — أليسا" },
      { property: "og:description", content: "أليسا، مساعد عبدالله على تيليجرام." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background text-foreground">
      <h1 className="text-4xl font-bold">ALYSSA CYBER</h1>
      <a className="text-primary underline underline-offset-4" href="https://t.me/hsjxnnsxbot">أليسا على تيليجرام ↗</a>
    </main>
  );
}
