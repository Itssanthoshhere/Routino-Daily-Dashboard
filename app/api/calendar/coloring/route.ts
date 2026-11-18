import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { backupWorkspace } from "@/lib/workspaceBackups";
import { auth } from "@/lib/auth";
import { getUserWorkspace, saveCalendarColorState, getDatabaseStatus } from "@/lib/db";
import { emptyColorState, validColorSettings, type ColorState, type ColorRun } from "@/lib/calendarColorSettings";
import { listColorCalendars, defaultColorRange, validColorRange, scanCalendarColors, patchCalendarColor } from "@/lib/calendarColorService";
const json=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{"Cache-Control":"private, no-store"}});
async function read(email:string):Promise<ColorState> {
  const value=(await getUserWorkspace(email))?.calendarColorState;
  if(!value) return emptyColorState();
  if(!validColorSettings(value.settings) || !Number.isInteger(value.revision) || !Array.isArray(value.runs)) throw new Error("Saved color settings need repair; existing data has not been overwritten.");
  return value;
}
export async function GET(request:Request) {
  const email=(await auth())?.user?.email;
  if(!email) return json({error:"Sign in to manage calendar colors."},401);
  try { if(new URL(request.url).searchParams.get("settingsOnly")==="1") { const state=await read(email); return json({settings:state.settings,revision:state.revision,pendingRunId:state.pendingRunId}); } const [state, calendars] = await Promise.allSettled([read(email), listColorCalendars()]); if(state.status === "rejected") throw state.reason; return json({state:state.value,calendars:calendars.status === "fulfilled" ? calendars.value : [],warning:calendars.status === "rejected" ? "Calendar list unavailable. Reconnect Google or retry; saved settings are preserved." : undefined,range:defaultColorRange(),durable:getDatabaseStatus().configured}); }
  catch(error) { return json({error:error instanceof Error?error.message:"Could not load color settings."},503); }
}
export async function POST(request:Request) {
  const email=(await auth())?.user?.email;
  if(!email) return json({error:"Sign in to manage calendar colors."},401);
  let body; try { body=await request.json(); } catch { return json({error:"Invalid request."},400); }
  if(!body || !["save","preview","apply","undo","recover"].includes(body.mode)) return json({error:"Choose a valid coloring action."},400);
  try {
    let state=await read(email);
    const save=async(next:ColorState)=>{ const result=await saveCalendarColorState(email,next.pendingRunId ? {...next,operationStartedAt:new Date().toISOString()} : next,state.revision); if(!result) throw new Error("Another device changed color settings. Reload before continuing."); state=result; };
    if(body.revision!==state.revision) return json({error:"Color settings changed on another device. Reload to preserve both versions."},409);
    if(body.mode==="recover") {
      const run=state.runs.find(item=>item.id===state.pendingRunId);
      if(!run || Date.now()-Date.parse(state.operationStartedAt || run.createdAt)<120000) return json({error:"This operation may still be running. Wait two minutes before recovery."},409);
      await save({...state,pendingRunId:undefined,operationStartedAt:undefined,runs:state.runs.map(item=>item.id===run.id?{...item,status:"interrupted",changes:item.changes.map(change=>change.status==="pending"?{...change,status:"uncertain"}:change)}:item)});
      return json({state,message:"Interrupted operation released. Unconfirmed entries will not be undone automatically; preview again to check current colors."});
    }
    if(state.pendingRunId) return json({error:"A coloring operation is already running. Reload its status before continuing."},409);
    if(body.mode==="undo") {
      const run=state.runs.find(item=>item.id===body.runId);
      if(!run) return json({error:"History entry not found."},404);
      const pending=run.changes.filter(change=>change.status==="applied");
      if(!pending.length) return json({error:"No confirmed changes remain to undo."},400);
      await backupWorkspace(email);
      await save({...state,pendingRunId:run.id,operationStartedAt:new Date().toISOString(),runs:state.runs.map(item=>item.id===run.id?{...item,status:"undoing"}:item)});
      for(const change of pending) {
        const result=await patchCalendarColor(change,true);
        await save({...state,runs:state.runs.map(item=>item.id===run.id?{...item,changes:item.changes.map(entry=>entry.key===change.key?{...entry,status:result.status==="failed"?"applied":result.status}:entry)}:item)});
      }
      await save({...state,pendingRunId:undefined,operationStartedAt:undefined,runs:state.runs.map(item=>item.id===run.id?{...item,status:"complete"}:item)});
      return json({state,message:"Undo checked against Google event versions. Newer edits and conflicts were preserved."});
    }
    if(!validColorSettings(body.settings)) return json({error:"Check rule names, keywords, colors, and exclusion limits."},400);
    if(body.mode==="save") { await backupWorkspace(email); await save({...state,settings:body.settings}); return json({state,message:"Rules and exclusions saved to your account. No calendar colors were changed."}); }
    if(!validColorRange(body.range)) return json({error:"Choose a valid date range of no more than two years."},400);
    const preview=await scanCalendarColors(body.settings,body.range);
    if(body.mode==="preview") return json({preview});
    if(body.hash!==preview.hash) return json({error:"Events or rules changed since preview. Preview again before applying."},409);
    if(!Array.isArray(body.selectedKeys) || !body.selectedKeys.length || body.selectedKeys.some((key:unknown)=>typeof key!=="string" || !preview.changes.some(change=>change.key===key))) return json({error:"Select changes from the current preview."},400);
    const changes=preview.changes.filter(change=>body.selectedKeys.includes(change.key));
    const run:ColorRun={id:randomUUID(),createdAt:new Date().toISOString(),changes,status:"applying"};
    await backupWorkspace(email);
    await save({...state,settings:body.settings,pendingRunId:run.id,operationStartedAt:new Date().toISOString(),runs:[run,...state.runs].slice(0,10)});
    for(const change of changes) {
      const result=await patchCalendarColor(change);
      await save({...state,runs:state.runs.map(item=>item.id===run.id?{...item,changes:item.changes.map(entry=>entry.key===change.key?{...entry,status:result.status,afterEtag:result.etag}:entry)}:item)});
      await new Promise(resolve=>setTimeout(resolve,300));
    }
    await save({...state,pendingRunId:undefined,operationStartedAt:undefined,runs:state.runs.map(item=>item.id===run.id?{...item,status:"complete"}:item)});
    const count=state.runs[0].changes.filter(change=>change.status==="applied").length;
    return json({state,message:`Applied ${count} of ${changes.length} selected changes. Review history for any conflicts or failures.`});
  } catch(error) { return json({error:error instanceof Error?error.message:"Coloring failed. Reload to inspect saved progress before retrying."},503); }
}
