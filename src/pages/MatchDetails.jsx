import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { 
    FaArrowLeft, FaCamera, FaSpinner, FaCrown, FaExchangeAlt, 
    FaTshirt, FaStar, FaUserAlt, FaMinusCircle, FaShieldAlt
} from "react-icons/fa";
import html2canvas from 'html2canvas';

const CHIPS_CONFIG = {
    'tripleCaptain': { label: 'TRIPLE CAPTAIN', icon: <FaCrown />, color: '#ffd700', bg: 'rgba(255, 215, 0, 0.15)' },
    'benchBoost': { label: 'BENCH BOOST', icon: <FaExchangeAlt />, color: '#00ff85', bg: 'rgba(0, 255, 133, 0.15)' },
    'freeHit': { label: 'FREE HIT', icon: <FaTshirt />, color: '#00ccff', bg: 'rgba(0, 204, 255, 0.15)' },
    'theBest': { label: 'THE BEST', icon: <FaStar />, color: '#ff00ff', bg: 'rgba(255, 0, 255, 0.15)' }
};

const SafeLogo = ({ url, size = 80, isLeague = false }) => {
    const [imgSrc, setImgSrc] = useState('');
    const SERVER_URL = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';
    useEffect(() => {
        if (!url) return;
        const fetchImg = async () => {
            try {
                if (url.startsWith('/uploads')) { setImgSrc(`${SERVER_URL}${url}`); } 
                else {
                    const { data } = await API.post('/teams/proxy-image', { imageUrl: url });
                    if (data.base64) setImgSrc(data.base64);
                }
            } catch (err) { console.error(err); }
        };
        fetchImg();
    }, [url, SERVER_URL]);

    return (
        <div className="logo-wrapper" style={{ width: size, height: size, background: '#fff', borderRadius: isLeague ? '8px' : '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 5px 15px rgba(0,0,0,0.1)', padding: '5px', border: '1px solid #f0f0f0', flexShrink: 0 }}>
            {imgSrc ? <img src={imgSrc} style={{ width: '90%', height: '90%', objectFit: 'contain' }} alt="L" /> : <FaShieldAlt size={size * 0.5} color="#ccc" />}
        </div>
    );
};

const MatchDetails = () => {
    const { fixtureId } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [leagueInfo, setLeagueInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const matchRef = useRef(null);

    /*useEffect(() => {
        const fetchDetails = async () => {
            try {
                const res = await API.get(`/fixtures/details/${fixtureId}`);
                setData(res.data);
                const leagueRes = await API.get('/leagues/me');
                setLeagueInfo(leagueRes.data);
            } catch (err) { console.error(err); } 
            finally { setLoading(false); }
        };
        fetchDetails();
    }, [fixtureId]);*/
	
	useEffect(() => {
    const fetchDetails = async () => {
        try {
            const res = await API.get(`/fixtures/details/${fixtureId}`);
            setData(res.data);
            
            const leagueRes = await API.get('/leagues/me');
            setLeagueInfo(leagueRes.data);
        } catch (err) {
            // التحقق إذا كان الخطأ بسبب حجب الجولة القادمة
            if (err.response && err.response.status === 403) {
                setData({ 
                    isHidden: true, 
                    message: err.response.data.message,
                    fixture: err.response.data.fixture // لعرض أسماء الفرق حتى لو التشكيلة مخفية
                });
            } else {
                console.error(err);
            }
        } finally {
            setLoading(false);
        }
    };
    fetchDetails();
}, [fixtureId]);

    const handleExportImage = async () => {
        if (!matchRef.current) return;
        setExporting(true);
        try {
            const canvas = await html2canvas(matchRef.current, { scale: 3, useCORS: true, backgroundColor: '#ffffff' });
            const link = document.createElement('a');
            link.href = canvas.toDataURL("image/png");
            link.download = `MatchResult.png`;
            link.click();
        } catch (error) { alert("خطأ في التصدير"); } 
        finally { setExporting(false); }
    };

    if (loading || !data) return <div style={{display:'flex', height:'100vh', justifyContent:'center', alignItems:'center'}}><FaSpinner className="fa-spin" size={40} color="#37003c" /></div>;
	
	// أضف هذا الشرط مباشرة بعد الـ Loading وقبل تعريف المتغيرات (fixture, homeLineup)
if (data?.isHidden) {
    return (
        <div style={{ padding: '20px', textAlign: 'center', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#f0f2f5' }}>
            <div style={{ background: '#fff', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', maxWidth: '400px' }}>
                <FaShieldAlt size={50} color="#37003c" style={{ marginBottom: '15px' }} />
                <h2 style={{ fontWeight: '1000', color: '#37003c' }}>🔒 {data.message}</h2>
                <p style={{ color: '#666', marginTop: '10px' }}>يمكنك رؤية التشكيلات فقط بعد انطلاق الجولة رسمياً.</p>
                <button onClick={() => navigate(-1)} style={{ marginTop: '20px', background: '#37003c', color: '#00ff85', border: 'none', padding: '10px 25px', borderRadius: '12px', fontWeight: '1000' }}>
                    العودة للجدول
                </button>
            </div>
        </div>
    );
}

    const { fixture, homeLineup, awayLineup } = data;
	const sortPlayers = (lineupArray) => {
    if (!lineupArray) return [];
    return [...lineupArray].sort((a, b) => {
        // 1. الكابتن أولاً
        if (a.isCaptain) return -1;
        if (b.isCaptain) return 1;
        
        // 2. الأساسي قبل الاحتياطي
        if (a.isStarter && !b.isStarter) return -1;
        if (!a.isStarter && b.isStarter) return 1;
        
        return 0; // الحفاظ على الترتيب الأصلي للبقية
    });
};

// تطبيق الترتيب على الفريقين
const sortedHomePlayers = sortPlayers(homeLineup?.lineup);
const sortedAwayPlayers = sortPlayers(awayLineup?.lineup);
const maxRows = Math.max(sortedHomePlayers.length, sortedAwayPlayers.length);
    //const maxRows = Math.max(homeLineup?.lineup?.length || 0, awayLineup?.lineup?.length || 0);

    const PlayerBox = ({ player, isHome, activeChip }) => {
        if (!player) return <div style={{ flex: 1 }}></div>;
        const raw = player.rawPoints || 0;
        const hits = player.transferCost || 0;
        const final = player.finalScore || 0;
        const multiplier = player.isCaptain ? (activeChip === 'tripleCaptain' ? 3 : 2) : 1;

        return (
            <div className="player-box-res" style={{ flex: 1, padding: '10px 8px', background: player.isStarter ? '#fff' : 'rgba(240, 240, 240, 0.6)', borderRadius: '12px', border: player.isStarter ? '1.5px solid #f0f0f0' : '1px dashed #ccc', display: 'flex', flexDirection: 'column', gap: '5px', minWidth: 0 }}>
                <div style={{ display: 'flex', flexDirection: isHome ? 'row' : 'row-reverse', alignItems: 'center', gap: '8px' }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                        <div className="player-icon-res" style={{ width: '35px', height: '35px', borderRadius: '10px', background: isHome ? '#37003c' : '#00ff85', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FaUserAlt color={isHome ? '#fff' : '#37003c'} size={16} />
                        </div>
                        {player.isCaptain && <div style={{ position: 'absolute', top: -5, right: -5, background: '#ffd700', borderRadius: '50%', padding: '2px', border: '1.5px solid #fff' }}><FaCrown size={8} color="#000" /></div>}
                    </div>
                    <div className="player-name-res" style={{ fontWeight: '1000', fontSize: '13px', color: '#1a1a1a', flex: 1, textAlign: isHome ? 'right' : 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {player.userId?.username}
                    </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f5f5f5', paddingTop: '5px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: isHome ? 'right' : 'left' }}>
                        <div style={{ fontSize: '10px', color: '#444', fontWeight: '1000' }}>RAW: {raw}</div>
                        {hits > 0 && <div style={{ fontSize: '10px', color: '#ff1744', fontWeight: '1000' }}>HITS: -{hits}</div>}
                    </div>
                    <div style={{ textAlign: isHome ? 'left' : 'right' }}>
                        <div className="player-score-res" style={{ fontSize: '24px', fontWeight: '1000', color: isHome ? '#37003c' : '#00a859', lineHeight: 1 }}>{final}</div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="main-wrapper" style={{ padding: '10px', background: '#f0f2f5', minHeight: '100vh', direction: 'rtl', fontFamily: 'Arial, sans-serif' }}>
            {/* Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <button onClick={() => navigate(-1)} style={{ background: '#fff', border: 'none', padding: '10px 15px', borderRadius: '12px', fontWeight: '1000', color: '#37003c', fontSize: '14px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>⬅ عودة</button>
                <button onClick={handleExportImage} disabled={exporting} style={{ background: '#37003c', color: '#00ff85', border: 'none', padding: '10px 15px', borderRadius: '12px', fontWeight: '1000', fontSize: '14px', display:'flex', alignItems:'center', gap:'8px' }}>
                    {exporting ? <FaSpinner className="fa-spin" /> : <><FaCamera /> مشاركة</>}
                </button>
            </div>

            <div ref={matchRef} className="match-card-container" style={{ background: '#fff', borderRadius: '30px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
                
                {/* League Header */}
                <div style={{ padding: '15px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', borderBottom: '1px solid #f0f0f0' }}>
                    <SafeLogo url={leagueInfo?.logoUrl} size={35} isLeague={true} />
                    <div className="league-name-res" style={{ fontWeight: '1000', fontSize: '16px', color: '#37003c' }}>
                        {leagueInfo?.name?.toUpperCase() || 'FANTASY LEAGUE'}
                    </div>
                </div>

                {/* ✅ Score Section - Optimized for Mobile Result Clashes */}
                <div className="score-section-res" style={{ background: 'linear-gradient(180deg, #37003c 0%, #1a001c 100%)', padding: '25px 0', color: '#fff' }}>
                    <div style={{ textAlign: 'center', fontSize: '11px', fontWeight: '900', color: '#00ff85', marginBottom: '15px', letterSpacing: '2px' }}>GAMEWEEK {fixture.gameweek}</div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', gap: '5px' }}>
                        
                        {/* Home Team (Right) */}
                        <div style={{ flex: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 0 }}>
                            <div className="mobile-logo-size"><SafeLogo url={fixture.homeTeamId?.logoUrl} size={65} /></div>
                            <div className="team-name-res" style={{ marginTop: '8px', fontSize: '14px', fontWeight: '1000', minHeight: '34px', textAlign: 'center', padding: '0 5px', lineHeight: '1.1', width: '100%', overflow: 'hidden' }}>{fixture.homeTeamId?.name}</div>
                            <div style={{ height: '30px', marginTop: '5px' }}>
                                {homeLineup?.activeChip && homeLineup.activeChip !== 'none' && (
                                    <div className="chip-badge" style={{ background: CHIPS_CONFIG[homeLineup.activeChip].bg, color: CHIPS_CONFIG[homeLineup.activeChip].color, padding: '3px 6px', borderRadius: '8px', fontSize: '8px', fontWeight: '1000', display: 'inline-flex', alignItems: 'center', gap: '3px', border: `1px solid ${CHIPS_CONFIG[homeLineup.activeChip].color}`, whiteSpace: 'nowrap' }}>
                                        {CHIPS_CONFIG[homeLineup.activeChip].icon} {CHIPS_CONFIG[homeLineup.activeChip].label}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ✅ Score (Center) - Fixed width to prevent clash */}
                        <div style={{ width: '110px', textAlign: 'center', flexShrink: 0 }}>
                            <div className="big-score-res" style={{ fontSize: '55px', fontWeight: '1000', letterSpacing: '-2px', display:'flex', justifyContent:'center', alignItems:'center', gap:'8px', lineHeight: '1' }}>
                                <span>{fixture.homeScore}</span>
                                <span style={{ opacity: 0.2, fontSize:'25px' }}>:</span>
                                <span>{fixture.awayScore}</span>
                            </div>
                            <div style={{ color: '#00ff85', fontSize: '10px', fontWeight: '1000', marginTop: '8px' }}>FINAL</div>
                        </div>

                        {/* Away Team (Left) */}
                        <div style={{ flex: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 0 }}>
                            <div className="mobile-logo-size"><SafeLogo url={fixture.awayTeamId?.logoUrl} size={65} /></div>
                            <div className="team-name-res" style={{ marginTop: '8px', fontSize: '14px', fontWeight: '1000', minHeight: '34px', textAlign: 'center', padding: '0 5px', lineHeight: '1.1', width: '100%', overflow: 'hidden' }}>{fixture.awayTeamId?.name}</div>
                            <div style={{ height: '30px', marginTop: '5px' }}>
                                {awayLineup?.activeChip && awayLineup.activeChip !== 'none' && (
                                    <div className="chip-badge" style={{ background: CHIPS_CONFIG[awayLineup.activeChip].bg, color: CHIPS_CONFIG[awayLineup.activeChip].color, padding: '3px 6px', borderRadius: '8px', fontSize: '8px', fontWeight: '1000', display: 'inline-flex', alignItems: 'center', gap: '3px', border: `1px solid ${CHIPS_CONFIG[awayLineup.activeChip].color}`, whiteSpace: 'nowrap' }}>
                                        {CHIPS_CONFIG[awayLineup.activeChip].icon} {CHIPS_CONFIG[awayLineup.activeChip].label}
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>

                {/* Labels */}
                <div style={{ padding: '20px 10px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 5px 10px', borderBottom: '1px solid #f0f0f0' }}>
                        <div style={{ fontWeight: '1000', fontSize: '13px', color: '#37003c' }}>📍 HOME</div>
                        <div style={{ fontWeight: '1000', fontSize: '13px', color: '#00a859' }}>AWAY 📍</div>
                    </div>
                </div>

                {/* Player List */}
<div style={{ padding: '10px' }}>
    {Array.from({ length: maxRows }).map((_, i) => {
        const hPlayer = sortedHomePlayers[i]; // استخدام المصفوفة المرتبة
        const aPlayer = sortedAwayPlayers[i]; // استخدام المصفوفة المرتبة
        
        // منطق عرض فاصل الاحتياط (BENCH)
        const showBenchHeader = (hPlayer && !hPlayer.isStarter && (i === 0 || sortedHomePlayers[i-1].isStarter)) || 
                              (aPlayer && !aPlayer.isStarter && (i === 0 || sortedAwayPlayers[i-1].isStarter));

        return (
            <div key={i}>
                {showBenchHeader && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '20px 0 10px' }}>
                        <div style={{ height: '2px', flex: 1, background: '#f0f0f0' }}></div>
                        <div style={{ fontWeight: '1000', fontSize: '12px', color: '#bbb', letterSpacing: '1px' }}>BENCH</div>
                        <div style={{ height: '2px', flex: 1, background: '#f0f0f0' }}></div>
                    </div>
                )}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                    <PlayerBox player={hPlayer} isHome={true} activeChip={homeLineup?.activeChip} />
                    <PlayerBox player={aPlayer} isHome={false} activeChip={awayLineup?.activeChip} />
                </div>
            </div>
        );
    })}
</div>

                {/* Footer */}
                <div style={{ padding: '25px', textAlign: 'center', background: '#f9f9f9', borderTop: '1px solid #eee' }}>
                    <div className="footer-name-res" style={{ fontWeight: '1000', fontSize: '13px', color: '#37003c', letterSpacing: '1px', opacity: 0.6 }}>
                        {leagueInfo?.name?.toUpperCase()} OFFICIAL
                    </div>
                </div>
            </div>

            <style>{`
                .fa-spin { animation: spin 2s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
                
                @media (max-width: 600px) {
                    .main-wrapper { padding: 5px !important; }
                    .big-score-res { font-size: 42px !important; gap: 5px !important; }
                    .team-name-res { font-size: 11px !important; min-height: 28px !important; }
                    .logo-wrapper { width: 50px !important; height: 50px !important; }
                    .player-score-res { font-size: 20px !important; }
                    .player-name-res { font-size: 10px !important; }
                    .player-icon-res { width: 30px !important; height: 30px !important; }
                    .chip-badge { font-size: 7px !important; padding: 1px 4px !important; }
                    .league-name-res { font-size: 14px !important; }
                    .footer-name-res { font-size: 11px !important; }
                }
            `}</style>
        </div>
    );
};

export default MatchDetails;