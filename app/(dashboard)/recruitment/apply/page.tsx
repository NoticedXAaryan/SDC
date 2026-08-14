"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export default function RecruitmentApplyPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    domain: "",
    answers: {
      whyJoin: "",
      experience: "",
      portfolio: ""
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.domain) {
      toast.error("Please select a domain to apply for");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit application");
      }
      
      toast.success("Application submitted successfully!");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Apply for the Club</CardTitle>
          <CardDescription>
            Join our core team. We are looking for passionate individuals who want to build, learn, and grow.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Which domain are you applying for?</label>
              <Select value={formData.domain} onValueChange={(v) => setFormData({...formData, domain: v || ""})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a domain" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical">Technical / Development</SelectItem>
                  <SelectItem value="design">UI/UX Design</SelectItem>
                  <SelectItem value="marketing">Marketing & PR</SelectItem>
                  <SelectItem value="content">Content Writing</SelectItem>
                  <SelectItem value="management">Event Management</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Why do you want to join us?</label>
              <Textarea 
                required
                placeholder="Tell us about your motivation..."
                value={formData.answers.whyJoin}
                onChange={(e) => setFormData({...formData, answers: {...formData.answers, whyJoin: e.target.value}})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">What relevant experience do you have?</label>
              <Textarea 
                required
                placeholder="Languages, frameworks, past roles, etc."
                value={formData.answers.experience}
                onChange={(e) => setFormData({...formData, answers: {...formData.answers, experience: e.target.value}})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Portfolio / GitHub / Resume Link (Optional)</label>
              <Input 
                type="url"
                placeholder="https://github.com/yourusername"
                value={formData.answers.portfolio}
                onChange={(e) => setFormData({...formData, answers: {...formData.answers, portfolio: e.target.value}})}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Submit Application
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
