// client/src/pages/TeamHistory.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import API from '../utils/api';
import { FaArrowRight, FaArrowLeft, FaShieldAlt, FaBolt, FaStar, FaMagic, FaArrowLeft as BackIcon, FaCrown, FaTshirt } from "react-icons/fa";

const TeamHistory = () => {
    const { teamId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    
    const initialGw = location.state?.startGw ? Math.max(1, location.state.startGw) : 1;
    const [currentGw, setCurrentGw] = useState(initialGw);
    
    const [teamInfo, setTeamInfo] = useState(null); 
    const [gwData, setGwData] = useState(null);
    const [chipsHistory, setChipsHistory] = useState({ p1: {}, p2: {} });
    const [loading, setLoading] = useState(false);
    const [restricted, setRestricted] = useState(false);
    
    const SERVER_URL = 'http://localhost:5000';

    const CHIPS = {
        'theBest': { label: 'The Best', icon: <FaStar color="gold" /> },
        'tripleCaptain': { label: 'Triple Captain', icon: <FaBolt color="orange" /> },
        'benchBoost': { label: 'Bench Boost', icon: <FaShieldAlt color="green" /> },
        'freeHit': { label: 'Free Hit', icon: <FaMagic color="purple" /> },
        'wildcard': { label: 'Wildcard', icon: <span>🃏</span> }
    };

    const getLogoUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        const cleanUrl = url.replace(/\\/g, '/');
        return `${SERVER_URL}${cleanUrl}`;
    };

    useEffect(() => {
        const fetchFullHistory = async () => {
            try {
                const { data } = await API.get(`/leagues/team-history-full/${teamId}`);
                if (data.team) setTeamInfo(data.team);
                
                const usedChips = { p1: {}, p2: {} };
                if (data.history) {
                    data.history.forEach(gw => {
                        if (gw.activeChip && gw.activeChip !== 'none' && gw.activeChip !== 'hidden') {
                            if (gw.gameweek <= 19) usedChips.p1[gw.activeChip] = gw.gameweek;
                            else usedChips.p2[gw.activeChip] = gw.gameweek;
                        }
                    });
                }
                setChipsHistory(usedChips);
            } catch (error) { console.error("Error fetching history:", error); }
        };
        fetchFullHistory();
    }, [teamId]);

    useEffect(() => {
        const fetchGwData = async () => {
            setLoading(true);
            setRestricted(false);
            setGwData(null);
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

    const changeGw = (val) => {
        if (currentGw + val > 0 && currentGw + val <= 38) setCurrentGw(prev => prev + val);
    };

    const KitImage = ({ size = 60 }) => {
        const teamName = teamInfo ? teamInfo.name : 'default';
        const kitSrc = `/kits/${teamName}.png`;
        
        return (
            <div style={{ position: 'relative', width: size, height: size, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <img 
                    src={kitSrc} 
                    alt="Kit" 
                    style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 5px 5px rgba(0,0,0,0.5))' }}
                    onError={(e) => { 
                        e.target.style.display = 'none'; 
                        e.target.nextSibling.style.display = 'block'; 
                    }}
                />
                <FaTshirt size={size} color="#f0f0f0" style={{ display: 'none', filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.3))' }} />
            </div>
        );
    };

    // ✅ تحديث PlayerCard لقبول activeChip وحساب النقاط الملونة
    const PlayerCard = ({ player, isSub = false, activeChip }) => {
        const name = player.userId?.username || 'Unknown';
        const hits = player.transferCost || 0;
        
        // ✅ منطق حساب النقاط للكابتن
        let displayScore = player.finalScore;
        let scoreBg = isSub ? '#ddd' : '#4caf50'; // لون الخلفية العادي (أخضر/رمادي)
        let scoreColor = isSub ? '#555' : '#fff'; // لون النص العادي
        let scoreBorder = '2px solid white'; // الإطار العادي

        if (player.isCaptain) {
            // التحقق من خاصية التريبل كابتن
            const multiplier = activeChip === 'tripleCaptain' ? 3 : 2;
            displayScore = player.finalScore * multiplier;

            // ✅ ستايل خاص للكابتن (أسود مع إطار ذهبي)
            scoreBg = '#000000'; 
            scoreColor = '#fff';
            scoreBorder = '2px solid #ffd700'; 
        }

        return (
            <div key={player._id} style={{ 
                display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '15px',
                transform: 'scale(1.1)', transition: 'transform 0.3s'
            }}>
                <div style={{ position: 'relative' }}>
                    <KitImage size={70} />
                    
                    {player.isCaptain && <FaCrown size={24} color="#ffd700" style={{ position: 'absolute', top: '-12px', right: '-8px', filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.6))', zIndex: 10 }} />}
                    {player.isViceCaptain && !player.isCaptain && <span style={{position:'absolute', top:0, right:-5, background:'gray', color:'white', borderRadius:'50%', width:'20px', height:'20px', fontSize:'12px', display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid white'}}>V</span>}

                    {hits > 0 && (
                        <div style={{
                            position: 'absolute', top: '-5px', left: '-10px',
                            backgroundColor: '#d32f2f', color: 'white',
                            borderRadius: '50%', width: '24px', height: '24px',
                            display: 'flex', justifyContent: 'center', alignItems: 'center',
                            fontSize: '11px', fontWeight: 'bold', border: '2px solid white',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.3)', zIndex: 10
                        }}>
                            -{hits}
                        </div>
                    )}
                </div>
                
                <div style={{ backgroundColor: '#37003c', color: 'white', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', marginTop: '5px', minWidth: '90px', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', borderBottom: '2px solid #00ff87' }}>
                    {name}
                </div>
                
                {/* ✅ عرض النقاط بالستايل الجديد */}
                <div style={{ 
                    fontSize: '16px', fontWeight: 'bold', 
                    color: scoreColor, background: scoreBg, border: scoreBorder,
                    padding:'2px 12px', borderRadius:'12px', marginTop:'5px', 
                    boxShadow:'0 2px 4px rgba(0,0,0,0.1)', minWidth: '30px', textAlign: 'center'
                }}>
                    {displayScore}
                </div>
            </div>
        );
    };

    const ChipBadge = ({ type, usedGw }) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: usedGw ? '#fff' : '#f9f9f9', padding: '5px 10px', borderRadius: '20px', border: usedGw ? '2px solid #38003c' : '1px dashed #ccc', opacity: usedGw ? 1 : 0.6, color: usedGw ? '#38003c' : '#999', fontSize: '11px' }}>
            {CHIPS[type]?.icon}
            <span style={{ fontWeight: 'bold' }}>{CHIPS[type]?.label || type}</span>
            {usedGw && <span style={{ background: '#38003c', color: 'white', padding: '1px 6px', borderRadius: '50%', fontSize: '10px' }}>GW{usedGw}</span>}
        </div>
    );

    const renderPitch = () => {
        if (!gwData || !gwData.lineup) return null;
        
        const starters = gwData.lineup.filter(p => p.isStarter);
        const bench = gwData.lineup.filter(p => !p.isStarter);

        const captain = starters.find(p => p.isCaptain);
        const others = starters.filter(p => !p.isCaptain);
        const activeChip = gwData.activeChip;

        return (
            <>
                <div style={{ 
                    position: 'relative', borderRadius: '15px', overflow: 'hidden', minHeight: '520px',
                    border: '4px solid #fff', boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                    background: `repeating-linear-gradient(0deg, #419d36, #419d36 50px, #4caf50 50px, #4caf50 100px)`,
                    display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'
                }}>
                    <div style={{ position: 'absolute', top: '15px', left: '15px', right: '15px', bottom: '15px', border: '2px solid rgba(255,255,255,0.5)', pointerEvents: 'none' }}></div>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '120px', height: '120px', border: '2px solid rgba(255,255,255,0.5)', borderRadius: '50%', pointerEvents: 'none' }}></div>
                    <div style={{ position: 'absolute', top: '50%', left: '0', right: '0', height: '2px', backgroundColor: 'rgba(255,255,255,0.5)', pointerEvents: 'none' }}></div>

                    {activeChip && activeChip !== 'none' && activeChip !== 'hidden' && (
                        <div style={{
                            position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)',
                            backgroundColor: 'white', padding: '8px 20px', borderRadius: '25px',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.3)', zIndex: 20,
                            display: 'flex', alignItems: 'center', gap: '8px',
                            color: '#e91e63', fontSize: '14px', fontWeight: 'bold', border: '2px solid #e91e63'
                        }}>
                            <span style={{ fontSize: '18px' }}>{CHIPS[activeChip]?.icon}</span>
                            <span>ACTIVE: {CHIPS[activeChip]?.label}</span>
                        </div>
                    )}

                    <div style={{ marginBottom: '60px', zIndex: 10 }}>
                        {/* ✅ تمرير activeChip لبطاقة اللاعب لحساب التريبل */}
                        {captain ? (
                            <PlayerCard player={captain} activeChip={activeChip} />
                        ) : (
                            others.length > 0 && <PlayerCard player={others[0]} activeChip={activeChip} />
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '80px', zIndex: 10 }}>
                        {others.map((p, idx) => (
                            (!captain && idx === 0) ? null : <PlayerCard key={p._id} player={p} activeChip={activeChip} />
                        ))}
                    </div>
                    
                    {starters.length === 0 && <div style={{color:'white', zIndex:10}}>لا يوجد لاعبين أساسيين</div>}
                </div>

                <div style={{ 
                    marginTop: '20px', backgroundColor: 'white', borderRadius: '12px', padding: '15px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
                }}>
                    <h5 style={{ margin: '0 0 10px 0', borderBottom: '2px solid #f0f0f0', paddingBottom: '5px', color: '#37003c' }}>🛋 دكة الاحتياط</h5>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        {bench.length > 0 ? bench.map(p => <PlayerCard key={p._id} player={p} isSub={true} />) : <span style={{fontSize:'12px', color:'#999'}}>فارغة</span>}
                    </div>
                </div>
            </>
        );
    };

    return (
        <div style={{ padding: '20px', background: '#eef1f5', minHeight: '100vh', fontFamily: 'Arial', direction: 'rtl' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <button onClick={() => navigate(-1)} style={{ background: 'white', border: '1px solid #ddd', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight:'bold', boxShadow:'0 2px 5px rgba(0,0,0,0.05)' }}>
                    <BackIcon /> عودة
                </button>
                <div style={{ textAlign: 'center' }}>
                    <h2 style={{ margin: '0 0 5px 0', color: '#37003c' }}>{teamInfo?.name || location.state?.team?.name || 'تاريخ الفريق'}</h2>
                    {teamInfo?.logoUrl && (
                        <img 
                            src={getLogoUrl(teamInfo.logoUrl)} 
                            style={{ width: '70px', height:'70px', objectFit:'contain', borderRadius:'50%', marginTop:'5px', border:'4px solid white', boxShadow:'0 4px 10px rgba(0,0,0,0.1)', backgroundColor: 'white' }} 
                            alt="logo" 
                        />
                    )}
                </div>
                <div style={{width:'100px'}}></div>
            </div>

            <div style={{ background: 'white', padding: '20px', borderRadius: '15px', marginBottom: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                <div style={{ marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', color: '#4a148c' }}>مرحلة الذهاب (GW 1-19):</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        {Object.keys(CHIPS).map(chip => <ChipBadge key={chip} type={chip} usedGw={chipsHistory.p1[chip]} />)}
                    </div>
                </div>
                <div>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', color: '#4a148c' }}>مرحلة الإياب (GW 20-38):</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        {Object.keys(CHIPS).map(chip => <ChipBadge key={chip} type={chip} usedGw={chipsHistory.p2[chip]} />)}
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginBottom: '30px' }}>
                <button onClick={() => changeGw(-1)} disabled={currentGw <= 1} style={{ border: 'none', background: 'white', padding: '12px', borderRadius: '50%', cursor: 'pointer', boxShadow:'0 2px 5px rgba(0,0,0,0.1)' }}><FaArrowRight size={20} color="#38003c" /></button>
                <div style={{ textAlign: 'center' }}>
                    <h3 style={{ margin: 0, color: '#38003c', fontSize: '24px' }}>GW {currentGw}</h3>
                    {gwData && <span style={{fontSize:'18px', color:'#e91e63', fontWeight:'bold'}}>{gwData.stats?.totalPoints || 0} نقطة</span>}
                </div>
                <button onClick={() => changeGw(1)} disabled={currentGw >= 38} style={{ border: 'none', background: 'white', padding: '12px', borderRadius: '50%', cursor: 'pointer', boxShadow:'0 2px 5px rgba(0,0,0,0.1)' }}><FaArrowLeft size={20} color="#38003c" /></button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '50px', fontSize: '18px', color: '#666' }}>جاري تحميل التشكيلة... ⏳</div>
            ) : restricted ? (
                <div style={{ textAlign: 'center', padding: '50px', background: '#ffebee', borderRadius: '15px', color: '#c62828', border:'1px solid #ffcdd2' }}>
                    <FaShieldAlt size={50} style={{ marginBottom: '15px' }} />
                    <h3>محتوى محجوب ⛔</h3>
                    <p>الديدلاين لم ينتهِ بعد، لا يمكنك التجسس الآن!</p>
                </div>
            ) : gwData && !gwData.noData ? (
                renderPitch()
            ) : (
                <div style={{ textAlign: 'center', color: '#999', padding: '50px', background: 'white', borderRadius: '15px', boxShadow:'0 2px 5px rgba(0,0,0,0.05)' }}>
                    لم يتم العثور على تشكيلة لهذه الجولة 🤷‍♂️
                </div>
            )}
        </div>
    );
};

export default TeamHistory;