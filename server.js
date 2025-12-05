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
      callback(null, 'public/img/');
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
const commentTable = "Comment"; // จากเดิม posts

// Promise wrapper for MySQL queries
const queryDB = (sql) => {
    return new Promise((resolve,reject) => {
        con.query(sql, (err,result, fields) => {
            if (err) reject(err);
            else resolve(result)
        })
    })
}

//--- ROUTES ---

// (Register) เพิ่มผู้ใช้ใหม่ลงตาราง User
app.post('/regisDB', async (req,res) => {
    const { username, gmail, password } = req.body; // รับค่าจากฟอร์ม (email ในฟอร์มจะถูกเก็บลง Gmail)

    try {
        // ตาม Data Dictionary: User (Username, Picture, Password, Gmail)
        // เรากำหนดรูปเริ่มต้นเป็น default.png
        let insertSql = `INSERT INTO ${userTable} (Username, Picture, Password, Gmail) 
                         VALUES ("${username}", "default.jpeg", "${password}", "${gmail}")`;
        
        await queryDB(insertSql);
        console.log("New user registered successfully");
        return res.redirect('index.html');

    } catch (err) {
        console.error("Error during registration:", err);
        return res.redirect('register.html');
    }
});

// (Profile Picture Upload) อัปเดต field 'Picture' ในตาราง User
app.post('/profilepic', upload.single('avatar'), async (req,res) => {
    try {
        const username = req.cookies.username;
        
        if (!req.file) {
            console.log("No file uploaded.");
            return res.redirect('feed.html');
        }
        
        const newFilename = req.file.filename;

        // Update database
        await updateImg(username, newFilename);

        // Update cookie 'img' ให้ตรงกับชื่อไฟล์ใหม่
        res.cookie('img', newFilename);
        return res.redirect('feed.html');

    } catch (err) {
        console.error("Error uploading profile picture:", err);
        return res.redirect('feed.html');
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

// (Check Login) ตรวจสอบกับตาราง User
app.post('/checkLogin', async (req,res) => {
    try {
        const { username, password } = req.body;
        console.log(username)
        console.log(password)
        
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

app.listen(port, hostname, () => {
    console.log(`Server running at   http://${hostname}:${port}/index.html`);
});