import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { 
    FaArrowRight, FaArrowLeft, FaShieldAlt, FaBolt, FaStar, 
    FaMagic, FaCrown, FaTshirt, FaSpinner 
} from "react-icons/fa";
import TournamentHeader from '../utils/TournamentHeader';

const TeamHistory = () => {
    const { teamId } = useParams();
    const navigate = useNavigate();
    const [currentGw, setCurrentGw] = useState(null);
    const [teamInfo, setTeamInfo] = useState(null); 
    const [gwData, setGwData] = useState(null);
    const [chipsHistory, setChipsHistory] = useState({ p1: {}, p2: {} });
    const [loading, setLoading] = useState(false);
    const [restricted, setRestricted] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [leagueLogo, setLeagueLogo] = useState('');

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const CHIPS = {
        'theBest': { label: 'The Best', icon: <FaStar color="gold" /> },
        'tripleCaptain': { label: 'Triple Captain', icon: <FaBolt color="orange" /> },
        'benchBoost': { label: 'Bench Boost', icon: <FaShieldAlt color="green" /> },
        'freeHit': { label: 'Free Hit', icon: <FaMagic color="purple" /> }
    };

    useEffect(() => {
        const initStatus = async () => {
            try {
                const { data } = await API.get('/gameweek/status');
                setCurrentGw(data.id || 1);
            } catch (error) { setCurrentGw(1); }
        };
        initStatus();
    }, []);

    useEffect(() => {
        const fetchFullHistory = async () => {
            try {
                const { data } = await API.get(`/leagues/team-history-full/${teamId}`);
                if (data.team) {
                    setTeamInfo(data.team);
                    // جلب شعار البطولة من بيانات الدوري
                    if (data.team.leagueId?.logoUrl) {
                        setLeagueLogo(data.team.leagueId.logoUrl);
                    } else {
                        try {
                            const { data: lData } = await API.get('/leagues/me');
                            if (lData.logoUrl) setLeagueLogo(lData.logoUrl);
                        } catch (e) { console.log("League logo load fail"); }
                    }
                }
                const usedChips = { p1: {}, p2: {} };
                if (data.history) {
                    data.history.forEach(gw => {
                        if (gw.activeChip && gw.activeChip !== 'none' && CHIPS[gw.activeChip]) {
                            if (gw.gameweek <= 19) usedChips.p1[gw.activeChip] = gw.gameweek;
                            else usedChips.p2[gw.activeChip] = gw.gameweek;
                        }
                    });
                }
                setChipsHistory(usedChips);
            } catch (error) { console.error(error); }
        };
        fetchFullHistory();
    }, [teamId]);

    useEffect(() => {
        if (!currentGw) return;
        const fetchGwData = async () => {
            setLoading(true); setRestricted(false);
            try {
                const { data } = await API.get(`/gameweek/team-data/${teamId}/${currentGw}`);
                if (data.restricted) setRestricted(true);
                else setGwData(data);
            } catch (error) {
                if(error.response?.status === 403) setRestricted(true);
            } finally { setLoading(false); }
        };
        fetchGwData();
    }, [currentGw, teamId]);

    const PlayerCard = ({ player, isSub = false }) => {
        const name = player.userId?.username || 'Unknown';
        const hits = player.transferCost || 0;
        const displayScore = player.finalScore ?? 0;
        const kitSize = isMobile ? (isSub ? 55 : 75) : (isSub ? 80 : 115);
        const cardWidth = isMobile ? (isSub ? '75px' : '85px') : '140px';

        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: cardWidth, margin: '2px 0', zIndex: 10 }}>
                <div style={{ position: 'relative' }}>
                    <div style={{ width: kitSize, height: kitSize }}>
                        <img 
                            src={`/kits/${teamInfo?.name || 'default'}.png`} 
                            style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }}
                            onError={(e) => { e.target.src = '/kits/default.png'; }} 
                        />
                    </div>
                    {player.isCaptain && (
                        <div style={{ position: 'absolute', top: '-10px', right: '-5px', zIndex: 15, textAlign: 'center' }}>
                            <FaCrown size={isMobile ? 18 : 32} color={gwData?.activeChip === 'tripleCaptain' ? "#00ff87" : "#ffd700"} />
                            {gwData?.activeChip === 'tripleCaptain' && (
                                <div style={{ color: '#00ff87', fontSize: '9px', fontWeight: '900', textShadow: '1px 1px 2px black', marginTop: '-4px' }}>x3</div>
                            )}
                        </div>
                    )}
                    {hits > 0 && (
                        <div style={{ position: 'absolute', top: '0', left: '-8px', background: '#d32f2f', color: 'white', borderRadius: '50%', width: isMobile ? '18px' : '22px', height: isMobile ? '18px' : '22px', fontSize: '9px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid white' }}>
                            -{hits}
                        </div>
                    )}
                </div>
                <div style={{ 
                    backgroundColor: '#37003c', color: 'white', padding: '2px 4px', borderRadius: '4px', 
                    fontSize: isMobile ? '9px' : '13px', marginTop: '4px', width: '100%', textAlign: 'center', 
                    borderBottom: player.isCaptain && gwData?.activeChip === 'theBest' ? '3px solid #ffd700' : '2px solid #00ff87', 
                    fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' 
                }}>
                    {name}
                </div>
                <div style={{ 
                    fontSize: isMobile ? '13px' : '20px', fontWeight: '900', color: '#fff', 
                    background: player.isCaptain ? '#000' : (isSub ? '#777' : '#4caf50'), 
                    border: player.isCaptain ? '1px solid #ffd700' : '1px solid white', 
                    padding: '0px 10px', borderRadius: '10px', marginTop: '2px', boxShadow: '0 4px 8px rgba(0,0,0,0.2)', 
                    minWidth: isMobile ? '35px' : '40px', textAlign: 'center' 
                }}>
                    {displayScore}
                </div>
            </div>
        );
    };

    if (!currentGw) return <div style={{textAlign:'center', padding:'100px'}}><FaSpinner className="spin" size={40} /></div>;

    return (
        <div style={{ padding: isMobile ? '10px' : '20px', background: '#f4f6f9', minHeight: '100vh', direction: 'rtl' }}>
            <TournamentHeader isMobile={isMobile} logoUrl={leagueLogo} />
            
            <div style={{ 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px',
                backgroundColor: '#fff', padding: '10px 15px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #eee'
            }}>
                <button onClick={() => navigate(-1)} style={{ background: '#f0f0f0', border: 'none', padding: '8px 12px', borderRadius: '10px', fontWeight: 'bold', cursor:'pointer' }}>⬅</button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h3 style={{ color: '#38003c', margin: 0, fontSize: isMobile ? '18px' : '22px', fontWeight: '800' }}>{teamInfo?.name}</h3>
                    <div style={{ width: isMobile ? '35px' : '45px', height: isMobile ? '35px' : '45px' }}>
                        <img 
                            src={teamInfo?.logoUrl || `/kits/${teamInfo?.name}.png`} 
                            alt="Crest" 
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                            onError={(e) => { e.target.src = '/kits/default.png'; }} 
                        />
                    </div>
                </div>
                <div style={{width:'40px'}}></div>
            </div>

            <div style={{ background: '#fff', padding: '15px', borderRadius: '15px', marginBottom: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#38003c', marginBottom: '10px', textAlign: 'center', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>📊 سجل الخواص المستعملة</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                    {Object.keys(CHIPS).map(chip => {
                        const gwP1 = chipsHistory.p1[chip]; const gwP2 = chipsHistory.p2[chip];
                        return (
                            <div key={chip} style={{ display: 'flex', gap: '4px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: gwP1 ? '#38003c' : '#eee', color: gwP1 ? '#fff' : '#aaa', padding: '4px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 'bold' }}>
                                    {CHIPS[chip].icon} {CHIPS[chip].label} (ذهاب) {gwP1 && `[${gwP1}]`}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: gwP2 ? '#00ff87' : '#eee', color: gwP2 ? '#38003c' : '#aaa', padding: '4px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 'bold' }}>
                                    {gwP2 && `[${gwP2}]`} (إياب)
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
                <button onClick={() => setCurrentGw(prev => Math.max(1, prev - 1))} disabled={currentGw <= 1} style={{ border: 'none', background: '#fff', padding: '12px', borderRadius: '50%', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', cursor: 'pointer' }}><FaArrowRight /></button>
                <div style={{ textAlign: 'center' }}>
                    <h2 style={{ margin: 0, fontSize: isMobile ? '24px' : '32px', color: '#38003c' }}>الجولة {currentGw}</h2>
                    {gwData && <div style={{ color: '#e91e63', fontWeight: 'bold', fontSize: '20px' }}>{gwData.stats?.totalPoints} ن</div>}
                </div>
                <button onClick={() => setCurrentGw(prev => Math.min(38, prev + 1))} disabled={currentGw >= 38} style={{ border: 'none', background: '#fff', padding: '12px', borderRadius: '50%', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', cursor: 'pointer' }}><FaArrowLeft /></button>
            </div>

            {loading ? <div style={{textAlign:'center'}}><FaSpinner className="spin" size={40} /></div> : 
             restricted ? (
                <div style={{ textAlign: 'center', padding: '50px 20px', background: '#fff', borderRadius: '25px', margin: '0 auto' }}>
                    <FaShieldAlt size={60} color="#d32f2f" />
                    <h3 style={{ color: '#d32f2f' }}>التشكيلة مخفية 🔒</h3>
                </div>
            ) : gwData && !gwData.noData ? (
                <div key={currentGw} className="pitch-fade-in" style={{ maxWidth: '850px', margin: '0 auto' }}>
                    {gwData.activeChip && gwData.activeChip !== 'none' && (
                        <div style={{ backgroundColor: '#38003c', color: '#00ff87', padding: '10px', borderRadius: '12px 12px 0 0', textAlign: 'center', fontWeight: 'bold', border: '2px solid #00ff87', borderBottom: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                            {CHIPS[gwData.activeChip]?.icon} <span>الخاصية المستخدمة: {CHIPS[gwData.activeChip]?.label}</span>
                        </div>
                    )}
                    <div style={{ 
                        background: `repeating-linear-gradient(0deg, #2e7d32, #2e7d32 45px, #388e3c 45px, #388e3c 90px)`,
                        borderRadius: gwData.activeChip && gwData.activeChip !== 'none' ? '0 0 20px 20px' : '20px', padding: isMobile ? '30px 5px' : '60px 20px', minHeight: isMobile ? '450px' : '650px', 
                        display:'flex', flexDirection:'column', justifyContent: 'center', border:'6px solid #fff', position:'relative', overflow:'hidden'
                    }}>
                        <div style={{ position: 'absolute', top: '15px', left: '15px', right: '15px', bottom: '15px', border: '1px solid rgba(255,255,255,0.3)' }}></div>
                        <div style={{ position: 'absolute', top: '50%', left: '0', right: '0', height: '1px', background: 'rgba(255,255,255,0.3)' }}></div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '25px' : '50px', alignItems: 'center', zIndex: 10 }}>
                            <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                                {gwData.lineup.filter(p => p.isStarter && p.isCaptain).map((p, idx) => (
                                    <PlayerCard key={p.userId?._id || p._id || `cap-${idx}`} player={p} />
                                ))}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: isMobile ? '45px' : '90px', width: '100%' }}>
                                {gwData.lineup.filter(p => p.isStarter && !p.isCaptain).map((p, idx) => (
                                    <PlayerCard key={p.userId?._id || p._id || `star-${idx}`} player={p} />
                                ))}
                            </div>
                        </div>
                    </div>
                    <div style={{ marginTop: '15px', background: '#fff', padding: '15px', borderRadius: '20px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)' }}>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px', color: '#38003c', borderBottom: '1px solid #eee' }}>🛋 الاحتياط</div>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: isMobile ? '5px' : '25px', flexWrap: 'wrap' }}>
                            {gwData.lineup.filter(p => !p.isStarter).map((p, idx) => (
                                <PlayerCard key={p.userId?._id || p._id || `sub-${idx}`} player={p} isSub={true} />
                            ))}
                        </div>
                    </div>
                </div>
            ) : <div style={{textAlign: 'center', padding: '40px'}}>لا توجد بيانات</div>}

            <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } } .pitch-fade-in { animation: fadeInSlide 0.4s ease-out forwards; } @keyframes fadeInSlide { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        </div>
    );
};

export default TeamHistory;