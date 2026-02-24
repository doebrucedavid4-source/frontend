import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  DISPONIBLE: "bg-success/10 text-success border-success/20",
  EMPRUNTE: "bg-warning/10 text-warning border-warning/20",
  EN_RESERVATION: "bg-info/10 text-info border-info/20",
  PERDU: "bg-destructive/10 text-destructive border-destructive/20",
  HS: "bg-muted text-muted-foreground border-border",
  EN_ATTENTE: "bg-warning/10 text-warning border-warning/20",
  PRETE_A_RETIRER: "bg-info/10 text-info border-info/20",
  ANNULEE: "bg-muted text-muted-foreground border-border",
  EXPIREE: "bg-destructive/10 text-destructive border-destructive/20",
  HONOREE: "bg-success/10 text-success border-success/20",
  IMPAYEE: "bg-destructive/10 text-destructive border-destructive/20",
  PAYEE: "bg-success/10 text-success border-success/20",
  BIBLIOTHECAIRE: "bg-primary/10 text-primary border-primary/20",
  ADMIN: "bg-violet-500/10 text-violet-700 border-violet-500/20",
  ADHERENT: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  active: "bg-success/10 text-success border-success/20",
  inactive: "bg-destructive/10 text-destructive border-destructive/20",
  retard: "bg-destructive/10 text-destructive border-destructive/20",
};

const statusLabels: Record<string, string> = {
  DISPONIBLE: "Disponible",
  EMPRUNTE: "Emprunté",
  EN_RESERVATION: "En réservation",
  PERDU: "Perdu",
  HS: "Hors service",
  EN_ATTENTE: "En attente",
  PRETE_A_RETIRER: "Prête à retirer",
  ANNULEE: "Annulée",
  EXPIREE: "Expirée",
  HONOREE: "Honorée",
  IMPAYEE: "Impayée",
  PAYEE: "Payée",
  BIBLIOTHECAIRE: "Bibliothécaire",
  ADMIN: "Admin",
  ADHERENT: "Adhérent",
  active: "Actif",
  inactive: "Inactif",
  retard: "En retard",
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        statusStyles[status] || "bg-muted text-muted-foreground border-border",
        className
      )}
    >
      {statusLabels[status] || status}
    </span>
  );
}

