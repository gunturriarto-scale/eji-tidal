import { google } from 'googleapis';
import * as xlsx from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

// Setup Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// ==========================================
// CONFIGURATION
// ==========================================
// Ganti dengan Folder ID dari Google Drive tempat upload data tiap hari
// Cara dapet ID: buka folder di browser, copy string panjang di URL setelah /folders/
const FOLDER_ID = 'GANTI_DENGAN_FOLDER_ID_DRIVE'; 

// Path ke file Service Account JSON credential dari Google Cloud Console
// 1. Bikin Service Account di GCP > Create Key > JSON
// 2. Share folder Google Drive ke email service account tersebut
const SERVICE_ACCOUNT_FILE = path.join(__dirname, 'google-service-account.json');

async function main() {
    try {
        console.log("🚀 Memulai proses sinkronisasi GMV Max dari Google Drive...");

        // 1. Authenticate with Google Drive
        const auth = new google.auth.GoogleAuth({
            keyFile: SERVICE_ACCOUNT_FILE,
            scopes: ['https://www.googleapis.com/auth/drive.readonly'],
        });
        const drive = google.drive({ version: 'v3', auth });

        // 2. Cari file terbaru di dalam folder
        console.log(`📁 Mencari file terbaru di folder: ${FOLDER_ID}`);
        const res = await drive.files.list({
            q: `'${FOLDER_ID}' in parents and trashed = false`,
            orderBy: 'createdTime desc',
            fields: 'files(id, name, mimeType, createdTime)',
            pageSize: 1, // Ambil yang paling baru aja
        });

        const files = res.data.files;
        if (!files || files.length === 0) {
            console.log("❌ Tidak ada file yang ditemukan di folder tersebut.");
            return;
        }

        const latestFile = files[0];
        console.log(`✅ File terbaru ditemukan: ${latestFile.name} (Uploaded: ${latestFile.createdTime})`);

        // 3. Download file
        console.log("📥 Mendownload file...");
        const response = await drive.files.get(
            { fileId: latestFile.id, alt: 'media' },
            { responseType: 'arraybuffer' }
        );

        // 4. Parse file menggunakan xlsx
        console.log("⚙️ Memproses data excel/csv...");
        const workbook = xlsx.read(response.data, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });

        if (rows.length < 2) {
            console.log("⚠️ File kosong atau format tidak sesuai.");
            return;
        }

        // 5. Mapping Data (Kolom O -> Gross Revenue, Cost -> Spends)
        // Note: Asumsi Kolom O adalah index ke-14 (0-based)
        console.log("🔄 Melakukan mapping data sesuai struktur tabel...");
        const headers = rows[0];
        
        // Buat logic sederhana nemuin index jika ada perubahan urutan kolom (fallback)
        const costIdx = headers.findIndex(h => String(h).toLowerCase().includes('cost') && !String(h).toLowerCase().includes('per') && !String(h).toLowerCase().includes('estimated'));
        // Fallback untuk kolom O (index 14) atau cari tulisan 'Gross Revenue' / 'GMV'
        const revenueIdx = headers.findIndex(h => String(h).toLowerCase().includes('gross revenue')) !== -1 
                           ? headers.findIndex(h => String(h).toLowerCase().includes('gross revenue')) 
                           : 14; 

        const mappedData = [];
        const dateNow = new Date().toISOString().split('T')[0];

        // Mulai dari baris data (index 1)
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length === 0) continue;

            const costValue = row[costIdx] !== undefined ? parseFloat(String(row[costIdx]).replace(/[^0-9.-]+/g,"")) : 0;
            const revenueValue = row[revenueIdx] !== undefined ? parseFloat(String(row[revenueIdx]).replace(/[^0-9.-]+/g,"")) : 0;
            const skuOrders = row[12] !== undefined ? parseFloat(String(row[12]).replace(/[^0-9.-]+/g,"")) : 0;

            mappedData.push({
                campaign_name: row[0] || '',
                campaign_id: row[1] || '',
                product_id: row[2] || '',
                creative_type: row[3] || '',
                video_title: row[4] || '',
                video_id: row[5] || '',
                tiktok_account: row[6] || '',
                time_posted: row[7] || '',
                status: row[8] || '',
                authorization: row[9] || '',
                cost: costValue || 0,
                sku_orders: skuOrders || 0,
                gross_revenue: revenueValue || 0,
                source_date: dateNow
            });
        }

        // 6. Push ke Supabase
        console.log(`📤 Pushing ${mappedData.length} baris ke Supabase...`);
        // Kita hancurkan data hari ini (overwrite harian) jika perlu, atau cukup insert bulk
        // Contoh kita insert into 'hanasui_gmv_max'
        
        // Pilihan: Clear data untuk source_date hari ini sebelum insert
        await supabase.from('hanasui_gmv_max').delete().eq('source_date', dateNow);

        // Bulk insert batch per 1000 untuk keamanan
        const chunkSize = 1000;
        for (let i = 0; i < mappedData.length; i += chunkSize) {
            const chunk = mappedData.slice(i, i + chunkSize);
            const { error: insertError } = await supabase
                .from('hanasui_gmv_max')
                .insert(chunk);
                
            if (insertError) {
                console.error("❌ Gagal insert ke Supabase:", insertError);
            } else {
                console.log(`✅ Berhasil insert batch ${i} - ${i + chunk.length}`);
            }
        }

        console.log("🎉 Selesai! Data berhasil di-sync ke Supabase.");

    } catch (err) {
        console.error("🚨 Terjadi kesalahan utama:", err.message);
    }
}

main();
