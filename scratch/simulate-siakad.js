const axios = require('axios');

const API_URL = 'http://localhost:8001/api/integration/siakad/push';
const API_KEY = 'spmi-siakad-secret-123';

const simulateData = async () => {
    const payloads = [
        {
            indicator_code: 'IKU-IPB-1.1',
            prodi_code: 'IF-UNMER',
            period: '2024-1',
            value: 3.45,
            notes: 'Simulasi data IPK dari SIAKAD'
        },
        {
            indicator_code: 'IKU-IPB-1.2',
            prodi_code: 'IF-UNMER',
            period: '2024-1',
            value: 75.5,
            notes: 'Simulasi data kelulusan dari SIAKAD'
        }
    ];

    for (const data of payloads) {
        try {
            console.log(`Mengirim data untuk ${data.indicator_code}...`);
            const response = await axios.post(API_URL, {
                api_key: API_KEY,
                ...data
            });
            console.log('✅ Berhasil:', response.data.message);
        } catch (error) {
            console.error('❌ Gagal:', error.response ? error.response.data.message : error.message);
        }
    }
};

simulateData();
