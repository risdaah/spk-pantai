const API_BASE_URL = 'http://localhost:5000/api';

const API = {
    async getKriteria() {
        try {
            const response = await fetch(`${API_BASE_URL}/spk/kriteria`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching kriteria:', error);
            throw error;
        }
    },

    async getPantai() {
        try {
            const response = await fetch(`${API_BASE_URL}/spk/pantai`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching pantai:', error);
            throw error;
        }
    },

    async hitungRanking(ratings) {
        try {
            const response = await fetch(`${API_BASE_URL}/spk/hitung`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ratings })
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error calculating ranking:', error);
            throw error;
        }
    }
};