import React, { useState } from 'react';
import { getApiUrl } from '../services/orderService';
import { X, Code2, Copy, Check, Terminal, ExternalLink } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const WebhookDocsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [copiedPython, setCopiedPython] = useState(false);

  if (!isOpen) return null;

  const webhookEndpoint = getApiUrl('/api/orders');

  const curlCommand = `curl -X POST "${webhookEndpoint}" \\
  -H "Content-Type: application/json" \\
  -d '{"text": "Bed 302-A Pt J.D. STAT CBC, CMP, and Blood Cultures x2 for fever 38.9C", "topic_id": 42}'`;

  const pythonSnippet = `import requests

webhook_url = "${webhookEndpoint}"

# Telegram Bot Handler Example
def on_telegram_message(message_text, topic_id=None):
    payload = {
        "text": message_text,
        "topic_id": topic_id
    }
    response = requests.post(webhook_url, json=payload)
    print("Clinical Order Logged:", response.json())

# Test call
on_telegram_message("Bed 205B Pt A.R. needs specimen cup for urine analysis and culture pre-op", topic_id=101)`;

  const copyToClipboard = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Telegram Webhook API Specification
              </h2>
              <p className="text-xs text-slate-500">
                Integration guide for hospital messaging bots & rounding workflows
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-4 space-y-5 text-sm">
          {/* Endpoint box */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              <span>Webhook Endpoint (POST)</span>
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Active
              </span>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs text-blue-600 dark:text-blue-400 font-bold break-all">
              <span>POST</span>
              <span>{webhookEndpoint}</span>
            </div>
          </div>

          {/* cURL Example */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-slate-500" />
                cURL Webhook Request
              </span>
              <button
                onClick={() => copyToClipboard(curlCommand, setCopiedCurl)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                {copiedCurl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCurl ? 'Copied!' : 'Copy cURL'}</span>
              </button>
            </div>
            <pre className="p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800">
              {curlCommand}
            </pre>
          </div>

          {/* Python Telegram Bot Example */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <ExternalLink className="w-4 h-4 text-slate-500" />
                Telegram Bot Integration (Python / Node.js)
              </span>
              <button
                onClick={() => copyToClipboard(pythonSnippet, setCopiedPython)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                {copiedPython ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedPython ? 'Copied!' : 'Copy Snippet'}</span>
              </button>
            </div>
            <pre className="p-3 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800">
              {pythonSnippet}
            </pre>
          </div>

          {/* JSON Payload Spec */}
          <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 text-xs space-y-1 text-slate-700 dark:text-slate-300">
            <span className="font-bold text-blue-900 dark:text-blue-300 block mb-1">
              Parsing Behavior (Gemini AI):
            </span>
            <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
              <li>
                <strong>Raw input:</strong> Accepts <code>{"{ \"text\": \"raw Telegram text\" }"}</code>.
              </li>
              <li>
                <strong>Output fields:</strong> Automatically extracts <code>bed_number</code>,{' '}
                <code>category</code> (&quot;Extraction&quot;, &quot;Specimen Cup&quot;, &quot;CXR&quot;, &quot;Medication&quot;, &quot;Other&quot;),{' '}
                <code>details</code>, and <code>priority</code> (&quot;STAT&quot;, &quot;Urgent&quot;, &quot;Routine&quot;).
              </li>
              <li>
                <strong>Initial Status:</strong> Stored immediately as <strong>Pending</strong>.
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90"
          >
            Close API Spec
          </button>
        </div>
      </div>
    </div>
  );
};
