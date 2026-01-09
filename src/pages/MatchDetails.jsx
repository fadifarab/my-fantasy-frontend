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
        <div style={{ width: size, height: size, background: '#fff', borderRadius: isLeague ? '10px' : '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(0,0,0,0.1)', padding: '8px', border: '1.5px solid #f0f0f0' }}>
            {imgSrc ? <img src={imgSrc} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="L" /> : <FaShieldAlt size={size * 0.6} color="#ccc" />}
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

    useEffect(() => {
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

    const { fixture, homeLineup, awayLineup } = data;
    const maxRows = Math.max(homeLineup?.lineup?.length || 0, awayLineup?.lineup?.length || 0);

    // ✅ مكون عرض الخاصية مع الحفاظ على المساحة ثابتة
    const ChipContainer = ({ chipId }) => {
        const hasChip = chipId && chipId !== 'none' && CHIPS_CONFIG[chipId];
        return (
            <div style={{ height: '35px', marginTop: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
                {hasChip ? (
                    <div style={{ background: CHIPS_CONFIG[chipId].bg, color: CHIPS_CONFIG[chipId].color, padding: '4px 10px', borderRadius: '10px', fontSize: '10px', fontWeight: '1000', display: 'flex', alignItems: 'center', gap: '5px', border: `1px solid ${CHIPS_CONFIG[chipId].color}`, whiteSpace: 'nowrap' }}>
                        {CHIPS_CONFIG[chipId].icon} {CHIPS_CONFIG[chipId].label}
                    </div>
                ) : null}
            </div>
        );
    };

    const PlayerBox = ({ player, isHome, activeChip }) => {
        if (!player) return <div style={{ flex: 1 }}></div>;
        const raw = player.rawPoints || 0;
        const hits = player.transferCost || 0;
        const final = player.finalScore || 0;
        const multiplier = player.isCaptain ? (activeChip === 'tripleCaptain' ? 3 : 2) : 1;

        return (
            <div style={{ flex: 1, padding: '15px 12px', background: player.isStarter ? '#fff' : 'rgba(240, 240, 240, 0.6)', borderRadius: '20px', border: player.isStarter ? '2.5px solid #f0f0f0' : '1.5px dashed #ccc', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', flexDirection: isHome ? 'row' : 'row-reverse', alignItems: 'center', gap: '12px' }}>
                    <div style={{ position: 'relative' }}>
                        <div style={{ width: '45px', height: '45px', borderRadius: '15px', background: isHome ? '#37003c' : '#00ff85', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FaUserAlt color={isHome ? '#fff' : '#37003c'} size={22} />
                        </div>
                        {player.isCaptain && <div style={{ position: 'absolute', top: -8, right: -8, background: '#ffd700', borderRadius: '50%', padding: '3px', border: '2px solid #fff' }}><FaCrown size={12} color="#000" /></div>}
                    </div>
                    <div style={{ fontWeight: '1000', fontSize: '15px', color: '#1a1a1a', flex: 1, textAlign: isHome ? 'right' : 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {player.userId?.username}
                    </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid #f5f5f5', paddingTop: '10px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: isHome ? 'right' : 'left' }}>
                        <div style={{ fontSize: '14px', color: '#555', fontWeight: '1000' }}>RAW: {raw}</div>
                        {hits > 0 && <div style={{ fontSize: '14px', color: '#ff1744', fontWeight: '1000' }}>HITS: -{hits}</div>}
                        {player.isCaptain && <div style={{ fontSize: '11px', color: '#37003c', fontWeight: '1000', background:'#eee', padding:'2px 6px', borderRadius:'5px' }}>{multiplier === 3 ? 'TRIPLE' : 'X2'} CAPTAIN</div>}
                    </div>
                    <div style={{ textAlign: isHome ? 'left' : 'right' }}>
                        <div style={{ fontSize: '34px', fontWeight: '1000', color: isHome ? '#37003c' : '#00a859', lineHeight: 1 }}>{final}</div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div style={{ padding: '15px', background: '#f0f2f5', minHeight: '100vh', direction: 'rtl', fontFamily: 'Arial, sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <button onClick={() => navigate(-1)} style={{ background: '#fff', border: 'none', padding: '12px 25px', borderRadius: '15px', fontWeight: '1000', color: '#37003c', fontSize: '16px' }}>⬅ عودة</button>
                <button onClick={handleExportImage} disabled={exporting} style={{ background: '#37003c', color: '#00ff85', border: 'none', padding: '12px 25px', borderRadius: '15px', fontWeight: '1000', fontSize: '16px', display:'flex', alignItems:'center', gap:'10px' }}>
                    {exporting ? <FaSpinner className="fa-spin" /> : <><FaCamera /> مشاركة</>}
                </button>
            </div>

            <div ref={matchRef} style={{ background: '#fff', borderRadius: '45px', overflow: 'hidden', boxShadow: '0 30px 60px rgba(0,0,0,0.15)' }}>
                <div style={{ padding: '25px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', borderBottom: '2px solid #f8f8f8' }}>
                    <SafeLogo url={leagueInfo?.logoUrl} size={50} isLeague={true} />
                    <div style={{ fontWeight: '1000', fontSize: '22px', color: '#37003c' }}>{leagueInfo?.name?.toUpperCase() || 'FANTASY LEAGUE'}</div>
                </div>

                <div style={{ background: 'linear-gradient(180deg, #37003c 0%, #1a001c 100%)', padding: '40px 10px', color: '#fff' }}>
                    <div style={{ textAlign: 'center', fontSize: '13px', fontWeight: '900', color: '#00ff85', marginBottom: '25px', letterSpacing: '3px' }}>GAMEWEEK {fixture.gameweek}</div>
                    
                    {/* ✅ استخدام الـ Grid مع محاذاة رأسية دقيقة */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', alignItems: 'start', justifyItems: 'center' }}>
                        
                        {/* المضيف */}
                        <div style={{ textAlign: 'center', width: '100%' }}>
                            <div style={{ display: 'flex', justifyContent: 'center' }}><SafeLogo url={fixture.homeTeamId?.logoUrl} size={90} /></div>
                            <div style={{ marginTop: '15px', fontSize: '18px', fontWeight: '1000', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{fixture.homeTeamId?.name}</div>
                            <ChipContainer chipId={homeLineup?.activeChip} />
                        </div>

                        {/* النتيجة */}
                        <div style={{ textAlign: 'center', width: '100%', paddingTop: '15px' }}>
                            <div style={{ fontSize: '85px', fontWeight: '1000', letterSpacing: '-5px', display:'flex', justifyContent:'center', alignItems:'center', gap:'12px', lineHeight: '1' }}>
                                <span>{fixture.awayScore}</span>
                                <span style={{ opacity: 0.2, fontSize:'45px' }}>:</span>
                                <span>{fixture.homeScore}</span>
                            </div>
                            <div style={{ color: '#00ff85', fontSize: '14px', fontWeight: '1000', letterSpacing: '2px', marginTop: '15px' }}>FINAL RESULT</div>
                        </div>

                        {/* الضيف */}
                        <div style={{ textAlign: 'center', width: '100%' }}>
                            <div style={{ display: 'flex', justifyContent: 'center' }}><SafeLogo url={fixture.awayTeamId?.logoUrl} size={90} /></div>
                            <div style={{ marginTop: '15px', fontSize: '18px', fontWeight: '1000', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{fixture.awayTeamId?.name}</div>
                            <ChipContainer chipId={awayLineup?.activeChip} />
                        </div>
                    </div>
                </div>

                <div style={{ padding: '30px 15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 10px 15px', marginBottom: '15px' }}>
                        <div style={{ fontWeight: '1000', fontSize: '17px', color: '#37003c' }}>📍 HOME</div>
                        <div style={{ fontWeight: '1000', fontSize: '17px', color: '#00a859' }}>AWAY 📍</div>
                    </div>

                    {Array.from({ length: maxRows }).map((_, i) => {
                        const hPlayer = homeLineup?.lineup?.[i];
                        const aPlayer = awayLineup?.lineup?.[i];
                        const showBenchHeader = (hPlayer && !hPlayer.isStarter && (i === 0 || homeLineup.lineup[i-1].isStarter)) || 
                                              (aPlayer && !aPlayer.isStarter && (i === 0 || awayLineup.lineup[i-1].isStarter));

                        return (
                            <div key={i}>
                                {showBenchHeader && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', margin: '35px 0 20px' }}>
                                        <div style={{ height: '3px', flex: 1, background: '#f0f0f0' }}></div>
                                        <div style={{ fontWeight: '1000', fontSize: '16px', color: '#aaa', letterSpacing: '2px' }}>SUBSTITUTES / BENCH</div>
                                        <div style={{ height: '3px', flex: 1, background: '#f0f0f0' }}></div>
                                    </div>
                                )}
                                <div style={{ display: 'flex', gap: '12px', marginBottom: '15px' }}>
                                    <PlayerBox player={hPlayer} isHome={true} activeChip={homeLineup?.activeChip} />
                                    <PlayerBox player={aPlayer} isHome={false} activeChip={awayLineup?.activeChip} />
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div style={{ padding: '40px', textAlign: 'center', background: '#f9f9f9', borderTop: '2px solid #eee' }}>
                    <div style={{ fontWeight: '1000', fontSize: '17px', color: '#37003c', letterSpacing: '2px' }}>{leagueInfo?.name?.toUpperCase() || 'FANTASY LEAGUE'} PRO</div>
                </div>
            </div>
            <style>{` .fa-spin { animation: spin 2s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } } `}</style>
        </div>
    );
};

export default MatchDetails;