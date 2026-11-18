"use client";
import { useState } from "react";
const sections = ["tasks", "notes", "habits", "customEvents", "quickLinks", "subscriptionBudgets", "focusRecords", "taskTemplates", "focusMinutes", "soundEnabled", "activeNav"];
function Comparison({ data }: { data: Record<string, unknown> }) {
  return <div className="space-y-3">{Object.entries(data).map(([field,value]) => <div key={field} className="rounded-lg border border-line p-2"><h5 className="font-semibold">{field === "customEvents" ? "Saved events" : field === "quickLinks" ? "Quick links" : field === "taskTemplates" ? "Task templates" : field}</h5>{Array.isArray(value) ? <><p className="text-xs text-muted">{value.length} record{value.length === 1 ? "" : "s"}</p><ul className="list-inside list-disc text-xs">{value.slice(0,5).map((item,index)=><li key={item && typeof item.id === "string" ? item.id : index}>{item && [item.title,item.name,item.summary].find(value=>typeof value === "string") || "Untitled record"}</li>)}</ul></> : <p className="text-xs">{String(value ?? "Not saved")}</p>}<details className="mt-2 text-xs"><summary className="cursor-pointer text-forest">Show full details</summary><pre className="max-h-64 overflow-auto whitespace-pre-wrap break-all bg-black/5 p-2">{JSON.stringify(value,null,2)}</pre></details></div>)}</div>;
}
export function WorkspaceConflict({ account, onResolve }: { account: string; onResolve: (revision: number, useCloud: boolean, snapshot: string) => Promise<void> }) {
  const [remote,setRemote]=useState<{data:Record<string,unknown>}|null>(null);
  const [snapshot,setSnapshot]=useState("");
  const [error,setError]=useState("");const [busy,setBusy]=useState(false);
  const load=async()=>{setBusy(true);setError("");try{
    const response=await fetch("/api/user-data",{cache:"no-store"});const json=await response.json();
    if(!response.ok || json.email?.toLowerCase()!==account)throw new Error("Sign in to the same account to review this conflict.");
    const local=localStorage.getItem(`routino_workspace_pending:${account}`)||"{}";JSON.parse(local);
    setSnapshot(local);setRemote({data:json.data||{}});
  }catch(e){setError(e instanceof Error?e.message:"Could not load the cloud copy.");}finally{setBusy(false);}};
  const resolve=async(useCloud:boolean)=>{setBusy(true);setError("");try{await onResolve(Number(remote?.data.coreRevision||0),useCloud,snapshot);}catch(e){setError(e instanceof Error?e.message:"Could not resolve; your draft is preserved.");}finally{setBusy(false);}};
  const local=snapshot?JSON.parse(snapshot):{};
  const fields=sections.filter(field=>field in local);
  return <section role="alert" className="fixed inset-x-4 bottom-4 z-[90] max-h-[80vh] overflow-auto rounded-2xl border border-amber-300 bg-white p-4 text-sm shadow-xl sm:left-auto sm:w-[min(48rem,95vw)]"><h3 className="font-semibold">Another device changed your workspace</h3><p className="mt-1 text-muted">Your local draft is preserved. Compare both copies before choosing what to save.</p><button className="btn-theme mt-3 rounded-lg border border-line px-3 py-2" disabled={busy} onClick={()=>void load()}>Compare local and cloud</button>{remote&&<><div className="mt-3 grid gap-3 sm:grid-cols-2"><div><h4 className="mb-2 font-semibold">Your pending changes</h4><Comparison data={Object.fromEntries(fields.map(field=>[field,local[field]]))}/></div><div><h4 className="mb-2 font-semibold">Current cloud copy</h4><Comparison data={Object.fromEntries(fields.map(field=>[field,remote.data[field]]))}/></div></div><p className="mt-2 text-xs text-muted">A separate local recovery copy is kept for either choice. New drafts apply only their changed records and preserve unrelated cloud records. Older drafts without record changes replace the reviewed sections.</p><div className="mt-3 flex flex-wrap gap-2"><button disabled={busy} className="btn-theme rounded-lg border border-line p-2" onClick={()=>void resolve(true)}>Use cloud copy</button><button disabled={busy} className="btn-theme rounded-lg border border-line p-2" onClick={()=>void resolve(false)}>Keep my pending changes</button></div></>}{error&&<p role="alert" className="mt-2 text-red-700">{error}</p>}</section>;
}
