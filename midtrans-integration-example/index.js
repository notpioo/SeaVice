const express = require('express');
const midtransClient = require('midtrans-client');
const path = require('path');

const app = express();\nrequire('dotenv').config();
const port = 3000;

// Middleware untuk melayani file statis dari folder 'public'
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Konfigurasi Midtrans Client
// Menggunakan kunci yang diberikan oleh pengguna
const snap = new midtransClient.Snap({
    isProduction: false, // Mode Sandbox
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY
});

// Endpoint untuk mendapatkan Snap Token
app.post('/create-transaction', async (req, res) => {
    // Contoh data transaksi sederhana
    const orderId = 'ORDER-' + Math.floor(100000 + Math.random() * 900000);
    const grossAmount = 50000; // Rp 50.000

    const parameter = {
        "transaction_details": {
            "order_id": orderId,
            "gross_amount": grossAmount
        },
        "enabled_payments": ["gopay", "shopeepay", "qris"],
        "credit_card": {
            "secure": true
        },
        "customer_details": {
            "first_name": "Budi",
            "last_name": "Pratama",
            "email": "budi.pratama@example.com",
            "phone": "081234567890"
        },
        "item_details": [
            {
                "id": "PROD001",
                "price": grossAmount,
                "quantity": 1,
                "name": "Layanan Premium Bulanan"
            }
        ],
        "callbacks": {
            "finish": "https://your-website.com/finish", // Ganti dengan URL finish Anda
            "error": "https://your-website.com/error",   // Ganti dengan URL error Anda
            "pending": "https://your-website.com/pending" // Ganti dengan URL pending Anda
        }
    };

    try {
        const transaction = await snap.createTransaction(parameter);
        // Kirim Snap Token kembali ke frontend
        res.json({ token: transaction.token });
    } catch (error) {
        console.error("Error creating transaction:", error.message);
        res.status(500).json({ error: 'Failed to create transaction' });
    }
});

// Endpoint untuk menangani notifikasi (Webhook)
app.post('/notification', (req, res) => {
    // Di sini Anda akan memproses notifikasi dari Midtrans
    // Logika untuk memverifikasi signature key dan memperbarui status pesanan di database
    console.log('Midtrans Notification Received:', req.body);
    
    // Contoh sederhana: kirim respons 200 OK
    res.status(200).send('OK');
});

app.listen(port, () => {
    console.log(`Server berjalan di http://localhost:${port}`);
});
