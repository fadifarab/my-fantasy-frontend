import { useState, useEffect } from 'react';
import API from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { FaRunning, FaMedal, FaGlobeAmericas } from "react-icons/fa";

const PlayerStats = () => {
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

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

    if (loading) return <div style={{ textAlign: 'center', padding: '100px', fontSize: '18px' }}>جاري سحب البيانات المباشرة من سيرفر الفانتزي... 🚀</div>;

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial', direction: 'rtl', background: '#f5f7fa', minHeight: '100vh' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px', gap: '15px' }}>
                <button onClick={() => navigate('/dashboard')} style={{ padding: '8px 15px', background: 'white', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>⬅ عودة</button>
                <h1 style={{ margin: 0, color: '#38003c' }}><FaRunning /> الترتيب الفردي العام (FPL Live)</h1>
            </div>

            <div style={{ maxWidth: '900px', margin: '0 auto', background: 'white', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#38003c', color: 'white', textAlign: 'center' }}>
                            <th style={{ padding: '15px' }}>#</th>
                            <th style={{ padding: '15px', textAlign: 'right' }}>اللاعب</th>
                            <th style={{ padding: '15px' }}>الترتيب العالمي <FaGlobeAmericas size={12}/></th>
                            <th style={{ padding: '15px' }}>الجولات</th>
                            <th style={{ padding: '15px', background: '#00ff85', color: '#38003c' }}>إجمالي النقاط</th>
                        </tr>
                    </thead>
                    <tbody>
                        {players.map((player, index) => (
                            <tr key={player.userId} style={{ borderBottom: '1px solid #eee', textAlign: 'center', background: index % 2 === 0 ? 'white' : '#f9f9f9' }}>
                                <td style={{ padding: '15px', fontWeight: 'bold' }}>
                                    {index === 0 && <FaMedal color="#ffd700" size={22} />}
                                    {index === 1 && <FaMedal color="#c0c0c0" size={22} />}
                                    {index === 2 && <FaMedal color="#cd7f32" size={22} />}
                                    {index > 2 && index + 1}
                                </td>
                                <td style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold' }}>
                                    {player.username}
                                    <div style={{ fontSize: '10px', color: '#999', fontWeight: 'normal' }}>ID: {player.fplId}</div>
                                </td>
                                <td style={{ padding: '15px', color: '#666' }}>
                                    {player.overallRank?.toLocaleString()}
                                </td>
                                <td style={{ padding: '15px' }}>{player.played}</td>
                                <td style={{ padding: '15px', fontSize: '20px', fontWeight: 'bold', color: '#38003c' }}>
                                    {player.totalPoints}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: '#888' }}>
                * ملاحظة: يتم جلب هذه النقاط مباشرة من حسابات اللاعبين الرسمية في تطبيق الفانتزي.
            </p>
        </div>
    );
};

export default PlayerStats;