import { useState, useEffect, useContext } from 'react';
import API from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
    FaShieldAlt, FaTrash, FaUserTie, FaUsers, 
    FaCrown, FaStar, FaIdBadge, FaHistory,
    FaCheckCircle, FaClock, FaExclamationCircle
} from "react-icons/fa";

const TeamsManagement = () => {
    const { user } = useContext(AuthContext);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentLeagueGw, setCurrentLeagueGw] = useState(null);
    const navigate = useNavigate();
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchTeams();
    }, []);

    const fetchTeams = async () => {
        try {
            setLoading(true);
            const { data: status } = await API.get('/gameweek/status');
            const targetGw = status.nextGwId || (status.id + 1);
            setCurrentLeagueGw(targetGw);

            const { data } = await API.get('/leagues/admin/all-teams'); 
            setTeams(data);
            setLoading(false);
        } catch (error) {
            console.error("خطأ في جلب بيانات الإدارة:", error);
            setLoading(false);
        }
    };

    const handleDeleteTeam = async (teamId, teamName) => {
        if (!window.confirm(`⚠️ تحذير: هل أنت متأكد من حذف فريق "${teamName}"؟`)) return;
        try {
            await API.delete(`/teams/${teamId}`);
            setMessage(`✅ تم حذف فريق ${teamName} بنجاح`);
            setTeams(teams.filter(t => t._id !== teamId));
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setMessage('❌ فشل حذف الفريق');
        }
    };

    if (!user || user.role !== 'admin') return <div style={{textAlign:'center', marginTop:'100px'}}>صلاحية محدودة.</div>;

    return (
        <div className="admin-container" style={{ padding: '15px', fontFamily: 'Arial', direction: 'rtl', background: '#f5f7fa', minHeight: '100vh' }}>
            
            {/* Header */}
            <div className="header-admin" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button onClick={() => navigate('/dashboard')} style={{ padding: '8px 12px', background: 'white', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>⬅</button>
                    <h1 style={{ margin: 0, color: '#38003c', fontSize: '1.2rem' }}>🛡️ إدارة الأندية</h1>
                </div>
                <div style={{ display: 'flex', gap: '5px' }}>
                    <div style={{ background: '#00ff85', color: '#38003c', padding: '5px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: 'bold' }}>
                        جولة: {currentLeagueGw}
                    </div>
                    <div style={{ background: '#38003c', color: 'white', padding: '5px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: 'bold' }}>
                        الأندية: {teams.length}
                    </div>
                </div>
            </div>

            {message && <div style={{ background: '#e8f5e9', color: 'green', padding: '10px', borderRadius: '8px', marginBottom: '15px', textAlign: 'center', fontSize: '12px', border: '1px solid #c8e6c9' }}>{message}</div>}

            {/* Grid Container */}
            <div className="teams-grid">
                {teams.map(team => (
                    <div key={team._id} className="team-card" style={{ background: 'white', borderRadius: '12px', padding: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', borderTop: `5px solid ${team.isReadyForNextGw ? '#00ff85' : '#38003c'}`, display: 'flex', flexDirection: 'column', position: 'relative' }}>
                        
                        {/* مؤشر الحالة */}
                        <div style={{ alignSelf: 'flex-start', marginBottom: '10px' }}>
                            {team.isReadyForNextGw ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#2e7d32', fontSize: '10px', fontWeight: 'bold', background: '#e8f5e9', padding: '3px 8px', borderRadius: '20px', border: '1px solid #c8e6c9' }}>
                                    <FaCheckCircle className="blink-icon" /> تم الحفظ
                                </div>
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#666', fontSize: '10px', fontWeight: 'bold', background: '#f5f5f5', padding: '3px 8px', borderRadius: '20px', border: '1px solid #ddd' }}>
                                    <FaClock /> موروثة
                                </div>
                            )}
                        </div>

                        {/* معلومات النادي */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
                            <img src={team.logoUrl} style={{ width: '45px', height: '45px', objectFit: 'contain', background: '#f9f9f9', padding: '4px', borderRadius: '8px' }} onError={(e) => e.target.src = 'https://via.placeholder.com/45'} />
                            <div style={{ flex: 1 }}>
                                <h3 style={{ margin: 0, color: '#333', fontSize: '1rem' }}>{team.name}</h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#38003c', fontSize: '11px', fontWeight: 'bold' }}>
                                    <FaUserTie size={10} /> المناجير: {team.managerId?.username}
                                </div>
                            </div>
                        </div>

                        {/* قائمة الأعضاء */}
                        <div style={{ background: '#f8f9fa', borderRadius: '10px', padding: '10px', marginBottom: '15px', border: '1px solid #eee' }}>
                            <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#666', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <FaUsers /> اللاعبين ({team.members?.length || 0})
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {team.members && team.members.length > 0 ? (
                                    team.members.map((member) => (
                                        <div key={member._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', background: 'white', borderRadius: '6px', borderRight: member._id === (team.managerId?._id || team.managerId) ? '3px solid #ffd700' : '3px solid #00ff85' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '70%' }}>
                                                <span style={{ fontWeight: 'bold', fontSize: '12px', color: '#333', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {member.username} 
                                                    {member._id === (team.managerId?._id || team.managerId) && <FaCrown color="#ffd700" style={{ marginRight: '3px' }} />}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: '11px', color: '#38003c', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                                                <FaStar size={9} color="#ffd700" /> {member.totalPoints || 0}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '10px', color: '#999', fontSize: '10px' }}>لا يوجد أعضاء</div>
                                )}
                            </div>
                        </div>

                        {/* الأزرار */}
                        <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                            <button 
                                onClick={() => navigate(`/team-history/${team._id}`)} 
                                style={{ flex: 4, padding: '10px', background: '#38003c', color: '#00ff85', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                            >
                                <FaHistory /> التاريخ
                            </button>
                            <button 
                                onClick={() => handleDeleteTeam(team._id, team.name)} 
                                style={{ flex: 1, padding: '10px', background: '#ffebee', color: '#c62828', border: '1px solid #ffcdd2', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                            >
                                <FaTrash size={12} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <style>{`
                /* التحكم في شبكة البطاقات */
                .teams-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
                    gap: 20px;
                }

                /* تعديلات الهاتف (أهم جزء) */
                @media (max-width: 600px) {
                    .admin-container {
                        padding: 10px !important;
                    }
                    .teams-grid {
                        grid-template-columns: 1fr; /* جعل البطاقات تأخذ كامل العرض */
                        gap: 15px;
                    }
                    .team-card {
                        padding: 12px !important;
                    }
                    h1 {
                        font-size: 1.1rem !important;
                    }
                    .team-card h3 {
                        font-size: 0.95rem !important;
                    }
                }

                .blink-icon {
                    animation: blinker 2s linear infinite;
                }
                @keyframes blinker {
                    50% { opacity: 0.3; }
                }
            `}</style>
        </div>
    );
};

export default TeamsManagement;