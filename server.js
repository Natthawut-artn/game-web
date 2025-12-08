const express = require('express');
const app = express();
const fs = require('fs');
const hostname = 'localhost';
const port = 3000;
const bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
const multer = require('multer');
const path = require('path');
const mysql = require('mysql');

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());

// --- Multer Configuration ---
const storage = multer.diskStorage({
    destination: (req, file, callback) => {
      // ระบุ Path ให้ตรงเป๊ะตามที่คุณบอก
      const dir = './public/CSS/Pictures/img/'; 

      // กันเหนียว: ถ้าหาไม่เจอ ให้สร้างโฟลเดอร์ให้เองเลย (แก้ปัญหา ENOENT ถาวร)
      if (!fs.existsSync(dir)){
          fs.mkdirSync(dir, { recursive: true });
      }

      callback(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const imageFilter = (req, file, cb) => {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/)) {
        req.fileValidationError = 'Only image files are allowed!';
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};

const upload = multer({ storage: storage, fileFilter: imageFilter });

// --- Database Connection ---
const con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "here_pop" // <------------------------------
});

con.connect(err => {
    if(err) throw(err);
    else{
        console.log("MySQL connected");
    }
});

// กำหนดชื่อ Table ตาม Data Dictionary ใหม่
const userTable = "user";     // จากเดิม userInfo
const commentTable = "comment"; // จากเดิม posts
const likeTable = "like";

// Promise wrapper for MySQL queries
const queryDB = (sql) => {
    return new Promise((resolve,reject) => {
        con.query(sql, (err,result, fields) => {
            if (err) reject(err);
            else resolve(result)
        })
    })
}
// ฟังก์ชันสำหรับสร้าง ID รันตัวเลข (เช่น CM00000000001)
// ฟังก์ชันสำหรับสร้าง ID รันตัวเลข (เวอร์ชั่นอัปเกรด: กรอง NaN ออก)
const generateRunningID = async (tableName, idColumn, prefix) => {
    try {
        // 1. หา ID ตัวล่าสุด *ที่ไม่ใช่ NaN* โดยเรียงจากมากไปน้อย
        // เพิ่ม WHERE ${idColumn} NOT LIKE '%NaN%' เพื่อข้ามข้อมูลที่เสีย
        let sql = `SELECT ${idColumn} FROM \`${tableName}\` 
                   WHERE ${idColumn} NOT LIKE '%NaN%' 
                   ORDER BY ${idColumn} DESC LIMIT 1`;
                   
        let result = await queryDB(sql);

        // 2. ถ้ายังไม่มีข้อมูลเลย (หรือมีแต่ NaN ล้วนๆ) ให้เริ่มที่เลข 1
        if (result.length === 0) {
            return prefix + "00000000001"; 
        }

        // 3. ถ้ามีข้อมูลแล้ว ให้ตัดเอาเฉพาะตัวเลขออกมา
        let lastId = result[0][idColumn]; // จะได้ตัวล่าสุดที่ถูกต้อง เช่น "L00000000003"
        
        // **เทคนิคพิเศษ**: ใช้ Regex ดึงเฉพาะ "ตัวเลข" ออกมา เพื่อกันความผิดพลาดเรื่อง Prefix ไม่ตรง
        let numberPart = lastId.match(/\d+/); 
        
        let nextNumber = 1;
        if (numberPart) {
            nextNumber = parseInt(numberPart[0]) + 1;
        }

        // 4. แปลงกลับเป็น string แล้วเติม 0 ให้เต็ม 11 หลัก
        let nextId = prefix + nextNumber.toString().padStart(11, '0');
        
        return nextId;
    } catch (err) {
        console.error("Error generating ID:", err);
        return prefix + Date.now(); // กันเหนียว
    }
}
//--- ROUTES ---

// (Register) เพิ่มผู้ใช้ใหม่ลงตาราง User

app.post('/regisDB', async (req,res) => {
    const { username, gmail, password } = req.body; 

    try {
        // 1. Insert User
        // (ถ้า Error duplicate entry ตรงนี้ ให้ไปลบข้อมูลเก่าใน Database ออกก่อน)
        let insertSql = `INSERT INTO ${userTable} (Username, Picture, Password, Gmail, Score) 
                         VALUES ("${username}", "here.png", "${password}", "${gmail}" , 0)`;
        
        await queryDB(insertSql);
        console.log("New user registered successfully");

        // -----------------------------------------------------------
        // 2. Insert Comment (Welcome Message)
        // -----------------------------------------------------------
        // เรียกใช้ฟังก์ชัน generateRunningID
        let cm_id = await generateRunningID(commentTable, "Cm_ID", "CM");
        
        // **แก้จุดผิด:** ใช้ตัวแปร ${cm_id} (ตัวเล็ก) ให้ตรงกับที่ประกาศ
        let insertCommentSql = `INSERT INTO ${commentTable} (Cm_ID, Username, User_target, Content) 
                                VALUES ("${cm_id}", "${username}", "", "")`;
        
        await queryDB(insertCommentSql);

        // -----------------------------------------------------------
        // 3. Insert Like (Initial Like)
        // -----------------------------------------------------------
        // เรียกใช้ฟังก์ชัน generateRunningID
        let like_id = await generateRunningID(likeTable, "Like_ID", "L");

        // **แก้จุดผิด:** ใช้ตัวแปร ${like_id} (ตัวเล็ก)
        // อย่าลืม! like เป็นคำสงวน ใช้ ` ` ครอบชื่อตาราง
        let insertLikeSql = `INSERT INTO \`${likeTable}\` (Like_ID, User_target, Username) 
                             VALUES ("${like_id}", "", "${username}")`;  //<--------!!สร้างlike Auto !!!อาจต้องแก้จุดนี้

        await queryDB(insertLikeSql);

        return res.redirect('index.html');

    } catch (err) {
        console.error("Error during registration:", err);
        // ถ้าเป็น Error ข้อมูลซ้ำ ให้กลับไปหน้า Register
        return res.redirect('register.html');
    }
});

// (Profile Picture Upload) อัปเดต field 'Picture' ในตาราง User
app.post('/profilepic', upload.single('avatar'), async (req,res) => {
    try {
        const username = req.cookies.username;
        
        if (!req.file) {
            console.log("No file uploaded.");
            return res.redirect('profile.html');
        }
        
        const newFilename = req.file.filename;
        console.log("path iamge "  + newFilename);

        // Update database
        await updateImg(username, newFilename);

        // Update cookie 'img' ให้ตรงกับชื่อไฟล์ใหม่
        res.cookie('img', newFilename);
        return res.redirect('profile.html');

    } catch (err) {
        console.error("Error uploading profile picture:", err);
        return res.redirect('profile.html');
    }
});

// (Helper Function) อัปเดต Picture โดยใช้ Username เป็น Key
const updateImg = async (username, filen) => {
    // แก้ SQL ให้ตรงกับ Data Dictionary (Picture, Username)
    let sql = `UPDATE ${userTable} SET Picture = '${filen}' WHERE Username = '${username}'`;
    try {
        await queryDB(sql);
        console.log(`Image updated for user: ${username}`);
    } catch (err) {
        console.error("Error in updateImg helper:", err);
    }
}

// (Logout)
app.get('/logout', (req,res) => {
    res.clearCookie('username');
    res.clearCookie('img');
    return res.redirect('login.html');
});

// (Read Posts) อ่านจากตาราง Comment
app.get('/readPost', async (req,res) => {
    try {
        // เลือกข้อมูลจาก Comment
        // หมายเหตุ: feed.js ฝั่ง client รอรับตัวแปรชื่อ 'message' และ 'user'
        // เราจึงต้องใช้ AS เพื่อเปลี่ยนชื่อ Content -> message ให้ client เข้าใจ
        let sql = `SELECT Cm_ID, Username AS user, Content AS message FROM ${commentTable}`;
        let result = await queryDB(sql);
        
        result = Object.assign({}, result); 
        res.json(result);
        
    } catch (err) {
        console.error("Error reading posts:", err);
        res.status(500).json({ error: "Failed to read posts" });
    }
});

// (Write Post) เขียนลงตาราง Comment
app.post('/writePost', async (req,res) => {
    try {
        const { user, message } = req.body;
        
        // Data Dictionary: Comment(Cm_ID, Username, User_target, Content)
        // 1. Cm_ID เป็น Varchar เราต้องสร้างเอง (ในที่นี้ใช้ Date.now เพื่อไม่ให้ซ้ำ)
        // 2. User_target (FK) จำเป็นต้องมี แต่ feed.js เดิมไม่มีการระบุผู้รับ
        //    *สมมติ* ว่าโพสต์หาตัวเอง (ใส่ user ลงไปทั้ง 2 ช่อง) เพื่อแก้ปัญหา FK error
        
        let cm_id = 'CM' + Date.now(); 
        
        let sql = `INSERT INTO ${commentTable} (Cm_ID, Username, User_target, Content) 
                   VALUES ("${cm_id}", "${user}", "${user}", "${message}")`;
                   
        await queryDB(sql);
        
        res.json({ message: "Post successful!" });

    } catch (err) {
        console.error("Error writing post:", err);
        res.status(500).json({ error: "Failed to write post" });
    }
});

// (Write Comment to User) Endpoint สำหรับโพสต์คอมเมนต์ถึงผู้ใช้คนอื่น
app.post('/postCommentToUser', async (req, res) => {
    // 1. Username (คนโพสต์) ดึงจาก Cookie ของคนที่ Login
    const commenter = req.cookies.username; 
    
    // 2. User_target (คนที่ถูกโพสต์ถึง) และ Content (ข้อความ) รับจาก body
    const { targetUser, content } = req.body;
    
    if (!commenter || !targetUser || !content) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        // 1. สร้าง Comment ID ใหม่
        let cm_id = await generateRunningID(commentTable, "Cm_ID", "CM");
        
        // 2. Insert Comment เข้าตาราง comment
        // Username = commenter (คนโพสต์)
        // User_target = targetUser (คนถูกโพสต์ถึง)
        // Content = content
        let sql = `INSERT INTO ${commentTable} (Cm_ID, Username, User_target, Content) 
                   VALUES ("${cm_id}", "${commenter}", "${targetUser}", "${content}")`;
                   
        await queryDB(sql);
        
        console.log(`Comment posted by ${commenter} to ${targetUser}`);
        res.json({ message: "Comment successful!" });

    } catch (err) {
        console.error("Error writing comment to user:", err);
        res.status(500).json({ error: "Failed to write comment" });
    }
});

// (Check Login) ตรวจสอบกับตาราง User
app.post('/checkLogin', async (req,res) => {
    try {
        const { username, password } = req.body;
        
        // แก้ SQL ให้ใช้ Username (PK)
        let sql = `SELECT * FROM ${userTable} WHERE Username = '${username}'`;
        let result = await queryDB(sql); 

        if (result.length === 0) {
            console.log("Login fail: user not found");
            return res.redirect('index.html?error=1');
        }

        const foundUser = result[0];
        console.log(foundUser.Password)
        console.log(foundUser.Username)

        // ตรวจสอบ Password
        if (foundUser.Password === password) { // สังเกต P ตัวใหญ่ตาม Data Dict ถ้า Database สร้างตัวเล็กให้แก้เป็น .password
            console.log("Login success");
            res.cookie('username', foundUser.Username);
            res.cookie('img', foundUser.Picture); // ใช้ column Picture
            return res.redirect('gameplay.html');
        } else {
            console.log("Login fail: wrong password");
            return res.redirect('index.html?error=1');
        }
    } catch (err) {
        console.error("Error during login:", err);
        return res.redirect('index.html?error=1');
    }
});

const getCurrentScore = async (username) => {
    let sql = `SELECT Score FROM ${userTable} WHERE Username = '${username}'`;
    let result = await queryDB(sql);
    if (result.length > 0) {
        // แปลงค่า Score จากฐานข้อมูลเป็นตัวเลข ถ้าไม่มีค่า ให้เป็น 0
        return parseInt(result[0].Score || 0, 10);
    }
    return 0; // หากไม่พบผู้ใช้
}

// (Update Score) Endpoint ใหม่สำหรับเพิ่มคะแนน 1 คะแนน
app.post('/updateScore', async (req, res) => {
    const username = req.cookies.username; // ดึง Username จาก Cookie ที่ตั้งไว้ตอน Login

    if (!username) {
        console.log("Error: User not logged in (username cookie missing).");
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const currentScore = await getCurrentScore(username);
        const newScore = currentScore + 1;

        // อัปเดต Field Score ในตาราง User
        let updateSql = `UPDATE ${userTable} SET Score = '${newScore}' WHERE Username = '${username}'`;
        await queryDB(updateSql);

        // console.log(`Score updated for user ${username}. New score: ${newScore}`);
        return res.status(200).json({ success: true, newScore: newScore });

    } catch (err) {
        console.error("Error updating score:", err);
        return res.status(500).json({ error: "Failed to update score" });
    }
});

// (Toggle Like) กดไลค์ / ยกเลิกไลค์
// server.js

// (Toggle Like) กดไลค์ / ยกเลิกไลค์
app.post('/toggleLike', async (req, res) => {
    // 1. Username (คนกด) -> ดึงจาก Cookie ของคนที่ Login อยู่
    const liker = req.cookies.username;

    // 2. User_target (คนถูกกด) -> รับค่าที่ส่งมาจากหน้าเว็บ
    const { targetUser } = req.body;

    // เช็คว่า Login หรือยัง
    if (!liker) {
        return res.status(401).json({ error: "Please login first" });
    }

    try {
        // เช็คก่อนว่าเคยกดไลค์คนนี้ไปหรือยัง?
        // ใช้ ` ` ครอบชื่อตาราง like เพราะเป็นคำสงวน SQL
        let checkSql = `SELECT * FROM \`like\` WHERE Username = '${liker}' AND User_target = '${targetUser}'`;
        let checkResult = await queryDB(checkSql);

        if (checkResult.length > 0) {
            // A. ถ้ามีแล้ว -> ให้ลบออก (Unlike)
            let deleteSql = `DELETE FROM \`like\` WHERE Username = '${liker}' AND User_target = '${targetUser}'`;
            await queryDB(deleteSql);
            console.log(`User ${liker} unliked ${targetUser}`); // Log ดูผลลัพธ์
            return res.json({ status: 'unliked' });

        } else {
            // B. ถ้ายังไม่มี -> ให้สร้างใหม่ (INSERT) <--- จุดที่คุณต้องการ
            
            // 3. Like_ID -> สร้างรหัสใหม่ (นำหน้าด้วย L ตามข้อมูลเก่าใน DB ของคุณ)
            // ฟังก์ชันนี้จะไปดู ID ล่าสุดใน DB แล้วบวก 1 ให้เอง
            let like_id = await generateRunningID('like', 'Like_ID', 'L');
            
            // คำสั่ง SQL สำหรับเพิ่มข้อมูล
            let insertSql = `INSERT INTO \`like\` (Like_ID, User_target, Username) 
                             VALUES ("${like_id}", "${targetUser}", "${liker}")`;
            
            await queryDB(insertSql);
            console.log(`User ${liker} liked ${targetUser} (ID: ${like_id})`); // Log ดูผลลัพธ์
            return res.json({ status: 'liked' });
        }

    } catch (err) {
        console.error("Error toggling like:", err);
        return res.status(500).json({ error: "Database error" });
    }
});

// (Leaderboard) ดึงข้อมูล User เรียงตามคะแนน + เช็คว่าเรากดไลค์ใครไปบ้าง
app.get('/getLeaderboard', async (req, res) => {
    try {
        const myUsername = req.cookies.username || ""; // ชื่อคนดู (เรา)

        // SQL นี้จะดึง User ทุกคน + คะแนน + เช็คว่า myUsername กดไลค์ไว้ไหม (isLiked)
        // เรียงจาก Score มาก -> น้อย
        let sql = `
            SELECT 
                u.Username, 
                u.Score,
                (SELECT COUNT(*) FROM \`${likeTable}\` l 
                 WHERE l.User_target = u.Username AND l.Username = '${myUsername}') AS isLiked
            FROM \`${userTable}\` u
            ORDER BY u.Score DESC
        `;

        let result = await queryDB(sql);
        res.json(result);

    } catch (err) {
        console.error("Error fetching leaderboard:", err);
        res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
});

/////////// Profile /////////////*****ยังไม่สมบูรณ์******
// (Get Profile Data) ดึงข้อมูลโปรไฟล์ (Username, Score, Rank)
app.get('/getProfileData', async (req, res) => {
    const username = req.cookies.username;

    if (!username) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        // ดึงข้อมูลผู้ใช้ทั้งหมดมาเรียงตามคะแนนเพื่อหา Rank
        let sqlLeaderboard = `SELECT Username, Score, Gmail FROM ${userTable} ORDER BY Score DESC`;
        let leaderboard = await queryDB(sqlLeaderboard);

        let userProfile = null;
        let rank = -1;

        // ค้นหาผู้ใช้ที่ล็อกอินเพื่อหา Rank และข้อมูลอื่นๆ
        for (let i = 0; i < leaderboard.length; i++) {
            if (leaderboard[i].Username === username) {
                userProfile = leaderboard[i];
                rank = i + 1; // Rank เริ่มที่ 1
                break;
            }
        }
        
        // **คำนวณจำนวน Like ทั้งหมดที่ผู้ใช้ได้รับ (User_target เป็น Username)**
        // เราใช้ชื่อตาราง `like` เพราะเป็นคำสงวน (SQL reserved keyword)
        let sqlTotalLikes = `SELECT COUNT(*) AS totalLikes FROM \`${likeTable}\` WHERE User_target = '${username}'`;
        let likeResult = await queryDB(sqlTotalLikes);
        let totalLikes = likeResult[0].totalLikes;


        if (userProfile) {
            res.json({
                username: userProfile.Username,
                gmail: userProfile.Gmail,
                score: userProfile.Score,
                rank: rank,
                totalLikes: totalLikes
            });
        } else {
            res.status(404).json({ error: "User not found" });
        }

    } catch (err) {
        console.error("Error fetching profile data:", err);
        res.status(500).json({ error: "Failed to fetch profile data" });
    }
});

// (Get Comments for User) ดึง Comment ที่ User_target เป็น Username ที่ล็อกอิน 
app.get('/getComments', async (req, res) => {
    const username = req.cookies.username; // ดึง Username จาก Cookie

    if (!username) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        // ดึง Comment ทั้งหมดที่ถูกโพสต์ถึงผู้ใช้คนนี้ (เรียงจาก ID มากไปน้อย เพื่อให้ Comment ใหม่สุดอยู่บน)
        // ดึง Username (คนคอมเมนต์) และ Content (ข้อความ)
        let sql = `SELECT Username, Content FROM ${commentTable} WHERE User_target = '${username}' ORDER BY Cm_ID DESC`;
        let result = await queryDB(sql);

        // ส่ง Array ของ Comment กลับไปให้ Client
        res.json(result);

    } catch (err) {
        console.error("Error fetching comments:", err);
        res.status(500).json({ error: "Failed to fetch comments" });
    }
});

app.listen(port, hostname, () => {
    console.log(`Server running at   http://${hostname}:${port}/index.html`);
});