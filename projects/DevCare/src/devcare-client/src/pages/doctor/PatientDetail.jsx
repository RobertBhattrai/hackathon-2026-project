import { useParams, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getPatientSessions, getPlanDetail } from '../../api/rehabApi'
import { getMyPatients } from '../../api/connectionsApi'
import Modal from '../../components/Modal'
import { 
  ChevronLeft, 
  Calendar, 
  Activity, 
  ChevronRight, 
  Sparkles, 
  Plus, 
  Edit3,
  Clock,
  Target,
  TrendingDown,
  X,
  ClipboardList,
  CheckCircle2
} from 'lucide-react'

function PatientDetail() {
  const { id } = useParams()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [patientInfo, setPatientInfo] = useState(null)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [planLoading, setPlanLoading] = useState(false)
  
  useEffect(() => {
    getPatientSessions(id)
      .then(data => setSessions(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
      
    getMyPatients()
      .then(patients => {
        const found = patients.find(p => p.id === parseInt(id))
        setPatientInfo(found || null)
      })
      .catch(err => console.error(err))
  }, [id])

  const handleViewPlan = async (planId) => {
    if (!planId || planId === 'none') return
    setPlanLoading(true)
    setIsModalOpen(true)
    try {
      const data = await getPlanDetail(planId)
      setSelectedPlan(data)
    } catch (err) {
      console.error(err)
    } finally {
      setPlanLoading(false)
    }
  }

  const latestSession = sessions[0]

  // Map sessions to notes, including those without feedback
  const notes = sessions.map((s, index) => {
    if (s.feedback) {
      return {
        id: s.feedback.id || `session-${s.id}`,
        session_id: s.id,
        date: new Date(s.feedback.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric' }),
        tag: 'EVALUATION',
        content: s.feedback.guidance,
        rating: s.feedback.rating,
        hasFeedback: true
      }
    } else {
      return {
        id: `session-${s.id}`,
        session_id: s.id,
        date: new Date(s.completed_at || s.started_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric' }),
        tag: 'PENDING REVIEW',
        content: 'Session completed. Awaiting clinical review and guidance.',
        rating: 0,
        hasFeedback: false
      }
    }
  })

  // Extract unique plans from sessions
  const uniquePlans = []
  const planIds = new Set()
  sessions.forEach(s => {
    if (s.plan_id && !planIds.has(s.plan_id)) {
      planIds.add(s.plan_id)
      uniquePlans.push({
        id: s.plan_id,
        name: s.plan_name,
        details: 'Assigned Therapy Plan',
        icon: '📋'
      })
    }
  })

  const patient = {
    id,
    name: patientInfo?.name || 'Loading...',
    condition: 'Physical Rehabilitation',
    timeline: patientInfo ? `Connected since ${new Date(patientInfo.connected_at).toLocaleDateString()}` : '',
    lastSession: latestSession ? new Date(latestSession.started_at).toLocaleDateString() : 'None',
    notes: notes,
    currentPlan: uniquePlans.length > 0 ? uniquePlans : [
      { id: 'none', name: 'No plans assigned yet', details: 'Create a plan to get started', icon: '❓' }
    ],
  }

  const sessionReport = latestSession ? {
    exercise_results: latestSession.results?.map(r => ({
      name: r.exercise_name,
      reps: r.reps,
      accuracy: `${Math.round(r.accuracy || 0)}%`,
      duration: `${r.duration}s`
    })) || [],
    body_part_scores: latestSession.body_part_scores?.map(s => ({
      part: s.part,
      score: s.score,
      color: s.score >= 90 ? 'bg-emerald-500' : s.score >= 80 ? 'bg-blue-500' : 'bg-amber-500'
    })) || []
  } : null

  return (
    <div className="animate-fade-in pb-12">
      {/* Breadcrumbs & Header */}
      <div className="mb-8 flex items-center justify-between">
        <Link to="/doctor/patients" className="flex items-center gap-2 text-sm font-bold text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors">
          <ChevronLeft size={18} />
          Back to Directory
        </Link>
        <div className="flex gap-2">
           <button className="btn-secondary py-2 px-4 text-xs h-10">Export Records</button>
           <button className="btn-primary py-2 px-4 text-xs h-10">Assign Review</button>
        </div>
      </div>

      {/* Header Profile Card */}
      <div className="mb-10 grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <div className="elevated-card border-none bg-white p-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 h-32 w-32 bg-blue-50/50 rounded-full blur-3xl -mr-16 -mt-16"></div>
            <div className="flex flex-col gap-10 md:flex-row md:items-center relative z-10">
              <div className="h-28 w-28 overflow-hidden rounded-[2rem] bg-slate-100 border-4 border-white shadow-lg">
                 <img 
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200&h=200" 
                  alt={patient.name} 
                  className="h-full w-full object-cover"
                 />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">{patient.name}</h1>
                    <p className="mt-1.5 text-lg font-semibold text-slate-500">
                      {patient.condition} <span className="mx-2 text-slate-300">•</span> {patient.timeline}
                    </p>
                  </div>
                  <button className="flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all">
                    <Edit3 size={16} />
                    Edit Plan
                  </button>
                </div>
                
              </div>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <div className="elevated-card border-none bg-white p-8 text-slate-900 h-full relative overflow-hidden shadow-xl">
             <div className="absolute top-0 right-0 p-4 opacity-5 text-blue-900">
               <Sparkles size={120} />
             </div>
             <div className="flex items-center gap-2 mb-6 relative z-10">
               <div className="h-1 w-4 bg-blue-600 rounded-full"></div>
               <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">AI Insights</h3>
             </div>
             <p className="text-base leading-relaxed text-slate-900 font-bold relative z-10">
               Sarah's knee extension range has improved by <span className="text-blue-600 font-black">4° this week</span>. Form detection identifies slight pelvic tilting during single-leg squats.
             </p>
             <div className="mt-10 rounded-2xl bg-blue-50/50 p-5 border border-blue-100 relative z-10">
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">Suggested Adjustment</p>
               <p className="mt-2 text-xs font-black leading-relaxed text-slate-900">
                 Increase resistance on Terminal Knee Extension (TKE) by 5%.
               </p>
             </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-8 lg:grid-cols-12">
        
        {/* Left: Charts & History */}
        <div className="lg:col-span-8 space-y-8">
          <section className="elevated-card border-none p-10 shadow-lg">
            <div className="flex items-center justify-between mb-10">
              <div>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-primary)] mb-2">
                   <div className="h-1 w-4 bg-[var(--color-primary)] rounded-full"></div>
                   Anatomical Analytics
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Latest Session Report</h3>
                <p className="text-sm text-slate-500 font-medium mt-1">Generated automatically after session completion</p>
              </div>
              <div className="h-10 px-4 rounded-xl bg-blue-50 border border-blue-100 flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-widest">
                 <Activity size={14} /> AI Verified
              </div>
            </div>
            
            <div className="space-y-8">
              {loading ? (
                 <div className="py-12 flex justify-center text-slate-400">Loading Session Data...</div>
              ) : !sessionReport ? (
                 <div className="py-12 text-center text-slate-400 font-bold">No session data available for this patient yet.</div>
              ) : (
                <>
                  {/* Exercise Table */}
                  <div className="overflow-hidden rounded-2xl border border-slate-100 shadow-sm">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50">
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Exercise</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Reps</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Accuracy</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Duration</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {sessionReport.exercise_results.map((res, i) => (
                          <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-5 text-sm font-bold text-slate-900">{res.name}</td>
                            <td className="px-6 py-5 text-sm font-black text-slate-900 text-center">{res.reps}</td>
                            <td className="px-6 py-5 text-sm font-black text-emerald-600 text-center">{res.accuracy}</td>
                            <td className="px-6 py-5 text-sm font-bold text-slate-500 text-right">{res.duration}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Body Part Scores */}
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 px-1">Biometric Body Part Scores</h4>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                      {sessionReport.body_part_scores.map((score, i) => (
                        <div key={i} className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm">
                          <div className="flex items-center justify-between mb-3">
                              <span className="text-xs font-bold text-slate-500">{score.part}</span>
                              <span className="text-sm font-black text-slate-900">{score.score}</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${score.color} transition-all duration-1000`}
                                style={{ width: `${score.score}%` }}
                              />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Clinical Notes */}
          <section className="elevated-card border-none p-10 shadow-lg">
            <div className="flex items-center justify-between mb-10">
              <div>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-primary)] mb-2">
                   <div className="h-1 w-4 bg-[var(--color-primary)] rounded-full"></div>
                   Physician Records
                </div>
                <h3 className="text-2xl font-bold">Clinical Notes</h3>
                <p className="text-sm text-slate-500 font-medium mt-1">Timeline of assessments and adjustments</p>
              </div>
              <Link 
                to={`/doctor/feedback/${id}`}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all shadow-md"
              >
                <Plus size={16} /> New Entry
              </Link>
            </div>
            
            <div className="space-y-12">
              {patient.notes.length > 0 ? patient.notes.map((note, i) => (
                <div key={note.id} className="relative pl-12">
                   <div className={`absolute left-0 top-1.5 h-4 w-4 rounded-full bg-white border-4 ${note.hasFeedback ? 'border-slate-900 ring-slate-50' : 'border-amber-500 ring-amber-50'} ring-8 shadow-sm z-10`}></div>
                   {i !== patient.notes.length - 1 && <div className="absolute left-[7.5px] top-8 bottom-[-48px] w-0.5 bg-slate-100"></div>}
                   <div className="flex items-center justify-between mb-4">
                     <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">{note.date}</span>
                        <div className="h-1 w-1 rounded-full bg-slate-300"></div>
                        <span className={`text-[9px] font-black tracking-widest px-2 py-1 rounded-lg border ${note.hasFeedback ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>{note.tag}</span>
                        {note.hasFeedback && (
                          <>
                            <div className="h-1 w-1 rounded-full bg-slate-300"></div>
                            <span className="text-[10px] font-bold text-amber-500">{"★".repeat(note.rating)}{"☆".repeat(5 - note.rating)}</span>
                          </>
                        )}
                     </div>
                     {!note.hasFeedback && (
                       <Link 
                         to={`/doctor/feedback/${id}?session=${note.session_id}`}
                         className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 text-white text-[10px] font-bold hover:bg-amber-600 transition-all shadow-sm"
                       >
                         Review Session
                       </Link>
                     )}
                   </div>
                   <p className={`text-base leading-relaxed font-medium p-6 rounded-[1.5rem] border whitespace-pre-wrap ${note.hasFeedback ? 'text-slate-600 bg-slate-50/50 border-slate-100/50' : 'text-slate-500 bg-white border-dashed border-amber-200'}`}>
                     {note.content}
                   </p>
                </div>
              )) : (
                <p className="text-sm text-slate-400 italic py-8 text-center border-2 border-dashed border-slate-100 rounded-[2rem]">No clinical records available.</p>
              )}
            </div>
          </section>
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          <section className="elevated-card border-none p-8 shadow-lg">
             <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-primary)] mb-4 cursor-pointer" onClick={() => patient.currentPlan[0]?.id !== 'none' && handleViewPlan(patient.currentPlan[0]?.id)}>
                <div className="h-1 w-4 bg-[var(--color-primary)] rounded-full"></div>
                Active Protocol
             </div>
             <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-slate-900 cursor-pointer" onClick={() => patient.currentPlan[0]?.id !== 'none' && handleViewPlan(patient.currentPlan[0]?.id)}>Current Plan</h3>
               <div className="flex gap-4 items-center">
                 <button onClick={() => patient.currentPlan[0]?.id !== 'none' && handleViewPlan(patient.currentPlan[0]?.id)} className="text-xs font-bold text-blue-600 hover:underline">View Details</button>
                 <Link 
                   to="/doctor/assign" 
                   onClick={(e) => {
                     if (patient.currentPlan[0]?.id !== 'none') {
                       e.preventDefault();
                       handleViewPlan(patient.currentPlan[0]?.id);
                     }
                   }}
                   className="text-xs font-bold text-[var(--color-text-muted)] hover:underline"
                 >
                   Modify
                 </Link>
               </div>
            </div>
            <div className="space-y-4">
              {patient.currentPlan.map(ex => (
                <div 
                  key={ex.id} 
                  onClick={() => handleViewPlan(ex.id)}
                  className="flex items-center gap-5 rounded-[1.5rem] bg-slate-50 p-5 border border-slate-100 hover:border-blue-200 hover:bg-white transition-all cursor-pointer group shadow-sm hover:shadow-md"
                >
                  <div className="h-14 w-14 rounded-2xl bg-white shadow-sm border border-slate-50 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    {ex.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-slate-900 leading-tight">{ex.name}</h4>
                    <p className="text-[11px] text-slate-500 font-bold mt-1.5 flex items-center gap-1.5">
                       <Clock size={10} className="text-blue-400" />
                       {ex.details}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="elevated-card border-none p-8 shadow-lg overflow-hidden">
            <div className="flex items-center justify-between mb-10">
               <div>
                  <h3 className="text-xl font-bold text-slate-900">Activity Intensity</h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">Daily session frequency and form accuracy</p>
               </div>
               <div className="flex gap-6">
                  <div className="text-right">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Current Streak</p>
                    <p className="text-lg font-black text-emerald-600">12 Days</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Missed</p>
                    <p className="text-lg font-black text-rose-500">1</p>
                  </div>
               </div>
            </div>

            <div className="relative">
              {/* Month Labels */}
              <div className="flex justify-between mb-2 px-2">
                 {['Jun', 'Jul', 'Aug', 'Sep', 'Oct'].map(m => (
                   <span key={m} className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">{m}</span>
                 ))}
              </div>
              
              <div className="flex gap-1.5 flex-wrap">
                {[...Array(140)].map((_, i) => {
                  // Simulate some activity data
                  const level = Math.random() > 0.3 ? (Math.random() > 0.5 ? (Math.random() > 0.5 ? 4 : 3) : 2) : 0;
                  const colors = [
                    'bg-slate-100/50', // Level 0
                    'bg-emerald-100',  // Level 1
                    'bg-emerald-300',  // Level 2
                    'bg-emerald-500',  // Level 3
                    'bg-emerald-700'   // Level 4
                  ];
                  
                  return (
                    <div 
                      key={i} 
                      className={`h-3 w-3 rounded-sm ${colors[level]} transition-all hover:scale-150 hover:z-10 cursor-pointer shadow-sm`}
                      title={`Activity Level: ${level}`}
                    ></div>
                  )
                })}
              </div>

              {/* Legend */}
              <div className="mt-6 flex items-center justify-end gap-2 px-1">
                 <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Less</span>
                 <div className="flex gap-1">
                    <div className="h-2.5 w-2.5 rounded-sm bg-slate-100/50"></div>
                    <div className="h-2.5 w-2.5 rounded-sm bg-emerald-100"></div>
                    <div className="h-2.5 w-2.5 rounded-sm bg-emerald-300"></div>
                    <div className="h-2.5 w-2.5 rounded-sm bg-emerald-500"></div>
                    <div className="h-2.5 w-2.5 rounded-sm bg-emerald-700"></div>
                 </div>
                 <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">More</span>
              </div>
            </div>
            
            <div className="space-y-6 pt-10 mt-10 border-t border-slate-50">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Biomechanic Metrics</p>
              <div className="flex flex-wrap gap-2.5">
                {[
                  { l: 'Stability: Optimal', c: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
                  { l: 'Tilt: Minimal (+2°)', c: 'bg-amber-50 text-amber-700 border-amber-100' },
                  { l: 'Tempo: Consistent', c: 'bg-blue-50 text-blue-700 border-blue-100' },
                  { l: 'Weight Dist: 60/40', c: 'bg-slate-100 text-slate-700 border-slate-200' }
                ].map(tag => (
                  <span key={tag.l} className={`px-4 py-2 rounded-xl text-[10px] font-bold border ${tag.c}`}>
                    {tag.l}
                  </span>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Therapy Plan Details"
      >
        {planLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-4">
            <div className="h-12 w-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-slate-500 font-bold text-sm">Fetching plan details...</p>
          </div>
        ) : selectedPlan ? (
          <div className="space-y-8">
            <div className="flex items-start gap-4 p-6 rounded-[2rem] bg-blue-50/50 border border-blue-100">
              <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-2xl">
                📋
              </div>
              <div>
                <h4 className="text-xl font-black text-slate-900">{selectedPlan.name}</h4>
                <p className="text-sm text-slate-500 font-bold mt-1">Assigned on {new Date(selectedPlan.created_at).toLocaleDateString()}</p>
              </div>
            </div>

            {selectedPlan.exercises && selectedPlan.exercises.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                  <div className="h-1 w-4 bg-slate-200 rounded-full"></div>
                  Exercises
                </div>
                <div className="grid gap-4">
                  {selectedPlan.exercises.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-5 rounded-2xl bg-white border border-slate-100 shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-xs font-black text-slate-400 border border-slate-100">
                          {item.order}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{item.exercise.name}</p>
                          <p className="text-[11px] text-slate-500 font-medium">{item.exercise.target_joint}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-blue-600">{item.target_reps} Reps</p>
                        <p className="text-[10px] font-bold text-slate-400">Target Goal</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                <div className="h-1 w-4 bg-slate-200 rounded-full"></div>
                Biometric Body Part Scores
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { part: 'Arms', score: 85, color: 'bg-emerald-500' },
                  { part: 'Knees', score: 85, color: 'bg-emerald-500' },
                  { part: 'Hips', score: 84, color: 'bg-emerald-500' },
                  { part: 'Ankles', score: 84, color: 'bg-emerald-500' },
                  { part: 'Shoulders', score: 80, color: 'bg-blue-500' }
                ].map((score, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-white border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-500">{score.part}</span>
                        <span className="text-sm font-black text-slate-900">{score.score}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${score.color} transition-all duration-1000`}
                          style={{ width: `${score.score}%` }}
                        />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {selectedPlan.tasks && selectedPlan.tasks.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                  <div className="h-1 w-4 bg-slate-200 rounded-full"></div>
                  Additional Tasks
                </div>
                <div className="space-y-3">
                  {selectedPlan.tasks.map((task, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-4 rounded-xl bg-slate-50/50 border border-slate-100">
                      <CheckCircle2 size={16} className="text-emerald-500" />
                      <span className="text-sm font-bold text-slate-700">{task}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400 font-bold">Failed to load plan details.</div>
        )}
      </Modal>
    </div>
  )
}

export default PatientDetail
