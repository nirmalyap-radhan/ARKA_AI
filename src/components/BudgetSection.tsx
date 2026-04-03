import { Hotel, Utensils, Bus, Ticket, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface BudgetItem {
  label: string;
  amount: number;
  icon: React.ElementType;
  color: string;
}

interface BudgetSectionProps {
  totalBudget: number;
}

const BudgetSection = ({ totalBudget }: BudgetSectionProps) => {
  const items: BudgetItem[] = [
    { label: "Accommodation", amount: Math.round(totalBudget * 0.35), icon: Hotel, color: "bg-primary" },
    { label: "Food & Dining", amount: Math.round(totalBudget * 0.25), icon: Utensils, color: "bg-secondary" },
    { label: "Transport", amount: Math.round(totalBudget * 0.2), icon: Bus, color: "bg-accent" },
    { label: "Activities", amount: Math.round(totalBudget * 0.2), icon: Ticket, color: "bg-primary/60" },
  ];

  const totalSpent = items.reduce((a, b) => a + b.amount, 0);

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display text-xl">
          <DollarSign className="h-5 w-5 text-primary" /> Budget Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {items.map((item) => (
          <div key={item.label} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-body font-medium">
                <item.icon className="h-4 w-4 text-muted-foreground" /> {item.label}
              </span>
              <span className="text-sm font-body font-semibold">${item.amount.toLocaleString()}</span>
            </div>
            <Progress value={(item.amount / totalBudget) * 100} className="h-2" />
          </div>
        ))}
        <div className="flex items-center justify-between border-t pt-3">
          <span className="font-body font-semibold">Total</span>
          <span className="font-display text-lg font-bold text-primary">${totalSpent.toLocaleString()}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default BudgetSection;
