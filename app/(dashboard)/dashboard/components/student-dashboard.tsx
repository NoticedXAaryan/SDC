import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { CheckCircle2, Circle, Clock, QrCode, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function StudentDashboard({ user, myRegistrations, myApplication }: any) {
  return (
    <div className="space-y-6">
      
      {/* 1. Up Next Card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2"><Clock className="w-5 h-5" /> Up Next</CardTitle>
          <CardDescription>Your pending actions and upcoming events</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {myRegistrations.length === 0 ? (
            <p className="text-sm text-muted-foreground">You are all caught up!</p>
          ) : (
            myRegistrations.map((reg: any) => (
              <div key={reg.eventId} className="flex justify-between items-center bg-white dark:bg-zinc-900 p-3 rounded-lg border">
                <div>
                  <p className="font-semibold text-sm">{reg.eventTitle}</p>
                  <p className="text-xs text-muted-foreground">Upcoming Event</p>
                </div>
                <Link href={`/passes/${reg.eventId}`} className="flex items-center gap-2 text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-md hover:bg-primary/20 transition">
                  <QrCode className="w-4 h-4" /> Open pass
                </Link>
              </div>
            ))
          )}
          {/* Mock pending form to show concept */}
          <div className="flex justify-between items-center bg-white dark:bg-zinc-900 p-3 rounded-lg border">
            <div>
              <p className="font-semibold text-sm">Post-Event Feedback</p>
              <p className="text-xs text-muted-foreground">Missing Info</p>
            </div>
            <Link href={`/forms/feedback`} className="flex items-center gap-2 text-xs font-medium text-amber-600 bg-amber-100 dark:bg-amber-900/30 px-3 py-1.5 rounded-md hover:bg-amber-200 transition">
              <FileText className="w-4 h-4" /> Fill Form
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 2. My Applications Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>My Applications</CardTitle>
            <CardDescription>Current recruitment cycle status</CardDescription>
          </CardHeader>
          <CardContent>
            {myApplication ? (
              <div className="relative border-l border-muted ml-3 space-y-6">
                <div className="relative pl-6">
                  <div className="absolute -left-[9px] top-1 bg-background"><CheckCircle2 className="w-5 h-5 text-primary bg-background" /></div>
                  <h4 className="font-semibold text-sm">Applied</h4>
                  <p className="text-xs text-muted-foreground">Application submitted</p>
                </div>
                <div className="relative pl-6">
                  <div className="absolute -left-[9px] top-1 bg-background">
                    {myApplication.status === "pending" ? <Circle className="w-5 h-5 text-muted-foreground fill-background" /> : <CheckCircle2 className="w-5 h-5 text-primary bg-background" />}
                  </div>
                  <h4 className="font-semibold text-sm">Online Assessment (OA)</h4>
                  <p className="text-xs text-muted-foreground">{myApplication.status === "pending" ? "Pending review" : "Completed"}</p>
                </div>
                <div className="relative pl-6">
                  <div className="absolute -left-[9px] top-1 bg-background"><Circle className="w-5 h-5 text-muted-foreground fill-background" /></div>
                  <h4 className="font-semibold text-sm">Interview</h4>
                  <p className="text-xs text-muted-foreground">Not scheduled</p>
                </div>
                <div className="relative pl-6">
                  <div className="absolute -left-[9px] top-1 bg-background"><Circle className="w-5 h-5 text-muted-foreground fill-background" /></div>
                  <h4 className="font-semibold text-sm">Result</h4>
                  <p className="text-xs text-muted-foreground">TBD</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground text-sm">
                No active applications. <Link href="/apply" className="text-primary hover:underline">Apply now</Link>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* 3. My Kit Card (ID Card Layout) */}
          <Card className="overflow-hidden relative bg-gradient-to-br from-zinc-900 to-black text-white border-zinc-800">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <QrCode className="w-24 h-24" />
            </div>
            <CardContent className="p-6 relative z-10">
              <Badge variant="outline" className="bg-white/10 text-zinc-300 border-zinc-700 mb-4">Member ID</Badge>
              <h3 className="text-2xl font-bold">{user.name}</h3>
              <p className="text-zinc-400 mb-4">@{user.username || "student"}</p>
              
              <div className="flex gap-4 text-sm mt-6">
                <div>
                  <p className="text-zinc-500 text-xs">Role</p>
                  <p className="font-medium capitalize">{user.role}</p>
                </div>
                <div>
                  <p className="text-zinc-500 text-xs">Joined</p>
                  <p className="font-medium">2026</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 4. Certificate Wallet Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Certificate Wallet</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex overflow-x-auto gap-4 pb-2 snap-x">
                {/* Mock certificates for visual slider */}
                {[1, 2, 3].map((i) => (
                  <Link href="/certificates" key={i} className="min-w-[200px] snap-center block">
                    <div className="aspect-[1.4/1] bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-900/20 border rounded-lg p-4 flex flex-col justify-between hover:shadow-md transition">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold truncate">Workshop {i}</p>
                        <p className="text-xs text-muted-foreground">Issued 2026</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

