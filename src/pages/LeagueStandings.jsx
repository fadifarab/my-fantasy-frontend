import { useState, useEffect } from 'react';
import API from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { 
    FaTrophy, FaStar, FaExclamationTriangle, 
    FaCaretUp, FaCaretDown, FaMinus 
} from "react-icons/fa";

const LeagueStandings = () => {
    const [teams, setTeams] = useState([]);
    const navigate = useNavigate();
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        fetchStandings();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchStandings = async () => {
        try {
            const { data } = await API.get('/leagues/standings');
            const sorted = data.sort((a, b) => {
                if (b.stats.points !== a.stats.points) return b.stats.points - a.stats.points;
                return b.stats.totalFplPoints - a.stats.totalFplPoints;
            });
            setTeams(sorted);
        } catch (error) { console.error(error); }
    };

    const renderRankChange = (team, currentIndex) => {
        const currentRank = currentIndex + 1;
        const lastGwRank = team.stats.lastGwPosition; 

        if (!lastGwRank || lastGwRank === currentRank) {
            return <FaMinus style={{ color: '#ccc', fontSize: isMobile ? '8px' : '10px' }} />;
        } else if (lastGwRank > currentRank) {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0' }}>
                    <FaCaretUp style={{ color: '#00c853', fontSize: isMobile ? '14px' : '18px' }} />
                    <span style={{ color: '#00c853', fontSize: '8px', fontWeight: 'bold', marginTop: '-4px' }}>
                        {lastGwRank - currentRank}
                    </span>
                </div>
            );
        } else {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0' }}>
                    <FaCaretDown style={{ color: '#ff1744', fontSize: isMobile ? '14px' : '18px' }} />
                    <span style={{ color: '#ff1744', fontSize: '8px', fontWeight: 'bold', marginTop: '-4px' }}>
                        {currentRank - lastGwRank}
                    </span>
                </div>
            );
        }
    };

    return (
        <div style={{ padding: isMobile ? '10px' : '20px', fontFamily: 'Arial, sans-serif', direction: 'rtl', backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', gap: '15px' }}>
                <button onClick={() => navigate('/dashboard')} style={{ padding: '8px 12px', cursor: 'pointer', border: 'none', borderRadius: '8px', background: 'white', fontWeight: 'bold' }}>⬅</button>
                <h1 style={{ margin: 0, color: '#38003c', fontSize: isMobile ? '18px' : '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FaTrophy color="#ffd700" /> الترتيب
                </h1>
            </div>

            <div style={{ 
                overflowX: 'auto', 
                backgroundColor: 'white', 
                borderRadius: '12px', 
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                WebkitOverflowScrolling: 'touch' // تجعل السكرول ناعم في الآيفون
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: isMobile ? '500px' : '800px' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#38003c', color: 'white', textAlign: 'center' }}>
                            <th style={{ padding: isMobile ? '10px 5px' : '15px', width: isMobile ? '40px' : '60px' }}>#</th>
                            <th style={{ padding: '15px', textAlign: 'right' }}>الفريق</th>
                            <th style={{ padding: '10px' }}>لعب</th>
                            <th style={{ padding: '10px' }}>فاز</th>
                            {!isMobile && <th style={{ padding: '15px' }}>تعادل</th>}
                            {!isMobile && <th style={{ padding: '15px' }}>خسر</th>}
                            <th style={{ padding: '10px', color:'#ffd700' }}><FaStar /></th>
                            <th style={{ padding: '10px', color: '#ff4d4d' }}><FaExclamationTriangle /></th>
                            <th style={{ padding: '10px' }}>FPL</th>
                            <th style={{ padding: '10px', backgroundColor: '#00ff85', color: '#38003c' }}>ن</th>
                        </tr>
                    </thead>
                    <tbody>
                        {teams.map((team, index) => (
                            <tr key={team._id} style={{ 
                                borderBottom: '1px solid #eee', 
                                textAlign: 'center', 
                                backgroundColor: index < 3 ? '#f9fffa' : 'white' 
                            }}>
                                {/* ✅ تعديل خلية الترتيب والأسهم */}
                                <td style={{ padding: isMobile ? '5px' : '15px' }}>
                                    <div style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center', 
                                        flexDirection: isMobile ? 'column' : 'row', // عمودي في الجوال ليوفر مساحة
                                        gap: isMobile ? '2px' : '8px' 
                                    }}>
                                        <div style={{ height: '20px', display: 'flex', alignItems: 'center' }}>
                                            {renderRankChange(team, index)}
                                        </div>
                                        <span style={{ fontWeight: 'bold', fontSize: isMobile ? '13px' : '16px' }}>{index + 1}</span>
                                    </div>
                                </td>
                                
                                <td style={{ padding: '10px', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <img src={team.logoUrl} alt="" style={{ width: isMobile ? '20px' : '30px', height: isMobile ? '20px' : '30px', objectFit: 'contain' }} />
                                        <span style={{ fontWeight: 'bold', fontSize: isMobile ? '12px' : '14px', whiteSpace: 'nowrap' }}>{team.name}</span>
                                    </div>
                                </td>
                                
                                <td style={{ fontSize: isMobile ? '12px' : '14px' }}>{team.stats.played}</td>
                                <td style={{ fontSize: isMobile ? '12px' : '14px' }}>{team.stats.won}</td>
                                {!isMobile && <td>{team.stats.drawn}</td>}
                                {!isMobile && <td>{team.stats.lost}</td>}
                                <td style={{ fontWeight: 'bold', color: '#e65100', fontSize: isMobile ? '12px' : '14px' }}>{team.stats.bonusPoints}</td>
                                <td style={{ fontWeight: 'bold', color: '#d32f2f', fontSize: isMobile ? '12px' : '14px' }}>{team.penaltyPoints || 0}</td>
                                <td style={{ color: '#666', fontSize: isMobile ? '11px' : '13px' }}>{team.stats.totalFplPoints}</td>
                                <td style={{ fontWeight: 'bold', fontSize: isMobile ? '15px' : '18px', color: '#38003c' }}>{team.stats.points}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LeagueStandings;