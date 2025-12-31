import { useState } from 'react';
import API from '../utils/api';
import { FaSave, FaSync, FaTable } from "react-icons/fa"; // تم تصحيح الخطأ هنا

const AdminDeadlines = () => {
  const [gameweeks, setGameweeks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  // 1. سحب البيانات من سيرفر الفانتازي (عبر الباك-اند الخاص بك)
  const fetchFromFPL = async () => {
    setLoading(true);
    setStatus('جاري سحب البيانات من سيرفر الفانتازي... ⏳');
    try {
      // تأكد أن المسار في الباك اند يجلب المصفوفة كاملة من:
      // https://fantasy.premierleague.com/api/bootstrap-static/
      const { data } = await API.get('/admin/fetch-fpl-deadlines');
      
      if (data && data.events) {
        // نضع المصفوفة كاملة (38 جولة) في الحالة
        setGameweeks(data.events); 
        setStatus(`✅ تم جلب ${data.events.length} جولة بنجاح. يمكنك الآن حفظها في قاعدتك.`);
      } else {
        setStatus('⚠️ لم يتم العثور على بيانات الجولات في الرد القادم من السيرفر');
      }
    } catch (err) {
      setStatus('❌ فشل جلب البيانات. تأكد من اتصال السيرفر بالإنترنت.');
      console.error(err);
    }
    setLoading(false);
  };

  // 2. حفظ كل الجولات بضغطة واحدة (Bulk Save)
  const saveAllToDb = async () => {
    if (gameweeks.length === 0) return alert('الرجاء سحب البيانات أولاً');
    if (!window.confirm(`هل تريد حفظ مواعيد الـ ${gameweeks.length} جولة كاملة في قاعدة بياناتك؟`)) return;
    
    setStatus('جاري حفظ البيانات في قاعدة بياناتك... 💾');
    try {
      // نرسل المصفوفة كاملة للسيرفر
      await API.post('/admin/deadlines/bulk', { events: gameweeks });
      setStatus('✅ تم تحديث كافة المواعيد بنجاح في قاعدة البيانات الخاصة بك!');
      alert('تم تحديث الـ 38 جولة بنجاح!');
    } catch (err) {
      setStatus('❌ فشل حفظ البيانات في القاعدة');
      alert('فشل حفظ الكل، جرب الحفظ الفردي');
    }
  };

  // 3. حفظ جولة واحدة فقط يدوياً
  const saveOneToDb = async (gw) => {
    try {
      await API.post('/admin/deadlines', {
        gw: gw.id,
        deadline_time: gw.deadline_time
      });
      alert(`✅ تم حفظ الجولة ${gw.id} بنجاح`);
    } catch (err) {
      alert('❌ خطأ في الحفظ');
    }
  };

  return (
    <div style={{ padding: '40px', direction: 'rtl', fontFamily: 'Arial', backgroundColor: '#f4f7f6', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', background: '#fff', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '2px solid #eee', paddingBottom: '20px' }}>
          <h2 style={{ color: '#37003c', margin: 0 }}>🗓 إدارة ومزامنة مواعيد الجولات</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
             <button 
                onClick={fetchFromFPL} 
                disabled={loading}
                style={{ padding: '12px 20px', background: '#37003c', color: '#00ff85', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <FaSync className={loading ? 'fa-spin' : ''} /> {loading ? 'جاري السحب...' : 'سحب من FPL'}
              </button>
              {gameweeks.length > 0 && (
                <button 
                  onClick={saveAllToDb}
                  style={{ padding: '12px 20px', background: '#00ff85', color: '#37003c', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  <FaSave /> حفظ الـ 38 جولة في قاعدتي
                </button>
              )}
          </div>
        </div>

        {status && (
          <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e3f2fd', color: '#0d47a1', borderRadius: '10px', textAlign: 'center', fontWeight: 'bold' }}>
            {status}
          </div>
        )}

        <div style={{ maxHeight: '600px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '15px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
            <thead style={{ backgroundColor: '#37003c', color: '#fff', position: 'sticky', top: 0 }}>
              <tr>
                <th style={{ padding: '15px' }}>رقم الجولة</th>
                <th style={{ padding: '15px' }}>موعد الديدلاين (توقيت محلي)</th>
                <th style={{ padding: '15px' }}>الحالة</th>
                <th style={{ padding: '15px' }}>الإجراء</th>
              </tr>
            </thead>
            <tbody>
              {gameweeks.map((gw) => (
                <tr key={gw.id} style={{ borderBottom: '1px solid #eee', backgroundColor: gw.is_current ? '#fff9c4' : 'transparent' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>الجولة {gw.id} {gw.is_current && '⭐'}</td>
                  <td style={{ padding: '12px' }}>{new Date(gw.deadline_time).toLocaleString('ar-EG', { dateStyle: 'full', timeStyle: 'short' })}</td>
                  <td style={{ padding: '12px' }}>{gw.finished ? '✅ منتهية' : '⏳ قادمة'}</td>
                  <td style={{ padding: '12px' }}>
                    <button 
                      onClick={() => saveOneToDb(gw)}
                      style={{ background: '#f0f0f0', color: '#333', border: '1px solid #ccc', padding: '5px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' }}
                    >
                      <FaSave /> حفظ فردي
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDeadlines;