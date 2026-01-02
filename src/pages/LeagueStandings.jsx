import { useState, useEffect } from 'react';
import API from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { FaTrophy, FaStar, FaExclamationTriangle } from "react-icons/fa"; // أضفنا أيقونة التحذير

const LeagueStandings = () => {
    const [teams, setTeams] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetchStandings();
    }, []);

    const fetchStandings = async () => {
        try {
            const { data } = await API.get('/leagues/standings');
            // الترتيب: حسب نقاط الدوري أولاً (التي تشمل الخصم والبونيس)، ثم فارق نقاط الفانتزي
            const sorted = data.sort((a, b) => {
                if (b.stats.points !== a.stats.points) return b.stats.points - a.stats.points;
                return b.stats.totalFplPoints - a.stats.totalFplPoints;
            });
            setTeams(sorted);
        } catch (error) { console.error(error); }
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', direction: 'rtl', backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', gap: '15px' }}>
                <button onClick={() => navigate('/dashboard')} style={{ padding: '8px 12px', cursor: 'pointer', border: 'none', borderRadius: '8px', background: 'white' }}>⬅ عودة</button>
                <h1 style={{ margin: 0, color: '#38003c', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FaTrophy color="#ffd700" /> جدول الترتيب
                </h1>
            </div>

            <div style={{ overflowX: 'auto', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#38003c', color: 'white', textAlign: 'center' }}>
                            <th style={{ padding: '15px' }}>#</th>
                            <th style={{ padding: '15px', textAlign: 'right' }}>الفريق</th>
                            <th style={{ padding: '15px' }}>لعب</th>
                            <th style={{ padding: '15px' }}>فاز</th>
                            <th style={{ padding: '15px' }}>تعادل</th>
                            <th style={{ padding: '15px' }}>خسر</th>
                            <th style={{ padding: '15px', color:'#ffd700' }} title="نقاط إضافية لأعلى رصيد"><FaStar /> بونيس</th>
                            
                            {/* العمود الجديد للعقوبات */}
                            <th style={{ padding: '15px', color: '#ff4d4d' }} title="نقاط مخصومة بسبب المخالفات">
                                <FaExclamationTriangle /> عقوبات
                            </th>

                            <th style={{ padding: '15px' }}>نقاط FPL</th>
                            <th style={{ padding: '15px', backgroundColor: '#00ff85', color: '#38003c' }}>النقاط</th>
                        </tr>
                    </thead>
                    <tbody>
                        {teams.map((team, index) => (
                            <tr key={team._id} style={{ borderBottom: '1px solid #eee', textAlign: 'center', backgroundColor: index < 4 ? '#f9fffa' : 'white' }}>
                                <td style={{ padding: '15px', fontWeight: 'bold' }}>{index + 1}</td>
                                <td style={{ padding: '15px', textAlign: 'right', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <img src={team.logoUrl} alt={team.name} style={{ width: '30px', height: '30px', objectFit: 'contain' }} />
                                    {team.name}
                                </td>
                                <td>{team.stats.played}</td>
                                <td>{team.stats.won}</td>
                                <td>{team.stats.drawn}</td>
                                <td>{team.stats.lost}</td>
                                <td style={{ fontWeight: 'bold', color: '#e65100' }}>{team.stats.bonusPoints}</td>
                                
                                {/* عرض قيمة العقوبة باللون الأحمر */}
                                <td style={{ fontWeight: 'bold', color: '#d32f2f' }}>
                                    {team.penaltyPoints > 0 ? `-${team.penaltyPoints}` : '0'}
                                </td>

                                <td style={{ color: '#666' }}>{team.stats.totalFplPoints}</td>
                                <td style={{ padding: '15px', fontWeight: 'bold', fontSize: '18px', color: '#38003c' }}>
                                    {team.stats.points}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LeagueStandings;