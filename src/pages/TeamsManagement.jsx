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
            // 1. جلب الجولة الحالية للدوري أولاً لمعرفة الجولة المستهدفة
            const { data: status } = await API.get('/gameweek/status');
            const targetGw = status.nextGwId || (status.id + 1);
            setCurrentLeagueGw(targetGw);

            // 2. جلب البيانات الإدارية
            const { data } = await API.get('/leagues/admin/all-teams'); 
            
            // 3. فحص حالة كل فريق للجولة القادمة (Compliance Check)
            // ملاحظة: السيرفر يجب أن يعيد حقل isInherited لكل فريق في هذا المسار
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
        <div style={{ padding: '20px', fontFamily: 'Arial', direction: 'rtl', background: '#f5f7fa', minHeight: '100vh' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button onClick={() => navigate('/dashboard')} style={{ padding: '8px 15px', background: 'white', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>⬅</button>
                    <h1 style={{ margin: 0, color: '#38003c', fontSize: '24px' }}>🛡️ إدارة أندية الدوري</h1>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ background: '#00ff85', color: '#38003c', padding: '8px 15px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        الجولة المراقبة: {currentLeagueGw}
                    </div>
                    <div style={{ background: '#38003c', color: 'white', padding: '8px 15px', borderRadius: '10px', fontSize: '14px', fontWeight: 'bold' }}>
                        إجمالي الأندية: {teams.length}
                    </div>
                </div>
            </div>

            {message && <div style={{ background: '#e8f5e9', color: 'green', padding: '15px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center', fontWeight: 'bold', border: '1px solid #c8e6c9' }}>{message}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '25px' }}>
                {teams.map(team => (
                    <div key={team._id} style={{ background: 'white', borderRadius: '15px', padding: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', borderTop: `5px solid ${team.isReadyForNextGw ? '#00ff85' : '#38003c'}`, display: 'flex', flexDirection: 'column', position: 'relative' }}>
                        
                        {/* مؤشر حالة التزام الفريق (GW +1) */}
                        <div style={{ position: 'absolute', top: '15px', left: '15px' }}>
                            {team.isReadyForNextGw ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#2e7d32', fontSize: '11px', fontWeight: 'bold', background: '#e8f5e9', padding: '4px 8px', borderRadius: '20px', border: '1px solid #c8e6c9' }}>
                                    <FaCheckCircle className="blink-icon" /> تم الحفظ
                                </div>
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#666', fontSize: '11px', fontWeight: 'bold', background: '#f5f5f5', padding: '4px 8px', borderRadius: '20px', border: '1px solid #ddd' }}>
                                    <FaClock /> موروثة
                                </div>
                            )}
                        </div>

                        {/* معلومات النادي */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px', marginTop: '10px' }}>
                            <img src={team.logoUrl} style={{ width: '55px', height: '55px', objectFit: 'contain', background: '#f9f9f9', padding: '5px', borderRadius: '8px' }} onError={(e) => e.target.src = 'https://via.placeholder.com/55'} />
                            <div style={{ flex: 1 }}>
                                <h3 style={{ margin: 0, color: '#333' }}>{team.name}</h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#38003c', fontSize: '13px', fontWeight: 'bold' }}>
                                    <FaUserTie size={12} /> المناجير: {team.managerId?.username}
                                </div>
                            </div>
                        </div>

                        {/* قائمة الأعضاء */}
                        <div style={{ background: '#f8f9fa', borderRadius: '12px', padding: '15px', flex: 1, marginBottom: '20px', border: '1px solid #eee' }}>
                            <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FaUsers /> قائمة اللاعبين ({team.members?.length || 0})
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {team.members && team.members.length > 0 ? (
                                    team.members.map((member) => (
                                        <div key={member._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'white', borderRadius: '8px', borderRight: member._id === (team.managerId?._id || team.managerId) ? '4px solid #ffd700' : '4px solid #00ff85', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#333' }}>
                                                    {member.username} 
                                                    {member._id === (team.managerId?._id || team.managerId) && <FaCrown color="#ffd700" style={{ marginRight: '5px' }} title="المناجير" />}
                                                </span>
                                                <small style={{ color: '#888', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <FaIdBadge size={10} /> ID: {member.fplId || '---'}
                                                </small>
                                            </div>
                                            <div style={{ textAlign: 'left' }}>
                                                <div style={{ fontSize: '12px', color: '#38003c', fontWeight: 'bold' }}>
                                                    <FaStar size={10} color="#ffd700" /> {member.totalPoints || 0} ن
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '20px', color: '#999', fontSize: '12px' }}>لا يوجد أعضاء حالياً</div>
                                )}
                            </div>
                        </div>

                        {/* التحكم الإداري */}
                        <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                            <button 
                                onClick={() => navigate(`/team-history/${team._id}`)} 
                                style={{ 
                                    flex: 3, padding: '12px', background: '#38003c', color: '#00ff85', 
                                    border: 'none', borderRadius: '8px', cursor: 'pointer', 
                                    fontWeight: 'bold', fontSize: '14px', display: 'flex', 
                                    alignItems: 'center', justifyContent: 'center', gap: '10px',
                                    boxShadow: '0 4px 10px rgba(56,0,60,0.2)'
                                }}
                            >
                                <FaHistory /> الاطلاع على تشكيلات الفريق
                            </button>
                            <button 
                                onClick={() => handleDeleteTeam(team._id, team.name)} 
                                style={{ flex: 1, padding: '10px', background: '#ffebee', color: '#c62828', border: '1px solid #ffcdd2', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                                title="حذف النادي"
                            >
                                <FaTrash size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <style>{`
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