/**
 * api.js - File for connecting with Database (Supabase or Google Apps Script)
 */

// 1. Initialize Supabase Client (if enabled)
let supabaseClient = null;
if (CONFIG.DATABASE_MODE === 'SUPABASE') {
    // Requires supabase-js loaded via CDN in index.html
    supabaseClient = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
}

const API = {
    url: CONFIG.GAS_API_URL,

    // ==========================================
    // Core Router 
    // ==========================================
    async route(action, payload = {}) {
        if (CONFIG.DATABASE_MODE === 'SUPABASE' && supabaseClient) {
            console.log(`[API] Routing to Supabase: ${action}`);
            return await this[`supabase_${action}`](payload);
        } else {
            console.log(`[API] Routing to GAS: ${action}`);
            return await this.gas_call(action, payload);
        }
    },

    // ==========================================
    // Public App Methods
    // ==========================================
    async login(email) { return await this.route('login', { email }); },
    async getAssets() { return await this.route('getAssets', {}); },
    async checkout(email, items, purpose, returnDate) {
        return await this.route('checkout', { email, items, purpose, returnDate });
    },
    async getMyItems(email) { return await this.route('getMyItems', { email }); },
    async returnItems(transactionId) { return await this.route('returnItems', { transaction_id: transactionId }); },
    async getApprovals(email) { return await this.route('getApprovals', { email }); },
    async approveItem(email, transactionId, status) {
        return await this.route('approveItem', { email, transaction_id: transactionId, status });
    },
    async getDashboard(email) { return await this.route('getDashboard', { email }); },

    // ==========================================
    // Google Apps Script (Legacy Backend)
    // ==========================================
    async gas_call(action, payload = {}) {
        try {
            const url = new URL(this.url);
            url.searchParams.append('action', action);
            if (Object.keys(payload).length > 0) {
                // If there's a returnDate mapping difference
                if (payload.returnDate) {
                    payload.return_date = payload.returnDate; // Fix naming for GAS
                    delete payload.returnDate;
                }
                url.searchParams.append('data', JSON.stringify(payload));
            }

            const response = await fetch(url.toString(), { method: "GET" });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const data = await response.json();
            if (data.status === "error") throw new Error(data.message);

            return data.data;
        } catch (error) {
            console.error("GAS API Error:", error);
            throw error;
        }
    },

    // ==========================================
    // Supabase Backend (New Fast Backend)
    // ==========================================

    // 1. Login
    async supabase_login(payload) {
        const { data, error } = await supabaseClient
            .from('users')
            .select('*')
            .ilike('Email', payload.email)
            .single();

        if (error || !data) throw new Error("User not found");
        return { email: data.Email, name: data.Name, role: data.Role };
    },

    // 2. Get Assets
    async supabase_getAssets() {
        // Fetch components
        const resCat = await supabaseClient.from('categories').select('*');
        const resAss = await supabaseClient.from('assets').select('*').neq('Status', 'Retired');
        const resTrans = await supabaseClient.from('transactions').select(`
            TransID, Email, Items, Purpose, ExpectedReturn, Status, users (Name)
        `).in('Status', ['Pending', 'Approved', 'Pending Return']);

        if (resCat.error) throw new Error(resCat.error.message);
        if (resAss.error) throw new Error(resAss.error.message);
        if (resTrans.error) throw new Error(resTrans.error.message);

        const assets = resAss.data;
        const categories = resCat.data;
        const activeTrans = resTrans.data;

        // Map borrowers to assets
        assets.forEach(asset => {
            let borrowers = [];
            activeTrans.forEach(t => {
                let items = t.Items || [];
                if (typeof items === 'string') {
                    try { items = JSON.parse(items); } catch (e) { }
                }
                const match = items.find(i => i.id === asset.SKU);
                if (match) {
                    borrowers.push({
                        email: t.Email,
                        name: t.users?.Name || t.Email,
                        purpose: t.Purpose,
                        qty: match.qty,
                        expectedReturn: t.ExpectedReturn,
                        status: t.Status
                    });
                }
            });
            asset.borrowers = borrowers;
        });

        return { assets, categories };
    },

    // 3. Checkout
    async supabase_checkout(payload) {
        const d = new Date();
        const dateStr = d.getFullYear().toString().substr(-2) +
            ("0" + (d.getMonth() + 1)).slice(-2) +
            ("0" + d.getDate()).slice(-2);
        const randomStr = Math.floor(Math.random() * 9000 + 1000);
        const transId = `TRN-${dateStr}-${randomStr}`;

        let itemsObj = payload.items;
        if (typeof itemsObj === 'string') itemsObj = JSON.parse(itemsObj);

        // Update available qty for each requested item
        for (const item of itemsObj) {
            // First get current available qty
            const { data: assetData } = await supabaseClient.from('assets').select('AvailableQty').eq('SKU', item.id).single();
            if (assetData) {
                const newAvailable = Math.max(0, assetData.AvailableQty - item.qty);
                await supabaseClient.from('assets').update({ AvailableQty: newAvailable }).eq('SKU', item.id);
            }
        }

        // Create transaction
        const { error } = await supabaseClient.from('transactions').insert({
            TransID: transId,
            Email: payload.email,
            Items: itemsObj,
            Purpose: payload.purpose,
            BorrowDate: new Date().toISOString(),
            ExpectedReturn: new Date(payload.returnDate).toISOString(),
            Status: 'Pending'
        });

        if (error) throw new Error(error.message);
        return { transId, status: "Pending" };
    },

    // 4. Get My Items
    async supabase_getMyItems(payload) {
        const { data, error } = await supabaseClient
            .from('transactions')
            .select('*')
            .ilike('Email', payload.email)
            // sort manually after fetching to avoid timezone issues, or use order()
            .order('BorrowDate', { ascending: false });

        if (error) throw new Error(error.message);

        // Normalize JSON payload
        return data.map(t => {
            if (typeof t.Items === 'string') {
                try { t.Items = JSON.parse(t.Items); } catch (e) { }
            }
            return t;
        });
    },

    // 5. Return Item Request
    async supabase_returnItems(payload) {
        const { error } = await supabaseClient
            .from('transactions')
            .update({ Status: 'Pending Return' })
            .eq('TransID', payload.transaction_id);

        if (error) throw new Error(error.message);
        return { message: "Return requested successfully" };
    },

    // 6. Get Approvals (Admin)
    async supabase_getApprovals(payload) {
        // Need to join user to get name
        const { data, error } = await supabaseClient
            .from('transactions')
            .select(`*, users!transactions_Email_fkey(Name)`)
            .in('Status', ['Pending', 'Pending Return']);

        if (error) throw new Error(error.message);

        const mappedData = data.map(t => {
            let items = t.Items;
            if (typeof items === 'string') try { items = JSON.parse(items); } catch (e) { }
            return {
                ...t,
                Name: t.users?.Name || "",
                Items: items
            };
        });

        const pendingList = mappedData.filter(t => t.Status === 'Pending');
        const returnList = mappedData.filter(t => t.Status === 'Pending Return');

        pendingList.sort((a, b) => new Date(a.BorrowDate) - new Date(b.BorrowDate));
        returnList.sort((a, b) => new Date(a.BorrowDate) - new Date(b.BorrowDate));

        return { pending_list: pendingList, return_list: returnList };
    },

    // 7. Approve / Reject (Admin)
    async supabase_approveItem(payload) {
        const { transaction_id, status } = payload;

        const { data: trans } = await supabaseClient.from('transactions').select('Items, Status').eq('TransID', transaction_id).single();
        if (!trans) throw new Error("Transaction not found");

        let items = trans.Items;
        if (typeof items === 'string') try { items = JSON.parse(items); } catch (e) { }

        const updates = { Status: status };
        if (status === 'Returned') {
            updates.ActualReturn = new Date().toISOString();

            // Restore inventory & update LastActive date
            for (const item of items) {
                const { data: assetData } = await supabaseClient.from('assets').select('AvailableQty').eq('SKU', item.id).single();
                if (assetData) {
                    await supabaseClient.from('assets').update({
                        AvailableQty: assetData.AvailableQty + item.qty,
                        LastActive: new Date().toISOString()
                    }).eq('SKU', item.id);
                }
            }
        }
        else if (status === 'Rejected') {
            // Restore inventory (because we deducted it when it was Pending)
            for (const item of items) {
                const { data: assetData } = await supabaseClient.from('assets').select('AvailableQty').eq('SKU', item.id).single();
                if (assetData) {
                    await supabaseClient.from('assets').update({
                        AvailableQty: assetData.AvailableQty + item.qty
                    }).eq('SKU', item.id);
                }
            }
        }
        else if (status === 'Return Rejected') {
            // Do NOT restore stock, keep them on the user's tab essentially or mark them as lost.
            updates.ActualReturn = new Date().toISOString();
        }

        const { error } = await supabaseClient.from('transactions').update(updates).eq('TransID', transaction_id);
        if (error) throw new Error(error.message);

        return { message: `Transaction marked as ${status}` };
    },

    // 8. Dashboard (Admin)
    async supabase_getDashboard(payload) {
        // Fetch all base data
        const resCat = await supabaseClient.from('categories').select('Name');
        const resAss = await supabaseClient.from('assets').select('*');
        const resTrans = await supabaseClient.from('transactions').select(`*, users!transactions_Email_fkey(Name)`);

        if (resCat.error) throw new Error(resCat.error.message);
        if (resAss.error) throw new Error(resAss.error.message);
        if (resTrans.error) throw new Error(resTrans.error.message);

        const assets = resAss.data;
        const transactions = resTrans.data.map(t => {
            let items = t.Items;
            if (typeof items === 'string') try { items = JSON.parse(items); } catch (e) { }
            return { ...t, Name: t.users?.Name || "", Items: items };
        });

        const activeAssets = assets.filter(a => a.Status !== 'Retired');
        const totalItems = activeAssets.reduce((sum, a) => sum + (a.TotalQty || 0), 0);

        // Group categories
        const categoryBreakdown = {};
        resCat.data.forEach(c => categoryBreakdown[c.Name] = { name: c.Name, count: 0 });
        activeAssets.forEach(a => {
            if (categoryBreakdown[a.CategoryID]) {
                categoryBreakdown[a.CategoryID].count += (a.TotalQty || 0);
            }
        });

        // Current Borrowed
        const borrowedList = transactions.filter(t => t.Status === 'Approved' || t.Status === 'Pending Return');
        let currentlyBorrowedCount = 0;
        borrowedList.forEach(t => {
            t.Items.forEach(i => currentlyBorrowedCount += i.qty);
        });

        // Overdue
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const overdueList = borrowedList.filter(t => {
            if (!t.ExpectedReturn) return false;
            return new Date(t.ExpectedReturn) < today;
        });

        // Dormant
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        const dormantAssets = activeAssets.filter(a => {
            if (!a.LastActive) return false;
            return new Date(a.LastActive) < ninetyDaysAgo;
        });

        // History
        const historyList = transactions.filter(t => t.Status === 'Returned' || t.Status === 'Rejected' || t.Status === 'Return Rejected');
        historyList.sort((a, b) => new Date(b.BorrowDate) - new Date(a.BorrowDate));

        return {
            total: totalItems,
            category_breakdown: Object.values(categoryBreakdown),
            borrowed: currentlyBorrowedCount,
            borrowed_list: borrowedList,
            overdue_count: overdueList.length,
            overdue_list: overdueList,
            inactive_count: dormantAssets.length,
            inactive_list: dormantAssets,
            history_list: historyList
        };
    }
};
