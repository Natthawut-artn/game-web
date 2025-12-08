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

            const data = await res.json();

            if (data.status === "success") {
                console.log("Login successful.");
                window.location.href = "gameplay.html";

            } else if (data.status === "error1"){
                // แสดง error บนหน้าเดิม (ไม่รีโหลดหน้า)
                document.getElementById('error').innerHTML = "Username or Password incorrect.";
            }

        } catch (err) {
            console.error("Login request failed:", err);
            // alert("Cannot connect to server. Please try again.");
            document.getElementById('error').innerHTML = "Cannot connect to server. Please try again.";
        }
    });

}