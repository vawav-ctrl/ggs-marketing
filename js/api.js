/**
 * api.js - File for connecting with Google Apps Script
 */

const API = {
    url: CONFIG.GAS_API_URL,

    // ฟังก์ชันพื้นฐานสำหรับยิง Request ไปหา GAS
    async call(action, payload = {}) {
        try {
            // Since POST is having CORS/Redirect issues with GAS, we switch to GET for all calls
            // Note: For production with large payloads, a different workaround (like form-data hidden iframe) might be needed,
            // but for this simple app, GET with url parameters is the most reliable way.
            const url = new URL(this.url);
            url.searchParams.append('action', action);

            // Append payload to URL
            if (payload) {
                // We stringify the payload to a single params for easier parsing on backend
                url.searchParams.append('data', JSON.stringify(payload));
            }

            const response = await fetch(url.toString(), {
                method: "GET"
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.status === "error") {
                throw new Error(data.message);
            }

            return data.data;

        } catch (error) {
            console.error("API Error:", error);
            throw error;
        }
    },

    // 1. Login
    async login(email) {
        return await this.call('login', { email: email });
    },

    // 2. ขอรายการสินทรัพย์ทั้งหมด
    async getAssets() {
        return await this.call('getAssets');
    },

    // 3. ยืมของ (Checkout)
    async checkout(email, items, purpose, returnDate) {
        return await this.call('checkout', {
            email: email,
            items: items,
            purpose: purpose,
            return_date: returnDate
        });
    },

    // 4. ดูของที่ฉันยืม
    async getMyItems(email) {
        return await this.call('getMyItems', { email: email });
    },

    // 5. คืนของ
    async returnItems(transactionId) {
        return await this.call('returnItems', { transaction_id: transactionId });
    },

    // 6. ดึงคําขอรออนุมัติ (สำหรับ Admin)
    async getApprovals(email) {
        return await this.call('getApprovals', { email: email });
    },

    // 7. อนุมัติ/ไม่อนุมัติ (สำหรับ Admin)
    async approveItem(email, transactionId, status) {
        return await this.call('approveItem', {
            email: email,
            transaction_id: transactionId,
            status: status // "Approved" หรือ "Rejected"
        });
    },

    // 8. ดึงข้อมูล Dashboard (สำหรับ Admin)
    async getDashboard(email) {
        return await this.call('getDashboard', { email: email });
    }
};
