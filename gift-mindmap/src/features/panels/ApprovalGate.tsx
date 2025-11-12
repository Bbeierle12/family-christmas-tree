/**
 * Approval Gate Modal
 * Shows diff preview, check results, and approve/reject UI
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  Eye
} from "lucide-react";
import { useAgentStore } from "@/store/agentStore";

export function ApprovalGate() {
  const { workflowState, approveChange, rejectChange } = useAgentStore();
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

  const approval = workflowState?.pendingApproval;

  if (!approval || approval.status !== "pending") {
    return null;
  }

  const allChecksPass = Object.values(approval.checkResults).every((v) => v);

  const handleApprove = () => {
    approveChange("user");
  };

  const handleReject = () => {
    if (showRejectInput) {
      rejectChange("user", rejectReason || "Rejected by user");
      setShowRejectInput(false);
      setRejectReason("");
    } else {
      setShowRejectInput(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            {approval.title}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Review the changes before deployment
          </p>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          {/* Check Results */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Quality Checks</h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(approval.checkResults).map(([check, passed]) => (
                <div
                  key={check}
                  className={`
                    flex items-center justify-between p-2 rounded border
                    ${passed ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}
                  `}
                >
                  <span className="text-sm capitalize">{check}</span>
                  {passed ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600" />
                  )}
                </div>
              ))}
            </div>
            
            {allChecksPass ? (
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded flex items-center gap-2 text-sm text-green-700">
                <CheckCircle2 className="w-4 h-4" />
                All quality checks passed!
              </div>
            ) : (
              <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded flex items-center gap-2 text-sm text-amber-700">
                <AlertTriangle className="w-4 h-4" />
                Some checks failed - proceed with caution
              </div>
            )}
          </div>

          {/* Diff Preview */}
          {approval.diff && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Changes</h3>
              <div className="bg-slate-900 text-slate-100 p-3 rounded font-mono text-xs overflow-x-auto max-h-64">
                <pre>{approval.diff}</pre>
              </div>
            </div>
          )}

          {/* Metrics (if available) */}
          {approval.metrics && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Metrics Preview</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="p-2 bg-slate-50 rounded">
                  <div className="text-muted-foreground">Error Rate</div>
                  <div className="font-semibold">
                    {approval.metrics.error_rate_5xx?.toFixed(2)}%
                  </div>
                </div>
                <div className="p-2 bg-slate-50 rounded">
                  <div className="text-muted-foreground">LCP Delta</div>
                  <div className="font-semibold">
                    {approval.metrics.vitals?.LCP_p75_delta ? 
                      `${(approval.metrics.vitals.LCP_p75_delta * 100).toFixed(1)}%` :
                      "N/A"
                    }
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Reject Reason Input */}
          {showRejectInput && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Rejection Reason</h3>
              <Textarea
                placeholder="Why are you rejecting this change? (optional)"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
              />
            </div>
          )}
        </CardContent>

        <CardFooter className="border-t flex justify-between gap-2">
          <div className="text-xs text-muted-foreground">
            Requested {new Date(approval.timestamp).toLocaleString()}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleReject}
              className="gap-2"
            >
              <ThumbsDown className="w-4 h-4" />
              {showRejectInput ? "Confirm Reject" : "Reject"}
            </Button>
            <Button
              onClick={handleApprove}
              disabled={!allChecksPass}
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              <ThumbsUp className="w-4 h-4" />
              Approve & Ship
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
