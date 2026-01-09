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
        <div style={{ width: size, height: size, background: '#fff', borderRadius: isLeague ? '8px' : '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 5px 15px rgba(0,0,0,0.1)', padding: '5px', border: '1px solid #f0f0f0', flexShrink: 0 }}>
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

    const PlayerBox = ({ player, isHome, activeChip }) => {
        if (!player) return <div style={{ flex: 1 }}></div>;
        const raw = player.rawPoints || 0;
        const hits = player.transferCost || 0;
        const final = player.finalScore || 0;
        const multiplier = player.isCaptain ? (activeChip === 'tripleCaptain' ? 3 : 2) : 1;

        return (
            <div style={{ flex: 1, padding: '12px 10px', background: player.isStarter ? '#fff' : 'rgba(240, 240, 240, 0.6)', borderRadius: '20px', border: player.isStarter ? '2.5px solid #f0f0f0' : '1.5px dashed #ccc', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', flexDirection: isHome ? 'row' : 'row-reverse', alignItems: 'center', gap: '10px' }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: isHome ? '#37003c' : '#00ff85', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FaUserAlt color={isHome ? '#fff' : '#37003c'} size={18} />
                        </div>
                        {player.isCaptain && <div style={{ position: 'absolute', top: -5, right: -5, background: '#ffd700', borderRadius: '50%', padding: '2px', border: '1.5px solid #fff' }}><FaCrown size={10} color="#000" /></div>}
                    </div>
                    <div style={{ fontWeight: '1000', fontSize: '13px', color: '#1a1a1a', flex: 1, textAlign: isHome ? 'right' : 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {player.userId?.username}
                    </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f5f5f5', paddingTop: '8px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: isHome ? 'right' : 'left' }}>
                        <div style={{ fontSize: '12px', color: '#666', fontWeight: '1000' }}>RAW: {raw}</div>
                        {hits > 0 && <div style={{ fontSize: '12px', color: '#ff1744', fontWeight: '1000' }}>HITS: -{hits}</div>}
                        {player.isCaptain && <div style={{ fontSize: '10px', color: '#37003c', fontWeight: '1000' }}>{multiplier === 3 ? 'TRIPLE' : 'X2'} CAPTAIN</div>}
                    </div>
                    <div style={{ textAlign: isHome ? 'left' : 'right' }}>
                        <div style={{ fontSize: '32px', fontWeight: '1000', color: isHome ? '#37003c' : '#00a859', lineHeight: 1 }}>{final}</div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div style={{ padding: '15px', background: '#f0f2f5', minHeight: '100vh', direction: 'rtl', fontFamily: 'Arial, sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <button onClick={() => navigate(-1)} style={{ background: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: '1000', color: '#37003c', fontSize: '15px' }}>⬅ عودة</button>
                <button onClick={handleExportImage} disabled={exporting} style={{ background: '#37003c', color: '#00ff85', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: '1000', fontSize: '15px', display:'flex', alignItems:'center', gap:'8px' }}>
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
                    
                    {/* ✅ محاذاة 100% كما في الصورة */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', alignItems: 'start', justifyItems: 'center' }}>
                        
                        {/* المضيف - يمين */}
                        <div style={{ textAlign: 'center', width: '100%' }}>
                            <div style={{ display: 'flex', justifyContent: 'center' }}><SafeLogo url={fixture.homeTeamId?.logoUrl} size={85} /></div>
                            <div style={{ marginTop: '12px', fontSize: '16px', fontWeight: '1000', minHeight: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{fixture.homeTeamId?.name}</div>
                            <div style={{ height: '35px', marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                                {homeLineup?.activeChip && homeLineup.activeChip !== 'none' && (
                                    <div style={{ background: CHIPS_CONFIG[homeLineup.activeChip].bg, color: CHIPS_CONFIG[homeLineup.activeChip].color, padding: '4px 10px', borderRadius: '10px', fontSize: '10px', fontWeight: '1000', display: 'flex', alignItems: 'center', gap: '5px', border: `1px solid ${CHIPS_CONFIG[homeLineup.activeChip].color}` }}>
                                        {CHIPS_CONFIG[homeLineup.activeChip].icon} {CHIPS_CONFIG[homeLineup.activeChip].label}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* النتيجة */}
                        <div style={{ textAlign: 'center', width: '100%', paddingTop: '10px' }}>
                            <div style={{ fontSize: '85px', fontWeight: '1000', letterSpacing: '-5px', display:'flex', justifyContent:'center', alignItems:'center', gap:'10px', lineHeight: '1' }}>
                                <span>{fixture.awayScore}</span>
                                <span style={{ opacity: 0.2, fontSize:'45px' }}>:</span>
                                <span>{fixture.homeScore}</span>
                            </div>
                            <div style={{ color: '#00ff85', fontSize: '12px', fontWeight: '1000', letterSpacing: '3px', marginTop: '10px' }}>FINAL RESULT</div>
                        </div>

                        {/* الضيف - يسار */}
                        <div style={{ textAlign: 'center', width: '100%' }}>
                            <div style={{ display: 'flex', justifyContent: 'center' }}><SafeLogo url={fixture.awayTeamId?.logoUrl} size={85} /></div>
                            <div style={{ marginTop: '12px', fontSize: '16px', fontWeight: '1000', minHeight: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{fixture.awayTeamId?.name}</div>
                            <div style={{ height: '35px', marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                                {awayLineup?.activeChip && awayLineup.activeChip !== 'none' && (
                                    <div style={{ background: CHIPS_CONFIG[awayLineup.activeChip].bg, color: CHIPS_CONFIG[awayLineup.activeChip].color, padding: '4px 10px', borderRadius: '10px', fontSize: '10px', fontWeight: '1000', display: 'flex', alignItems: 'center', gap: '5px', border: `1px solid ${CHIPS_CONFIG[awayLineup.activeChip].color}` }}>
                                        {CHIPS_CONFIG[awayLineup.activeChip].icon} {CHIPS_CONFIG[awayLineup.activeChip].label}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* مقارنة اللاعبين */}
                <div style={{ padding: '30px 15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 10px 15px', borderBottom: '2px solid #f0f0f0', marginBottom: '15px' }}>
                        <div style={{ fontWeight: '1000', fontSize: '15px', color: '#37003c' }}>📍 AWAY</div>
                        <div style={{ fontWeight: '1000', fontSize: '15px', color: '#00a859' }}>HOME 📍</div>
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
                                        <div style={{ fontWeight: '1000', fontSize: '14px', color: '#aaa', letterSpacing: '2px' }}>SUBSTITUTES / BENCH</div>
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

                {/* تذييل البطاقة */}
                <div style={{ padding: '35px', textAlign: 'center', background: '#f9f9f9', borderTop: '2px solid #eee' }}>
                    <div style={{ fontWeight: '1000', fontSize: '15px', color: '#37003c', letterSpacing: '2px' }}>{leagueInfo?.name?.toUpperCase() || 'FANTASY LEAGUE'} PRO</div>
                </div>
            </div>
            <style>{` .fa-spin { animation: spin 2s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } } `}</style>
        </div>
    );
};

export default MatchDetails;