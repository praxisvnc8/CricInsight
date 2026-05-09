import { useEffect, useMemo, useRef, useState } from "react";
import { predictMatchWinner, predictInningsScore, predictPlayerPerformance, fetchPlayerStats, fetchPlayerList } from "../services/api";
import { getTeamLogo, getPlayerAvatar } from "../utils/teamLogos";

const TEAMS = ["Chennai Super Kings","Delhi Capitals","Gujarat Titans","Kolkata Knight Riders","Lucknow Super Giants","Mumbai Indians","Punjab Kings","Rajasthan Royals","Royal Challengers Bengaluru","Sunrisers Hyderabad"];
const CITIES = ["Mumbai","Chennai","Kolkata","Delhi","Bangalore","Hyderabad","Jaipur","Ahmedabad","Chandigarh","Lucknow"];

interface WinnerResult { predicted_winner: string; team1: string; team2: string; team1_prob: number; team2_prob: number; }
interface ScoreResult { predicted_score: number; score_low: number; score_high: number; batting_team: string; bowling_team: string; }
interface PerfResult { label: string; thresholds: { poor_below: number; good_above: number }; input_stats: Record<string, number>; }
type TabId = "winner" | "score" | "player";

const css = `
.cc-wrap{min-height:100vh;background:linear-gradient(160deg,#060a14 0%,#0c1222 40%,#0a0f1e 100%);padding:2.5rem 2rem;font-family:'Inter','Segoe UI',sans-serif;color:#e2e8f0}
.cc-head{font-size:2.2rem;font-weight:800;text-align:center;margin-bottom:.3rem;background:linear-gradient(90deg,#f59e0b,#fbbf24,#f7971e);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.cc-sub{text-align:center;color:#475569;font-size:.88rem;margin-bottom:2rem}

/* Tabs */
.cc-tabs{display:flex;justify-content:center;gap:.35rem;margin-bottom:2rem;background:rgba(255,255,255,.02);border-radius:14px;padding:.3rem;border:1px solid rgba(255,255,255,.04);width:fit-content;margin-left:auto;margin-right:auto}
.cc-tab{padding:.6rem 1.3rem;border-radius:10px;border:1px solid transparent;background:transparent;color:#475569;font-weight:600;font-size:.85rem;cursor:pointer;transition:all .25s;font-family:'Inter',sans-serif;white-space:nowrap}
.cc-tab:hover{color:#94a3b8}
.cc-tab--on{background:rgba(0,198,255,.08);color:#fff;border-color:rgba(0,198,255,.25);box-shadow:0 0 20px rgba(0,114,255,.1),inset 0 0 12px rgba(0,198,255,.04)}

/* Two-pane */
.cc-panes{display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;max-width:1100px;margin:0 auto}
@media(max-width:860px){.cc-panes{grid-template-columns:1fr}}

/* Glass card */
.cc-glass{background:rgba(255,255,255,.03);backdrop-filter:blur(20px);border-radius:20px;border:1px solid rgba(255,255,255,.06);padding:1.75rem;box-shadow:0 4px 28px rgba(0,0,0,.3);transition:border-color .3s}
.cc-glass:hover{border-color:rgba(0,198,255,.08)}

/* Form */
.cc-ftitle{font-size:1rem;font-weight:600;color:#94a3b8;margin-bottom:1.25rem;display:flex;align-items:center;gap:.45rem}
.cc-fgrid{display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.25rem}
@media(max-width:520px){.cc-fgrid{grid-template-columns:1fr}}
.cc-fg{display:flex;flex-direction:column;gap:.3rem}
.cc-fg--full{grid-column:1/-1}
.cc-lbl{font-size:.7rem;font-weight:600;color:#475569;text-transform:uppercase;letter-spacing:1.2px}
.cc-sel-wrap{display:flex;align-items:center;gap:.55rem;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:10px;padding:.4rem .6rem;transition:border-color .2s}
.cc-sel-wrap:focus-within{border-color:rgba(0,198,255,.25);box-shadow:0 0 12px rgba(0,114,255,.06)}
.cc-logo-xs{width:24px;height:24px;object-fit:contain;flex-shrink:0}
.cc-sel{flex:1;background:transparent;border:none;color:#e2e8f0;font-size:.88rem;font-family:'Inter',sans-serif;outline:none;cursor:pointer}
.cc-sel option{background:#1e293b;color:#e2e8f0}
.cc-inp{padding:.65rem .9rem;border-radius:10px;border:1px solid rgba(255,255,255,.06);background:rgba(255,255,255,.03);color:#e2e8f0;font-size:.9rem;font-family:'Inter',sans-serif;outline:none;transition:border-color .2s}
.cc-inp:focus{border-color:rgba(0,198,255,.25)}

/* Submit */
.cc-btn{width:100%;padding:.8rem;border-radius:12px;border:none;background:linear-gradient(135deg,#00c6ff,#0072ff);color:#fff;font-weight:700;font-size:.95rem;cursor:pointer;font-family:'Inter',sans-serif;transition:opacity .2s,transform .15s;position:relative;overflow:hidden}
.cc-btn:disabled{opacity:.5;pointer-events:none}
.cc-btn:hover{transform:translateY(-1px)}
.cc-val{text-align:center;font-size:.82rem;color:#f87171;margin-bottom:.6rem}

/* Scanner animation */
@keyframes scanline{0%{top:-2px}100%{top:calc(100% + 2px)}}
.cc-scanning{position:relative;overflow:hidden}
.cc-scanning::after{content:'';position:absolute;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,#00c6ff,transparent);animation:scanline 1.5s linear infinite;pointer-events:none}

/* Right pane - result */
.cc-result-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:300px;text-align:center;gap:.75rem}
.cc-result-empty-icon{font-size:3rem;opacity:.15}
.cc-result-empty-text{color:#334155;font-size:.9rem;font-style:italic}

.cc-rlabel{font-size:.72rem;font-weight:600;color:#475569;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:.75rem;text-align:center}

/* Winner */
.cc-win-banner{display:flex;align-items:center;justify-content:center;gap:1rem;margin-bottom:1.25rem}
.cc-win-logo{width:56px;height:56px;object-fit:contain;filter:drop-shadow(0 4px 12px rgba(245,158,11,.2))}
.cc-win-name{font-size:1.4rem;font-weight:800;background:linear-gradient(135deg,#f59e0b,#fbbf24);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.cc-prob{margin-bottom:.75rem}
.cc-prob-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:.25rem;font-size:.82rem}
.cc-prob-team{display:flex;align-items:center;gap:.4rem}
.cc-prob-logo{width:20px;height:20px;object-fit:contain}
.cc-prob-bar{height:8px;border-radius:4px;background:rgba(255,255,255,.05);overflow:hidden}
.cc-prob-fill{height:100%;border-radius:4px;transition:width .8s ease}

/* Score */
.cc-score-big{font-size:3.5rem;font-weight:800;text-align:center;line-height:1;background:linear-gradient(135deg,#00c6ff,#0072ff);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:.3rem}
.cc-score-range{text-align:center;font-size:.9rem;color:#64748b;margin-bottom:.4rem}
.cc-score-teams{display:flex;align-items:center;justify-content:center;gap:.5rem;font-size:.82rem;color:#64748b;margin-bottom:1rem}
.cc-score-logo{width:22px;height:22px;object-fit:contain}

/* Player perf */
.cc-perf-avatar{width:76px;height:76px;border-radius:50%;margin:0 auto .6rem;display:block}
.cc-perf-avatar--good{border:3px solid rgba(16,185,129,.4);box-shadow:0 0 24px rgba(16,185,129,.15)}
.cc-perf-avatar--average{border:3px solid rgba(245,158,11,.4);box-shadow:0 0 24px rgba(245,158,11,.15)}
.cc-perf-avatar--poor{border:3px solid rgba(239,68,68,.4);box-shadow:0 0 24px rgba(239,68,68,.15)}
.cc-perf-badge{display:inline-block;padding:.5rem 1.8rem;border-radius:24px;font-size:1rem;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:1rem}
.cc-perf-badge--good{background:rgba(16,185,129,.12);border:1px solid rgba(16,185,129,.3);color:#34d399;box-shadow:0 0 20px rgba(16,185,129,.08)}
.cc-perf-badge--average{background:rgba(245,158,11,.12);border:1px solid rgba(245,158,11,.3);color:#fbbf24;box-shadow:0 0 20px rgba(245,158,11,.08)}
.cc-perf-badge--poor{background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.3);color:#f87171;box-shadow:0 0 20px rgba(239,68,68,.08)}
.cc-perf-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(90px,1fr));gap:.6rem;margin-top:.75rem}
.cc-perf-sv{font-size:1.1rem;font-weight:700;color:#e2e8f0;text-align:center}
.cc-perf-sl{font-size:.6rem;font-weight:600;color:#475569;text-transform:uppercase;letter-spacing:.8px;margin-top:.1rem;text-align:center}

/* Insight box */
.cc-insight{margin-top:1.25rem;padding:1rem;border-radius:12px;background:rgba(0,198,255,.04);border:1px solid rgba(0,198,255,.1)}
.cc-insight-title{font-size:.7rem;font-weight:700;color:#0ea5e9;text-transform:uppercase;letter-spacing:1.2px;margin-bottom:.4rem;display:flex;align-items:center;gap:.3rem}
.cc-insight-text{font-size:.82rem;color:#94a3b8;line-height:1.55}

.cc-err{text-align:center;color:#f87171;font-size:.88rem;margin-top:.75rem}

/* Autocomplete */
.cc-ac-wrap{position:relative}
.cc-ac-dropdown{position:absolute;top:calc(100% + 4px);left:0;right:0;z-index:50;background:rgba(15,23,42,.96);backdrop-filter:blur(20px);border:1px solid rgba(0,198,255,.15);border-radius:12px;max-height:320px;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,.4)}
.cc-ac-item{padding:.65rem 1rem;cursor:pointer;font-size:.88rem;color:#cbd5e1;display:flex;align-items:center;gap:.6rem;transition:background .15s}
.cc-ac-item:first-child{border-radius:12px 12px 0 0}
.cc-ac-item:last-child{border-radius:0 0 12px 12px}
.cc-ac-item:hover{background:rgba(0,198,255,.08);color:#fff}
.cc-ac-item img{width:28px;height:28px;border-radius:50%;flex-shrink:0;border:1px solid rgba(255,255,255,.08)}
`;

export default function Predictions() {
  const [tab, setTab] = useState<TabId>("winner");

  // Winner state
  const [w1, sw1] = useState(TEAMS[5]); const [w2, sw2] = useState(TEAMS[0]);
  const [wc, swc] = useState(CITIES[0]); const [wt, swt] = useState(TEAMS[5]);
  const [wd, swd] = useState("bat");
  const [wL, swL] = useState(false); const [wR, swR] = useState<WinnerResult|null>(null);
  const [wE, swE] = useState<string|null>(null); const [wV, swV] = useState<string|null>(null);

  // Score state
  const [sb, ssb] = useState(TEAMS[5]); const [so, sso] = useState(TEAMS[0]);
  const [sc, ssc] = useState(CITIES[0]); const [ss, sss] = useState(2024);
  const [st, sst] = useState(TEAMS[5]); const [sd, ssd] = useState("bat");
  const [sL, ssL] = useState(false); const [sR, ssR] = useState<ScoreResult|null>(null);
  const [sE, ssE] = useState<string|null>(null); const [sV, ssV] = useState<string|null>(null);

  // Player state
  const [pn, spn] = useState(""); const [pL, spL] = useState(false);
  const [pR, spR] = useState<PerfResult | null>(null);
  const [pE, spE] = useState<string | null>(null); const [pName, spName] = useState("");
  const [playerList, setPlayerList] = useState<string[]>([]);
  const [pSuggShow, setPSuggShow] = useState(false);
  const pAcRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchPlayerList().then(setPlayerList).catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pAcRef.current && !pAcRef.current.contains(e.target as Node)) setPSuggShow(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const pSuggestions = useMemo(() => {
    const term = pn.trim().toLowerCase();
    if (!term) return [];
    return playerList.filter(p => p.toLowerCase().includes(term)).slice(0, 10);
  }, [pn, playerList]);

  // Handlers
  const doWinner = () => {
    if (w1===w2){swV("Teams must be different.");return;}
    if (wt!==w1&&wt!==w2){swV("Toss Winner must be one of the teams.");return;}
    swV(null);swL(true);swE(null);swR(null);
    predictMatchWinner({team1:w1,team2:w2,city:wc,toss_winner:wt,toss_decision:wd})
      .then((d:WinnerResult)=>swR(d)).catch(()=>swE("Prediction failed.")).finally(()=>swL(false));
  };
  const doScore = () => {
    if (sb===so){ssV("Teams must be different.");return;}
    if (st!==sb&&st!==so){ssV("Toss Winner must be one of the teams.");return;}
    ssV(null);ssL(true);ssE(null);ssR(null);
    predictInningsScore({batting_team:sb,bowling_team:so,city:sc,season:ss,toss_winner:st,toss_decision:sd})
      .then((d:ScoreResult)=>ssR(d)).catch(()=>ssE("Score prediction failed.")).finally(()=>ssL(false));
  };
  const doPlayer = async () => {
    const name=pn.trim(); if(!name)return;
    spL(true);spE(null);spR(null);
    try{
      const s=await fetchPlayerStats(name); spName(name);
      const total_runs=s.total_runs??0, innings=s.total_innings??0, balls_faced=s.total_balls_faced??0;
      const fours=s.total_fours??0, sixes=s.total_sixes??0;
      const strike_rate=balls_faced>0?parseFloat(((total_runs/balls_faced)*100).toFixed(2)):0;
      const batting_avg=innings>0?parseFloat((total_runs/innings).toFixed(2)):0;
      const wickets=s.total_wickets??0, runs_conceded=s.total_runs_conceded??0, balls_bowled=s.total_balls_bowled??0;
      const economy=balls_bowled>0?parseFloat(((runs_conceded/balls_bowled)*6).toFixed(2)):0;
      const bowling_avg=wickets>0?parseFloat((runs_conceded/wickets).toFixed(2)):0;
      const perf:PerfResult=await predictPlayerPerformance({innings,balls_faced,total_runs,strike_rate,batting_avg,fours,sixes,wickets,economy,bowling_avg});
      spR(perf);
    }catch(e:any){
      if(e?.response?.status===404)spE(`Player "${name}" not found. Try "V Kohli", "JJ Bumrah".`);
      else spE("Classification failed.");
    }finally{spL(false);}
  };

  const handlePlayerSelect = (name: string) => {
    spn(name);
    setPSuggShow(false);
    // Need to call doPlayer with the selected name directly
    (async () => {
      spL(true); spE(null); spR(null);
      try {
        const s = await fetchPlayerStats(name); spName(name);
        const total_runs = s.total_runs ?? 0, innings = s.total_innings ?? 0, balls_faced = s.total_balls_faced ?? 0;
        const fours = s.total_fours ?? 0, sixes = s.total_sixes ?? 0;
        const strike_rate = balls_faced > 0 ? parseFloat(((total_runs / balls_faced) * 100).toFixed(2)) : 0;
        const batting_avg = innings > 0 ? parseFloat((total_runs / innings).toFixed(2)) : 0;
        const wickets = s.total_wickets ?? 0, runs_conceded = s.total_runs_conceded ?? 0, balls_bowled = s.total_balls_bowled ?? 0;
        const economy = balls_bowled > 0 ? parseFloat(((runs_conceded / balls_bowled) * 6).toFixed(2)) : 0;
        const bowling_avg = wickets > 0 ? parseFloat((runs_conceded / wickets).toFixed(2)) : 0;
        const perf: PerfResult = await predictPlayerPerformance({ innings, balls_faced, total_runs, strike_rate, batting_avg, fours, sixes, wickets, economy, bowling_avg });
        spR(perf);
      } catch (e: any) {
        if (e?.response?.status === 404) spE(`Player "${name}" not found.`);
        else spE("Classification failed.");
      } finally { spL(false); }
    })();
  };

  // Render helpers
  const teamSel = (label:string,value:string,onChange:(v:string)=>void,opts:string[],full=false) => (
    <div className={`cc-fg${full?" cc-fg--full":""}`}>
      <label className="cc-lbl">{label}</label>
      <div className="cc-sel-wrap">
        {TEAMS.includes(value)&&<img className="cc-logo-xs" src={getTeamLogo(value)} alt=""/>}
        <select className="cc-sel" value={value} onChange={e=>onChange(e.target.value)}>
          {opts.map(o=><option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    </div>
  );

  const emptyResult = (icon:string,text:string) => (
    <div className="cc-result-empty">
      <div className="cc-result-empty-icon">{icon}</div>
      <div className="cc-result-empty-text">{text}</div>
    </div>
  );

  // Tab content
  const renderWinner = () => (
    <div className="cc-panes">
      <div className={`cc-glass${wL?" cc-scanning":""}`}>
        <div className="cc-ftitle">🏆 Match Winner Predictor</div>
        <div className="cc-fgrid">
          {teamSel("Team 1",w1,v=>{sw1(v);if(wt!==v&&wt!==w2)swt(v);},TEAMS)}
          {teamSel("Team 2",w2,v=>{sw2(v);if(wt!==w1&&wt!==v)swt(v);},TEAMS)}
          {teamSel("Venue",wc,swc,CITIES)}
          {teamSel("Toss Winner",wt,swt,[w1,w2])}
          {teamSel("Toss Decision",wd,swd,["bat","field"],true)}
        </div>
        {wV&&<p className="cc-val">⚠️ {wV}</p>}
        <button className="cc-btn" disabled={wL} onClick={doWinner}>{wL?"⏳ Analysing…":"🏆 Predict Winner"}</button>
        {wE&&<p className="cc-err">❌ {wE}</p>}
      </div>
      <div className="cc-glass">
        {!wR&&!wL&&emptyResult("🎯","Configure match parameters and run the prediction engine")}
        {wL&&emptyResult("⚡","Neural network processing…")}
        {wR&&(<>
          <p className="cc-rlabel">Predicted Winner</p>
          <div className="cc-win-banner">
            <img className="cc-win-logo" src={getTeamLogo(wR.predicted_winner)} alt=""/>
            <h3 className="cc-win-name">{wR.predicted_winner}</h3>
          </div>
          <div className="cc-prob">
            <div className="cc-prob-head">
              <span className="cc-prob-team"><img className="cc-prob-logo" src={getTeamLogo(wR.team1)} alt=""/>{wR.team1}</span>
              <span style={{color:"#00c6ff",fontWeight:700}}>{wR.team1_prob}%</span>
            </div>
            <div className="cc-prob-bar"><div className="cc-prob-fill" style={{width:`${wR.team1_prob}%`,background:"linear-gradient(90deg,#00c6ff,#0072ff)"}}/></div>
          </div>
          <div className="cc-prob">
            <div className="cc-prob-head">
              <span className="cc-prob-team"><img className="cc-prob-logo" src={getTeamLogo(wR.team2)} alt=""/>{wR.team2}</span>
              <span style={{color:"#f59e0b",fontWeight:700}}>{wR.team2_prob}%</span>
            </div>
            <div className="cc-prob-bar"><div className="cc-prob-fill" style={{width:`${wR.team2_prob}%`,background:"linear-gradient(90deg,#f59e0b,#ef4444)"}}/></div>
          </div>
          <div className="cc-insight">
            <div className="cc-insight-title">🤖 AI Analyst Insight</div>
            <p className="cc-insight-text">
              The model {wR.team1_prob>65?"heavily favors":wR.team1_prob>55?"slightly favors":"sees a close contest for"}{" "}
              <strong>{wR.predicted_winner}</strong> given the toss decision to <strong>{wd}</strong> at <strong>{wc}</strong>,
              exploiting historical win-rate advantages. The probability spread of{" "}
              <strong>{Math.abs(wR.team1_prob-wR.team2_prob).toFixed(1)}%</strong> suggests{" "}
              {Math.abs(wR.team1_prob-wR.team2_prob)>20?"a dominant edge":"a competitive match ahead"}.
            </p>
          </div>
        </>)}
      </div>
    </div>
  );

  const renderScore = () => (
    <div className="cc-panes">
      <div className={`cc-glass${sL?" cc-scanning":""}`}>
        <div className="cc-ftitle">🏏 Innings Score Predictor</div>
        <div className="cc-fgrid">
          {teamSel("Batting Team",sb,v=>{ssb(v);if(st!==v&&st!==so)sst(v);},TEAMS)}
          {teamSel("Bowling Team",so,v=>{sso(v);if(st!==sb&&st!==v)sst(v);},TEAMS)}
          {teamSel("Venue",sc,ssc,CITIES)}
          <div className="cc-fg">
            <label className="cc-lbl">Season</label>
            <div className="cc-sel-wrap">
              <select className="cc-sel" value={ss} onChange={e=>sss(Number(e.target.value))}>
                {Array.from({length:17},(_,i)=>2008+i).map(y=><option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
          {teamSel("Toss Winner",st,sst,[sb,so])}
          {teamSel("Toss Decision",sd,ssd,["bat","field"],true)}
        </div>
        {sV&&<p className="cc-val">⚠️ {sV}</p>}
        <button className="cc-btn" disabled={sL} onClick={doScore}>{sL?"⏳ Computing…":"🏏 Predict Score"}</button>
        {sE&&<p className="cc-err">❌ {sE}</p>}
      </div>
      <div className="cc-glass">
        {!sR&&!sL&&emptyResult("📊","Set match conditions and predict the first innings total")}
        {sL&&emptyResult("⚡","Running regression model…")}
        {sR&&(<>
          <p className="cc-rlabel">Predicted 1st Innings Score</p>
          <div className="cc-score-big">{sR.predicted_score}</div>
          <p className="cc-score-range">Likely range: {sR.score_low} – {sR.score_high}</p>
          <div className="cc-score-teams">
            <img className="cc-score-logo" src={getTeamLogo(sR.batting_team)} alt=""/>
            <span>{sR.batting_team}</span>
            <span style={{color:"#334155"}}>vs</span>
            <img className="cc-score-logo" src={getTeamLogo(sR.bowling_team)} alt=""/>
            <span>{sR.bowling_team}</span>
          </div>
          <div className="cc-insight">
            <div className="cc-insight-title">🤖 AI Analyst Insight</div>
            <p className="cc-insight-text">
              Projected score of <strong>{sR.predicted_score}</strong> reflects <strong>{sR.batting_team}</strong>'s
              historical run-rate metrics at <strong>{sc}</strong> under current toss conditions ({sd} first).
              The {sR.predicted_score>=170?"above-par":"competitive"} projection factors in venue dimensions,
              season trends, and bowling attack strength of <strong>{sR.bowling_team}</strong>.
            </p>
          </div>
        </>)}
      </div>
    </div>
  );

  const renderPlayer = () => {
    const cls = pR? pR.label==="Good"?"good":pR.label==="Average"?"average":"poor" : "";
    return (
      <div className="cc-panes">
        <div className={`cc-glass${pL?" cc-scanning":""}`}>
          <div className="cc-ftitle">🧠 Player Performance Classifier</div>
          <div className="cc-fgrid" style={{gridTemplateColumns:"1fr"}}>
            <div className="cc-fg cc-fg--full">
              <label className="cc-lbl">Player Name</label>
              <div className="cc-ac-wrap" ref={pAcRef}>
                <input className="cc-inp" type="text" placeholder='Search player (e.g. "Bumrah", "Kohli")'
                  value={pn} onChange={e=>{spn(e.target.value);setPSuggShow(true);}} onFocus={()=>{if(pn.trim())setPSuggShow(true);}} onKeyDown={e=>e.key==="Enter"&&doPlayer()}/>
                {pSuggShow && pSuggestions.length > 0 && (
                  <div className="cc-ac-dropdown">
                    {pSuggestions.map(name => (
                      <div className="cc-ac-item" key={name} onMouseDown={() => handlePlayerSelect(name)}>
                        <img src={getPlayerAvatar(name, 56)} alt="" />
                        {name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <button className="cc-btn" disabled={pL} onClick={doPlayer}>{pL?"⏳ Classifying…":"🧠 Classify Performance"}</button>
          {pE&&<p className="cc-err">⚠️ {pE}</p>}
        </div>
        <div className="cc-glass">
          {!pR&&!pL&&emptyResult("🧬","Enter a player name to classify their career performance")}
          {pL&&emptyResult("⚡","Evaluating composite impact score…")}
          {pR&&(<div style={{textAlign:"center"}}>
            <img className={`cc-perf-avatar cc-perf-avatar--${cls}`} src={getPlayerAvatar(pName)} alt={pName}/>
            <p className="cc-rlabel">Career Performance Rating</p>
            <div>
              <span className={`cc-perf-badge cc-perf-badge--${cls}`}>
                {pR.label==="Good"?"🥇 ":pR.label==="Average"?"🥈 ":"🥉 "}{pR.label}
              </span>
            </div>
            <div className="cc-perf-stats">
              {Object.entries(pR.input_stats).map(([k,v])=>(
                <div key={k}><div className="cc-perf-sv">{typeof v==="number"?(Number.isInteger(v)?v:v.toFixed(1)):v}</div>
                <div className="cc-perf-sl">{k.replace(/_/g," ")}</div></div>
              ))}
            </div>
            <div className="cc-insight">
              <div className="cc-insight-title">🤖 AI Analyst Insight</div>
              <p className="cc-insight-text">
                Based on a composite impact score analyzing career runs, wickets, strike rate, and economy,{" "}
                <strong>{pName}</strong> is classified as <strong style={{color:cls==="good"?"#34d399":cls==="average"?"#fbbf24":"#f87171"}}>{pR.label}</strong>.
                {pR.label==="Good"?" This player consistently delivers match-winning performances across batting and bowling dimensions."
                :pR.label==="Average"?" Solid contributions across seasons with room for more consistent high-impact showings."
                :" Performance metrics suggest limited impact relative to opportunities — may benefit from role optimization."}
              </p>
            </div>
          </div>)}
        </div>
      </div>
    );
  };

  const tabs:{id:TabId;label:string;icon:string}[] = [
    {id:"winner",label:"Match Winner",icon:"🏆"},
    {id:"score",label:"Innings Score",icon:"🏏"},
    {id:"player",label:"Player Classifier",icon:"🧠"},
  ];

  return (<>
    <style>{css}</style>
    <div className="cc-wrap">
      <h1 className="cc-head">Prediction Command Center</h1>
      <p className="cc-sub">ML-powered analytics engine for match outcomes and player classification</p>
      <div className="cc-tabs">
        {tabs.map(t=>(
          <button key={t.id} className={`cc-tab${tab===t.id?" cc-tab--on":""}`} onClick={()=>setTab(t.id)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>
      {tab==="winner"&&renderWinner()}
      {tab==="score"&&renderScore()}
      {tab==="player"&&renderPlayer()}
    </div>
  </>);
}
