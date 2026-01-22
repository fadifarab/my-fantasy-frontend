import React from 'react';
import { FaTrophy } from 'react-icons/fa';

const TournamentHeader = ({ isMobile, logoUrl }) => {
    // فحص الرابط في كونسول المتصفح (F12) - سيخبرنا بالرابط الحقيقي
    console.log("Link received by Header:", logoUrl);

    const SERVER_URL = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';
    
    // منطق الربط: إذا بدأ بـ http استخدمه، إذا بدأ بـ /uploads أضف السيرفر، وإلا فهو فارغ
    let finalPath = null;
    if (logoUrl && logoUrl.trim() !== "") {
        if (logoUrl.startsWith('http')) {
            finalPath = logoUrl;
        } else {
            finalPath = `${SERVER_URL}${logoUrl.startsWith('/') ? '' : '/'}${logoUrl}`;
        }
    }

    return (
        <div style={{ 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            gap: isMobile ? '10px' : '20px', padding: isMobile ? '10px' : '15px 30px', 
            background: 'linear-gradient(135deg, #38003c 0%, #58005c 100%)', 
            borderRadius: '15px', marginBottom: '20px', color: '#fff',
            border: '2px solid #00ff85', width: '100%', boxSizing: 'border-box'
        }}>
            <div style={{
                background: '#fff', padding: '4px', borderRadius: '50%',
                width: isMobile ? '50px' : '75px', height: isMobile ? '50px' : '75px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
            }}>
                {finalPath ? (
                    <img 
                        src={finalPath} 
                        alt="Logo" 
                        key={finalPath} // إجبار المكون على إعادة التحميل عند تغيير الرابط
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                        onError={(e) => {
                            console.error("Failed to load image from:", finalPath);
                            e.target.style.display = 'none';
                            e.target.parentNode.innerHTML = '<div style="color:#38003c; font-size:25px">🏆</div>';
                        }} 
                    />
                ) : (
                    <FaTrophy size={isMobile ? 25 : 40} color="#38003c" />
                )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
                <h2 style={{ margin: 0, fontSize: isMobile ? '17px' : '28px', fontWeight: '900' }}>
                    FPL ZEDDINE
                </h2>
                <div style={{ fontSize: isMobile ? '10px' : '13px', color: '#00ff85', fontWeight: 'bold' }}>
                    الموسم الرياضي 2025 - 2026
                </div>
            </div>
        </div>
    );
};

export default TournamentHeader;