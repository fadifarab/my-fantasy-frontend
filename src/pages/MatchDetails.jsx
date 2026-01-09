import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { FaArrowLeft, FaBolt, FaUserAlt, FaCamera, FaSpinner, FaTrophy, FaCrown, FaExchangeAlt, FaTshirt, FaStar } from "react-icons/fa";
import html2canvas from 'html2canvas';

// ✅ مصفوفة تعريف الخواص لسهولة الوصول إليها
const CHIP_CONFIG = {
    'tripleCaptain': { label: 'Triple Captain', icon: <FaCrown color="#ffd700" />, color: '#ffd700' },
    'benchBoost': { label: 'Bench Boost', icon: <FaExchangeAlt color="#00ff87" />, color: '#00ff87' },
    'freeHit': { label: 'Free Hit', icon: <FaTshirt color="#00ff87" />, color: '#00ff87' },
    'theBest': { label: 'The Best', icon: <FaStar color="#9c27b0" />, color: '#9c27b0' }
};

const SafeLogo = ({ url, size = 60 }) => {
    const [imgSrc, setImgSrc] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!url) {
            setImgSrc('data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'); 
            setIsLoading(false);
            return;
        }
        const fetchBase64 = async () => {
            try {
                const { data } = await API.post('/teams/proxy-image', { imageUrl: url });
                if (data.base64) setImgSrc(data.base64);
            } catch (err) {
                setImgSrc('data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');
            } finally { setIsLoading(false); }
        };
        fetchBase64();
    }, [url]);

    return (
        <div style={{ 
            width: `${size}px`, height: `${size}px`, minWidth: `${size}px`, minHeight: `${size}px`,
            background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', 
            justifyContent: 'center', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.4)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)', position: 'relative'
        }}>
            {!isLoading && <img src={imgSrc} alt="Logo" style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain', display: 'block' }} />}
        </div>
    );
};

const MatchDetails = () => {
    const { fixtureId } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const matchRef = useRef(null);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const res = await API.get(`/fixtures/details/${fixtureId}`);
                setData(res.data);
            } catch (err) { console.error(err); } 
            finally { setLoading(false); }
        };
        fetchDetails();
    }, [fixtureId]);

    const handleExportImage = async () => {
        if (!matchRef.current) return;
        setExporting(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 600));
            const canvas = await html2canvas(matchRef.current, {
                scale: 2, useCORS: true, allowTaint: false, backgroundColor: '#f5f7fa',
                logging: false, width: matchRef.current.offsetWidth, height: matchRef.current.offsetHeight
            });
            const link = document.createElement('a');
            link.href = canvas.toDataURL("image/png", 1.0);
            link.download = `Match-Result.png`;
            link.click();
        } catch (error) { alert("حدث خطأ أثناء حفظ الصورة"); } 
        finally { setExporting(false); }
    };

    const sortLineup = (lineup) => {
        if (!lineup) return [];
        return [...lineup].sort((a, b) => (b.isCaptain - a.isCaptain) || (b.isStarter - a.isStarter));
    };

    if (loading || !data) return <div style={{textAlign:'center', padding:'100px'}}><FaSpinner className="fa-spin" /></div>;

    const { fixture, homeLineup, awayLineup } = data;

    // ✅ مكون عرض الخاصية (Chip Badge)
    const ChipBadge = ({ chipId }) => {
        if (!chipId || chipId === 'none') return null;
        const config = CHIP_CONFIG[chipId];
        if (!config) return null;
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '20px', border: `1px solid ${config.color}`, marginTop: '8px' }}>
                {config.icon}
                <span style={{ fontSize: '10px', fontWeight: 'bold', color: config.color, whiteSpace: 'nowrap' }}>{config.label}</span>
            </div>
        );
    };

    const PlayerCard = ({ player, isHome }) => (
        <div className="player-card-row" style={{ 
            display: 'flex', flexDirection: isHome ? 'row' : 'row-reverse', 
            alignItems: 'center', padding: '10px 15px', marginBottom: '8px', 
            borderRadius: '12px', backgroundColor: player.isStarter ? 'white' : '#f8f8f8', 
            borderRight: !isHome ? '5px solid #00ff85' : 'none',
            borderLeft: isHome ? '5px solid #38003c' : 'none',
            boxShadow: '0 3px 6px rgba(0,0,0,0.06)', position: 'relative', height: '60px'
        }}>
            <div className="player-name-box" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexDirection: isHome ? 'row' : 'row-reverse', width: '45%' }}>
                <div style={{ position: 'relative' }}>
                    <div style={{ width: '32px', height: '32px', background: '#eee', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FaUserAlt size={14} color={player.isStarter ? '#38003c' : '#bbb'} />
                    </div>
                    {player.isCaptain && (
                        <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#ffd700', color: '#000', fontSize: '10px', fontWeight: 'bold', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid white' }}>C</span>
                    )}
                </div>
                <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#333', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{player.userId?.username}</div>
            </div>

            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {player.transferCost > 0 && (
                    <span style={{ backgroundColor: '#ffebee', color: '#d32f2f', border: '1px solid #ffcdd2', borderRadius: '6px', padding: '2px 6px', fontSize: '10px', fontWeight: 'bold' }}>-{player.transferCost}H</span>
                )}
            </div>

            <div style={{ width: '40px', display: 'flex', justifyContent: 'center' }}>
                <div style={{ fontWeight: '900', fontSize: '18px', color: player.isStarter ? (isHome ? '#38003c' : '#00a859') : '#999' }}>{player.finalScore ?? 0}</div>
            </div>
        </div>
    );

    return (
        <div style={{ padding: '20px', backgroundColor: '#f5f7fa', minHeight: '100vh', direction: 'rtl' }} className="details-page-container">
            <div className="top-nav" style={{ display: 'flex', justifyContent: 'space-between', maxWidth: '850px', margin: '0 auto 20px' }}>
                <button onClick={() => navigate(-1)} style={{ background: '#fff', border: 'none', borderRadius: '8px', padding: '8px 15px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}><FaArrowLeft /> عودة</button>
                <button onClick={handleExportImage} disabled={exporting} style={{ background: '#38003c', color: '#00ff85', border: 'none', borderRadius: '10px', padding: '10px 20px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {exporting ? <FaSpinner className="fa-spin" /> : <><FaCamera /> حفظ الصورة</>}
                </button>
            </div>

            <div ref={matchRef} className="match-card-main" style={{ maxWidth: '850px', margin: '0 auto', background: '#fff', borderRadius: '25px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                <div className="header-gradient" style={{ background: 'linear-gradient(135deg, #38003c 0%, #240028 100%)', padding: '40px 20px', color: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px' }} className="score-row">
                        
                        <div style={{ flex: 2, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }} className="team-box">
                            <SafeLogo url={fixture.homeTeamId?.logoUrl} size={window.innerWidth < 768 ? 70 : 90} />
                            <h4 style={{ marginTop: '12px', fontSize: '16px', fontWeight: '900' }}>{fixture.homeTeamId?.name}</h4>
                            {/* ✅ إظهار الخاصية للفريق الأول */}
                            <ChipBadge chipId={homeLineup?.activeChip} />
                        </div>

                        <div style={{ flex: 3, textAlign: 'center' }} className="score-box">
                            <div style={{ fontSize: '12px', color: '#00ff85', fontWeight: 'bold', marginBottom: '5px' }}>GAMEWEEK {fixture.gameweek}</div>
                            <div style={{ fontSize: '50px', fontWeight: '900', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }} className="score-numbers">
                                <span>{fixture.homeScore}</span><span style={{opacity:0.3}}>:</span><span>{fixture.awayScore}</span>
                            </div>
                        </div>

                        <div style={{ flex: 2, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }} className="team-box">
                            <SafeLogo url={fixture.awayTeamId?.logoUrl} size={window.innerWidth < 768 ? 70 : 90} />
                            <h4 style={{ marginTop: '12px', fontSize: '16px', fontWeight: '900' }}>{fixture.awayTeamId?.name}</h4>
                            {/* ✅ إظهار الخاصية للفريق الثاني */}
                            <ChipBadge chipId={awayLineup?.activeChip} />
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', padding: '25px' }} className="lineups-grid">
                    <div className="lineup-col">
                        <div style={{ padding: '8px', borderBottom: '3px solid #38003c', marginBottom: '15px', fontWeight: 'bold', color: '#38003c', textAlign: 'center' }}>صاحب الأرض</div>
                        {sortLineup(homeLineup?.lineup).map((p, i) => <PlayerCard key={i} player={p} isHome={true} />)}
                    </div>
                    <div className="lineup-col">
                        <div style={{ padding: '8px', borderBottom: '3px solid #00ff85', marginBottom: '15px', fontWeight: 'bold', color: '#00796b', textAlign: 'center' }}>الضيوف</div>
                        {sortLineup(awayLineup?.lineup).map((p, i) => <PlayerCard key={i} player={p} isHome={false} />)}
                    </div>
                </div>
            </div>

            <style>{`
                .fa-spin { animation: spin 2s linear infinite; } 
                @keyframes spin { 100% { transform: rotate(360deg); } }

                @media (max-width: 768px) {
                    .details-page-container { padding: 10px !important; }
                    .header-gradient { padding: 20px 10px !important; }
                    .score-numbers { font-size: 38px !important; }
                    .team-box h4 { font-size: 13px !important; margin-top: 8px !important; }
                    .lineups-grid { grid-template-columns: 1fr !important; padding: 15px !important; gap: 30px !important; }
                    .player-name-box { width: 60% !important; }
                    .player-card-row { height: 55px !important; padding: 5px 10px !important; }
                    .top-nav { margin-bottom: 10px !important; }
                }
            `}</style>
        </div>
    );
};

export default MatchDetails;