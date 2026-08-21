import React, { useState } from "react";
import {
  X,
  Send,
  Loader2,
  AlertCircle,
  CheckCircle2,
  BellRing,
} from "lucide-react";
import { useLanguage } from "../utils/LanguageContext";
import { supabase } from "../utils/supabaseClient";

interface SendNotificationManagerProps {
  onClose: () => void;
}

interface SendResult {
  sent: number;
  failed: number;
  total: number;
  removedStaleTokens: number;
  note?: string;
}

export const SendNotificationManager: React.FC<SendNotificationManagerProps> = ({
  onClose,
}) => {
  const { language } = useLanguage();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SendResult | null>(null);

  const handleSend = async () => {
    setError("");
    setResult(null);

    if (!supabase) {
      setError(
        language === "bn"
          ? "Supabase কনফিগার করা হয়নি।"
          : "Supabase is not configured."
      );
      return;
    }
    if (!title.trim() || !body.trim()) {
      setError(
        language === "bn"
          ? "শিরোনাম এবং বার্তা উভয়ই আবশ্যক।"
          : "Both a title and a message are required."
      );
      return;
    }

    setBusy(true);
    const { data, error: fnError } = await supabase.functions.invoke(
      "send-notification",
      { body: { title: title.trim(), body: body.trim() } }
    );
    setBusy(false);

    if (fnError || data?.error) {
      setError(data?.error || fnError?.message || "Failed to send notification.");
      return;
    }

    setResult(data as SendResult);
    setTitle("");
    setBody("");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-stone-200 my-6 space-y-5 max-h-[92vh] overflow-y-auto relative">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 flex items-center justify-center shrink-0">
              <BellRing size={22} />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-base">
                {language === "bn" ? "পুশ নোটিফিকেশন পাঠান" : "Send Push Notification"}
              </h3>
              <p className="text-xs text-stone-500">
                {language === "bn"
                  ? "অ্যাপ ইন্সটল করা সকল ডিভাইসে বাবল নোটিফিকেশন যাবে"
                  : "Delivered as a bubble notification to every installed device"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3.5">
          <div>
            <label className="text-xs font-bold text-stone-600 mb-1.5 block">
              {language === "bn" ? "শিরোনাম" : "Title"}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                language === "bn" ? "যেমনঃ জরুরি বিজ্ঞপ্তি" : "e.g. Important Announcement"
              }
              maxLength={100}
              className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-700/40"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-stone-600 mb-1.5 block">
              {language === "bn" ? "বার্তা" : "Message"}
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={
                language === "bn"
                  ? "সম্পূর্ণ বার্তা লিখুন..."
                  : "Write the full notification message..."
              }
              maxLength={1000}
              rows={5}
              className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-700/40 resize-none"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleSend}
            disabled={busy}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-emerald-950 font-black text-sm shadow-md cursor-pointer"
          >
            {busy ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            {language === "bn" ? "সবাইকে পাঠান" : "Send to Everyone"}
          </button>
        </div>

        {result && (
          <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
              <CheckCircle2 size={18} />
              {language === "bn" ? "নোটিফিকেশন পাঠানো হয়েছে!" : "Notification sent!"}
            </div>
            {result.total === 0 ? (
              <p className="text-xs text-stone-600">
                {language === "bn"
                  ? "এখনো কোনো ডিভাইস নিবন্ধিত হয়নি — যারা অ্যাপে লগইন করে খুলবেন তারা পরবর্তী নোটিফিকেশন থেকে পাবেন।"
                  : "No devices are registered yet — anyone who opens and logs into the app will receive future notifications."}
              </p>
            ) : (
              <p className="text-xs text-stone-700">
                {language === "bn"
                  ? `মোট ${result.total} টি ডিভাইসের মধ্যে ${result.sent} টিতে সফলভাবে পাঠানো হয়েছে${
                      result.failed > 0 ? `, ${result.failed} টি ব্যর্থ হয়েছে` : ""
                    }।`
                  : `Sent to ${result.sent} of ${result.total} registered device${
                      result.total === 1 ? "" : "s"
                    }${result.failed > 0 ? `, ${result.failed} failed` : ""}.`}
                {result.removedStaleTokens > 0 &&
                  (language === "bn"
                    ? ` (${result.removedStaleTokens} টি পুরনো/অকার্যকর ডিভাইস মুছে ফেলা হয়েছে)`
                    : ` (${result.removedStaleTokens} stale device${
                        result.removedStaleTokens === 1 ? "" : "s"
                      } removed)`)}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
