import { redirect } from "next/navigation";

export default function BudgetRedirectPage() {
  redirect("/finance?tab=budgets");
}
