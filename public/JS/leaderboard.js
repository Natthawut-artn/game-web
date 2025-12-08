// JS/leaderboard.js

// ฟังก์ชันหลัก: เริ่มทำงานเมื่อโหลดหน้าเว็บ
function initLeaderboard() {
    console.log("Initializing Dynamic Leaderboard...");
    loadLeaderboardData(); // 1. ไปดึงข้อมูลมาแสดง
}

// 1. ฟังก์ชันดึงข้อมูลจาก Server และสร้าง HTML
async function loadLeaderboardData() {
    try {
        const res = await fetch('/getLeaderboard'); // เรียก API ที่เราเพิ่งสร้าง
        const users = await res.json();

        const boardElement = document.getElementById('board');
        if (!boardElement) return;

        // ล้างข้อมูลเก่า (ที่เป็นชื่อ static) ออกให้หมด
        boardElement.innerHTML = '';

        // วนลูปสร้างแถวข้อมูลตามจำนวน User
        users.forEach((user, index) => {
            // เช็คว่าเรากดไลค์คนนี้ไว้หรือยัง?
            // ถ้า isLiked > 0 แสดงว่ากดแล้ว ให้ใช้รูป jaipow.png (แดง), ถ้ายังใช้ jai.png (ขาว)
            let heartIcon = (user.isLiked > 0) ? "CSS/Pictures/Icons/jai\.png" : "CSS/Pictures/Icons/jaipow.png";
            let likeStatus = (user.isLiked > 0) ? "liked" : "unliked";

            // สร้าง HTML ของแถว (เลียนแบบโครงสร้างเดิมใน gameplay.html)
            // หมายเหตุ: Score หรือ Username ถ้าเป็นค่าว่าง ให้ใส่ -
            let score = (user.Score !== null && user.Score !== undefined) ? user.Score : 0;
            let username = user.Username || "Unknown";

            let rowHtml = `
                <div class="b" id="index" onclick="handleRowClick(event, '${username}')"> 
                    <img src="CSS/Pictures/Icons/klipartz.com 1.png" width="25px" height="25px">
                    <h4>${index + 1}#</h4>
                    <h4 class="user-name-display">${username}</h4>
                    <h4 class="user-score-display" style="margin-left:auto; margin-right:10px;">Score: ${score}</h4>
                    
                    <img src="${heartIcon}" 
                         class="like-btn" 
                         data-target="${username}" 
                         data-status="${likeStatus}"
                         style="cursor: pointer;" 
                         width="20px" height="20px"
                         onclick="handleLikeClick(event, this)">
                </div>
            `;
            
            // ใส่ HTML ลงไปในบอร์ด
            boardElement.insertAdjacentHTML('beforeend', rowHtml);
        });

    } catch (err) {
        console.error("Error loading leaderboard:", err);
    }
}

// 2. ฟังก์ชันจัดการเมื่อกดปุ่มไลค์ (แยกออกมาเพื่อให้ทำงานกับ Dynamic HTML ได้)
async function handleLikeClick(event, btn) {
    event.stopPropagation(); // หยุดไม่ให้ไปกดโดนแถว (ไม่ให้เด้ง Popup)

    const targetUser = btn.getAttribute('data-target');
    
    // ทำ Animation กดปุ่มเล็กน้อย (Optional)
    btn.style.transform = "scale(0.8)";
    setTimeout(() => btn.style.transform = "scale(1)", 100);

    try {
        const res = await fetch('/toggleLike', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targetUser: targetUser })
        });

        const data = await res.json();

        // เปลี่ยนรูปหัวใจตามผลลัพธ์จาก Server
        if (data.status === 'liked') {
            btn.src = "CSS/Pictures/Icons/jai.png";  //<------jaipow !!**แก้จุดนี้รันตรงตามต้องการแล้ว
        } else if (data.status === 'unliked') {
            btn.src = "CSS/Pictures/Icons/jaipow.png"; //<-----!!jai !!**แก้จุดนี้รันตรงตามต้องการแล้ว
        }

        // **!!! แก้ไขที่สำคัญที่สุดคือตรงนี้ !!!**
        // อัปเดต data-status ให้ตรงกับสถานะใหม่ที่ Server ส่งกลับมา
        btn.setAttribute('data-status', data.status);  //<-------!!**แก้จุดนี้รันตรงตามต้องการแล้ว

    } catch (err) {
        console.error("Error toggling like:", err);
    }
}

/////////////// แบบเดิม ///////////////
// // 3. ฟังก์ชันจัดการเมื่อคลิกที่แถว (แสดง Popup Comment)
// function handleRowClick(event, index) {
//     // โค้ดส่วนนี้จะเรียกฟังก์ชัน showpopup จาก ui.js หรือเขียนใหม่ตรงนี้ก็ได้
//     // แต่เนื่องจาก index ตอนนี้เป็นตัวเลขแถว อาจจะต้องปรับ showpopup ให้รับชื่อคนแทน
    
//     // เพื่อความง่าย: เราจะเรียก showpopup แบบเดิม แต่ต้องระวังเรื่อง index
//     // ถ้าคุณใช้ ui.js ที่มี showpopup อยู่แล้ว โค้ดนี้จะเรียกใช้ได้เลย
//     if (typeof showpopup === 'function') {
//         showpopup(index);
//     } else {
//         console.log("Popup function not found");
//     }
// }

//////////////// แบบใหม่ ///////////////
// 3. ฟังก์ชันจัดการเมื่อคลิกที่แถว (แสดง Popup Comment)
// เปลี่ยนให้รับ Username แทน index
function handleRowClick(event, targetUsername) {
    // โค้ดส่วนนี้จะเรียกฟังก์ชัน showpopup จาก ui.js หรือเขียนใหม่ตรงนี้ก็ได้
    
    // แทนที่จะใช้ index ให้เรียก showpopup โดยส่ง targetUsername ไป
    if (typeof showpopup === 'function') {
        // สมมติว่า showpopup ถูกออกแบบมารับ Username
        showpopup(targetUsername); 
    } else {
        console.log(`Popup function not found. Target user: ${targetUsername}`);
        // ถ้าไม่มี showpopup คุณอาจต้องสร้าง Modal/Popup ที่นี่
    }
}