import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { FaArrowLeft, FaBolt, FaExclamationTriangle, FaUserAlt, FaCamera, FaSpinner, FaTrophy } from "react-icons/fa";
import html2canvas from 'html2canvas';

// ✅ SafeLogo المطور (يدعم التحميل السلس)
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
        <div style={{ width: size, height: size, background: isLoading ? '#f0f0f0' : 'transparent', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {!isLoading && <img src={imgSrc} alt="Logo" style={{ width: '85%', height: '85%', objectFit: 'contain' }} />}
        </div>
    );
};

const MatchDetails = () => {
    const { fixtureId } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [exporting, setExporting] = useState(false);
    const matchRef = useRef(null);

    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const res = await API.get(`/fixtures/details/${fixtureId}`);
                setData(res.data);
            } catch (err) { setError(err.response?.data?.message || 'تعذر تحميل البيانات'); } 
            finally { setLoading(false); }
        };
        fetchDetails();
    }, [fixtureId]);

    const sortLineup = (lineup) => {
        if (!lineup) return [];
        return [...lineup].sort((a, b) => {
            if (a.isCaptain && !b.isCaptain) return -1;
            if (!a.isCaptain && b.isCaptain) return 1;
            if (a.isStarter && !b.isStarter) return -1;
            if (!a.isStarter && b.isStarter) return 1;
            return 0;
        });
    };

    const handleExportImage = async () => {
        if (!matchRef.current) return;
        setExporting(true);
        try {
            const canvas = await html2canvas(matchRef.current, {
                scale: 2, useCORS: true, backgroundColor: '#f5f7fa'
            });
            const image = canvas.toDataURL("image/png");
            const link = document.createElement('a');
            link.href = image;
            link.download = `Match-Result.png`;
            link.click();
        } catch (error) { alert("فشل تصدير الصورة"); }
        setExporting(false);
    };

    if (loading) return <div style={{display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', flexDirection:'column', gap:'10px'}}>
        <FaSpinner className="fa-spin" size={30} color="#38003c" />
        <span style={{fontWeight:'bold'}}>جاري جلب النتائج...</span>
    </div>;

    const { fixture, homeLineup, awayLineup } = data;
    const sortedHome = sortLineup(homeLineup?.lineup);
    const sortedAway = sortLineup(awayLineup?.lineup);

    const PlayerCard = ({ player, isHome, teamActiveChip }) => {
        const isTripleCaptain = teamActiveChip === 'tripleCaptain';
        let multiplier = 1;
        if (player.isCaptain) multiplier = isTripleCaptain ? 3 : 2;
        const displayScore = (player.finalScore ?? 0) * multiplier;

        return (
            <div style={{ 
                display: 'flex', 
                flexDirection: isHome ? 'row' : 'row-reverse', 
                alignItems: 'center', 
                padding: '8px 12px', 
                marginBottom: '6px', 
                borderRadius: '12px', 
                backgroundColor: player.isStarter ? 'white' : '#f0f0f0', 
                borderRight: !isHome ? '4px solid #00ff85' : 'none',
                borderLeft: isHome ? '4px solid #38003c' : 'none',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexDirection: isHome ? 'row' : 'row-reverse' }}>
                    <div style={{ position: 'relative' }}>
                        <div style={{ width: '32px', height: '32px', background: '#eee', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FaUserAlt size={14} color={player.isStarter ? '#38003c' : '#bbb'} />
                        </div>
                        {player.isCaptain && (
                            <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#ffd700', color: 'black', fontSize: '9px', fontWeight: 'bold', width: '15px', height: '15px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid white' }}>C</span>
                        )}
                    </div>
                    <div style={{ textAlign: isHome ? 'right' : 'left' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '13px', color: player.isStarter ? '#333' : '#888' }}>{player.userId?.username}</div>
                        {isTripleCaptain && player.isCaptain && <span style={{ fontSize: '8px', color: '#e91e63', fontWeight: 'bold' }}>TRIPLE CAPTAIN</span>}
                    </div>
                </div>
                <div style={{ 
                    fontWeight: '900', 
                    fontSize: '16px', 
                    color: player.isStarter ? (isHome ? '#38003c' : '#00a859') : '#999',
                    minWidth: '25px',
                    textAlign: 'center'
                }}>
                    {displayScore}
                </div>
            </div>
        );
    };

    return (
        <div style={{ padding: isMobile ? '0' : '20px', backgroundColor: '#f5f7fa', minHeight: '100vh', direction: 'rtl' }}>
            {/* Control Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', backgroundColor: isMobile ? 'white' : 'transparent', marginBottom: isMobile ? '0' : '10px' }}>
                <button onClick={() => navigate(-1)} style={{ background: '#eee', border: 'none', borderRadius: '5px', padding: '5px 12px', cursor: 'pointer', fontWeight: 'bold' }}><FaArrowLeft /> عودة</button>
                <button onClick={handleExportImage} disabled={exporting} style={{ background: '#38003c', color: '#00ff85', border: 'none', borderRadius: '8px', padding: '6px 15px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {exporting ? <FaSpinner className="fa-spin" /> : <FaCamera />} حفظ الصورة
                </button>
            </div>

            <div ref={matchRef} style={{ padding: isMobile ? '10px' : '0' }}>
                {/* 🏟 Scoreboard Modernized 🏟 */}
                <div style={{ 
                    background: 'linear-gradient(180deg, #38003c 0%, #240028 100%)', 
                    borderRadius: isMobile ? '15px' : '25px', 
                    padding: isMobile ? '25px 10px' : '40px', 
                    color: 'white', 
                    marginBottom: '20px', 
                    boxShadow: '0 12px 24px rgba(0,0,0,0.2)',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{ position: 'absolute', top: '-20px', left: '-20px', opacity: 0.05 }}><FaTrophy size={150} /></div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                        <div style={{ flex: 1, textAlign: 'center' }}>
                            <SafeLogo url={fixture.homeTeamId?.logoUrl} size={isMobile ? 55 : 85} />
                            <h4 style={{ fontSize: isMobile ? '12px' : '18px', marginTop: '10px' }}>{fixture.homeTeamId?.name}</h4>
                            {homeLineup?.activeChip && homeLineup.activeChip !== 'none' && <span style={{fontSize:'9px', background:'#e91e63', padding:'2px 8px', borderRadius:'10px'}}> <FaBolt /> {homeLineup.activeChip}</span>}
                        </div>

                        <div style={{ flex: 1, textAlign: 'center' }}>
                            <div style={{ color: '#00ff85', fontSize: '10px', fontWeight: 'bold', marginBottom: '5px' }}>GAMEWEEK {fixture.gameweek}</div>
                            <div style={{ fontSize: isMobile ? '36px' : '56px', fontWeight: '900', letterSpacing: '2px', color: '#fff', display:'flex', justifyContent:'center', alignItems:'center', gap:'10px' }}>
                                {fixture.isFinished ? (
                                    <><span>{fixture.homeScore}</span><span style={{opacity:0.2}}>:</span><span>{fixture.awayScore}</span></>
                                ) : <span style={{color:'#00ff85', fontSize:'24px'}}>VS</span>}
                            </div>
                            <div style={{ fontSize: '10px', opacity: 0.6, fontWeight: 'bold', letterSpacing: '1px' }}>MATCH DETAILS</div>
                        </div>

                        <div style={{ flex: 1, textAlign: 'center' }}>
                            <SafeLogo url={fixture.awayTeamId?.logoUrl} size={isMobile ? 55 : 85} />
                            <h4 style={{ fontSize: isMobile ? '12px' : '18px', marginTop: '10px' }}>{fixture.awayTeamId?.name}</h4>
                            {awayLineup?.activeChip && awayLineup.activeChip !== 'none' && <span style={{fontSize:'9px', background:'#e91e63', padding:'2px 8px', borderRadius:'10px'}}> <FaBolt /> {awayLineup.activeChip}</span>}
                        </div>
                    </div>
                </div>

                {/* 📋 Lineups Side by Side 📋 */}
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '15px' }}>
                    <div style={{ background: 'transparent' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 10px', borderBottom: '2px solid #38003c', marginBottom: '10px' }}>
                            <span style={{ fontWeight: 'bold', color: '#38003c' }}>{fixture.homeTeamId?.name}</span>
                            <span style={{ fontSize: '12px', color: '#666' }}>النقاط</span>
                        </div>
                        {sortedHome.map((p, i) => <PlayerCard key={i} player={p} isHome={true} teamActiveChip={homeLineup?.activeChip} />)}
                    </div>

                    <div style={{ background: 'transparent' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 10px', borderBottom: '2px solid #00ff85', marginBottom: '10px' }}>
                            <span style={{ fontSize: '12px', color: '#666' }}>النقاط</span>
                            <span style={{ fontWeight: 'bold', color: '#00796b' }}>{fixture.awayTeamId?.name}</span>
                        </div>
                        {sortedAway.map((p, i) => <PlayerCard key={i} player={p} isHome={false} teamActiveChip={awayLineup?.activeChip} />)}
                    </div>
                </div>
            </div>
        </div>
    );
};
export default MatchDetails;