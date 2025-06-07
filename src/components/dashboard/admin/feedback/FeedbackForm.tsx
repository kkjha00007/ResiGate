import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ClipboardEdit, Send, Bug, Lightbulb, MessageCircle } from "lucide-react";

interface FeedbackFormProps {
  onSubmit: () => void;
  hideHeader?: boolean;
}

const FeedbackForm = ({ onSubmit, hideHeader }: FeedbackFormProps) => {
  const [type, setType] = useState("bug");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      // TODO: Replace with actual API endpoint
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, subject, description }),
      });
      if (!res.ok) throw new Error("Failed to submit feedback");
      setType("bug");
      setSubject("");
      setDescription("");
      onSubmit();
    } catch (err: any) {
      setError(err.message || "Error submitting feedback");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-lg">
      {!hideHeader && (
        <CardHeader className="flex items-center gap-3 pb-2">
          <ClipboardEdit className="h-7 w-7 text-yellow-600" />
          <div>
            <CardTitle className="text-xl font-semibold text-yellow-700">Submit Feedback / Bug Report</CardTitle>
            <CardDescription>Help us improve! Report bugs, request features, or share feedback.</CardDescription>
          </div>
        </CardHeader>
      )}
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <div className="flex gap-3">
              <button type="button" onClick={() => setType("bug")} className={`flex items-center gap-1 px-3 py-2 rounded border ${type === "bug" ? "bg-red-100 border-red-400 text-red-700" : "bg-white border-gray-300 text-gray-600"}`}><Bug className="h-4 w-4" /> Bug</button>
              <button type="button" onClick={() => setType("feature")} className={`flex items-center gap-1 px-3 py-2 rounded border ${type === "feature" ? "bg-blue-100 border-blue-400 text-blue-700" : "bg-white border-gray-300 text-gray-600"}`}><Lightbulb className="h-4 w-4" /> Feature</button>
              <button type="button" onClick={() => setType("feedback")} className={`flex items-center gap-1 px-3 py-2 rounded border ${type === "feedback" ? "bg-green-100 border-green-400 text-green-700" : "bg-white border-gray-300 text-gray-600"}`}><MessageCircle className="h-4 w-4" /> Feedback</button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Subject</label>
            <input value={subject} onChange={e => setSubject(e.target.value)} required className="w-full border rounded p-2 focus:ring-2 focus:ring-yellow-300" placeholder="Short summary (e.g. App crashes on login)" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} required className="w-full border rounded p-2 focus:ring-2 focus:ring-yellow-300" rows={4} placeholder="Please describe the issue, suggestion, or feedback in detail..." />
          </div>
          {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
          <button type="submit" className="mt-2 px-5 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded flex items-center gap-2" disabled={loading}>
            {loading ? <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span> : <Send className="h-4 w-4" />} Submit
          </button>
        </form>
      </CardContent>
    </Card>
  );
};

export default FeedbackForm;
