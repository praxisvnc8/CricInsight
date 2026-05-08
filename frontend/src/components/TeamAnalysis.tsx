import { useEffect, useMemo, useState } from "react";
import Chart from "react-apexcharts";
import { fetchMatches } from "../services/api";
import { getTeamLogo } from "../utils/teamLogos";
import type { ApexOptions } from "apexcharts";

interface Match {
  id:number;season:number;city:string|null;date:string;match_type:string|null;
  player_of_match:string|null;venue:string|null;team1:string;team2:string;
  toss_winner:string|null;toss_decision:string|null;winner:string|null;
  result:string|null;result_margin:number|null;target_runs:number|null;
  target_overs:number|null;super_over:string|null;method:string|null;
  umpire1:string|null;umpire2:string|null;
}

interface FranchiseInfo {
  name:string;captain:string;coach:string;owner:string;homeVenue:string;keyPlayers:string[];
}

const FRANCHISE_DETAILS: FranchiseInfo[] = [
  {name:"Chennai Super Kings",captain:"Ruturaj Gaikwad",coach:"Stephen Fleming",owner:"Chennai Super Kings Cricket Ltd.",homeVenue:"MA Chidambaram Stadium, Chennai",keyPlayers:["Ruturaj Gaikwad","Ravindra Jadeja","Matheesha Pathirana","Shivam Dube","Devon Conway"]},
  {name:"Delhi Capitals",captain:"KL Rahul",coach:"Ricky Ponting",owner:"GMR Group & JSW Group",homeVenue:"Arun Jaitley Stadium, Delhi",keyPlayers:["KL Rahul","Jake Fraser-McGurk","Kuldeep Yadav","Mitchell Starc","Tristan Stubbs"]},
  {name:"Gujarat Titans",captain:"Shubman Gill",coach:"Ashish Nehra",owner:"CVC Capital Partners",homeVenue:"Narendra Modi Stadium, Ahmedabad",keyPlayers:["Shubman Gill","Rashid Khan","Sai Sudharsan","Mohammed Siraj","Jos Buttler"]},
  {name:"Kolkata Knight Riders",captain:"Ajinkya Rahane",coach:"Chandrakant Pandit",owner:"Red Chillies Entertainment",homeVenue:"Eden Gardens, Kolkata",keyPlayers:["Sunil Narine","Andre Russell","Rinku Singh","Varun Chakaravarthy","Venkatesh Iyer"]},
  {name:"Lucknow Super Giants",captain:"Rishabh Pant",coach:"Justin Langer",owner:"RPSG Group",homeVenue:"Ekana Cricket Stadium, Lucknow",keyPlayers:["Rishabh Pant","Nicholas Pooran","Ravi Bishnoi","Avesh Khan","Quinton de Kock"]},
  {name:"Mumbai Indians",captain:"Hardik Pandya",coach:"Mark Boucher",owner:"Reliance Industries",homeVenue:"Wankhede Stadium, Mumbai",keyPlayers:["Jasprit Bumrah","Rohit Sharma","Suryakumar Yadav","Tilak Varma","Tim David"]},
  {name:"Punjab Kings",captain:"Shreyas Iyer",coach:"Trevor Bayliss",owner:"Mohit Burman & Preity Zinta",homeVenue:"PCA Stadium, Mohali",keyPlayers:["Shreyas Iyer","Kagiso Rabada","Arshdeep Singh","Marcus Stoinis","Prabhsimran Singh"]},
  {name:"Rajasthan Royals",captain:"Sanju Samson",coach:"Kumar Sangakkara",owner:"Emerging Media",homeVenue:"Sawai Mansingh Stadium, Jaipur",keyPlayers:["Sanju Samson","Yashasvi Jaiswal","Trent Boult","Shimron Hetmyer","Yuzvendra Chahal"]},
  {name:"Royal Challengers Bengaluru",captain:"Rajat Patidar",coach:"Andy Flower",owner:"United Spirits",homeVenue:"M. Chinnaswamy Stadium, Bengaluru",keyPlayers:["Virat Kohli","Rajat Patidar","Glenn Maxwell","Yash Dayal","Cameron Green"]},
  {name:"Sunrisers Hyderabad",captain:"Pat Cummins",coach:"Daniel Vettori",owner:"Sun TV Network",homeVenue:"Rajiv Gandhi Intl Stadium, Hyderabad",keyPlayers:["Travis Head","Heinrich Klaasen","Pat Cummins","Abhishek Sharma","Bhuvneshwar Kumar"]},
];

const css = `
.ta-wrap{min-height:100vh;background:linear-gradient(160deg,#060a14 0%,#0c1222 40%,#0a0f1e 100%);padding:2.5rem 2rem;font-family:'Inter','Segoe UI',sans-serif;color:#e2e8f0}
.ta-head{font-size:2.2rem;font-weight:800;text-align:center;margin-bottom:.3rem;background:linear-gradient(90deg,#f59e0b,#fbbf24,#f7971e);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.ta-sub{text-align:center;color:#475569;font-size:.88rem;margin-bottom:2.5rem}

/* Glass */
.ta-glass{background:rgba(255,255,255,.03);backdrop-filter:blur(18px);border-radius:20px;border:1px solid rgba(255,255,255,.06);padding:1.75rem;box-shadow:0 4px 24px rgba(0,0,0,.25);transition:border-color .3s}
.ta-glass:hover{border-color:rgba(0,198,255,.08)}

/* Selector row */
.ta-sel-row{display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;max-width:700px;margin:0 auto 2.5rem}
@media(max-width:600px){.ta-sel-row{grid-template-columns:1fr}}
.ta-sel-group{display:flex;flex-direction:column;gap:.35rem}
.ta-sel-lbl{font-size:.72rem;font-weight:600;color:#475569;text-transform:uppercase;letter-spacing:1.5px}
.ta-sel-wrap{display:flex;align-items:center;gap:.65rem;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:12px;padding:.5rem .75rem;transition:border-color .2s}
.ta-sel-wrap:focus-within{border-color:rgba(0,198,255,.25);box-shadow:0 0 12px rgba(0,114,255,.06)}
.ta-sel-logo{width:32px;height:32px;object-fit:contain;flex-shrink:0}
.ta-sel{flex:1;background:transparent;border:none;color:#e2e8f0;font-size:.92rem;font-family:'Inter',sans-serif;outline:none;cursor:pointer}
.ta-sel option{background:#1e293b;color:#e2e8f0}

/* Section */
.ta-section{max-width:1100px;margin:0 auto 2.5rem}
.ta-stitle{font-size:1.05rem;font-weight:600;color:#94a3b8;margin-bottom:1.25rem;display:flex;align-items:center;gap:.5rem}

/* KPI grid */
.ta-kpi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:1rem;margin-bottom:2rem}
.ta-kpi{background:rgba(255,255,255,.03);backdrop-filter:blur(14px);border-radius:16px;border:1px solid rgba(255,255,255,.05);padding:1.25rem 1rem;text-align:center;transition:transform .3s,box-shadow .3s}
.ta-kpi:hover{transform:translateY(-3px);box-shadow:0 6px 24px rgba(0,114,255,.08)}
.ta-kpi-val{font-size:2rem;font-weight:800;background:linear-gradient(135deg,#00c6ff,#0072ff);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.ta-kpi-val--warm{background:linear-gradient(135deg,#f59e0b,#ef4444);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.ta-kpi-lbl{margin-top:.3rem;font-size:.7rem;font-weight:600;color:#475569;text-transform:uppercase;letter-spacing:1.5px}

/* H2H banner */
.ta-h2h-banner{display:flex;align-items:center;justify-content:center;gap:2rem;margin-bottom:1.5rem;flex-wrap:wrap}
.ta-h2h-team{display:flex;flex-direction:column;align-items:center;gap:.4rem}
.ta-h2h-logo{width:64px;height:64px;object-fit:contain;filter:drop-shadow(0 4px 12px rgba(0,0,0,.3));transition:transform .3s}
.ta-h2h-logo:hover{transform:scale(1.08)}
.ta-h2h-name{font-size:.82rem;font-weight:600;color:#94a3b8;text-align:center;max-width:110px}
.ta-h2h-wins{font-size:2.2rem;font-weight:800}
.ta-h2h-vs{font-size:.82rem;font-weight:700;color:#334155;padding:.5rem .9rem;border-radius:10px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.05)}

/* Chart */
.ta-chart-wrap{max-width:480px;margin:0 auto}

/* Divider */
.ta-divider{max-width:1100px;margin:0 auto 2.5rem;border:none;border-top:1px solid rgba(255,255,255,.05)}

/* Franchise directory */
.ta-fran-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:1rem;max-width:1100px;margin:0 auto 1.5rem}
.ta-fran-card{display:flex;flex-direction:column;align-items:center;gap:.5rem;padding:1.25rem 1rem;background:rgba(255,255,255,.03);backdrop-filter:blur(14px);border-radius:16px;border:1px solid rgba(255,255,255,.05);cursor:pointer;transition:transform .25s,border-color .25s,box-shadow .25s}
.ta-fran-card:hover{transform:translateY(-3px);border-color:rgba(0,198,255,.15);box-shadow:0 6px 24px rgba(0,0,0,.2)}
.ta-fran-card--active{border-color:rgba(245,158,11,.3);box-shadow:0 0 20px rgba(245,158,11,.08)}
.ta-fran-logo{width:52px;height:52px;object-fit:contain;transition:transform .25s}
.ta-fran-card:hover .ta-fran-logo{transform:scale(1.1)}
.ta-fran-name{font-size:.78rem;font-weight:600;color:#94a3b8;text-align:center}

/* Franchise detail panel */
.ta-detail{max-width:1100px;margin:0 auto 2rem;overflow:hidden;transition:max-height .4s ease,opacity .3s ease}
.ta-detail--closed{max-height:0;opacity:0;margin-bottom:0}
.ta-detail--open{max-height:600px;opacity:1}
.ta-detail-inner{display:grid;grid-template-columns:auto 1fr;gap:2rem;align-items:start;padding:1.75rem}
@media(max-width:600px){.ta-detail-inner{grid-template-columns:1fr;text-align:center}}
.ta-detail-logo{width:88px;height:88px;object-fit:contain;filter:drop-shadow(0 4px 16px rgba(245,158,11,.15))}
.ta-detail-info{display:flex;flex-direction:column;gap:.6rem}
.ta-detail-name{font-size:1.3rem;font-weight:800;background:linear-gradient(135deg,#f59e0b,#fbbf24);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.ta-detail-row{display:flex;gap:.5rem;font-size:.85rem}
.ta-detail-key{color:#475569;font-weight:600;min-width:90px}
.ta-detail-val{color:#cbd5e1;font-weight:500}
.ta-detail-players{display:flex;flex-wrap:wrap;gap:.4rem;margin-top:.3rem}
.ta-detail-player{padding:.25rem .7rem;border-radius:8px;font-size:.75rem;font-weight:600;background:rgba(0,198,255,.06);border:1px solid rgba(0,198,255,.12);color:#94a3b8}

/* States */
.ta-center{display:flex;justify-content:center;align-items:center;min-height:60vh}
.ta-error-box{display:flex;flex-direction:column;justify-content:center;align-items:center;min-height:60vh;gap:1rem}
.ta-retry{padding:.65rem 1.8rem;border-radius:10px;border:none;background:linear-gradient(135deg,#f59e0b,#fbbf24);color:#1e1b4b;font-weight:700;cursor:pointer;font-size:.9rem;font-family:'Inter',sans-serif}
.ta-prompt{display:flex;justify-content:center;align-items:center;min-height:15vh;color:#334155;font-style:italic}
`;

export default function TeamAnalysis() {
  const [matches,setMatches]=useState<Match[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState<string|null>(null);
  const [primary,setPrimary]=useState("");
  const [opponent,setOpponent]=useState("");
  const [selectedFran,setSelectedFran]=useState<string|null>(null);

  const load=()=>{setLoading(true);setError(null);
    fetchMatches().then((d:Match[])=>setMatches(d)).catch(()=>setError("Could not load match data.")).finally(()=>setLoading(false));};
  useEffect(()=>{load();},[]);

  const teams=useMemo(()=>{const s=new Set<string>();matches.forEach(m=>{s.add(m.team1);s.add(m.team2)});return Array.from(s).sort();},[matches]);
  useEffect(()=>{if(teams.length>=2&&!primary){setPrimary(teams[0]);setOpponent(teams[1]);}},[teams,primary]);

  const teamKpis=useMemo(()=>{
    if(!primary)return null;
    const tm=matches.filter(m=>m.team1===primary||m.team2===primary);
    const total=tm.length; const wins=tm.filter(m=>m.winner===primary).length;
    const pct=total>0?((wins/total)*100).toFixed(1):"0.0";
    const tw=tm.filter(m=>m.toss_winner===primary).length;
    const tww=tm.filter(m=>m.toss_winner===primary&&m.winner===primary).length;
    const tc=tw>0?((tww/tw)*100).toFixed(1):"0.0";
    return{total,wins,pct,tc};
  },[matches,primary]);

  const h2h=useMemo(()=>{
    if(!primary||!opponent||primary===opponent)return null;
    const hm=matches.filter(m=>(m.team1===primary&&m.team2===opponent)||(m.team1===opponent&&m.team2===primary));
    const t=hm.length;const pw=hm.filter(m=>m.winner===primary).length;
    const ow=hm.filter(m=>m.winner===opponent).length;const nr=t-pw-ow;
    return{total:t,primaryWins:pw,opponentWins:ow,noResult:nr};
  },[matches,primary,opponent]);

  const donut=useMemo(()=>{
    if(!h2h||h2h.total===0)return null;
    const labels=[primary,opponent];const series=[h2h.primaryWins,h2h.opponentWins];
    if(h2h.noResult>0){labels.push("No Result");series.push(h2h.noResult);}
    const options:ApexOptions={
      chart:{type:"donut",background:"transparent"},theme:{mode:"dark"},labels,
      colors:["#00c6ff","#f59e0b","#334155"],stroke:{width:3,colors:["#0a0f1e"]},
      legend:{position:"bottom",labels:{colors:"#94a3b8"},fontSize:"12px"},
      dataLabels:{enabled:true,style:{fontSize:"14px",fontWeight:700},dropShadow:{enabled:false}},
      plotOptions:{pie:{donut:{size:"62%",labels:{show:true,name:{fontSize:"13px",color:"#cbd5e1"},
        value:{fontSize:"24px",fontWeight:800,color:"#e2e8f0"},
        total:{show:true,label:"Total",fontSize:"12px",color:"#475569"}}}}},
      tooltip:{theme:"dark"},
    };
    return{options,series};
  },[h2h,primary,opponent]);

  const activeFran=FRANCHISE_DETAILS.find(f=>f.name===selectedFran)||null;

  if(loading)return(<><style>{css}</style><div className="ta-wrap ta-center"><span style={{opacity:.7}}>⏳ Loading…</span></div></>);
  if(error)return(<><style>{css}</style><div className="ta-wrap ta-error-box"><span style={{color:"#f87171"}}>❌ {error}</span><button className="ta-retry" onClick={load}>Retry</button></div></>);

  return(<>
    <style>{css}</style>
    <div className="ta-wrap">
      <h1 className="ta-head">Team Analysis</h1>
      <p className="ta-sub">Head-to-head engine and franchise intelligence</p>

      {/* Selectors */}
      <div className="ta-sel-row">
        <div className="ta-sel-group">
          <label className="ta-sel-lbl">Primary Team</label>
          <div className="ta-sel-wrap">
            <img className="ta-sel-logo" src={getTeamLogo(primary)} alt=""/>
            <select className="ta-sel" value={primary} onChange={e=>setPrimary(e.target.value)}>
              {teams.map(t=><option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div className="ta-sel-group">
          <label className="ta-sel-lbl">Opponent</label>
          <div className="ta-sel-wrap">
            <img className="ta-sel-logo" src={getTeamLogo(opponent)} alt=""/>
            <select className="ta-sel" value={opponent} onChange={e=>setOpponent(e.target.value)}>
              {teams.filter(t=>t!==primary).map(t=><option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* KPIs */}
      {teamKpis&&(
        <div className="ta-section">
          <div className="ta-stitle">
            <img src={getTeamLogo(primary)} alt="" style={{width:24,height:24,objectFit:"contain"}}/>
            {primary} — Overall Stats
          </div>
          <div className="ta-kpi-grid">
            <div className="ta-kpi"><div className="ta-kpi-val">{teamKpis.total}</div><div className="ta-kpi-lbl">Matches</div></div>
            <div className="ta-kpi"><div className="ta-kpi-val">{teamKpis.wins}</div><div className="ta-kpi-lbl">Wins</div></div>
            <div className="ta-kpi"><div className="ta-kpi-val">{teamKpis.pct}%</div><div className="ta-kpi-lbl">Win %</div></div>
            <div className="ta-kpi"><div className="ta-kpi-val ta-kpi-val--warm">{teamKpis.tc}%</div><div className="ta-kpi-lbl">Toss→Win</div></div>
          </div>
        </div>
      )}

      {/* H2H */}
      {primary===opponent?(
        <div className="ta-prompt">Select two different teams to see head-to-head stats.</div>
      ):h2h&&h2h.total>0?(
        <div className="ta-section">
          <div className="ta-stitle">⚔️ Head-to-Head</div>
          <div className="ta-glass">
            <div className="ta-h2h-banner">
              <div className="ta-h2h-team">
                <img className="ta-h2h-logo" src={getTeamLogo(primary)} alt=""/>
                <div className="ta-h2h-name">{primary}</div>
                <div className="ta-h2h-wins" style={{color:"#00c6ff"}}>{h2h.primaryWins}</div>
              </div>
              <div className="ta-h2h-vs">{h2h.total} matches</div>
              <div className="ta-h2h-team">
                <img className="ta-h2h-logo" src={getTeamLogo(opponent)} alt=""/>
                <div className="ta-h2h-name">{opponent}</div>
                <div className="ta-h2h-wins" style={{color:"#f59e0b"}}>{h2h.opponentWins}</div>
              </div>
            </div>
            {donut&&<div className="ta-chart-wrap"><Chart options={donut.options} series={donut.series} type="donut" height={320}/></div>}
          </div>
        </div>
      ):(
        <div className="ta-prompt">No head-to-head matches found.</div>
      )}

      <hr className="ta-divider"/>

      {/* Franchise Directory */}
      <div className="ta-section">
        <div className="ta-stitle">🏢 Franchise Directory</div>
        <div className="ta-fran-grid">
          {FRANCHISE_DETAILS.map(f=>(
            <div key={f.name} className={`ta-fran-card${selectedFran===f.name?" ta-fran-card--active":""}`}
              onClick={()=>setSelectedFran(selectedFran===f.name?null:f.name)}>
              <img className="ta-fran-logo" src={getTeamLogo(f.name)} alt=""/>
              <span className="ta-fran-name">{f.name}</span>
            </div>
          ))}
        </div>

        {/* Detail panel */}
        <div className={`ta-glass ta-detail ${activeFran?"ta-detail--open":"ta-detail--closed"}`}>
          {activeFran&&(
            <div className="ta-detail-inner">
              <img className="ta-detail-logo" src={getTeamLogo(activeFran.name)} alt=""/>
              <div className="ta-detail-info">
                <div className="ta-detail-name">{activeFran.name}</div>
                <div className="ta-detail-row"><span className="ta-detail-key">Captain</span><span className="ta-detail-val">{activeFran.captain}</span></div>
                <div className="ta-detail-row"><span className="ta-detail-key">Coach</span><span className="ta-detail-val">{activeFran.coach}</span></div>
                <div className="ta-detail-row"><span className="ta-detail-key">Owner</span><span className="ta-detail-val">{activeFran.owner}</span></div>
                <div className="ta-detail-row"><span className="ta-detail-key">Home</span><span className="ta-detail-val">{activeFran.homeVenue}</span></div>
                <div className="ta-detail-row">
                  <span className="ta-detail-key">Key Players</span>
                  <div className="ta-detail-players">
                    {activeFran.keyPlayers.map(p=><span className="ta-detail-player" key={p}>{p}</span>)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </>);
}
