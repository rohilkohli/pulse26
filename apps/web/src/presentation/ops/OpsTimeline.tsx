// ============================================================
// Pulse26 — Match Timeline View
// Shows current match phase on expected crowd curve
// ============================================================


import { Clock, Bus, Goal, Play, Coffee, DoorOpen, Moon, Lightbulb } from 'lucide-react';
import { useOpsContext } from './OpsLayout';
import { MatchPhaseLabel } from '../shared/components';

const PHASE_TIMELINE = [
  { phase: 'pre_match',     label: 'Pre-Match', minute: -120, icon: Clock },
  { phase: 'arrival',       label: 'Arrival',   minute: -60,  icon: Bus },
  { phase: 'kickoff_surge', label: 'Kickoff',   minute: 0,    icon: Goal },
  { phase: 'first_half',    label: '1st Half',  minute: 23,   icon: Play },
  { phase: 'halftime',      label: 'Half Time', minute: 47,   icon: Coffee },
  { phase: 'second_half',   label: '2nd Half',  minute: 70,   icon: Play },
  { phase: 'exit_surge',    label: 'Exit',      minute: 95,   icon: DoorOpen },
  { phase: 'post_match',    label: 'Post-Match',minute: 125,  icon: Moon },
];

// Expected crowd density curve per phase (for illustration)
const CROWD_CURVE: Record<string, number> = {
  pre_match: 8,
  arrival: 45,
  kickoff_surge: 82,
  first_half: 72,
  halftime: 60,
  second_half: 70,
  exit_surge: 65,
  post_match: 15,
};

const OPERATIONAL_TIPS: Record<string, string[]> = {
  pre_match: ['Staff turnstiles for first arrivals', 'Verify accessible routes are clear', 'Brief volunteers on emergency procedures'],
  arrival: ['Monitor Gate A for early surge', 'Open concessions now', 'Transit hub approaching capacity'],
  kickoff_surge: ['All gates at maximum throughput', 'Deploy extra stewards to Gate A', 'Concessions should close soon'],
  first_half: ['Monitor empty concourses for safety', 'Restock concessions during play', 'Check parking fill rates'],
  halftime: ['All concessions expect peak traffic', 'Brief exit staff for full-time', 'Accessible routes at halftime exit'],
  second_half: ['Prepare exit plan for close game', 'Alert transit partners about exit surge timing', 'Medical teams on standby'],
  exit_surge: ['Open all exit gates immediately', 'Transit hub coordination active', 'Post-match crowd management protocol'],
  post_match: ['Clear concourses systematically', 'Accessible transport priority', 'Staff debrief in 30min'],
};

export function OpsTimeline() {
  const { telemetry, selectedVenueId } = useOpsContext();
  const snapshot = telemetry.telemetryMap.get(selectedVenueId);
  const currentPhase = snapshot?.matchPhase ?? 'pre_match';
  const currentPct = snapshot?.overallOccupancyPct ?? 0;
  const currentPhaseIdx = PHASE_TIMELINE.findIndex((p) => p.phase === currentPhase);

  const tips = OPERATIONAL_TIPS[currentPhase] ?? [];

  return (
    <div className="flex flex-col gap-6 p-6 min-h-[calc(100vh-80px)]">
      <div className="mb-2">
        <h1 className="text-2xl font-display mb-1.5">Match Timeline</h1>
        <p className="text-sm text-secondary">
          Current match phase, expected crowd dynamics, and pre-emptive operational guidance.
        </p>
      </div>

      {/* Current Phase Hero */}
      <div className="card relative overflow-hidden bg-gradient-to-br from-blue-500/8 to-indigo-500/4 border border-border-default/60 rounded-2xl p-6 shadow-xl transition-all duration-300">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-[10px] text-muted uppercase tracking-[0.12em] font-extrabold mb-1.5 select-none">Current Phase</div>
            <div className="text-3xl font-display font-bold mb-2 flex items-center gap-2">
              <MatchPhaseLabel phase={currentPhase} matchMinute={snapshot?.matchMinute} />
            </div>
            <div className="text-secondary text-sm select-none">
              Overall venue occupancy: <strong className={currentPct >= 80 ? 'text-danger' : 'text-primary'}>{currentPct}%</strong>
            </div>
          </div>
          <div className="flex items-center justify-center bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl w-14 h-14 border border-blue-500/20 shadow-inner shrink-0">
            {(() => {
              const CurrentIcon = PHASE_TIMELINE.find((p) => p.phase === currentPhase)?.icon ?? Goal;
              return <CurrentIcon size={28} strokeWidth={2} />;
            })()}
          </div>
        </div>
      </div>

      {/* Timeline Bar */}
      <div className="card relative overflow-hidden bg-surface-01 p-6 border border-border-default shadow-lg rounded-2xl">
        <h2 className="text-base font-semibold mb-6 select-none">Expected Crowd Density</h2>
        <div className="overflow-x-auto pb-4 scrollbar-thin">
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 0, minWidth: 680, position: 'relative' }} className="px-2 pt-8">
            {PHASE_TIMELINE.map((p, i) => {
              const isActive = p.phase === currentPhase;
              const isPast = i < currentPhaseIdx;
              const expectedDensity = CROWD_CURVE[p.phase] ?? 50;
              return (
                <div
                  key={p.phase}
                  className="relative flex-1 flex flex-col items-center"
                >
                  {/* Bar */}
                  <div className="w-full flex items-end justify-center h-28 pb-3 relative">
                    {isActive && (
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-blue-500 text-white text-[9px] font-extrabold tracking-wider px-2 py-0.5 rounded-full shadow-[0_2px_8px_rgba(59,130,246,0.3)] animate-bounce select-none whitespace-nowrap z-20">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        LIVE NOW
                      </div>
                    )}
                    <div 
                      className={`w-3/5 rounded-t-lg transition-all duration-500 border ${
                        isActive
                          ? 'bg-gradient-to-t from-blue-600 to-blue-400 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.35)]'
                          : isPast
                            ? 'bg-surface-03/60 border-border-subtle'
                            : 'bg-surface-02/30 border-border-subtle/50'
                      }`}
                      style={{ height: `${expectedDensity}%` }}
                      title={`${p.label}: ${expectedDensity}% expected crowd density`}
                    >
                    </div>
                  </div>

                  {/* Connector line */}
                  <div className={`w-full h-0.5 ${
                    isPast || isActive ? 'bg-blue-500' : 'bg-surface-03'
                  }`} />

                  {/* Dot */}
                  <div className="relative flex items-center justify-center my-2.5 h-5 w-5">
                    {isActive ? (
                      <>
                        <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.6)] z-10" />
                        <div className="absolute w-5 h-5 rounded-full bg-blue-500/30 animate-ping" />
                      </>
                    ) : (
                      <div className={`w-2.5 h-2.5 rounded-full transition-colors ${
                        isPast ? 'bg-blue-500/40' : 'bg-surface-03'
                      }`} />
                    )}
                  </div>

                  {/* Label */}
                  <div className={`flex flex-col items-center text-center mt-1 select-none transition-colors ${
                    isActive ? 'text-blue-500 dark:text-blue-400 font-bold' : 'text-muted'
                  }`}>
                    <div className={`flex justify-center mb-1.5 p-1 rounded-md transition-colors ${
                      isActive ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'text-muted/70'
                    }`}>
                      <p.icon size={14} strokeWidth={2.5} />
                    </div>
                    <div className="text-[10px] tracking-wide font-bold uppercase">{p.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="text-[10px] text-muted mt-4 text-center select-none tracking-wider uppercase font-semibold">
          Data visualization shows expected crowd density index at each match milestone
        </div>
      </div>

      {/* Operational Tips / Playbook */}
      {tips.length > 0 && (
        <div className="card relative overflow-hidden bg-gradient-to-br from-emerald-500/8 to-blue-500/4 p-6 border border-border-default shadow-lg rounded-2xl">
          <h2 className="text-base font-semibold mb-4 flex items-center gap-2 select-none">
            <span aria-hidden="true" className="flex items-center text-emerald-500"><Lightbulb size={18} strokeWidth={2.5} /></span> 
            Operational Playbook
          </h2>
          <div className="flex flex-col gap-3">
            {tips.map((tip, i) => (
              <div 
                key={i} 
                className="group/tip flex items-center justify-between bg-surface-01/60 hover:bg-surface-01/80 border border-border-default/40 hover:border-blue-500/20 rounded-xl p-4 transition-all duration-300 shadow-sm fade-in"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="flex items-start gap-3.5">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-bold shrink-0 select-none mt-0.5" aria-hidden="true">
                    {i + 1}
                  </div>
                  <p className="text-sm font-semibold text-primary leading-relaxed" style={{ margin: 0 }}>{tip}</p>
                </div>
                <span className="text-[9px] font-bold text-muted bg-surface-02 px-2 py-0.5 rounded-md tracking-wider uppercase opacity-0 group-hover/tip:opacity-100 transition-opacity select-none ml-4 whitespace-nowrap">
                  Action Item
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
