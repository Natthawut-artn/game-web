window.onload = init

function init() {
    console.log("Register client script initialized.");

    // ใช้ ID ของฟอร์มตามที่ระบุใน HTML: <form id="myform">
    const form = document.getElementById("myform");

    if (!form) {
        console.error("Form element with ID 'myform' not found.");
        return;
    }

    form.addEventListener("submit", async function(e) {
        e.preventDefault(); // ป้องกันการ Submit แบบดั้งเดิมของ HTML

        // 1. ดึงค่าจากฟอร์มโดยใช้ FormData เพื่อเข้าถึง Name Attribute
        const formData = new FormData(form);
        
        // 2. ดึงค่าที่จำเป็นตามที่เซิร์ฟเวอร์คาดหวัง (username, gmail, password)
        const username = formData.get('username')?.trim() || ''; // ใช้ name="username"
        const gmail = formData.get('gmail')?.trim() || '';       // ใช้ name="email"
        const password = formData.get('password')?.trim() || ''; // ใช้ name="password"
        const retrypassword = formData.get('retrypassword')?.trim() || ''; // ตรวจสอบรหัสผ่านซ้ำ

        // 3. (การตรวจสอบฝั่ง Client) ตรวจสอบความถูกต้องเบื้องต้น
        if (!username || !gmail || !password || !retrypassword) {
            alert("กรุณากรอกข้อมูลให้ครบทุกช่อง");
            return;
        }

        if (password !== retrypassword) {
            alert("รหัสผ่านและรหัสผ่านยืนยันไม่ตรงกัน");
            return;
        }
        
        // **สำคัญ:** Server ของคุณใช้ตัวแปร `gmail` ใน `req.body`
        // ดังนั้น Client ต้องส่ง field เป็น `gmail` แม้ว่า Input ใน HTML จะชื่อ `email` ก็ตาม
        const payload = {
            username: username,
            // เปลี่ยนจาก 'email' เป็น 'gmail' เพื่อให้ตรงกับ req.body ที่เซิร์ฟเวอร์คาดหวัง
            gmail: gmail, 
            password: password
        };
        
        console.log("Attempting registration with payload:", payload);

        try {
            // 4. ส่งข้อมูลไปยัง Endpoint /regisDB
            const res = await fetch('/regisDB', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload) 
            });

            // 5. จัดการการตอบกลับจากเซิร์ฟเวอร์ (โดยใช้การตรวจสอบ Redirect)
            if (res.redirected) {
                // เซิร์ฟเวอร์ส่ง res.redirect() กลับมา (สำเร็จไป index.html หรือล้มเหลวไป register.html)
                console.log("Registration complete. Redirecting to:", res.url);
                window.location.href = res.url;
            } else {
                // หากไม่มีการ redirect (อาจเป็น error 500 หรือปัญหาอื่นๆ)
                console.error("Registration response received without redirection. Status:", res.status);
                alert("การลงทะเบียนล้มเหลวเนื่องจากข้อผิดพลาดของเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง");
            }

        } catch (err) {
            console.error("Registration request failed (Network error or exception):", err);
            alert("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่อของคุณ");
        }
    });
}