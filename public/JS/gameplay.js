window.onload = init;

let currentScore = 0; // ตัวแปรสำหรับเก็บคะแนนบน client

function init(){
    let hear = document.getElementById('hear');
    hear.onclick = pop;

    // ดึงคะแนนเริ่มต้นเมื่อโหลดหน้า
    fetchInitialScore(); 
    initcommentpopup();

    displayCurrentUser();
    if (typeof initLeaderboard === 'function') {
        initLeaderboard();
        setInterval(() => {
            initLeaderboard();
        }, 3000); // 3000ms = 3 วินาที
    }
}
// ฟังก์ชันช่วยดึงค่าจาก Cookie ตามชื่อที่ระบุ
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null; // ถ้าหาไม่เจอ
}

// ฟังก์ชันดึงคะแนนเริ่มต้นจากเซิร์ฟเวอร์ (สมมติว่ามี Endpoint /getScore) **เพิ่มโค้ด**
async function fetchInitialScore() {
    // เนื่องจาก server.js ที่คุณให้มาไม่มี /getScore, 
    // เราจะใช้ /updateScore ในการอัปเดตเท่านั้น. 
    // หากต้องการแสดงคะแนนที่ถูกต้องทันที ต้องเพิ่ม Endpoint /getScore ใน server.js
    // ในตัวอย่างนี้ เราจะเริ่มจาก 0 ก่อน แล้วอัปเดตเมื่อมีการคลิก
    // หรือคุณสามารถเก็บคะแนนใน cookie ด้วยก็ได้หากต้องการให้คะแนนติดมาทันที
    const username = getCookie('username');  //เพิ่มมา
    if (!username) {
        updateScoreDisplay(0); // ถ้าไม่มีผู้ใช้ ให้แสดง 0
        return;
    }
    
    try {
        // ใช้ Endpoint ที่สร้างไว้สำหรับ Profile เพื่อดึงคะแนน
        const res = await fetch('/getProfileData'); 
        if (res.ok) {
            const data = await res.json();
            // อัปเดตคะแนนที่แสดงบนหน้าจอด้วยคะแนนจริง
            updateScoreDisplay(data.score);
        } else {
            console.error("Failed to fetch initial score.");
            updateScoreDisplay(0);
        }
    } catch (err) {
        console.error("Network error fetching initial score:", err);
        
        updateScoreDisplay(0);
    }
}
function displayCurrentUser() {
    // 1. ดึงชื่อจาก Cookie 'username'
    const username = getCookie('username'); 
    
    // 2. อ้างอิง Element ที่เราเพิ่งแก้ ID ไปใน HTML
    const profileNameElement = document.getElementById('current-user-name');

    // 3. ถ้ามีชื่อใน Cookie และเจอ Element ให้แสดงผล
    if (username && profileNameElement) {
        profileNameElement.textContent = '@' + decodeURIComponent(username);
    } else {
        // กรณีไม่มี Cookie (อาจจะยังไม่ Login)
        if(profileNameElement) profileNameElement.textContent = '@Guest';
    }
}
// ฟังก์ชันอัปเดตคะแนนที่แสดงบนหน้าจอ
function updateScoreDisplay(score) {
    const scoreElement = document.getElementById('score');
    if (scoreElement) {
        scoreElement.textContent = score;
        currentScore = score;
    }
}

async function pop(){
    let hear = document.getElementById('hear');
    
    // 1. เล่น Animation (ตามโค้ดเดิม)
    hear.src = "CSS/Pictures/Backgrounds/here1.png";
    setTimeout(() => {
        hear.src = "CSS/Pictures/Backgrounds/here2.png";
    }, 250);

    const audio = new Audio('SFX/POPs AND JINGLES/POP 1.wav'); 
    audio.play();

    // 2. ส่งคำขอไปอัปเดตคะแนนบนเซิร์ฟเวอร์
    try {
        const res = await fetch('/updateScore', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // ไม่ต้องส่ง body เพราะ username ถูกดึงจาก cookie บน server
        });

        if (res.status === 200) {
            const data = await res.json();
            // 3. อัปเดตคะแนนบนหน้าจอด้วยคะแนนใหม่ที่ได้จากเซิร์ฟเวอร์
            updateScoreDisplay(data.newScore);
            console.log("Score updated successfully. New score:", data.newScore);
        } else {
            const errorData = await res.json();
            console.error("Failed to update score on server:", errorData.error);
            // แสดงข้อความ error ให้ผู้ใช้ทราบ (แทน alert)
            document.getElementById('score').textContent = `Error: ${currentScore}`; 
        }

    } catch (err) {
        console.error("Network error during score update:", err);
        // แสดงข้อความ error
        document.getElementById('score').textContent = `Connection Error: ${currentScore}`;
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// // โค้ดส่วนที่เหลือ (initcommentpopup, showpopup) ยังคงเดิม  <------อันเดิม
 function initcommentpopup(){
// *** NOTE: การเรียกใช้ initcommentpopup() ควรถูกย้ายไปเรียกหลัง initLeaderboard() โหลดเสร็จ ***
    // แต่ถ้าเรียกใน init() ก็ต้องมั่นใจว่า Element '.b' ถูกสร้างขึ้นมาแล้ว
    
    // เนื่องจาก Element .b ถูกสร้างแบบ Dynamic โดย leaderboard.js 
    // เราจึงควรให้ leaderboard.js เป็นคนจัดการ Event Click แทน
    // และให้ leaderboard.js เรียก showpopup(targetUsername) โดยตรง
    
    // *** ลบ หรือ คอมเมนต์ ฟังก์ชัน initcommentpopup ทั้งหมดนี้ออกไปจาก gameplay.js ***
    // (เพราะเราให้ leaderboard.js จัดการแทนแล้ว)
    let popups = document.querySelectorAll('.b')
    for(i = 0 ; i < popups.length ; i++){
        // let index = i
        // popups[i].onclick = () => showpopup(index)

        // *** แก้ไข: ดึง username จาก data-username ที่เราเพิ่มใน leaderboard.js ***
        let targetUsername = popups[i].getAttribute('data-username'); 
        popups[i].onclick = () => showpopup(targetUsername); // ส่งชื่อผู้ใช้ไปแทน index
    }
 }

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// function showpopup(index){  <------อันเดิม
//     let popup = document.getElementById('comment-popup')
//     popup.style.display = 'flex'

//     let cancel = document.getElementById('cancel')
//     cancel.addEventListener('click',() =>{
//         popup.style.display = 'none'
//     })
//     let submit = document.getElementById('submit')
//     submit.addEventListener('click',() =>{
//         popup.style.display = 'none'
//     })
// }

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// *** แก้ไข: ปรับ showpopup ให้รับ targetUser เข้ามาแทน index ***
function showpopup(targetUser){
    let popup = document.getElementById('comment-popup');
    // ต้องมี Element นี้ใน HTML ของคุณ (เช่น ใน gameplay.html)
    let commentInput = document.getElementById('content'); 
    
    popup.style.display = 'flex';
    
    // *** ต้องมี Element นี้ใน HTML ของคุณ (เช่น <h3 id="popup-target-name"></h3>) ***
    let targetNameElement = document.getElementById('user-target');
    if (targetNameElement) {
        targetNameElement.textContent = `Commenting to: @${targetUser}`;
    }

    let cancel = document.getElementById('cancel');
    cancel.onclick = () => { popup.style.display = 'none'; }; 

    let submit = document.getElementById('submit');
    // เทคนิคการล้าง Event Listener เก่า เพื่อป้องกันการทำงานซ้ำเมื่อเรียก showpopup หลายครั้ง
    submit.replaceWith(submit.cloneNode(true)); 
    submit = document.getElementById('submit'); 

    // *** เพิ่ม Event Listener ใหม่สำหรับการ Submit ที่ถูกต้อง ***
    submit.onclick = async () => {
        const commentContent = commentInput.value.trim();
        if (commentContent) {
            await submitComment(targetUser, commentContent); // ส่ง targetUser และ content
            popup.style.display = 'none';
            commentInput.value = ''; // ล้างข้อความ
        } else {
            alert("Please write a comment.");
        }
    };
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// B. เพิ่มฟังก์ชัน Submit Comment เพื่อเชื่อมกับ Server
// *** เพิ่มฟังก์ชันนี้ต่อท้ายใน gameplay.js ***

async function submitComment(targetUser, content) {
    try {
        const res = await fetch('/postCommentToUser', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                targetUser: targetUser, 
                content: content 
            })
        });

        const data = await res.json();

        if (res.ok) {
            console.log(`Comment posted successfully to ${targetUser}!`);
            alert("Comment posted successfully!");
        } else {
            console.error(`Failed to post comment: ${data.error}`);
            alert(`Failed to post comment: ${data.error}`);
        }

    } catch (err) {
        console.error("Network error submitting comment:", err);
        alert("An unexpected network error occurred. Check server console.");
    }
}