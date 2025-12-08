// เรียกฟังก์ชันเมื่อหน้าเว็บโหลดเสร็จ
window.onload = loadProfileData;

function getCookie(name) {
            const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
            if (match) return match[2];
            return null;
        }

        // ฟังก์ชันหลักสำหรับโหลดข้อมูลโปรไฟล์
        async function loadProfileData() {
            const username = getCookie('username');

            if (!username) {
                // ถ้าไม่มี Cookie Username ให้ Redirect ไปหน้า Login
                window.location.href = 'index.html';
                return;
            }

            // 1. ดึงข้อมูลโปรไฟล์ (คะแนน, อันดับ, Gmail, Likes)
            try {
                const profileResponse = await fetch('/getProfileData'); // เรียกใช้ Endpoint ใหม่
                const profileData = await profileResponse.json();

                if (profileResponse.ok) {
                    // อัปเดตข้อมูลผู้ใช้ใน HTML
                    document.getElementById('user-name').textContent = profileData.username;
                    document.getElementById('user-email').textContent = profileData.gmail;
                    document.getElementById('user-index').textContent = `Rank : ${profileData.rank}`;
                    document.getElementById('user-score').textContent = `Points : ${profileData.score}`; // ต้องเพิ่ม ID 'user-score' ใน HTML
                    document.getElementById('miniheart-amout').textContent = profileData.totalLikes;
                    
                    // อัปเดตรูปโปรไฟล์
                    const userImg = getCookie('img') || 'default.jpeg';
                    document.getElementById('user-pro').style.backgroundImage = `url(CSS/Pictures/img/${userImg})`;
                } else {
                    console.error("Failed to load profile data:", profileData.error);
                }
            } catch (error) {
                console.error("Error fetching profile data:", error);
            }
            
            // 2. ดึงข้อมูล Comment
            try {
                const commentResponse = await fetch('/getComments'); // เรียกใช้ Endpoint ใหม่
                const comments = await commentResponse.json();

                if (commentResponse.ok) {
                    const commentContainer = document.getElementById('user-comment');
                    // ล้าง Comment เก่าทั้งหมด ยกเว้นหัวข้อ <h2>Comment</h2>
                    let commentDiv = document.getElementById('comment');
                    commentDiv.innerHTML = ''; 

                    // สร้างและเพิ่ม Element สำหรับ Comment ใหม่แต่ละอัน
                    comments.forEach(comment => {
                        const newCommentDiv = document.createElement('div');
                        newCommentDiv.classList.add('comment-item'); // เพิ่ม Class เพื่อจัด Style 

                        newCommentDiv.innerHTML = `
                            <h3 id="username" class="commenter-name">@${comment.Username}</h3>
                            <h4>${comment.Content}</h4>
                        `;
                        commentDiv.appendChild(newCommentDiv); // เพิ่มเข้าใน div#comment
                    });

                } else {
                    console.error("Failed to load comments:", comments.error);
                }
            } catch (error) {
                console.error("Error fetching comments:", error);
            }
        }