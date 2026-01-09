import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { 
    FaArrowLeft, FaCamera, FaSpinner, FaCrown, FaExchangeAlt, 
    FaTshirt, FaStar, FaUserAlt, FaMinusCircle, FaShieldAlt
} from "react-icons/fa";
import html2canvas from 'html2canvas';

const CHIPS_CONFIG = {
    'tripleCaptain': { label: 'TRIPLE CAPTAIN', icon: <FaCrown />, color: '#ffd700', bg: 'rgba(255, 215, 0, 0.2)' },
    'benchBoost': { label: 'BENCH BOOST', icon: <FaExchangeAlt />, color: '#00ff85', bg: 'rgba(0, 255, 133, 0.2)' },
    'freeHit': { label: 'FREE HIT', icon: <FaTshirt />, color: '#00ccff', bg: 'rgba(0, 204, 255, 0.2)' },
    'theBest': { label: 'THE BEST', icon: <FaStar />, color: '#ff00ff', bg: 'rgba(255, 0, 255, 0.2)' }
};

const SafeLogo = ({ url, size = 90 }) => {
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
        <div className="team-logo-container" style={{ width: size, height: size, background: '#fff', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '8px', border: '2px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
            {imgSrc ? (
                <img src={imgSrc} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="L" />
            ) : (
                <FaShieldAlt size={size * 0.5} color="#ccc" />
            )}
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
            link.download = `Result_GW${data?.fixture?.gameweek}.png`;
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
            <div className="p-box" style={{ flex: 1, padding: '12px 10px', background: player.isStarter ? '#fff' : 'rgba(255,255,255,0.6)', borderRadius: '18px', border: '1.5px solid #eee', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', flexDirection: isHome ? 'row' : 'row-reverse', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: isHome ? '#37003c' : '#00ff85', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FaUserAlt color={isHome ? '#fff' : '#37003c'} size={18} />
                    </div>
                    <div className="p-username" style={{ fontWeight: '1000', fontSize: '15px', color: '#1a1a1a', flex: 1, textAlign: isHome ? 'right' : 'left' }}>{player.userId?.username}</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f0f0f0', paddingTop: '8px' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '12px', fontWeight: '1000', color: '#666' }}>RAW: {raw}</div>
                        {hits > 0 && <div style={{ fontSize: '12px', fontWeight: '1000', color: '#ff1744' }}>HITS: -{hits}</div>}
                    </div>
                    <div className="p-score" style={{ fontSize: '30px', fontWeight: '1000', color: isHome ? '#37003c' : '#00a859' }}>{final}</div>
                </div>
            </div>
        );
    };

    return (
        <div className="page-container" style={{ padding: '15px', background: '#f0f2f5', minHeight: '100vh', direction: 'rtl' }}>
            <div className="no-export" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <button onClick={() => navigate(-1)} style={{ background: '#fff', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: '1000', color: '#37003c' }}>⬅ عودة</button>
                <button onClick={handleExportImage} disabled={exporting} style={{ background: '#37003c', color: '#00ff85', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: '1000' }}>{exporting ? <FaSpinner className="fa-spin" /> : 'مشاركة'}</button>
            </div>

            <div ref={matchRef} className="card-main" style={{ background: '#fff', borderRadius: '40px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}>
                {/* اسم البطولة */}
                <div style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <SafeLogo url={leagueInfo?.logoUrl} size={40} />
                    <div style={{ fontWeight: '1000', fontSize: '20px', color: '#37003c' }}>{leagueInfo?.name?.toUpperCase()}</div>
                </div>

                {/* قسم النتيجة - تماثل كامل */}
                <div className="header-bg" style={{ background: 'linear-gradient(180deg, #37003c 0%, #1a001c 100%)', padding: '40px 15px', color: '#fff' }}>
                    <div style={{ textAlign: 'center', fontSize: '12px', fontWeight: '1000', color: '#00ff85', marginBottom: '30px', letterSpacing: '2px' }}>GAMEWEEK {fixture.gameweek}</div>
                    
                    <div className="score-row" style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between' }}>
                        <div className="team-col" style={{ flex: 1, textAlign: 'center' }}>
                            <SafeLogo url={fixture.homeTeamId?.logoUrl} size={85} />
                            <div className="team-name" style={{ marginTop: '15px', fontWeight: '1000', fontSize: '18px', minHeight: '44px' }}>{fixture.homeTeamId?.name}</div>
                            {homeLineup?.activeChip && homeLineup.activeChip !== 'none' && (
                                <div className="chip" style={{ background: CHIPS_CONFIG[homeLineup.activeChip].bg, color: CHIPS_CONFIG[homeLineup.activeChip].color, padding: '5px 10px', borderRadius: '10px', fontSize: '10px', fontWeight: '1000', marginTop: '10px', display: 'inline-block', border: `1px solid ${CHIPS_CONFIG[homeLineup.activeChip].color}` }}>
                                    {CHIPS_CONFIG[homeLineup.activeChip].label}
                                </div>
                            )}
                        </div>

                        <div className="result-col" style={{ flex: 1.5, textAlign: 'center', paddingTop: '10px' }}>
                            <div className="main-score" style={{ fontSize: '85px', fontWeight: '1000', display: 'flex', justifyContent: 'center', gap: '10px', lineHeight: 1 }}>
                                <span>{fixture.homeScore}</span>
                                <span style={{ opacity: 0.2 }}>:</span>
                                <span>{fixture.awayScore}</span>
                            </div>
                            <div style={{ color: '#00ff85', fontSize: '12px', fontWeight: '1000', marginTop: '15px' }}>FINAL RESULT</div>
                        </div>

                        <div className="team-col" style={{ flex: 1, textAlign: 'center' }}>
                            <SafeLogo url={fixture.awayTeamId?.logoUrl} size={85} />
                            <div className="team-name" style={{ marginTop: '15px', fontWeight: '1000', fontSize: '18px', minHeight: '44px' }}>{fixture.awayTeamId?.name}</div>
                            {awayLineup?.activeChip && awayLineup.activeChip !== 'none' && (
                                <div className="chip" style={{ background: CHIPS_CONFIG[awayLineup.activeChip].bg, color: CHIPS_CONFIG[awayLineup.activeChip].color, padding: '5px 10px', borderRadius: '10px', fontSize: '10px', fontWeight: '1000', marginTop: '10px', display: 'inline-block', border: `1px solid ${CHIPS_CONFIG[awayLineup.activeChip].color}` }}>
                                    {CHIPS_CONFIG[awayLineup.activeChip].label}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* مقارنة اللاعبين */}
                <div style={{ padding: '25px 15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 10px 15px', borderBottom: '2px solid #f8f8f8', marginBottom: '20px' }}>
                        <div style={{ fontWeight: '1000', fontSize: '16px', color: '#37003c' }}>📍 HOME</div>
                        <div style={{ fontWeight: '1000', fontSize: '16px', color: '#00a859' }}>AWAY 📍</div>
                    </div>

                    {Array.from({ length: maxRows }).map((_, i) => (
                        <div key={i} style={{ marginBottom: '15px' }}>
                            {((homeLineup?.lineup?.[i] && !homeLineup.lineup[i].isStarter && (i === 0 || homeLineup.lineup[i-1].isStarter)) || 
                              (awayLineup?.lineup?.[i] && !awayLineup.lineup[i].isStarter && (i === 0 || awayLineup.lineup[i-1].isStarter))) && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', margin: '30px 0 15px' }}>
                                    <div style={{ height: '2.5px', flex: 1, background: '#f0f0f0' }}></div>
                                    <div style={{ fontWeight: '1000', fontSize: '14px', color: '#bbb' }}>BENCH</div>
                                    <div style={{ height: '2.5px', flex: 1, background: '#f0f0f0' }}></div>
                                </div>
                            )}
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <PlayerBox player={homeLineup?.lineup?.[i]} isHome={true} activeChip={homeLineup?.activeChip} />
                                <PlayerBox player={awayLineup?.lineup?.[i]} isHome={false} activeChip={awayLineup?.activeChip} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <style>{`
                @media (max-width: 600px) {
                    .main-score { font-size: 65px !important; }
                    .team-name { font-size: 14px !important; min-height: 35px !important; }
                    .team-logo-container { width: 65px !important; height: 65px !important; }
                    .p-score { font-size: 26px !important; }
                    .p-username { font-size: 13px !important; }
                    .card-main { border-radius: 30px !important; }
                }
            `}</style>
        </div>
    );
};

export default MatchDetails;