import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Shield, Activity, Bell, FileText, Package, DollarSign, Sparkles, ServerCrash, TerminalSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminDashboard({ user, managementStats, upcomingEvents, insights = [] }: any) {
  return (
    <div className="space-y-6">
      
      {/* 1. Master Command Center (System Health, Global KPIs) */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-zinc-900 text-white border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-300">System Health</CardTitle>
            <Activity className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">99.9%</div>
            <p className="text-xs text-zinc-400 mt-1">All services operational</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Club Members</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{managementStats?.totalMembers || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Total verified accounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Global Registrations</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{managementStats?.totalRegistrations || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all active forms</p>
          </CardContent>
        </Card>
        <Card className="bg-destructive/5 border-destructive/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-destructive">Pending Approvals</CardTitle>
            <Bell className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">8</div>
            <p className="text-xs text-destructive/80 mt-1">Requires admin review</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          
          {/* 4. AI Insights Panel */}
          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                <Sparkles className="w-5 h-5" /> AI Insights Panel
              </CardTitle>
              <CardDescription>Auto-generated summaries of club activity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {insights.length === 0 ? (
                <div className="p-4 bg-white/60 dark:bg-black/20 rounded-lg border border-blue-100 dark:border-blue-900">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-300">Recruitment Velocity Drop</p>
                  <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">Application submissions have dropped by 40% in the last 48 hours compared to previous cycle.</p>
                </div>
              ) : (
                insights.map((insight: any) => (
                  <div key={insight.id} className="p-4 bg-white/60 dark:bg-black/20 rounded-lg border border-blue-100 dark:border-blue-900">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-300">{insight.title}</h4>
                      {insight.metricTrend && (
                        <span className={`text-xs font-medium px-2 py-1 rounded bg-white dark:bg-black border ${insight.metricTrend.startsWith('+') ? 'text-green-600' : insight.metricTrend.startsWith('-') ? 'text-red-600' : 'text-muted-foreground'}`}>
                          {insight.metricTrend}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-blue-700 dark:text-blue-400">{insight.description}</p>
                    {insight.isActionable && insight.actionLink && (
                      <Link href={insight.actionLink} className="text-xs text-blue-600 hover:underline mt-2 inline-block font-medium">
                        Take Action →
                      </Link>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* 3. Recent Audit Logs */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Audit Logs</CardTitle>
                <CardDescription>Real-time system activity stream</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/audit"><TerminalSquare className="w-4 h-4 mr-2" /> View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4 items-start text-sm border-b pb-3">
                  <div className="bg-zinc-100 dark:bg-zinc-800 text-xs font-mono px-2 py-1 rounded text-zinc-500">10:42 AM</div>
                  <div>
                    <p className="font-medium">Finance Expense Approved</p>
                    <p className="text-xs text-muted-foreground">Admin @aaryan approved expense EXP-2042 for $250.00.</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start text-sm border-b pb-3">
                  <div className="bg-zinc-100 dark:bg-zinc-800 text-xs font-mono px-2 py-1 rounded text-zinc-500">09:15 AM</div>
                  <div>
                    <p className="font-medium text-destructive">Certificate Revoked</p>
                    <p className="text-xs text-muted-foreground">Admin @john revoked certificate CERT-9912 (Plagiarism).</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start text-sm border-b pb-3">
                  <div className="bg-zinc-100 dark:bg-zinc-800 text-xs font-mono px-2 py-1 rounded text-zinc-500">Yesterday</div>
                  <div>
                    <p className="font-medium">Role Updated</p>
                    <p className="text-xs text-muted-foreground">System auto-promoted @sarah to Member.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* 2. Finance & Inventory Snapshot */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Finance Snapshot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-900 p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 text-green-700 p-2 rounded-full"><DollarSign className="w-4 h-4" /></div>
                  <div>
                    <p className="font-semibold text-sm">Budget Remaining</p>
                    <p className="text-xs text-muted-foreground">Q3 Allocation</p>
                  </div>
                </div>
                <span className="font-bold font-mono">$4,250</span>
              </div>
              
              <div className="pt-2">
                <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Pending Approvals</h4>
                <div className="space-y-2 flex flex-col">
                  <Link href="/admin/finance" className="text-sm flex justify-between p-2 hover:bg-muted rounded-md transition">
                    <span>Venue Booking</span>
                    <span className="font-medium text-amber-600">$500</span>
                  </Link>
                  <Link href="/admin/finance" className="text-sm flex justify-between p-2 hover:bg-muted rounded-md transition">
                    <span>Marketing Materials</span>
                    <span className="font-medium text-amber-600">$150</span>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Inventory Alerts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between border-l-2 border-amber-500 pl-3">
                <div>
                  <p className="text-sm font-medium">Club T-Shirts (M)</p>
                  <p className="text-xs text-muted-foreground">Low stock warning</p>
                </div>
                <div className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded">5 left</div>
              </div>
              <div className="flex items-center justify-between border-l-2 border-red-500 pl-3">
                <div>
                  <p className="text-sm font-medium">Lanyards</p>
                  <p className="text-xs text-muted-foreground">Out of stock</p>
                </div>
                <div className="bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded">0 left</div>
              </div>
              <Button variant="outline" className="w-full mt-2 text-xs" asChild>
                <Link href="/admin/inventory"><Package className="w-3 h-3 mr-2" /> Manage Inventory</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
