import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { FaArrowLeft, FaBolt, FaExclamationTriangle, FaUserAlt, FaCamera, FaSpinner } from "react-icons/fa";
import html2canvas from 'html2canvas';

// ✅ SafeLogo: معالجة الصور لضمان عمل html2canvas ومنع مشاكل الـ CORS
const SafeLogo = ({ url }) => {
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

    if (isLoading) return <div style={{width:'60px', height:'60px', borderRadius:'50%', background:'#eee'}}></div>;

    return (
        <svg width="70" height="70" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', margin: 'auto' }}>
            <image href={imgSrc} width="60" height="60" x="10" y="10" preserveAspectRatio="xMidYMid meet" />
        </svg>
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

    // --- اكتشاف حجم الشاشة ---
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
            if (a.isCaptain) return -1;
            if (b.isCaptain) return 1;
            if (a.isStarter && !b.isStarter) return -1;
            if (!a.isStarter && b.isStarter) return 1;
            return 0;
        });
    };

    const handleExportImage = async () => {
        if (!matchRef.current) return;
        setExporting(true);
        try {
            const element = matchRef.current;
            window.scrollTo(0, 0);
            await new Promise(resolve => setTimeout(resolve, 800));

            const canvas = await html2canvas(element, {
                scale: 2, 
                useCORS: true, 
                allowTaint: true,
                backgroundColor: '#f5f7fa',
                height: element.scrollHeight, 
                windowHeight: element.scrollHeight, 
            });
            
            const image = canvas.toDataURL("image/png");
            const link = document.createElement('a');
            link.href = image;
            link.download = `Match-Details.png`;
            link.click();
        } catch (error) { alert("فشل تصدير الصورة"); }
        setExporting(false);
    };

    if (loading) return <div style={{display:'flex', justifyContent:'center', alignItems:'center', height:'100vh'}}>⚽ جاري التحميل...</div>;
    if (error) return <div style={{textAlign:'center', padding:'50px', color:'red'}}>{error} <br/><button onClick={()=>navigate(-1)}>عودة</button></div>;
    if (!data) return null;

    const { fixture, homeLineup, awayLineup, warning } = data;
    const sortedHome = sortLineup(homeLineup?.lineup);
    const sortedAway = sortLineup(awayLineup?.lineup);

    const PlayerCard = ({ player, isHome, teamActiveChip }) => {
        if (!player) return null;
        const hit = player.transferCost || 0;
        const isTripleCaptain = teamActiveChip === 'tripleCaptain';
        let multiplier = 1;
        if (player.isCaptain) multiplier = isTripleCaptain ? 3 : 2;
        const displayScore = (player.finalScore ?? 0) * multiplier;

        return (
            <div style={{ 
                display: 'flex', 
                flexDirection: isHome ? 'row' : 'row-reverse', 
                alignItems: 'center', 
                padding: isMobile ? '8px 10px' : '10px 15px', 
                marginBottom: '8px', 
                borderRadius: '10px', 
                backgroundColor: player.isStarter ? 'white' : '#e0e0e0', 
                borderLeft: isHome ? '5px solid #38003c' : 'none', 
                borderRight: !isHome ? '5px solid #00ff85' : 'none', 
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                minHeight: '55px'
            }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: isHome ? 'row' : 'row-reverse', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexDirection: isHome ? 'row' : 'row-reverse' }}>
                        {player.isCaptain && ( <span style={{ width: '20px', height: '20px', backgroundColor: '#ffeb3b', borderRadius: '50%', border: '1px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' }}>C</span> )}
                        <span style={{ fontWeight: 'bold', fontSize: isMobile ? '13px' : '15px', color: player.isStarter ? '#333' : '#666' }}>{player.userId?.username}</span>
                        {isTripleCaptain && player.isCaptain && ( <span style={{fontSize:'8px', background:'black', color:'white', padding:'2px 4px', borderRadius:'3px'}}>TC</span> )}
                    </div>
                </div>
                <div style={{ width: isMobile ? '32px' : '40px', height: isMobile ? '32px' : '40px', borderRadius: '50%', backgroundColor: player.isStarter ? (isHome ? '#38003c' : '#009688') : '#757575', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: isMobile ? '14px' : '18px' }}>
                    {displayScore}
                </div>
            </div>
        );
    };

    return (
        <div style={{ padding: isMobile ? '10px' : '20px', backgroundColor: '#f5f7fa', minHeight: '100vh', direction: 'rtl' }}>
            {/* Header Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: isMobile ? '14px' : '16px', color:'#555', fontWeight:'bold' }}> <FaArrowLeft /> عودة </button>
                <button onClick={handleExportImage} disabled={exporting} style={{ background: '#38003c', color: '#00ff85', border: 'none', borderRadius: '20px', padding: '6px 15px', fontSize: isMobile ? '12px' : '14px', cursor: 'pointer', display:'flex', alignItems:'center', gap:'5px' }}> 
                    {exporting ? <FaSpinner className="fa-spin"/> : <FaCamera />} {isMobile ? 'حفظ' : 'حفظ كصورة'}
                </button>
            </div>

            <div ref={matchRef} style={{ padding: '5px', backgroundColor: '#f5f7fa' }}>
                {/* 🏆 Scoreboard - النسخة النهائية المحسنة للتمركز 🏆 */}
                <div style={{ 
                    background: 'linear-gradient(135deg, #38003c 0%, #1a001b 100%)', 
                    borderRadius: '20px', 
                    padding: isMobile ? '20px 10px' : '30px', 
                    color: 'white', 
                    marginBottom: '20px', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    boxShadow: '0 10px 20px rgba(56, 0, 60, 0.3)'
                }}>
                    <div style={{ flex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <SafeLogo url={fixture.homeTeamId?.logoUrl} />
                        <h4 style={{ margin: '8px 0', fontSize: isMobile ? '12px' : '18px', fontWeight: 'bold' }}>{fixture.homeTeamId?.name}</h4>
                        {homeLineup?.activeChip && homeLineup.activeChip !== 'none' && ( <div style={{ background: '#e91e63', padding: '2px 8px', borderRadius: '10px', fontSize: '9px', fontWeight:'bold' }}> <FaBolt /> {homeLineup.activeChip} </div> )}
                    </div>

                    <div style={{ flex: 0.8, textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minWidth: isMobile ? '80px' : '150px' }}>
                        <div style={{ fontSize: isMobile ? '10px' : '12px', color: '#00ff85', fontWeight:'bold', marginBottom: '5px' }}>GW {fixture.gameweek}</div>
                        <div style={{ fontSize: isMobile ? '28px' : '48px', fontWeight: '900', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: isMobile ? '5px' : '15px', letterSpacing: '1px' }}>
                            {fixture.isFinished ? (
                                <>
                                    <span>{fixture.homeScore}</span>
                                    <span style={{ opacity: 0.3 }}>-</span>
                                    <span>{fixture.awayScore}</span>
                                </>
                            ) : (
                                <span style={{ fontSize: isMobile ? '20px' : '32px', color: '#00ff85' }}>VS</span>
                            )}
                        </div>
                        <small style={{ fontSize: '9px', opacity: 0.6, marginTop: '5px', fontWeight: 'bold' }}>FINAL SCORE</small>
                    </div>

                    <div style={{ flex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <SafeLogo url={fixture.awayTeamId?.logoUrl} />
                        <h4 style={{ margin: '8px 0', fontSize: isMobile ? '12px' : '18px', fontWeight: 'bold' }}>{fixture.awayTeamId?.name}</h4>
                        {awayLineup?.activeChip && awayLineup.activeChip !== 'none' && ( <div style={{ background: '#e91e63', padding: '2px 8px', borderRadius: '10px', fontSize: '9px', fontWeight:'bold' }}> <FaBolt /> {awayLineup.activeChip} </div> )}
                    </div>
                </div>

                {/* Lineups List */}
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '15px' }}>
                    <div style={{ background: 'white', borderRadius: '15px', padding: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                        <h4 style={{ borderBottom: '2px solid #38003c', paddingBottom: '8px', color: '#38003c', marginTop:0 }}>{fixture.homeTeamId?.name}</h4>
                        {sortedHome?.map((p, i) => (
                            <PlayerCard key={i} player={p} isHome={true} teamActiveChip={homeLineup?.activeChip} />
                        ))}
                    </div>

                    <div style={{ background: 'white', borderRadius: '15px', padding: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                        <h4 style={{ borderBottom: '2px solid #00ff85', paddingBottom: '8px', color: '#00796b', marginTop:0 }}>{fixture.awayTeamId?.name}</h4>
                        {sortedAway?.map((p, i) => (
                            <PlayerCard key={i} player={p} isHome={false} teamActiveChip={awayLineup?.activeChip} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
export default MatchDetails;