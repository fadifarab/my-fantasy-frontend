import { useState, useEffect } from 'react';
import API from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { FaRunning, FaMedal, FaGlobeAmericas } from "react-icons/fa";

const PlayerStats = () => {
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // --- اكتشاف حجم الشاشة ---
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data } = await API.get('/leagues/player-stats');
                setPlayers(data);
            } catch (error) {
                console.error("Error fetching player stats:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div style={{ textAlign: 'center', padding: '100px', fontSize: '18px' }}>جاري جلب البيانات... 🚀</div>;

    return (
        <div style={{ padding: isMobile ? '10px' : '20px', fontFamily: 'Arial', direction: 'rtl', background: '#f5f7fa', minHeight: '100vh' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', gap: '10px' }}>
                <button onClick={() => navigate('/dashboard')} style={{ padding: '8px 12px', background: 'white', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: isMobile ? '12px' : '14px' }}>⬅ عودة</button>
                <h2 style={{ margin: 0, color: '#38003c', fontSize: isMobile ? '18px' : '24px' }}><FaRunning /> الترتيب الفردي</h2>
            </div>

            {/* Table Container */}
            <div style={{ 
                maxWidth: '900px', 
                margin: '0 auto', 
                background: 'white', 
                borderRadius: '15px', 
                overflowX: 'auto', // تمرير جانبي في حال ضيق الشاشة
                boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                WebkitOverflowScrolling: 'touch'
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: isMobile ? '450px' : 'auto' }}>
                    <thead>
                        <tr style={{ background: '#38003c', color: 'white', textAlign: 'center' }}>
                            <th style={{ padding: isMobile ? '10px' : '15px', fontSize: '13px' }}>#</th>
                            <th style={{ padding: isMobile ? '10px' : '15px', textAlign: 'right', fontSize: '13px' }}>اللاعب</th>
                            {!isMobile && <th style={{ padding: '15px', fontSize: '13px' }}>الترتيب العالمي <FaGlobeAmericas size={12}/></th>}
                            <th style={{ padding: isMobile ? '10px' : '15px', fontSize: '13px' }}>ج</th>
                            <th style={{ padding: isMobile ? '10px' : '15px', background: '#00ff85', color: '#38003c', fontSize: '13px' }}>النقاط</th>
                        </tr>
                    </thead>
                    <tbody>
                        {players.map((player, index) => (
                            <tr key={player.userId} style={{ borderBottom: '1px solid #eee', textAlign: 'center', background: index % 2 === 0 ? 'white' : '#f9f9f9' }}>
                                <td style={{ padding: isMobile ? '10px' : '15px', fontWeight: 'bold' }}>
                                    {index === 0 && <FaMedal color="#ffd700" size={isMobile ? 18 : 22} />}
                                    {index === 1 && <FaMedal color="#c0c0c0" size={isMobile ? 18 : 22} />}
                                    {index === 2 && <FaMedal color="#cd7f32" size={isMobile ? 18 : 22} />}
                                    {index > 2 && index + 1}
                                </td>
                                <td style={{ padding: isMobile ? '10px' : '15px', textAlign: 'right', fontWeight: 'bold' }}>
                                    <div style={{ fontSize: isMobile ? '13px' : '15px' }}>{player.username}</div>
                                    <div style={{ fontSize: '9px', color: '#999', fontWeight: 'normal' }}>ID: {player.fplId}</div>
                                </td>
                                {!isMobile && (
                                    <td style={{ padding: '15px', color: '#666', fontSize: '14px' }}>
                                        {player.overallRank?.toLocaleString()}
                                    </td>
                                )}
                                <td style={{ padding: isMobile ? '10px' : '15px', fontSize: '13px' }}>{player.played}</td>
                                <td style={{ padding: isMobile ? '10px' : '15px', fontSize: isMobile ? '16px' : '20px', fontWeight: 'bold', color: '#38003c' }}>
                                    {player.totalPoints}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <p style={{ textAlign: 'center', marginTop: '15px', fontSize: '11px', color: '#888' }}>
                * بيانات حية من سيرفرات الفانتزي الرسمية.
            </p>
        </div>
    );
};

export default PlayerStats;