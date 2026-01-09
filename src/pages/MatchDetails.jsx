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

// ✅ حل مشكلة تشوه الشعار عند التصدير
const SafeLogo = ({ url, size = 70 }) => {
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
        <div style={{ 
            width: size, height: size, background: '#fff', borderRadius: '12px', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            overflow: 'hidden', padding: '5px', border: '1px solid #eee', flexShrink: 0 
        }}>
            {imgSrc ? (
                <img src={imgSrc} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="Logo" />
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
        // ننتظر قليلاً لضمان تحميل الصور في الـ Canvas
        setTimeout(async () => {
            try {
                const canvas = await html2canvas(matchRef.current, { 
                    scale: 2, 
                    useCORS: true, 
                    backgroundColor: '#ffffff',
                    allowTaint: true
                });
                const link = document.createElement('a');
                link.href = canvas.toDataURL("image/png");
                link.download = `MatchResult.png`;
                link.click();
            } catch (error) { alert("خطأ في التصدير"); } 
            finally { setExporting(false); }
        }, 500);
    };

    if (loading || !data) return <div style={{display:'flex', height:'100vh', justifyContent:'center', alignItems:'center'}}><FaSpinner className="fa-spin" size={40} color="#37003c" /></div>;

    const { fixture, homeLineup, awayLineup } = data;
    const maxRows = Math.max(homeLineup?.lineup?.length || 0, awayLineup?.lineup?.length || 0);

    const PlayerBox = ({ player, isHome }) => {
        if (!player) return <div style={{ flex: 1 }}></div>;
        return (
            <div style={{ 
                flex: 1, padding: '10px', background: player.isStarter ? '#fff' : '#f9f9f9',
                borderRadius: '15px', border: '1px solid #eee', display: 'flex', 
                flexDirection: isHome ? 'row' : 'row-reverse', alignItems: 'center', gap: '10px' 
            }}>
                <div style={{ position: 'relative' }}>
                    <div style={{ width: '35px', height: '35px', borderRadius: '10px', background: isHome ? '#37003c' : '#00ff85', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FaUserAlt color={isHome ? '#fff' : '#37003c'} size={16} />
                    </div>
                </div>
                <div style={{ flex: 1, textAlign: isHome ? 'right' : 'left' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '12px' }}>{player.userId?.username}</div>
                    <div style={{ fontSize: '18px', fontWeight: '900', color: isHome ? '#37003c' : '#00a859' }}>{player.finalScore || 0}</div>
                </div>
            </div>
        );
    };

    return (
        <div style={{ padding: '10px', background: '#f4f4f4', minHeight: '100vh', direction: 'rtl' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <button onClick={() => navigate(-1)} style={{ background: '#fff', border: 'none', padding: '8px 15px', borderRadius: '10px', fontWeight: 'bold' }}>⬅ عودة</button>
                <button onClick={handleExportImage} disabled={exporting} style={{ background: '#37003c', color: '#00ff85', border: 'none', padding: '8px 15px', borderRadius: '10px', fontWeight: 'bold' }}>
                    {exporting ? <FaSpinner className="fa-spin" /> : 'مشاركة النتيجة'}
                </button>
            </div>

            <div ref={matchRef} style={{ background: '#fff', borderRadius: '30px', overflow: 'hidden', maxWidth: '500px', margin: '0 auto' }}>
                
                {/* اسم البطولة */}
                <div style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold', fontSize: '18px', borderBottom: '1px solid #f0f0f0' }}>
                    {leagueInfo?.name || 'FANTASY LEAGUE'}
                </div>

                {/* قسم النتيجة - تماثل كامل للهاتف */}
                <div style={{ background: '#37003c', padding: '30px 10px', color: '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        
                        {/* المضيف */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                            <SafeLogo url={fixture.homeTeamId?.logoUrl} size={65} />
                            <div style={{ fontSize: '12px', fontWeight: 'bold', textAlign: 'center', height: '30px' }}>{fixture.homeTeamId?.name}</div>
                            {homeLineup?.activeChip && homeLineup.activeChip !== 'none' && (
                                <div style={{ background: CHIPS_CONFIG[homeLineup.activeChip].bg, color: CHIPS_CONFIG[homeLineup.activeChip].color, padding: '2px 6px', borderRadius: '5px', fontSize: '9px', fontWeight: 'bold' }}>
                                    {CHIPS_CONFIG[homeLineup.activeChip].label}
                                </div>
                            )}
                        </div>

                        {/* النتيجة */}
                        <div style={{ flex: 1, textAlign: 'center' }}>
                            <div style={{ fontSize: '50px', fontWeight: '900', display: 'flex', justifyContent: 'center', gap: '10px' }}>
                                <span>{fixture.homeScore}</span>
                                <span style={{ opacity: 0.3 }}>:</span>
                                <span>{fixture.awayScore}</span>
                            </div>
                            <div style={{ fontSize: '10px', color: '#00ff85', fontWeight: 'bold' }}>FINAL RESULT</div>
                        </div>

                        {/* الضيف */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                            <SafeLogo url={fixture.awayTeamId?.logoUrl} size={65} />
                            <div style={{ fontSize: '12px', fontWeight: 'bold', textAlign: 'center', height: '30px' }}>{fixture.awayTeamId?.name}</div>
                            {awayLineup?.activeChip && awayLineup.activeChip !== 'none' && (
                                <div style={{ background: CHIPS_CONFIG[awayLineup.activeChip].bg, color: CHIPS_CONFIG[awayLineup.activeChip].color, padding: '2px 6px', borderRadius: '5px', fontSize: '9px', fontWeight: 'bold' }}>
                                    {CHIPS_CONFIG[awayLineup.activeChip].label}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* قائمة اللاعبين */}
                <div style={{ padding: '15px' }}>
                    {Array.from({ length: maxRows }).map((_, i) => (
                        <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                            <PlayerBox player={homeLineup?.lineup?.[i]} isHome={true} />
                            <PlayerBox player={awayLineup?.lineup?.[i]} isHome={false} />
                        </div>
                    ))}
                </div>

                <div style={{ padding: '20px', textAlign: 'center', fontSize: '12px', color: '#999', background: '#fcfcfc' }}>
                    {leagueInfo?.name} PRO OFFICIAL
                </div>
            </div>
        </div>
    );
};

export default MatchDetails;