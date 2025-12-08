window.onload = init

function init(){

    // ไม่ต้องใช้ document.addEventListener("DOMContentLoaded", ...) ซ้อน เพราะ window.onload ก็เพียงพอแล้ว
    const form = document.getElementById("myform");
    
    // ตรวจสอบว่า form ถูกโหลดมาหรือไม่
    if (!form) {
        console.error("Form element with ID 'myform' not found.");
        return;
    }

    form.addEventListener("submit", async function(e) {
        e.preventDefault();

        // **สำคัญ:** การเข้าถึงค่าต้องใช้ ID (ต้องแก้ไข index.html ให้มี id="username" และ id="password" ด้วย)
        const usernameInput = document.getElementById("username");
        const passwordInput = document.getElementById("password");
        
        // ตรวจสอบ Input Elements
        if (!usernameInput || !passwordInput) {
            console.error("Username or Password input field not found. Check if index.html has IDs 'username' and 'password'.");
            alert("Login fields not found.");
            return;
        }

        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();
        
        console.log("Username submitted:", username);
        console.log("Password submitted:", password);

        try {
            const res = await fetch('/checkLogin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            
            // **การแก้ไขสำคัญ:** // เซิร์ฟเวอร์ใช้ res.redirect() ซึ่งส่งสถานะ 302 กลับมา 
            // เราต้องตรวจสอบว่ามีการ redirect เกิดขึ้นหรือไม่ และเปลี่ยนหน้าไปยัง URL ที่ถูก redirect ไป
            if (res.redirected) {
                // หากเซิร์ฟเวอร์ส่งคำสั่ง redirect (สำเร็จหรือล้มเหลวก็ตาม)
                console.log("Redirecting to:", res.url);
                window.location.href = res.url;
            } else if (res.status === 200) {
                 // กรณีนี้แทบจะไม่เกิดขึ้น หากเซิร์ฟเวอร์ใช้ res.redirect()
                 // แต่ถ้าเซิร์ฟเวอร์ส่ง 200 มาโดยไม่มี redirect ให้อัพเดตหน้าตามความเหมาะสม
                console.log("Login success, but no redirect was explicitly received. Moving to gameplay.html as fallback.");
                window.location.href = "gameplay.html";
            } else {
                // สำหรับกรณีที่เกิด error อื่นๆ ที่ไม่ใช่การ redirect
                console.log("Login failed with status:", res.status);
                alert("Login failed. Please check your username and password.");
            }

        } catch (err) {
            console.error("Login request failed (Network error or exception):", err);
            alert("Cannot connect to server. Please try again.");
        }
    });

}