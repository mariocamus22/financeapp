import { DashboardHome } from "@/components/pages/dashboard-home";

export default function HomePage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Inicio</h1>
        <p className="text-sm text-muted-foreground">
          Tu posición financiera al instante.
        </p>
      </header>
      <DashboardHome />
    </div>
  );
}
